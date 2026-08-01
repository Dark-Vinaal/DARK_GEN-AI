import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    optimizeDeps: {
      // Force vite to pre-bundle these dependencies to prevent commonjs/esm issues
      include: ['jspdf', 'lucide-react', '@google/genai'],
    },
    server: {
      proxy: {}
    }
  };
});