import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";
import { resolve } from 'path'
import svgr from 'vite-plugin-svgr';
// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
  ],
  build: {
    outDir: process.env.OUTPUT_DIR || 'dist'
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: true,
    },
    watch: {
      awaitWriteFinish: {
        pollInterval: 50,
        stabilityThreshold: 100,
      },
    },
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/index.css",
        "./index.html",
        "./src/**/*.tsx",
        "./src/**/*.ts",
        "./src/**/*.jsx",
        "./src/**/*.js",
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/test-utils.ts',
        'src/__tests__/setup.ts',
        'dist/',
        'dist-server/',
        'dist-test/'
      ]
    }
  }
});
