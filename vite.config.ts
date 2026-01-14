import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill global for libraries like puter.js/socket.io
      global: 'window',
      // Polyfill process.env safely by injecting loaded env variables
      'process.env': env,
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
  };
});