import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ffApi } from './server/api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), ffApi()],
  server: {
    port: 5180,
    // 디자인 시스템 파일은 FF가 직접 고치므로, 고칠 때마다 화면이 새로 고쳐지지 않게 한다.
    watch: { ignored: ['**/systems/**'] },
  },
})
