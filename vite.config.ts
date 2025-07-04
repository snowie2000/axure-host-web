import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `https://ui.wocai.net`, // 后台接口前缀
        changeOrigin: true, // 是否允许跨域
        secure: false, // 如果是https接口，需要配置这个参数
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
