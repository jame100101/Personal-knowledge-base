"""Local SQLite teaching core. No HTTP, payment provider, or real message broker."""
from contextlib import closing
import json
from pathlib import Path
import sqlite3
import tempfile
import uuid


class OutOfStock(Exception):
    pass


class IdempotencyConflict(Exception):
    pass


def connect(database):
    connection = sqlite3.connect(database, timeout=10, isolation_level=None)
    connection.execute('PRAGMA foreign_keys = ON')
    connection.row_factory = sqlite3.Row
    return connection


def initialize(database, initial_stock=5):
    if type(initial_stock) is not int or initial_stock < 0:
        raise ValueError('invalid initial stock')
    with closing(connect(database)) as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS stock (
            sku TEXT PRIMARY KEY NOT NULL,
            available INTEGER NOT NULL CHECK(available >= 0)
        );
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            request_key TEXT NOT NULL,
            sku TEXT NOT NULL REFERENCES stock(sku),
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            UNIQUE(user_id, request_key)
        );
        CREATE TABLE IF NOT EXISTS outbox (
            event_id TEXT PRIMARY KEY NOT NULL,
            order_id TEXT NOT NULL REFERENCES orders(id),
            payload TEXT NOT NULL,
            published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0, 1))
        );
        CREATE TABLE IF NOT EXISTS delivered (
            event_id TEXT PRIMARY KEY NOT NULL REFERENCES outbox(event_id),
            order_id TEXT NOT NULL REFERENCES orders(id)
        );
        ''')
        # Initialization never resets stock on an existing database.
        db.execute('INSERT INTO stock VALUES (?, ?) ON CONFLICT(sku) DO NOTHING',
                   ('book', initial_stock))


def place_order(database, user_id, request_key, sku, quantity, *, fail_after_stock=False):
    """user_id comes from a trusted caller; this function does not authenticate."""
    for value in (user_id, request_key, sku):
        if not isinstance(value, str) or not value.strip() or len(value) > 128:
            raise ValueError('invalid identifier')
    if type(quantity) is not int or not 1 <= quantity <= 100:
        raise ValueError('quantity must be an integer between 1 and 100')
    with closing(connect(database)) as db:
        # SQLite has one writer at a time; do not infer PostgreSQL lock semantics.
        db.execute('BEGIN IMMEDIATE')
        try:
            previous = db.execute(
                'SELECT id, sku, quantity FROM orders WHERE user_id=? AND request_key=?',
                (user_id, request_key),
            ).fetchone()
            if previous:
                if (previous['sku'], previous['quantity']) != (sku, quantity):
                    raise IdempotencyConflict('key already used for a different request')
                db.commit()
                return previous['id']
            changed = db.execute(
                'UPDATE stock SET available=available-? WHERE sku=? AND available>=?',
                (quantity, sku, quantity),
            ).rowcount
            if changed != 1:
                raise OutOfStock(sku)
            if fail_after_stock:
                raise RuntimeError('injected failure after stock update')
            order_id = str(uuid.uuid4())
            db.execute('INSERT INTO orders VALUES (?, ?, ?, ?, ?)',
                       (order_id, user_id, request_key, sku, quantity))
            event_id = str(uuid.uuid4())
            payload = json.dumps({'type': 'OrderPlaced', 'orderId': order_id})
            db.execute('INSERT INTO outbox(event_id,order_id,payload) VALUES (?,?,?)',
                       (event_id, order_id, payload))
            db.commit()
            return order_id
        except BaseException:
            db.rollback()
            raise


def deliver_locally(database, event_id):
    """Simulate an idempotent DB consumer, not an atomic external email send."""
    with closing(connect(database)) as db:
        db.execute('BEGIN IMMEDIATE')
        try:
            event = db.execute('SELECT order_id FROM outbox WHERE event_id=?',
                               (event_id,)).fetchone()
            if event is None:
                raise ValueError('unknown event')
            inserted = db.execute(
                'INSERT INTO delivered VALUES (?,?) ON CONFLICT(event_id) DO NOTHING',
                (event_id, event['order_id']),
            ).rowcount == 1
            db.execute('UPDATE outbox SET published=1 WHERE event_id=?', (event_id,))
            db.commit()
            return inserted
        except BaseException:
            db.rollback()
            raise


def demo():
    with tempfile.TemporaryDirectory() as directory:
        database = Path(directory) / 'orders.sqlite'
        initialize(database)
        first = place_order(database, 'alice', 'request-1', 'book', 2)
        repeated = place_order(database, 'alice', 'request-1', 'book', 2)
        assert first == repeated
        with closing(connect(database)) as db:
            remaining = db.execute('SELECT available FROM stock').fetchone()[0]
            event = db.execute('SELECT event_id FROM outbox').fetchone()[0]
        assert deliver_locally(database, event)
        assert not deliver_locally(database, event)
        print(json.dumps({'same_order_on_retry': first == repeated,
                          'remaining_stock': remaining, 'consumer_deduplicated': True}))


if __name__ == '__main__':
    demo()
