<script setup lang="ts">
import { CornerDownLeft, FileText, Folder, Search, X } from 'lucide-vue-next'
import { documentPublicPath, folderPublicPath, findFolderPath } from '~/utils/folders'
const { folders, documents, loading, error, load } = useKnowledge()
const { open, query, tag, close } = useSearch()
const { t } = useLocale()
const input = ref<HTMLInputElement>()
const resultsRoot = ref<HTMLElement>()
const active = ref(0)
const composing = ref(false)
const normalized = computed(() => query.value.trim().toLocaleLowerCase())
const results = computed(() => {
  const q = normalized.value
  const folderMatches =
    !tag.value && q
      ? folders.value
          .filter((item) =>
            `${item.name} ${item.description || ''}`.toLocaleLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            kind: 'folder',
            title: item.name,
            description: item.description || '',
            path: folderPublicPath(item.id, folders.value),
            trail:
              findFolderPath(item.parent_id, folders.value)
                .map((f) => f.name)
                .join(' / ') || t('library'),
          }))
      : []
  const docs = documents.value.filter(
    (item) =>
      item.status === 'published' &&
      (!tag.value || item.tags.includes(tag.value)) &&
      (!q ||
        `${item.title} ${item.description || ''} ${item.tags.join(' ')} ${item.content}`
          .toLocaleLowerCase()
          .includes(q)),
  )
  if (!q) docs.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  return [
    ...folderMatches,
    ...docs.slice(0, q || tag.value ? 20 : 5).map((item) => ({
      id: item.id,
      kind: 'document',
      title: item.title,
      description: item.description || item.excerpt || '',
      path: documentPublicPath(item, folders.value),
      trail:
        findFolderPath(item.folder_id, folders.value)
          .map((f) => f.name)
          .join(' / ') || t('uncategorized'),
    })),
  ]
})
function parts(value: string) {
  const q = normalized.value
  const at = q ? value.toLocaleLowerCase().indexOf(q) : -1
  return at < 0
    ? [value, '', '']
    : [value.slice(0, at), value.slice(at, at + q.length), value.slice(at + q.length)]
}
watch([query, tag], () => {
  active.value = 0
})
watch(results, () => {
  active.value = Math.min(active.value, Math.max(0, results.value.length - 1))
})
watch(open, async (value) => {
  if (value) {
    active.value = 0
    await nextTick()
    input.value?.focus()
  }
})
async function onKey(event: KeyboardEvent) {
  if (event.isComposing || composing.value || event.keyCode === 229) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!results.value.length) return
    active.value =
      (active.value + (event.key === 'ArrowDown' ? 1 : -1) + results.value.length) %
      results.value.length
    await nextTick()
    resultsRoot.value
      ?.querySelector<HTMLElement>(`[data-index="${active.value}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  } else if (event.key === 'Enter' && document.activeElement === input.value) {
    event.preventDefault()
    const result = results.value[active.value]
    if (result) {
      close()
      await navigateTo(result.path)
    }
  }
}
function clear() {
  query.value = ''
  tag.value = null
  input.value?.focus()
}
</script>

<template>
  <UiDialog :open="open" :label="t('searchTitle')" @close="close">
    <section class="search-dialog" @keydown="onKey">
      <header>
        <Search :size="20" aria-hidden="true" />
        <input
          ref="input"
          v-model="query"
          autofocus
          :placeholder="t('searchPlaceholder')"
          :aria-label="t('searchKeyword')"
          aria-describedby="search-help"
          autocomplete="off"
          @compositionstart="composing = true"
          @compositionend="composing = false"
        />
        <button
          class="icon-control"
          type="button"
          :aria-label="t('closeSearch')"
          @click="close"
        >
          <X :size="18" />
        </button>
      </header>
      <div v-if="tag || query" class="search-filters">
        <span v-if="tag" class="tag">{{ t('filterTag') }} · #{{ tag }}</span>
        <button type="button" @click="clear">{{ t('clearFilters') }}</button>
      </div>
      <p id="search-help" class="search-help">{{ t('searchHelp') }}</p>
      <div ref="resultsRoot" class="search-results" :aria-busy="loading">
        <div v-if="error" class="empty-state" role="alert">
          {{ t('loadFailed') }}
          <button class="button" type="button" @click="load(true)">
            {{ t('retry') }}
          </button>
        </div>
        <div v-else-if="loading" class="empty-state" role="status">
          {{ t('loading') }}
        </div>
        <template v-else>
          <template v-for="(result, index) in results" :key="result.id">
            <h2
              v-if="index === 0 || result.kind !== results[index - 1]?.kind"
              class="result-label"
            >
              {{
                result.kind === 'folder'
                  ? t('folders')
                  : normalized || tag
                    ? t('documents')
                    : t('recentDocuments')
              }}
            </h2>
            <NuxtLink
              :to="result.path"
              :data-index="index"
              :class="{ active: active === index }"
              @focus="active = index"
              @pointermove="active = index"
              @click="close"
            >
              <component
                :is="result.kind === 'folder' ? Folder : FileText"
                :size="17"
                aria-hidden="true"
              />
              <span
                ><small class="result-path">{{ result.trail }}</small
                ><strong
                  >{{ parts(result.title)[0]
                  }}<mark v-if="parts(result.title)[1]">{{
                    parts(result.title)[1]
                  }}</mark
                  >{{ parts(result.title)[2] }}</strong
                ><small>{{ result.description }}</small></span
              >
              <CornerDownLeft :size="14" aria-hidden="true" />
            </NuxtLink>
          </template>
          <div v-if="!results.length" class="no-results">
            <Search :size="25" />
            <p>{{ t('noResults') }}</p>
            <button v-if="query || tag" class="button" type="button" @click="clear">
              {{ t('clearFilters') }}
            </button>
          </div>
        </template>
      </div>
      <span class="sr-only" role="status">{{
        results.length
          ? `${active + 1} / ${results.length} · ${results[active]?.title}`
          : t('noResults')
      }}</span>
      <footer>
        <span><kbd>↑↓</kbd> {{ t('browse') }} <kbd>Enter</kbd> {{ t('open') }}</span
        ><span><kbd>Esc</kbd> {{ t('close') }}</span>
      </footer>
    </section>
  </UiDialog>
</template>

<style scoped>
.search-dialog {
  max-height: calc(84dvh - 24px);
  display: flex;
  flex-direction: column;
}
header {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--kb-border);
  color: var(--kb-accent);
}
header input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--kb-text);
  font-size: 17px;
  padding: 8px 0;
}
.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 18px 0;
}
.search-filters button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--kb-text-muted);
  text-decoration: underline;
  cursor: pointer;
  min-height: 36px;
}
.search-help {
  margin: 12px 18px 4px;
  font-size: 12px;
  color: var(--kb-text-subtle);
}
.search-results {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
}
.result-label {
  margin: 0;
  padding: 12px 10px 8px;
  color: var(--kb-text-subtle);
  font-size: 12px;
  font-weight: 500;
}
.search-results a {
  min-height: 76px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 16px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: var(--kb-radius-md);
  color: var(--kb-text-muted);
  transition:
    background-color var(--kb-duration-fast),
    border-color var(--kb-duration-fast);
}
.search-results a.active {
  background: var(--kb-selected-bg);
  border-color: var(--kb-selected-border);
  color: var(--kb-text);
}
.search-results a:active {
  background: var(--kb-surface-hover);
}
.search-results a > span {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.search-results strong {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.search-results small {
  color: var(--kb-text-subtle);
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.search-results .result-path {
  font-size: 11px;
}
mark {
  color: var(--kb-accent);
  background: var(--kb-selection);
  border-radius: 2px;
}
.no-results {
  padding: 40px 16px;
  text-align: center;
  color: var(--kb-text-muted);
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-top: 1px solid var(--kb-border);
  font-size: 12px;
  color: var(--kb-text-subtle);
}
header,
footer {
  flex-shrink: 0;
}
kbd {
  border: 1px solid var(--kb-border-strong);
  background: var(--kb-shortcut-bg);
  color: var(--kb-shortcut-text);
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 11px;
}
@media (max-width: 600px) {
  .search-dialog {
    max-height: calc(100dvh - 24px);
  }
  header {
    padding: 10px 12px;
  }
  footer {
    font-size: 11px;
  }
}
</style>
