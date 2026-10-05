<script setup lang="ts">
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  FileText,
  Folder,
  Search,
  Tags,
} from 'lucide-vue-next'
import { buildFolderTree, documentPublicPath, folderPublicPath } from '~/utils/folders'

const { t, dateLocale } = useLocale()
useHead({ title: 'Knowledge Base', titleTemplate: null })
const { folders, documents, load, loading, error } = useKnowledge()
const { show: openSearch, shortcut } = useSearch()
const { track } = useCardSpotlight()
await callOnce('home-knowledge', () => load())
const tree = computed(() => buildFolderTree(folders.value, documents.value))
const recent = computed(() =>
  [...documents.value]
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 5),
)
const allTags = computed(() => {
  const counts = new Map<string, number>()
  documents.value
    .flatMap((doc) => doc.tags)
    .forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})
const tags = computed(() => allTags.value.slice(0, 10))
const latestUpdate = computed(() => recent.value[0]?.updated_at)
</script>

<template>
  <div class="home-stage">
    <div class="home">
      <header class="workspace-header">
        <div>
          <span class="eyebrow">PERSONAL KNOWLEDGE SYSTEM</span>
          <h1>Damnatiox Knowledge</h1>
          <p>{{ t('homeTagline') }}</p>
        </div>
        <button class="command-search" type="button" @click="openSearch({}, $event)">
          <Search :size="17" />
          <span>{{ t('searchAll') }}</span>
          <kbd>{{ shortcut }}</kbd>
        </button>
      </header>

      <div v-if="error" class="status-panel" role="alert">
        <span>{{ t('loadFailed') }}</span
        ><button type="button" class="button" @click="load(true)">
          {{ t('retry') }}
        </button>
      </div>
      <div v-else-if="loading" class="status-panel" role="status">
        {{ t('loading') }}
      </div>
      <template v-else>
        <section class="metrics" :aria-label="t('knowledgeStats')">
          <div>
            <Folder :size="15" /><span
              ><strong>{{ folders.length }}</strong
              ><small>{{ t('folders') }}</small></span
            >
          </div>
          <div>
            <FileText :size="15" /><span
              ><strong>{{ documents.length }}</strong
              ><small>{{ t('publishedDocuments') }}</small></span
            >
          </div>
          <div>
            <Tags :size="15" /><span
              ><strong>{{ allTags.length }}</strong
              ><small>{{ t('activeTags') }}</small></span
            >
          </div>
          <div>
            <Clock3 :size="15" /><span
              ><strong>{{
                latestUpdate
                  ? new Date(latestUpdate).toLocaleDateString(dateLocale, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'
              }}</strong
              ><small>{{ t('latestUpdate') }}</small></span
            >
          </div>
        </section>

        <section>
          <div class="section-heading">
            <div>
              <span class="eyebrow">LIBRARY</span>
              <h2>{{ t('knowledgeAreas') }}</h2>
            </div>
            <span class="muted">{{ tree.length }} {{ t('topDirectories') }}</span>
          </div>
          <div v-if="!tree.length" class="empty-state">{{ t('emptyLibrary') }}</div>
          <div v-else class="folder-grid">
            <NuxtLink
              v-for="node in tree"
              :key="node.id"
              :to="folderPublicPath(node.id, folders)"
              class="folder-card"
              @pointermove="track"
            >
              <div class="folder-card-top">
                <span class="folder-icon"><Folder :size="19" /></span
                ><ArrowRight :size="16" />
              </div>
              <h3>{{ node.name }}</h3>
              <p>{{ node.description || t('organizingFolder') }}</p>
              <div class="folder-meta">
                <span>{{ node.children.length }} {{ t('subdirectories') }}</span
                ><span>{{ node.documentCount }} {{ t('documents') }}</span>
              </div>
            </NuxtLink>
          </div>
        </section>

        <div class="home-columns">
          <section>
            <div class="section-heading">
              <div>
                <span class="eyebrow">RECENT</span>
                <h2>{{ t('recent') }}</h2>
              </div>
            </div>
            <div v-if="!recent.length" class="empty-state">{{ t('noRecent') }}</div>
            <div v-else class="recent-list surface">
              <NuxtLink
                v-for="document in recent"
                :key="document.id"
                :to="documentPublicPath(document, folders)"
              >
                <span class="doc-icon"><BookOpenText :size="16" /></span>
                <span class="doc-info"
                  ><strong>{{ document.title }}</strong
                  ><small>{{ document.description }}</small></span
                >
                <span class="doc-time">{{
                  new Date(document.updated_at).toLocaleDateString(dateLocale, {
                    month: '2-digit',
                    day: '2-digit',
                  })
                }}</span>
              </NuxtLink>
            </div>
          </section>
          <section>
            <div class="section-heading">
              <div>
                <span class="eyebrow">INDEX</span>
                <h2>{{ t('popularTags') }}</h2>
              </div>
            </div>
            <div class="tag-panel surface">
              <p v-if="!tags.length">{{ t('noTags') }}</p>
              <button
                v-for="[tag, count] in tags"
                :key="tag"
                class="tag"
                type="button"
                @click="openSearch({ tag }, $event)"
              >
                # {{ tag }} <span>{{ count }}</span>
              </button>
              <p>{{ t('tagHint') }}</p>
            </div>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.home-stage {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  overflow: clip;
  background: var(--kb-bg);
}
.home-stage::before {
  content: '';
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  background: url('/images/knowledge-home-line-art.png') top center / 100% auto
    no-repeat;
  opacity: var(--kb-home-art-opacity);
  filter: var(--kb-home-art-filter);
  mix-blend-mode: var(--kb-home-art-blend);
}

.home {
  position: relative;
  z-index: 1;
  width: min(1120px, calc(100% - 64px));
  margin: 0 auto;
  padding: 64px 0 80px;
}
.workspace-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--kb-border);
}
.workspace-header > div,
.home-columns > section {
  min-width: 0;
}
h1 {
  margin: 14px 0 18px;
  font-size: clamp(36px, 4.6vw, 62px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}
.workspace-header p {
  max-width: 620px;
  margin: 0;
  color: var(--kb-text-muted);
  font-size: 16px;
  line-height: 1.8;
}
.command-search {
  width: min(100%, 560px);
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--kb-control-border);
  border-radius: var(--kb-radius-md);
  background: var(--kb-home-surface);
  color: var(--kb-text-muted);
  cursor: pointer;
  transition:
    background-color var(--kb-duration-fast),
    border-color var(--kb-duration-fast),
    transform var(--kb-duration-press);
}
.command-search:hover {
  background: var(--kb-home-surface-hover);
  border-color: var(--kb-accent);
}
.command-search > svg {
  color: var(--kb-accent);
  flex: none;
}
.command-search span {
  flex: 1;
  text-align: left;
  font-size: 14px;
}
kbd {
  border: 1px solid var(--kb-border-strong);
  border-radius: 5px;
  padding: 4px 6px;
  color: var(--kb-shortcut-text);
  font: 11px monospace;
  white-space: nowrap;
  background: var(--kb-shortcut-bg);
}
.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 24px 0 48px;
  border-bottom: 1px solid var(--kb-border);
}
.metrics > div {
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--kb-icon);
}
.metrics > div:first-child {
  padding-left: 0;
}
.metrics span {
  display: grid;
  gap: 7px;
}
.metrics strong {
  font-size: 22px;
  font-weight: 600;
  color: var(--kb-text);
}
.metrics small {
  font-size: 12px;
  color: var(--kb-text-subtle);
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.section-heading > div {
  display: grid;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}
.section-heading > span {
  font-size: 12px;
}
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 14px;
}
.folder-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-width: 0;
  min-height: 210px;
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--kb-border-strong);
  border-radius: var(--kb-radius-lg);
  background: var(--kb-home-surface);
  transition:
    border-color var(--kb-duration-fast),
    background-color var(--kb-duration-fast),
    transform var(--kb-duration-fast) var(--kb-ease-out);
}
.folder-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    260px circle at var(--spot-x, 50%) var(--spot-y, 50%),
    var(--kb-spotlight),
    transparent 75%
  );
  transition: opacity var(--kb-duration-fast);
}
.folder-card:focus-visible {
  border-color: var(--kb-accent);
}
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .folder-card:hover {
    transform: translateY(-2px);
    border-color: var(--kb-selected-border);
  }
  .folder-card:hover::after {
    opacity: 1;
  }
}
.folder-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--kb-text-subtle);
}
.folder-card-top > svg {
  transition: transform var(--kb-duration-fast);
}
.folder-card:focus-visible .folder-card-top > svg {
  transform: translateX(2px);
}
.folder-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--kb-icon-tile-border);
  border-radius: 10px;
  background: var(--kb-icon-tile-bg);
  color: var(--kb-accent);
}
.folder-card h3 {
  margin: 20px 0 9px;
  font-size: 18px;
  font-weight: 600;
}
.folder-card p {
  margin: 0;
  flex: 1;
  color: var(--kb-text-muted);
  font-size: 14px;
  line-height: 1.75;
  text-wrap: pretty;
}
.folder-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--kb-border);
  font-size: 12px;
  color: var(--kb-text-subtle);
}
.home-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 28px;
  margin-top: 44px;
}
.home-columns .surface {
  background: var(--kb-home-surface);
}
.recent-list {
  padding: 5px;
}
.recent-list a {
  min-height: 80px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 45px;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 8px;
  transition: background-color var(--kb-duration-fast);
}
.recent-list a:hover,
.recent-list a:active {
  background: var(--kb-surface-hover);
}
.doc-icon {
  width: 32px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--kb-icon);
}
.doc-info {
  min-width: 0;
  display: grid;
  gap: 5px;
}
.doc-info strong {
  font-size: 15px;
  font-weight: 550;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.doc-info small {
  font-size: 12px;
  line-height: 1.6;
  color: var(--kb-text-subtle);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.doc-time {
  color: var(--kb-text-subtle);
  font-size: 12px;
}
.tag-panel {
  padding: 18px;
}
.tag-panel .tag {
  margin: 0 6px 8px 0;
  cursor: pointer;
  min-height: 36px;
}
.tag-panel .tag:hover {
  border-color: var(--kb-selected-border);
  color: var(--kb-accent);
  background: var(--kb-selected-bg);
}
.tag-panel .tag span {
  color: var(--kb-text-subtle);
}
.tag-panel p {
  margin: 12px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--kb-border);
  color: var(--kb-text-subtle);
  font-size: 12px;
  line-height: 1.75;
}
@media (min-width: 1600px) {
  .workspace-header {
    grid-template-columns: minmax(0, 1fr) 340px;
    align-items: end;
    gap: 32px;
  }
}
@media (max-width: 1180px) {
  .home {
    padding-top: 36px;
  }
  .home-columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .home {
    width: calc(100% - 32px);
    padding: 28px 0 48px;
  }
  h1 {
    font-size: 36px;
    overflow-wrap: anywhere;
  }
  .workspace-header p {
    font-size: 15px;
  }
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 32px;
  }
  .metrics > div:nth-child(odd) {
    padding-left: 0;
  }
  .metrics strong {
    font-size: 20px;
  }
  .folder-card {
    min-height: 190px;
    padding: 20px;
  }
  .home-columns {
    margin-top: 32px;
  }
  .tag-panel .tag {
    min-height: 44px;
  }
  .recent-list a {
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 8px;
  }
  .doc-time {
    grid-column: 2;
  }
}
@media (forced-colors: active) {
  .home-stage::before {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .folder-card:focus-visible .folder-card-top > svg {
    transform: none;
  }
}
</style>
