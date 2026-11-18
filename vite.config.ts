import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ffApi } from './server/api.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), ffApi()],
  server: {
    port: 5180,
    // 디자인 시스템 파일은 FF가 직접 고치므로, 고칠 때마다 화면이 새로 고쳐지지 않게 지켜보지 않는다.
    // FF 자신의 디자인 시스템(ff-ds)의 값 파일만은 지켜본다. index.css가 이 파일을 가져다 쓰므로, FF에서 값을 고치면 FF의 화면에 바로 반영된다(화면 전체가 아니라 스타일만 바뀐다).
    // 목록에 "빼고"를 적는 방식은 듣지 않는다(하나라도 맞으면 지켜보지 않는다). 그래서 경로를 직접 가린다. ff-ds 폴더 자체도 지켜봐야 그 안의 파일이 보인다.
    watch: { ignored: (path: string) => /[\\/]systems[\\/]/.test(path) && !/[\\/]systems[\\/]ff-ds([\\/]tokens\.css)?$/.test(path) },
  },
})
