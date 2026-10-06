import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the API runs separately; proxy /api so the browser sees one origin.
    proxy: { '/api': process.env.VITE_DEV_API_PROXY || 'http://localhost:5000' },
    // Crisis resources are shared with the backend from ../shared.
    fs: { allow: ['..'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
});
