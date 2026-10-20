import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { realtimeServerPlugin } from './server/realtimePlugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), realtimeServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
