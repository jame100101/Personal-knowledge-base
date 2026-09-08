<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { Breadcrumb } from '~/types/knowledge'

defineProps<{ items: Breadcrumb[] }>()
const { t } = useLocale()
</script>

<template>
  <nav class="breadcrumbs" :aria-label="t('breadcrumbs')">
    <template v-for="(item, index) in items" :key="item.path">
      <ChevronRight v-if="index" :size="13" aria-hidden="true" />
      <NuxtLink
        :to="item.path"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        {{ item.label }}
      </NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--kb-text-subtle);
  font-size: 12px;
  overflow: hidden;
}
.breadcrumbs a {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms;
}
.breadcrumbs a:hover,
.breadcrumbs a[aria-current='page'] {
  color: var(--kb-text-muted);
}
.breadcrumbs svg {
  flex: none;
  color: var(--kb-icon);
}

@media (max-width: 1180px) {
  .breadcrumbs {
    overflow-x: auto;
    padding-bottom: 4px;
    font-size: 13px;
  }
  .breadcrumbs a {
    flex-shrink: 0;
    max-width: 240px;
    min-height: 36px;
    display: flex;
    align-items: center;
  }
}
</style>
