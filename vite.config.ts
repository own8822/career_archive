import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 상대 경로 지원 (GitHub Pages 및 로컬 동시 호환)
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  }
});
