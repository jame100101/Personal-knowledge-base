<script setup lang="ts">
const props = defineProps<{
  chapter: {
    id: string
    title: string
    summary: string
    modules: string[]
    mode: string
    image: string
  }
}>()
const routeSource = computed(() => {
  const nodes = props.chapter.modules.map(
    (label, i) => `N${i}["${String(i + 1).padStart(2, '0')} ${label}"]`,
  )
  const edges =
    props.chapter.mode === 'choices'
      ? ['C["按项目需要选择"]', ...nodes.map((_, i) => `C --> N${i}`)]
      : [nodes.map((_, i) => `N${i}`).join(' --> ')]
  return '```mermaid\nflowchart LR\n' + [...nodes, ...edges].join('\n') + '\n```'
})
</script>

<template>
  <section class="chapter-overview" :aria-label="`${chapter.title}：章节概览`">
    <a
      :href="chapter.image"
      target="_blank"
      rel="noopener"
      class="chapter-cover"
      :aria-label="`查看${chapter.title}概括图原图（新窗口）`"
    >
      <img
        :src="chapter.image"
        :alt="`${chapter.title}：${chapter.modules.join('、')}`"
        width="1672"
        height="941"
        loading="lazy"
        decoding="async"
      >
    </a>
    <div class="chapter-overview-copy">
      <p class="eyebrow">CHAPTER OVERVIEW · 章节概览</p>
      <p>{{ chapter.summary }}</p>
      <h2>本章学习路线</h2>
      <p class="chapter-route-note">
        {{
          chapter.mode === 'choices'
            ? '这些是可选方向，按项目需要选择，不必全部学完。'
            : '箭头表示建议的学习顺序；先理解问题，再逐步进入实现与实践。'
        }}
      </p>
      <MarkdownRenderer :source="routeSource" diagram-only />
    </div>
  </section>
</template>

<style scoped>
.chapter-overview {
  margin: 24px 0 32px;
  overflow: hidden;
  border: 1px solid var(--kb-border);
  border-radius: 16px;
}
.chapter-cover {
  display: block;
  background: #edf5ff;
}
.chapter-cover img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: contain;
}
.chapter-overview-copy {
  padding: 20px 24px;
}
.chapter-overview-copy p {
  line-height: 1.8;
}
.chapter-overview-copy h2 {
  font-size: 18px;
  margin: 22px 0 8px;
}
.chapter-route-note {
  font-size: 13px;
  color: var(--kb-text-muted);
}
@media (max-width: 600px) {
  .chapter-overview-copy {
    padding: 16px;
  }
}
</style>
