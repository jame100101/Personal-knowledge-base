<script setup lang="ts">
const { theme } = useTheme()
const { locale } = useLocale()
let themeFrame = 0
onBeforeUnmount(() => {
  cancelAnimationFrame(themeFrame)
  delete document.documentElement.dataset.themeChanging
})

watch(
  theme,
  (value, previous) => {
    if (!import.meta.client) return
    if (previous && previous !== value) {
      cancelAnimationFrame(themeFrame)
      document.documentElement.dataset.themeChanging = ''
      themeFrame = requestAnimationFrame(() => {
        themeFrame = requestAnimationFrame(() => {
          delete document.documentElement.dataset.themeChanging
        })
      })
    }
    document.documentElement.dataset.theme = value
    document.documentElement.style.colorScheme = value
  },
  { immediate: true, flush: 'sync' },
)

useHead(() => ({
  htmlAttrs: { 'data-theme': theme.value, lang: locale.value },
  meta: [
    {
      name: 'theme-color',
      content: theme.value === 'dark' ? '#0b0d0f' : '#f5f7f2',
    },
  ],
}))
</script>

<template>
  <NuxtLoadingIndicator color="#d8ff64" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
