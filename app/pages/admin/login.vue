<script setup lang="ts">
import { ArrowLeft, KeyRound, LockKeyhole, Mail } from 'lucide-vue-next'

definePageMeta({ layout: false })
useHead({ title: '管理员登录' })
const { $supabaseConfigured } = useNuxtApp()
const auth = useAuth()
const { t } = useLocale()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  if (busy.value) return
  error.value = ''
  busy.value = true
  try {
    await auth.signIn(email.value, password.value)
    if (!auth.isAdmin.value) {
      await auth.signOut()
      throw new Error('此账户没有管理员权限')
    }
    await navigateTo('/admin')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '登录失败'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <NuxtLink to="/" class="back"
      ><ArrowLeft :size="15" /> {{ t('backLibrary') }}</NuxtLink
    >
    <ThemeToggle class="theme-control" />
    <section class="login-card">
      <div class="login-brand">
        <BrandMark /><span
          ><strong>Damnatiox</strong><small>SECURE ADMIN ACCESS</small></span
        >
      </div>
      <div class="login-icon"><LockKeyhole :size="22" /></div>
      <span class="eyebrow">ADMIN CONSOLE</span>
      <h1>{{ t('adminLogin') }}</h1>
      <p>{{ t('loginHint') }}</p>
      <div v-if="!$supabaseConfigured" class="config-notice">
        当前尚未配置 Supabase 环境变量。本地开发可直接访问
        <NuxtLink to="/admin">管理后台</NuxtLink>。
      </div>
      <form v-else @submit.prevent="submit">
        <div class="field">
          <label for="login-email">{{ t('email') }}</label>
          <div class="input-wrap">
            <Mail :size="15" /><input
              id="login-email"
              v-model="email"
              :disabled="busy"
              :aria-invalid="!!error"
              :aria-describedby="error ? 'login-error' : undefined"
              type="email"
              autocomplete="email"
              required
              placeholder="admin@example.com"
            />
          </div>
        </div>
        <div class="field">
          <label for="login-password">{{ t('password') }}</label>
          <div class="input-wrap">
            <KeyRound :size="15" /><input
              id="login-password"
              v-model="password"
              :disabled="busy"
              :aria-invalid="!!error"
              :aria-describedby="error ? 'login-error' : undefined"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••••••"
            />
          </div>
        </div>
        <p v-if="error" id="login-error" class="error-text" role="alert">{{ error }}</p>
        <button class="button primary" :disabled="busy" type="submit">
          {{ busy ? t('signingIn') : t('signIn') }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 80px 20px 32px;
  background: var(--kb-bg);
}
.back {
  position: fixed;
  top: 22px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--kb-text-subtle);
  font-size: 12px;
}
.back:hover {
  color: var(--kb-text);
}
.theme-control {
  position: fixed;
  top: 16px;
  right: 18px;
}
.login-card {
  width: min(430px, 100%);
  padding: 31px;
  border: 1px solid var(--kb-border);
  border-radius: var(--kb-radius-lg);
  background: var(--kb-surface);
  box-shadow: var(--kb-shadow);
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-bottom: 27px;
  margin-bottom: 29px;
  border-bottom: 1px solid var(--kb-border);
}
.login-brand span {
  display: grid;
}
.login-brand strong {
  font-size: 13px;
}
.login-brand small {
  color: var(--kb-text-subtle);
  font: 8px monospace;
  letter-spacing: 0.12em;
}
.login-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 19px;
  border: 1px solid var(--kb-border-strong);
  border-radius: 10px;
  color: var(--kb-accent);
  background: var(--kb-code-bg);
}
h1 {
  margin: 8px 0 9px;
  font-size: 28px;
  letter-spacing: -0.04em;
}
.login-card > p {
  margin: 0 0 24px;
  color: var(--kb-text-muted);
  font-size: 13px;
  line-height: 1.6;
}
form {
  display: grid;
  gap: 16px;
}
.input-wrap {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  border: 1px solid var(--kb-border);
  border-radius: var(--kb-radius-sm);
  background: var(--kb-bg);
  color: var(--kb-text-subtle);
}
.input-wrap:focus-within {
  border-color: var(--kb-accent);
}
.input-wrap input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline-offset: 2px;
  background: transparent;
  color: var(--kb-text);
}
.config-notice {
  padding: 12px;
  border: 1px solid var(--kb-demo-border);
  border-radius: var(--kb-radius-sm);
  background: var(--kb-demo-bg);
  color: var(--kb-demo-text);
  font-size: 12px;
  line-height: 1.6;
}
.config-notice a {
  color: var(--kb-accent);
  text-decoration: underline;
}
</style>
