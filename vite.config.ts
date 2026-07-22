import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Expose only explicitly public Vite variables to browser code.
  envPrefix: 'VITE_',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
