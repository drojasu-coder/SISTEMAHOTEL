import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const config = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const enabled = config.VITE_GOOGLE_LOGIN_ENABLED;
  if (enabled && !['true', 'false'].includes(enabled)) {
    throw new Error('VITE_GOOGLE_LOGIN_ENABLED debe ser true o false');
  }
  const id = config.VITE_GOOGLE_CLIENT_ID?.trim();
  if ((id || enabled === 'true') && !/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id ?? '')) {
    throw new Error('VITE_GOOGLE_CLIENT_ID debe ser un Client ID web válido');
  }
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  },
  };
});
