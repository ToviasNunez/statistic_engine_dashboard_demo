import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/statistic_engine_dashboard_demo/', // 👈 MUY IMPORTANTE
  server: {
    host: '0.0.0.0',
    port: 3000
  },
});