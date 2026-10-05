<script setup lang="ts">
import {
  CheckCircle2,
  LoaderCircle,
  FileUp,
  ImagePlus,
  Save,
  Send,
  UploadCloud,
} from 'lucide-vue-next'
import type { DocumentDraft, KnowledgeDocument } from '~/types/knowledge'
import { parseFrontmatter } from '~/utils/markdown'
import { isSafeMarkdownFilename, slugify } from '~/utils/slug'

const props = defineProps<{ document?: KnowledgeDocument }>()
const route = useRoute()
const { t } = useLocale()
const router = useRouter()
const { folders, documents, load, saveDocument } = useKnowledge()
await load(false, true)
const requestedFolderId =
  typeof route.query.folder === 'string' &&
  folders.value.some((item) => item.id === route.query.folder)
    ? route.query.folder
    : null
const defaultFolderId = props.document?.folder_id || requestedFolderId
const nextSortOrder =
  Math.max(
    0,
    ...documents.value
      .filter((item) => item.folder_id === defaultFolderId)
      .map((item) => item.sort_order),
  ) + 10
const initial = (): DocumentDraft => ({
  id: props.document?.id,
  folder_id: defaultFolderId,
  title: props.document?.title || '',
  slug: props.document?.slug || '',
  description: props.document?.description || '',
  tags: props.document?.tags || [],
  content: props.document?.content || '# 新文档\n\n开始记录你的知识…',
  status: props.document?.status || 'draft',
  sort_order: props.document?.sort_order || nextSortOrder,
  original_filename: props.document?.original_filename || undefined,
  file_size_bytes: props.document?.file_size_bytes || undefined,
})
const draft = reactive<DocumentDraft>(initial())
const tagsInput = ref(draft.tags.join(', '))
const originalFile = shallowRef<File>()
const busy = ref(false)
const error = ref('')
const success = ref('')
const parseNotice = ref('')
const savedSnapshot = ref(JSON.stringify(draft))
const dirty = computed(() => JSON.stringify(draft) !== savedSnapshot.value)
const invalid = ref('')
const panel = ref<'edit' | 'preview'>('edit')
const preview = ref(draft.content)
let previewTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => draft.content,
  (value) => {
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => {
      preview.value = value
    }, 180)
  },
)
const leaveOpen = ref(false)
let resolveLeave: ((value: boolean) => void) | undefined
let pendingLeave: Promise<boolean> | undefined
function leaveDecision(value: boolean) {
  leaveOpen.value = false
  resolveLeave?.(value)
  resolveLeave = undefined
  pendingLeave = undefined
}
const removeGuard = router.beforeEach(() => {
  if (!dirty.value) return true
  if (pendingLeave) return pendingLeave
  leaveOpen.value = true
  pendingLeave = new Promise<boolean>((resolve) => {
    resolveLeave = resolve
  })
  return pendingLeave
})
onBeforeUnmount(() => {
  removeGuard()
  clearTimeout(previewTimer)
  resolveLeave?.(false)
})
const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)

watch(tagsInput, (value) => {
  draft.tags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
})
watch(
  () => draft.title,
  (value, previous) => {
    if (!draft.id && (!draft.slug || draft.slug === slugify(previous)))
      draft.slug = slugify(value)
  },
)
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))

async function readFile(file: File) {
  error.value = ''
  parseNotice.value = ''
  if (!isSafeMarkdownFilename(file.name)) throw new Error(t('fileInvalid'))
  if (file.size > 2 * 1024 * 1024) throw new Error(t('fileLarge'))
  const buffer = await file.arrayBuffer()
  const source = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  const parsed = parseFrontmatter(source, file.name)
  Object.assign(draft, {
    title: parsed.title,
    slug: parsed.slug,
    description: parsed.description,
    tags: parsed.tags,
    content: parsed.content,
    sort_order: parsed.order,
    original_filename: file.name,
    file_size_bytes: file.size,
  })
  tagsInput.value = parsed.tags.join(', ')
  originalFile.value = file
  parseNotice.value = t('fileRead')
  if (parsed.folderSuggestion) parseNotice.value += ` (${parsed.folderSuggestion})`
}

async function handleFiles(files: FileList | null) {
  if (!files?.length || busy.value) return
  if (files.length !== 1) {
    error.value = t('fileMultiple')
    return
  }
  try {
    await readFile(files[0]!)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('fileFailed')
  }
}

function handleDrop(event: DragEvent) {
  dragging.value = false
  void handleFiles(event.dataTransfer?.files || null)
}

async function submit(status: 'draft' | 'published') {
  if (busy.value) return
  error.value = ''
  success.value = ''
  invalid.value = ''
  const failed = !draft.title.trim()
    ? ['title', t('requiredTitle')]
    : !draft.slug.trim()
      ? ['slug', t('requiredSlug')]
      : !draft.folder_id
        ? ['folder', t('requiredFolder')]
        : null
  if (failed) {
    invalid.value = failed[0]!
    error.value = failed[1]!
    await nextTick()
    globalThis.document.getElementById(`editor-${invalid.value}`)?.focus()
    return
  }
  busy.value = true
  try {
    draft.status = status
    const saved = await saveDocument(draft, originalFile.value)
    savedSnapshot.value = JSON.stringify(draft)
    success.value = status === 'published' ? t('documentPublished') : t('draftSaved')
    if (status === 'published') {
      await navigateTo(documentPublicPath(saved, folders.value))
    } else if (!draft.id) {
      await navigateTo(`/admin/documents/${saved.id}`)
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('saveFailed')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="editor-shell" :aria-busy="busy">
    <fieldset :disabled="busy" class="editor-fields">
      <section class="editor-meta">
        <div class="field field-wide">
          <label for="editor-title">{{ t('editorTitle') }}</label
          ><input
            id="editor-title"
            v-model="draft.title"
            :aria-invalid="invalid === 'title'"
            :aria-describedby="invalid === 'title' ? 'editor-error' : undefined"
            class="input"
            placeholder="文档标题"
          />
        </div>
        <div class="field">
          <label for="editor-slug">Slug</label
          ><input
            id="editor-slug"
            v-model="draft.slug"
            :aria-invalid="invalid === 'slug'"
            :aria-describedby="invalid === 'slug' ? 'editor-error' : undefined"
            class="input mono"
            placeholder="document-slug"
          />
        </div>
        <div class="field">
          <label for="editor-folder">{{ t('editorFolder') }}</label
          ><FolderSelect
            id="editor-folder"
            v-model="draft.folder_id"
            :aria-invalid="invalid === 'folder'"
            :aria-describedby="invalid === 'folder' ? 'editor-error' : undefined"
            :folders="folders"
            required
          />
        </div>
        <div class="field field-wide">
          <label for="editor-description">{{ t('editorDescription') }}</label
          ><input
            id="editor-description"
            v-model="draft.description"
            class="input"
            placeholder="一句话描述文档内容"
          />
        </div>
        <div class="field">
          <label for="editor-tags">{{ t('editorTags') }}</label
          ><input
            id="editor-tags"
            v-model="tagsInput"
            class="input"
            placeholder="java, spring"
          />
        </div>
        <div class="field">
          <label for="editor-order">{{ t('editorOrder') }}</label
          ><input
            id="editor-order"
            v-model.number="draft.sort_order"
            class="input"
            type="number"
          />
        </div>
      </section>

      <section
        class="drop-zone"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="handleDrop"
      >
        <UploadCloud :size="20" />
        <span
          ><strong>{{ t('dropMarkdown') }}</strong
          ><small>{{ t('fileHint') }}</small></span
        >
        <button class="button small" type="button" @click="fileInput?.click()">
          <FileUp :size="14" /> {{ t('chooseFile') }}
        </button>
        <input
          ref="fileInput"
          hidden
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          @change="handleFiles(($event.target as HTMLInputElement).files)"
        />
      </section>
      <p v-if="parseNotice" class="notice">
        <CheckCircle2 :size="14" /> {{ parseNotice }}
      </p>
      <p v-if="error" id="editor-error" class="error-text" role="alert">{{ error }}</p>
      <p class="success-text" role="status">{{ success }}</p>

      <div class="editor-panel-switch" :aria-label="t('editorPreview')">
        <button type="button" :aria-pressed="panel === 'edit'" @click="panel = 'edit'">
          {{ t('editorEdit') }}
        </button>
        <button
          type="button"
          :aria-pressed="panel === 'preview'"
          @click="panel = 'preview'"
        >
          {{ t('editorPreview') }}
        </button>
      </div>
      <section class="split-editor" :data-panel="panel">
        <div class="editor-pane">
          <header>
            <span>MARKDOWN</span><span>{{ draft.content.length }} CHARS</span>
          </header>
          <textarea
            v-model="draft.content"
            class="source-editor mono"
            spellcheck="false"
            :aria-label="t('editorSource')"
          />
        </div>
        <div class="preview-pane">
          <header>
            <span>{{ t('editorPreview') }}</span
            ><button type="button" disabled aria-describedby="image-unavailable">
              <ImagePlus :size="14" /> {{ t('images') }}
            </button>
          </header>
          <p id="image-unavailable" class="image-unavailable">
            {{ t('imageUnavailable') }}
          </p>
          <div class="preview-scroll"><MarkdownRenderer :source="preview" /></div>
        </div>
      </section>
    </fieldset>
    <footer class="editor-actions">
      <span>{{ busy ? t('saving') : dirty ? t('unsaved') : t('saved') }}</span>
      <div>
        <button class="button" type="button" :disabled="busy" @click="submit('draft')">
          <LoaderCircle v-if="busy" class="busy-icon" :size="15" /><Save
            v-else
            :size="15"
          />
          {{ t('saveDraft') }}
        </button>
        <button
          class="button primary"
          type="button"
          :disabled="busy"
          @click="submit('published')"
        >
          <Send :size="15" /> {{ t('publishDocument') }}
        </button>
      </div>
    </footer>
    <UiDialog
      compact
      :open="leaveOpen"
      :label="t('leaveTitle')"
      @close="leaveDecision(false)"
    >
      <div class="leave-confirm">
        <h2>{{ t('leaveTitle') }}</h2>
        <p>{{ t('leaveHint') }}</p>
        <div>
          <button
            class="button primary"
            type="button"
            autofocus
            @click="leaveDecision(false)"
          >
            {{ t('keepEditing') }}</button
          ><button class="button danger" type="button" @click="leaveDecision(true)">
            {{ t('discardLeave') }}
          </button>
        </div>
      </div>
    </UiDialog>
  </div>
</template>

<style scoped>
.editor-shell {
  padding: 24px 28px 0;
}
.editor-meta {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 13px;
  margin-bottom: 15px;
}
.field-wide {
  grid-column: span 2;
}
.drop-zone {
  min-height: 61px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 13px;
  border: 1px dashed var(--kb-border-strong);
  border-radius: var(--kb-radius-md);
  color: var(--kb-text-subtle);
  background: var(--kb-surface);
  transition:
    border 150ms,
    background 150ms;
}
.drop-zone.dragging {
  border-color: var(--kb-accent);
  background: rgb(216 255 100 / 4%);
}
.drop-zone > span {
  flex: 1;
  display: grid;
  gap: 2px;
}
.drop-zone strong {
  color: var(--kb-text-muted);
  font-size: 12px;
}
.drop-zone small {
  font-size: 12px;
}
.notice {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--kb-success);
  font-size: 12px;
}
.split-editor {
  height: max(560px, calc(100vh - 350px));
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 16px;
  border: 1px solid var(--kb-border);
  border-radius: var(--kb-radius-md);
  background: var(--kb-surface);
  overflow: hidden;
}
.editor-pane,
.preview-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.editor-pane {
  border-right: 1px solid var(--kb-border);
}
.split-editor header {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--kb-border);
  color: var(--kb-text-subtle);
  font: 10px monospace;
  letter-spacing: 0.08em;
}
.split-editor header button {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--kb-text-subtle);
  cursor: pointer;
}
.source-editor {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: block;
  overflow: auto;
  overscroll-behavior: contain;
  resize: none;
  border: 0;
  outline-offset: -3px;
  padding: 19px;
  background: var(--kb-code-bg);
  color: var(--kb-code-text);
  font-size: 13px;
  line-height: 1.65;
  tab-size: 2;
}
.preview-scroll {
  min-height: 0;
  flex: 1;
  padding: 26px 28px;
  overflow: auto;
  overscroll-behavior: contain;
}
.editor-actions {
  position: sticky;
  bottom: 0;
  z-index: 20;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--kb-border);
  background: var(--kb-panel-bg);
  margin-top: 20px;
}
.editor-actions > span {
  color: var(--kb-text-subtle);
  font-size: 12px;
}
.editor-actions > div {
  display: flex;
  gap: 8px;
}
@media (max-width: 980px) {
  .editor-meta {
    grid-template-columns: 1fr 1fr;
  }
  .field-wide {
    grid-column: span 2;
  }
  .split-editor {
    height: min(640px, 70dvh);
    grid-template-columns: 1fr;
  }
  .editor-pane {
    border-right: 0;
    border-bottom: 1px solid var(--kb-border);
  }
  .source-editor {
    font-size: 16px;
  }
  .source-editor,
  .preview-scroll {
    min-height: 0;
  }
}
@media (max-width: 760px) {
  .editor-shell {
    padding: 18px 14px 0;
  }
  .editor-meta {
    grid-template-columns: 1fr;
  }
  .field-wide {
    grid-column: auto;
  }
  .drop-zone {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .drop-zone > span {
    min-width: 180px;
  }
  .editor-actions {
    left: 0;
    bottom: 0;
    padding: 12px 0 max(12px, env(safe-area-inset-bottom));
  }
  .editor-actions > span {
    display: none;
  }
  .editor-actions > div {
    width: 100%;
  }
  .editor-actions .button {
    flex: 1;
  }
  .preview-scroll {
    padding: 20px 16px;
  }
}
.editor-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.editor-panel-switch {
  display: none;
}
.image-unavailable {
  margin: 0;
  padding: 10px 14px;
  color: var(--kb-text-subtle);
  font-size: 12px;
  line-height: 1.6;
  border-bottom: 1px solid var(--kb-border);
}
.leave-confirm {
  padding: 28px;
}
.leave-confirm h2 {
  margin: 0 0 12px;
  font-size: 22px;
}
.leave-confirm p {
  color: var(--kb-text-muted);
  line-height: 1.8;
}
.leave-confirm > div {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.busy-icon {
  animation: busy-spin 1s linear infinite;
}
@keyframes busy-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 980px) {
  .editor-panel-switch {
    display: flex;
    gap: 4px;
    padding: 4px;
    margin-top: 20px;
    border: 1px solid var(--kb-border);
    border-radius: var(--kb-radius-md);
    background: var(--kb-surface);
  }
  .editor-panel-switch button {
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: var(--kb-radius-sm);
    background: transparent;
    color: var(--kb-text-muted);
    cursor: pointer;
  }
  .editor-panel-switch button[aria-pressed='true'] {
    color: var(--kb-text);
    background: var(--kb-selected-bg);
    box-shadow: inset 0 -2px var(--kb-accent);
  }
  .split-editor[data-panel='edit'] .preview-pane,
  .split-editor[data-panel='preview'] .editor-pane {
    display: none;
  }
}
</style>
