import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-auth',
              test: /node_modules[\\/](firebase[\\/](auth|app)|@firebase[\\/](auth|app))/,
              priority: 20,
            },
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/](firebase[\\/]firestore|@firebase[\\/]firestore)/,
              priority: 20,
            },
          ],
        },
      },
    },
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
