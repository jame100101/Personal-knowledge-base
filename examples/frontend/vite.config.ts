import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        vue: fileURLToPath(new URL('./vue.html', import.meta.url)),
        react: fileURLToPath(new URL('./react.html', import.meta.url)),
      },
    },
  },
})
