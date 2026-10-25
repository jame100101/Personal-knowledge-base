<script setup lang="ts">
import { ListTree } from 'lucide-vue-next'
import { extractHeadings } from '~/utils/markdown'

const props = defineProps<{ source: string }>()
const { t } = useLocale()
const headings = computed(() => extractHeadings(props.source))
const activeId = ref('')
const expanded = ref(false)
const query = ref('')
const filteredHeadings = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return headings.value.filter((heading) =>
    heading.title.toLocaleLowerCase().includes(needle),
  )
})
async function closeCompact(event: MouseEvent, id: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  expanded.value = false
  // Wait for the outline to collapse before calculating the anchor position.
  await nextTick()
  window.history.pushState(window.history.state, '', `#${encodeURIComponent(id)}`)
  const heading = document.getElementById(id)
  if (heading) {
    heading.tabIndex = -1
    heading.scrollIntoView({ block: 'start', behavior: 'instant' })
    heading.focus({ preventScroll: true })
  }
}
const mounted = ref(false)
let frame = 0
let resizeObserver: ResizeObserver | undefined
function updateActive() {
  frame = 0
  // Theme/locale changes can replace Markdown nodes without changing the source.
  const headingElements = headings.value
    .map(({ id }) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el)
  const first = headingElements[0]
  const scrollPadding =
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const anchorTop =
    scrollPadding +
    (first
      ? (Number.parseFloat(getComputedStyle(first).scrollMarginTop) || 30) + 2
      : 32)
  // Keep the preceding section active between headings, including when scrolling up.
  const current = headingElements.findLast(
    (heading) => heading.getBoundingClientRect().top <= anchorTop,
  )
  activeId.value = current?.id || headingElements[0]?.id || ''
}
function queueActiveUpdate() {
  if (!frame) frame = window.requestAnimationFrame(updateActive)
}

async function observeHeadings() {
  activeId.value = ''
  await nextTick()
  if (!mounted.value) return
  resizeObserver?.disconnect()
  const body = document.getElementById('article-body')
  if (body) resizeObserver?.observe(body)
  updateActive()
}

onMounted(() => {
  mounted.value = true
  resizeObserver = new ResizeObserver(queueActiveUpdate)
  observeHeadings()
  window.addEventListener('scroll', queueActiveUpdate, { passive: true })
  window.addEventListener('resize', queueActiveUpdate)
})
watch(
  () => props.source,
  () => {
    query.value = ''
    expanded.value = false
    if (mounted.value) observeHeadings()
  },
)
onUnmounted(() => {
  mounted.value = false
  window.removeEventListener('scroll', queueActiveUpdate)
  window.removeEventListener('resize', queueActiveUpdate)
  window.cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
</script>

<template>
  <aside class="toc">
    <div class="toc-title"><ListTree :size="14" /> {{ t('pageToc') }}</div>
    <button
      class="toc-toggle"
      type="button"
      :aria-expanded="expanded"
      :disabled="!mounted"
      aria-controls="article-outline"
      @click="expanded = !expanded"
    >
      <ListTree :size="18" /> {{ t('pageToc') }} <span>{{ expanded ? '−' : '+' }}</span>
    </button>
    <nav
      v-if="headings.length"
      id="article-outline"
      :class="{ expanded }"
      :aria-label="t('pageToc')"
    >
      <div v-if="headings.length > 8" class="toc-search">
        <label for="outline-query">{{ t('filterOutline') }}</label>
        <div>
          <input
            id="outline-query"
            v-model="query"
            :disabled="!mounted"
            type="search"
            autocomplete="off"
            :placeholder="t('filterOutline')"
            @keydown.esc="query = ''"
          >
          <button
            v-if="query"
            type="button"
            :aria-label="t('clearOutline')"
            @click="query = ''"
          >
            ×
          </button>
        </div>
        <span role="status">{{
          t('outlineCount').replace('{count}', String(filteredHeadings.length))
        }}</span>
      </div>
      <p v-if="!filteredHeadings.length" class="toc-empty">{{ t('outlineEmpty') }}</p>
      <a
        v-for="heading in filteredHeadings"
        :key="heading.id"
        :href="`#${heading.id}`"
        :class="[`level-${heading.level}`, { active: activeId === heading.id }]"
        :aria-current="activeId === heading.id ? 'location' : undefined"
        @click="closeCompact($event, heading.id)"
      >
        {{ heading.title }}
      </a>
    </nav>
    <p v-else class="subtle">{{ t('noHeadings') }}</p>
  </aside>
</template>

<style scoped>
.toc {
  min-width: 0;
}
.toc-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 13px;
  color: var(--kb-text-muted);
  font-size: 13px;
  font-weight: 700;
}
.toc-title svg {
  color: var(--kb-icon);
}
nav {
  display: grid;
  gap: 2px;
  border-left: 1px solid var(--kb-border);
}
nav a {
  padding: 5px 8px 5px 13px;
  color: var(--kb-text-subtle);
  font-size: 13px;
  line-height: 1.4;
  transition:
    color 140ms,
    border 140ms;
  border-left: 1px solid transparent;
  margin-left: -1px;
}
nav a:hover,
nav a.active {
  color: var(--kb-text);
}
nav a.active {
  border-left-color: var(--kb-accent);
}
nav a.level-3 {
  padding-left: 22px;
}
nav a.level-4 {
  padding-left: 30px;
}
nav a.level-5 {
  padding-left: 38px;
}
nav a.level-6 {
  padding-left: 46px;
}
p {
  font-size: 13px;
  line-height: 1.5;
}

.toc-toggle {
  display: none;
}
.toc-search {
  padding: 0 10px 12px;
  display: grid;
  gap: 7px;
}
.toc-search label,
.toc-search > span {
  font-size: 12px;
  color: var(--kb-text-muted);
}
.toc-search > div {
  position: relative;
}
.toc-search input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 44px 8px 10px;
  border: 1px solid var(--kb-border);
  border-radius: 7px;
  background: var(--kb-surface);
  color: var(--kb-text);
  font: inherit;
  font-size: 13px;
}
.toc-search input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.toc-search button {
  position: absolute;
  right: 0;
  top: 0;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--kb-text);
  cursor: pointer;
  font-size: 20px;
}
.toc-empty {
  padding: 8px 14px;
  color: var(--kb-text-muted);
}
@media (max-width: 1180px) {
  .toc-title {
    display: none;
  }
  .toc-toggle {
    display: flex;
    width: 100%;
    min-height: 48px;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid var(--kb-border);
    border-radius: 8px;
    background: var(--kb-surface);
    color: var(--kb-text);
    font-size: 14px;
    cursor: pointer;
  }
  .toc-toggle span {
    margin-left: auto;
  }
  nav {
    display: none;
    margin-top: 8px;
    max-height: 45dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--kb-surface);
  }
  nav.expanded {
    display: grid;
  }
  nav a {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
}
</style>
