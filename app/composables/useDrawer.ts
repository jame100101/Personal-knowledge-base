import { lockBodyScroll } from '~/utils/scroll-lock'
/** Drawer focus is suspended while a native modal is above it. */
export function useDrawer(
  open: Ref<boolean>,
  panel: Ref<HTMLElement | undefined>,
  trigger: Ref<HTMLButtonElement | undefined>,
) {
  let release: (() => void) | undefined
  watch(open, async (value) => {
    if (value) {
      release?.()
      release = lockBodyScroll()
      await nextTick()
      if (open.value) panel.value?.querySelector<HTMLElement>('.mobile-close')?.focus()
    } else {
      release?.()
      release = undefined
      await nextTick()
      if (!document.querySelector('dialog[open]'))
        trigger.value?.focus({ preventScroll: true })
    }
  })
  function keydown(event: KeyboardEvent) {
    if (!open.value || document.querySelector('dialog[open]') || event.defaultPrevented)
      return
    if (event.key === 'Escape') {
      event.preventDefault()
      open.value = false
    }
    if (event.key !== 'Tab') return
    const items = [
      ...(panel.value?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), select, input, [tabindex="0"]',
      ) || []),
    ].filter((el) => el.getClientRects().length)
    const first = items[0],
      last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }
  onMounted(() => window.addEventListener('keydown', keydown))
  onBeforeUnmount(() => {
    release?.()
    window.removeEventListener('keydown', keydown)
  })
}
