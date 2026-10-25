<script setup lang="ts">
import { BookOpen, ExternalLink, Type } from 'lucide-vue-next'
import { extractHeadings } from '~/utils/markdown'

const props = defineProps<{ source: string }>()
const emit = defineEmits<{ size: [value: number] }>()
const { t } = useLocale()
const fontSize = ref(16)
const ready = ref(false)
const sourceHeading = computed(() =>
  extractHeadings(props.source).find((heading) =>
    /参考|来源|资料依据|核验依据|阅读依据|源码索引|Sources|References/i.test(
      heading.title,
    ),
  ),
)
function setSize(value: number) {
  fontSize.value = value
  emit('size', value)
  try {
    localStorage.setItem('kb-reading-size', String(value))
  } catch {
    /* Reading works without storage. */
  }
}
function jump(event: MouseEvent, id: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  window.history.pushState(window.history.state, '', `#${encodeURIComponent(id)}`)
  target.tabIndex = -1
  target.scrollIntoView({ block: 'start' })
  target.focus({ preventScroll: true })
}
onMounted(() => {
  try {
    const saved = Number(localStorage.getItem('kb-reading-size'))
    if ([16, 18, 20].includes(saved)) {
      fontSize.value = saved
      emit('size', saved)
    }
  } catch {
    /* Private browsing can disable storage. */
  }
  ready.value = true
})
</script>

<template>
  <nav class="reading-tools" :aria-label="t('readingTools')">
    <div class="reading-jumps">
      <a href="#article-body" @click="jump($event, 'article-body')"
        ><BookOpen :size="16" />{{ t('startReading') }}</a
      >
      <a
        v-if="sourceHeading"
        :href="`#${sourceHeading.id}`"
        @click="jump($event, sourceHeading.id)"
        ><ExternalLink :size="15" />{{ t('articleSources') }}</a
      >
    </div>
    <div class="reading-size" role="group" :aria-label="t('readingFontSize')">
      <Type :size="16" aria-hidden="true" />
      <button
        v-for="size in [16, 18, 20]"
        :key="size"
        type="button"
        :aria-pressed="fontSize === size"
        :aria-label="`${t('readingFontSize')} ${size}`"
        :disabled="!ready"
        @click="setSize(size)"
      >
        {{ size }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.reading-tools,
.reading-jumps,
.reading-size {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reading-tools {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 0;
  margin: -20px 0 24px;
  border-bottom: 1px solid var(--kb-border);
}
.reading-jumps {
  flex-wrap: wrap;
}
a,
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 6px 10px;
  border-radius: var(--kb-radius-sm);
  color: var(--kb-text-muted);
  font-size: 13px;
}
button:disabled {
  opacity: 0.5;
  cursor: wait;
}
button {
  min-width: 44px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
a:hover,
button:hover {
  background: var(--kb-surface);
  color: var(--kb-text);
}
button[aria-pressed='true'] {
  background: var(--kb-surface);
  border-color: var(--kb-border-strong);
  color: var(--kb-text);
  font-weight: 700;
}
.reading-size > svg {
  color: var(--kb-text-subtle);
}
</style>
