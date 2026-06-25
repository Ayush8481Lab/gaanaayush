import { defineConfig } from 'vite'
import cloudflarePages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [cloudflarePages({ entry: './src/index.ts' })],
  build: {
    minify: true,
    emptyOutDir: true,
    reportCompressedSize: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js'
      }
    }
  }
})
