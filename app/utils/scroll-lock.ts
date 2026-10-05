// A shared lease prevents a nested dialog from unlocking an open drawer.
const owners = new Set<symbol>()
let previous = ''
export function lockBodyScroll() {
  const owner = Symbol('overlay')
  if (!owners.size) {
    previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  owners.add(owner)
  return () => {
    if (!owners.delete(owner)) return
    if (!owners.size) document.body.style.overflow = previous
  }
}
