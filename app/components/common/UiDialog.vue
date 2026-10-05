<script setup lang="ts">
import { useAnimate, useReducedMotion } from 'motion-v'
import { lockBodyScroll } from '~/utils/scroll-lock'
const props = defineProps<{
  open: boolean
  label: string
  compact?: boolean
  returnFocus?: HTMLElement
}>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const [scope, animate] = useAnimate()
const reduced = useReducedMotion()
let release: (() => void) | undefined
let trigger: HTMLElement | null = null
let revision = 0
let animation: ReturnType<typeof animate> | undefined
async function sync(open: boolean) {
  const current = ++revision
  animation?.stop()
  await nextTick()
  if (!dialog.value || current !== revision) return
  if (open) {
    if (!dialog.value.open) {
      trigger = props.returnFocus || (document.activeElement as HTMLElement)
      release = lockBodyScroll()
      dialog.value.showModal()
      const focusTarget =
        dialog.value.querySelector<HTMLElement>('[autofocus]') ||
        dialog.value.querySelector<HTMLElement>('input, button')
      focusTarget?.focus()
    }
    animation = animate(
      scope.value,
      { opacity: [0.6, 1], y: reduced.value ? 0 : [8, 0] },
      { duration: reduced.value ? 0 : 0.2, ease: 'easeOut' },
    )
  } else if (dialog.value.open) {
    animation = animate(
      scope.value,
      { opacity: 0, y: reduced.value ? 0 : 4 },
      { duration: reduced.value ? 0 : 0.14, ease: 'easeOut' },
    )
    await animation
    if (current !== revision) return
    dialog.value.close()
    release?.()
    release = undefined
    if (
      trigger?.isConnected &&
      trigger.getClientRects().length &&
      !trigger.closest('[inert]')
    )
      trigger.focus({ preventScroll: true })
    else
      document
        .querySelector<HTMLElement>('#main-content')
        ?.focus({ preventScroll: true })
  }
}
watch(() => props.open, sync)
onMounted(() => sync(props.open))
onBeforeUnmount(() => {
  revision++
  animation?.stop()
  release?.()
  dialog.value?.close()
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="kb-dialog"
      :class="{ compact }"
      :aria-label="label"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div ref="scope" class="kb-dialog-panel"><slot /></div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.kb-dialog {
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: max(8vh, env(safe-area-inset-top)) 16px 24px;
  border: 0;
  background: transparent;
  color: var(--kb-text);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.kb-dialog[open] {
  display: grid;
  align-items: start;
  justify-items: center;
}
.kb-dialog::backdrop {
  background: var(--kb-overlay);
}
.kb-dialog-panel {
  width: min(680px, 100%);
  min-width: 0;
  border: 1px solid var(--kb-border-strong);
  border-radius: var(--kb-radius-lg);
  background: var(--kb-surface);
  box-shadow: var(--kb-shadow);
  overflow: hidden;
}
@media (max-width: 600px) {
  .kb-dialog {
    padding: max(12px, env(safe-area-inset-top)) 12px 12px;
  }
}
.kb-dialog.compact .kb-dialog-panel {
  width: min(460px, 100%);
}
</style>
