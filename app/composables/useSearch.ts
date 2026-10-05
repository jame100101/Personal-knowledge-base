/** One explicit entry point for shortcuts, navigation, and tag searches. */
export function useSearch() {
  const open = useState('kb-search-open', () => false)
  const query = useState('kb-search-query', () => '')
  const tag = useState<string | null>('kb-search-tag', () => null)
  const shortcut = useState('kb-search-shortcut', () => 'Ctrl K')
  onMounted(() => {
    shortcut.value = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'
  })
  function show(options: { query?: string; tag?: string } = {}, event?: Event) {
    // Safari does not focus pointer-clicked buttons by default.
    if (event?.currentTarget instanceof HTMLElement)
      event.currentTarget.focus({ preventScroll: true })
    query.value = options.query || ''
    tag.value = options.tag || null
    open.value = true
  }
  return {
    open,
    query,
    tag,
    shortcut,
    show,
    close: () => {
      open.value = false
    },
  }
}
