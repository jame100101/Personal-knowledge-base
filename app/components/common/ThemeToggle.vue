<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

withDefaults(defineProps<{ showLabel?: boolean }>(), { showLabel: false })

const { isDark, toggleTheme } = useTheme()
const { t } = useLocale()
const ready = ref(false)
const actionLabel = computed(() =>
  isDark.value ? t('switchToLight') : t('switchToDark'),
)

onMounted(() => {
  ready.value = true
})
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="actionLabel"
    :title="actionLabel"
    :aria-pressed="!isDark"
    :disabled="!ready"
    @click="toggleTheme"
  >
    <span class="theme-icon" aria-hidden="true"
      ><Sun :size="16" :class="{ visible: isDark }" /><Moon
        :size="16"
        :class="{ visible: !isDark }"
    /></span>
    <span v-if="showLabel">{{ isDark ? t('lightMode') : t('darkMode') }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  min-width: 40px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 7px 9px;
  border: 1px solid transparent;
  border-radius: var(--kb-radius-sm);
  background: transparent;
  color: var(--kb-icon);
  cursor: pointer;
  transition:
    color 150ms ease,
    background 150ms ease,
    border-color 150ms ease;
}
.theme-toggle:hover {
  border-color: var(--kb-border);
  background: var(--kb-surface-hover);
  color: var(--kb-text);
}
.theme-toggle > span:not(.theme-icon) {
  flex: 1;
  text-align: left;
  font-size: 13px;
}
.theme-toggle:disabled {
  cursor: wait;
  opacity: 0.6;
}
.theme-icon {
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
  flex: none;
}
.theme-icon svg {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: rotate(-30deg) scale(0.7);
  transition:
    opacity var(--kb-duration-fast),
    transform var(--kb-duration-dialog) var(--kb-ease-out);
}
.theme-icon svg.visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .theme-icon svg {
    transform: none;
  }
}
</style>
