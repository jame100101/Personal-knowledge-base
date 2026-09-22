from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('order_service', ROOT/'examples/backend/order_service.py')
service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(service)


class OrderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = Path(self.temp.name)/'test.sqlite'
        service.initialize(self.db, 5)

    def scalar(self, query):
        with closing(service.connect(self.db)) as db:
            return db.execute(query).fetchone()[0]

    def test_order_and_event_commit_together(self):
        service.place_order(self.db, 'a', 'k', 'book', 2)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 3)
        self.assertEqual(self.scalar('SELECT count(*) FROM orders'), 1)
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'), 1)

    def test_retry_returns_same_order(self):
        a = service.place_order(self.db, 'a', 'k', 'book', 2)
        b = service.place_order(self.db, 'a', 'k', 'book', 2)
        self.assertEqual(a, b)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 3)

    def test_different_payload_rejects_same_key(self):
        service.place_order(self.db, 'a', 'k', 'book', 2)
        with self.assertRaises(service.IdempotencyConflict):
            service.place_order(self.db, 'a', 'k', 'book', 1)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 3)

    def test_out_of_stock_leaves_no_partial_rows(self):
        with self.assertRaises(service.OutOfStock):
            service.place_order(self.db, 'a', 'k', 'book', 6)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 5)
        self.assertEqual(self.scalar('SELECT count(*) FROM orders'), 0)
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'), 0)

    def test_injected_failure_rolls_back_stock(self):
        with self.assertRaises(RuntimeError):
            service.place_order(self.db, 'a', 'k', 'book', 2, fail_after_stock=True)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 5)
        self.assertEqual(self.scalar('SELECT count(*) FROM orders'), 0)
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'), 0)

    def test_competing_orders_do_not_oversell(self):
        def attempt(index):
            try:
                service.place_order(self.db, 'a', f'k-{index}', 'book', 1)
                return True
            except service.OutOfStock:
                return False
        with ThreadPoolExecutor(max_workers=8) as pool:
            successes = list(pool.map(attempt, range(12)))
        self.assertEqual(sum(successes), 5)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 0)
        self.assertEqual(self.scalar('SELECT count(*) FROM orders'), 5)
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'), 5)

    def test_concurrent_retries_deduct_once(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            ids = list(pool.map(lambda _: service.place_order(self.db, 'a', 'same', 'book', 1), range(8)))
        self.assertEqual(len(set(ids)), 1)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 4)
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'), 1)

    def test_key_is_scoped_to_user(self):
        a = service.place_order(self.db, 'a', 'key', 'book', 1)
        b = service.place_order(self.db, 'b', 'key', 'book', 1)
        self.assertNotEqual(a, b)

    def test_consumer_deduplicates(self):
        service.place_order(self.db, 'a', 'key', 'book', 1)
        event = self.scalar('SELECT event_id FROM outbox')
        self.assertTrue(service.deliver_locally(self.db, event))
        self.assertFalse(service.deliver_locally(self.db, event))
        self.assertEqual(self.scalar('SELECT count(*) FROM delivered'), 1)
        self.assertEqual(self.scalar('SELECT published FROM outbox'), 1)

    def test_invalid_quantity_rejected(self):
        for quantity in (0, -1, 1.5, True, '2', 101):
            with self.subTest(quantity=quantity), self.assertRaises(ValueError):
                service.place_order(self.db, 'a', 'key', 'book', quantity)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 5)

    def test_initialize_preserves_existing_state(self):
        service.place_order(self.db, 'a', 'key', 'book', 1)
        service.initialize(self.db, 99)
        self.assertEqual(self.scalar('SELECT available FROM stock'), 4)

    def test_unknown_event_rejected(self):
        with self.assertRaises(ValueError):
            service.deliver_locally(self.db, 'missing')
        self.assertEqual(self.scalar('SELECT count(*) FROM delivered'), 0)


if __name__ == '__main__':
    unittest.main()
