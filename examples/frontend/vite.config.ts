import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  plugins: [vue()],
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        nativeBasics: fileURLToPath(
          new URL('./foundations/native.html', import.meta.url),
        ),
        vueBasics: fileURLToPath(new URL('./foundations/vue.html', import.meta.url)),
        reactBasics: fileURLToPath(
          new URL('./foundations/react.html', import.meta.url),
        ),
        vue: fileURLToPath(new URL('./vue.html', import.meta.url)),
        react: fileURLToPath(new URL('./react.html', import.meta.url)),
      },
    },
  },
})
