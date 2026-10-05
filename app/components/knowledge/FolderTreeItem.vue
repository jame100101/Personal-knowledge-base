<script setup lang="ts">
import {
  ChevronRight,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
} from 'lucide-vue-next'
import type { Folder, FolderNode } from '~/types/knowledge'
import {
  documentPublicPath,
  folderPublicPath,
  orderedFolderEntries,
  findFolderPath,
} from '~/utils/folders'

const props = defineProps<{
  node: FolderNode
  allFolders: Folder[]
  level?: number
  currentFolderId?: string
  currentDocumentId?: string
}>()
const entries = computed(() =>
  orderedFolderEntries(props.node.children, props.node.documents),
)
const expansion = useState<Record<string, boolean>>('kb-folder-expansion', () => ({}))
const expanded = computed({
  get: () => expansion.value[props.node.id] ?? (props.level || 0) < 1,
  set: (value) => {
    expansion.value[props.node.id] = value
  },
})
const hasChildren = computed(
  () => props.node.children.length > 0 || props.node.documents.length > 0,
)
const { t } = useLocale()
function toggleExpanded() {
  if (hasChildren.value) expanded.value = !expanded.value
}
async function handleLabelClick(event: MouseEvent) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return
  event.preventDefault()
  if (hasChildren.value && expanded.value) {
    expanded.value = false
    return
  }

  if (hasChildren.value) expanded.value = true
  await navigateTo(folderPublicPath(props.node.id, props.allFolders))
}
watch(
  [() => props.currentFolderId, () => props.currentDocumentId],
  () => {
    if (
      findFolderPath(props.currentFolderId || null, props.allFolders).some(
        (folder) => folder.id === props.node.id,
      ) ||
      props.node.documents.some((doc) => doc.id === props.currentDocumentId)
    )
      expanded.value = true
  },
  { immediate: true },
)
const visited = ref(expanded.value)
watch(expanded, (value) => {
  if (value) visited.value = true
})
</script>

<template>
  <li>
    <div
      class="tree-row"
      :class="{
        active: currentFolderId === node.id && !currentDocumentId,
        expandable: hasChildren,
      }"
      :style="{ '--depth': level || 0 }"
    >
      <button
        class="tree-toggle"
        type="button"
        :disabled="!hasChildren"
        :aria-expanded="hasChildren ? expanded : undefined"
        :aria-label="expanded ? t('collapseFolder') : t('expandFolder')"
        @click.stop="toggleExpanded"
      >
        <ChevronRight :size="13" :class="{ rotated: expanded }" />
      </button>
      <component
        :is="expanded ? FolderOpen : FolderIcon"
        :size="15"
        class="tree-icon"
      />
      <a
        :href="folderPublicPath(node.id, allFolders)"
        class="tree-label"
        :title="node.name"
        :aria-current="
          currentFolderId === node.id && !currentDocumentId ? 'page' : undefined
        "
        @click.stop="handleLabelClick"
      >
        {{ node.name }}
      </a>
      <span class="tree-count">{{ node.documentCount }}</span>
    </div>
    <Transition name="tree"
      ><ul v-if="visited" v-show="expanded" class="tree-children">
        <template v-for="entry in entries" :key="`${entry.kind}-${entry.item.id}`">
          <FolderTreeItem
            v-if="entry.kind === 'folder'"
            :node="entry.item"
            :all-folders="allFolders"
            :level="(level || 0) + 1"
            :current-folder-id="currentFolderId"
            :current-document-id="currentDocumentId"
          />
          <li v-else>
            <NuxtLink
              :to="documentPublicPath(entry.item, allFolders)"
              class="tree-document"
              :title="entry.item.title"
              :aria-current="currentDocumentId === entry.item.id ? 'page' : undefined"
              :class="{ active: currentDocumentId === entry.item.id }"
              :style="{ '--depth': (level || 0) + 1 }"
            >
              <FileText :size="13" />
              <span>{{ entry.item.title }}</span>
            </NuxtLink>
          </li>
        </template>
      </ul></Transition
    >
  </li>
</template>

<style scoped>
li,
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tree-row {
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 calc(6px + var(--depth) * 13px);
  border-radius: var(--kb-radius-sm);
  color: var(--kb-text-muted);
  font-size: 13px;
  transition:
    background 140ms,
    color 140ms;
}
.tree-row:hover,
.tree-row.active {
  background: var(--kb-surface-hover);
  color: var(--kb-text);
}
.tree-row.expandable {
}
.tree-row.active {
  box-shadow: inset 2px 0 var(--kb-accent);
}
.tree-toggle {
  width: 24px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  padding: 0;
  background: none;
  color: var(--kb-icon);
  cursor: pointer;
}
.tree-toggle:disabled {
  opacity: 0;
}
.tree-toggle svg {
  transition: transform 140ms;
}
.tree-toggle .rotated {
  transform: rotate(90deg);
}
.tree-icon {
  color: var(--kb-icon);
  flex: none;
}
.tree-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.tree-count {
  font: 10px/1.4 monospace;
  color: var(--kb-text-subtle);
}
.tree-document {
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px 5px calc(43px + var(--depth) * 13px);
  border-radius: var(--kb-radius-sm);
  color: var(--kb-text-muted);
  font-size: 12px;
  transition:
    background 140ms,
    color 140ms;
}
.tree-document span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tree-document > svg {
  width: 13px;
  height: 13px;
  min-width: 13px;
  flex: 0 0 13px;
  stroke-width: 1.75;
}
.tree-document:hover,
.tree-document.active {
  background: var(--kb-surface-hover);
  color: var(--kb-text);
}
.tree-document.active {
  color: var(--kb-accent);
  box-shadow: inset 2px 0 var(--kb-accent);
  background: var(--kb-selected-bg);
}
.tree-enter-active,
.tree-leave-active {
  transition: opacity var(--kb-duration-fast);
}
.tree-enter-from,
.tree-leave-to {
  opacity: 0;
}
@media (max-width: 1180px) {
  .tree-toggle {
    width: 44px;
    height: 44px;
  }
  .tree-row {
    padding-left: calc(var(--depth) * 10px);
    gap: 4px;
  }
  .tree-document {
    min-height: 44px;
  }
}
</style>
