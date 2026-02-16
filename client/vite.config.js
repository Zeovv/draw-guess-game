import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 确保静态资源正确处理
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // 确保生成的文件名是稳定的
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    // 开发服务器优化
    host: true,
    port: 5173
  }
})
