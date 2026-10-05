<script setup lang="ts">
import { BookOpen, LogOut, Menu, X } from 'lucide-vue-next'

const auth = useAuth()
const { isDemo } = useKnowledge()
const route = useRoute()
const mobileOpen = ref(false)
const { t } = useLocale()
const sidebar = ref<HTMLElement>()
const menuButton = ref<HTMLButtonElement>()
const compact = ref(false)
let media: MediaQueryList | undefined
function resize() {
  compact.value = media?.matches ?? false
  if (!compact.value) mobileOpen.value = false
}
useDrawer(mobileOpen, sidebar, menuButton)
onMounted(() => {
  media = window.matchMedia('(max-width: 760px)')
  resize()
  media.addEventListener('change', resize)
})
onBeforeUnmount(() => media?.removeEventListener('change', resize))

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="admin-shell">
    <a class="skip-link" href="#main-content">{{ t('skipContent') }}</a>
    <header class="admin-mobile-header" :inert="mobileOpen">
      <button
        ref="menuButton"
        type="button"
        :aria-label="t('openNavigation')"
        :aria-expanded="mobileOpen"
        aria-controls="admin-navigation"
        @click="mobileOpen = true"
      >
        <Menu :size="20" />
      </button>
      <NuxtLink to="/admin"><BrandMark /><strong>Damnatiox</strong></NuxtLink>
      <ThemeToggle />
    </header>

    <Transition name="fade"
      ><div v-if="mobileOpen" class="admin-backdrop" @click="mobileOpen = false"
    /></Transition>
    <aside
      id="admin-navigation"
      ref="sidebar"
      :class="{ mobileOpen }"
      :inert="compact && !mobileOpen"
      :aria-label="t('admin')"
    >
      <div class="admin-brand-row">
        <NuxtLink to="/admin" class="admin-brand"
          ><BrandMark /><span
            ><strong>Damnatiox</strong><small>KNOWLEDGE WORKSPACE</small></span
          ></NuxtLink
        >
        <button
          class="mobile-close"
          type="button"
          :aria-label="t('closeNavigation')"
          @click="mobileOpen = false"
        >
          <X :size="17" />
        </button>
      </div>

      <AdminExplorer />

      <div class="admin-bottom">
        <NuxtLink to="/"><BookOpen :size="15" /> {{ t('backLibrary') }}</NuxtLink>
        <div class="admin-preferences">
          <ThemeToggle show-label /><LanguageSelector />
        </div>
        <button v-if="!isDemo" type="button" @click="auth.signOut">
          <LogOut :size="15" /> {{ t('signOut') }}
        </button>
      </div>
    </aside>
    <main id="main-content" tabindex="-1" :inert="mobileOpen">
      <div v-if="isDemo" class="admin-demo">{{ t('adminDemo') }}</div>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: var(--kb-admin-sidebar-width) minmax(0, 1fr);
}
aside {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 13px 10px 10px;
  border-right: 1px solid var(--kb-border);
  background: var(--kb-surface);
}
.admin-brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 6px 16px;
}
.admin-brand span {
  min-width: 0;
  display: grid;
}
.admin-brand strong {
  font-size: 13px;
}
.admin-brand small {
  overflow: hidden;
  color: var(--kb-text-subtle);
  font: 7px monospace;
  letter-spacing: 0.12em;
  white-space: nowrap;
}
.mobile-close {
  display: none;
}
.admin-bottom {
  display: grid;
  gap: 2px;
  padding-top: 7px;
  border-top: 1px solid var(--kb-border);
}
.admin-bottom a,
.admin-bottom button {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--kb-radius-sm);
  background: transparent;
  color: var(--kb-text-muted);
  font-size: 13px;
  cursor: pointer;
}
.admin-bottom a:hover,
.admin-bottom button:hover {
  background: var(--kb-surface-hover);
  color: var(--kb-text);
}
main {
  min-width: 0;
}
.admin-demo {
  min-height: 28px;
  display: grid;
  place-items: center;
  border-bottom: 1px solid var(--kb-demo-border);
  background: var(--kb-demo-bg);
  color: var(--kb-demo-text);
  font: 10px monospace;
}
.admin-mobile-header,
.admin-backdrop {
  display: none;
}
@media (max-width: 760px) {
  .admin-shell {
    display: block;
    padding-top: 54px;
  }
  .admin-mobile-header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 45;
    height: 54px;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    padding: 0 10px;
    border-bottom: 1px solid var(--kb-border);
    background: var(--kb-panel-bg);
    backdrop-filter: blur(8px);
  }
  .admin-mobile-header > button {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--kb-text-muted);
  }
  .admin-mobile-header > a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 12px;
  }
  aside {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(310px, 88vw);
    height: 100dvh;
    transform: translateX(-100%);
    transition: transform var(--kb-duration-panel) var(--kb-ease-out);
  }
  aside.mobileOpen {
    transform: translateX(0);
  }
  .mobile-close {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--kb-text-muted);
  }
  .admin-backdrop {
    position: fixed;
    inset: 0;
    z-index: 46;
    display: block;
    background: var(--kb-overlay);
  }
}
.admin-preferences {
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (max-width: 760px) {
  aside {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
}
</style>
