import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill global for libraries like puter.js/socket.io
    global: 'window',
    // Polyfill process.env safely
    'process.env': process.env,
  },
  resolve: {
    alias: {
      // Ensure we don't accidentally bundle node-only modules
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    // Force vite to pre-bundle these dependencies to prevent commonjs/esm issues
    include: ['@heyputer/puter.js', 'jspdf', 'lucide-react', '@google/genai'],
  },
});