import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/coffee-manager-dashboard/', // 👈 This must match your repo name exactly
  plugins: [react()],
});
