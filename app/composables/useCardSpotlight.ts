/** Local pointer coordinates only; no global state, RAF, or background listener. */
export function useCardSpotlight() {
  function track(event: PointerEvent) {
    if (
      event.pointerType !== 'mouse' ||
      document.hidden ||
      !window.matchMedia(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
      ).matches
    )
      return
    const card = event.currentTarget as HTMLElement
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }
  return { track }
}
