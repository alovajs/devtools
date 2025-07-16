import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vscodeWebviewHmr from 'vite-plugin-vscode-webview-hmr'
import VueDevTools from 'vite-plugin-vue-devtools'
import 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  build: {
    rollupOptions: {
      external: [
        'extension/handlers-type', // ignore react stuff
      ],
    },
  },
  plugins: [
    Vue(),
    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),
    vscodeWebviewHmr({
      linkDir: './src/assets',
    }),
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
  },
})
