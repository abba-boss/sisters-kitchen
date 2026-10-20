import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true,
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  },

  server: {
    port: 5174,
    host: '0.0.0.0', // Listen on all interfaces
    strictPort: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true, // Fix refresh issue
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['framer-motion'],
          'chart-vendor':  ['recharts'],
          'socket-vendor': ['socket.io-client'],
          'icons-vendor':  ['lucide-react'],
        },
      },
    },
  },
});
