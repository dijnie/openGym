import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('./', import.meta.url))
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode === 'test' ? 'zalo' : mode, root, '')
  const url = new URL(env.VITE_ZALO_API_BASE)
  if (env.VITE_ZALO !== '1' || url.protocol !== 'https:' || url.origin !== env.VITE_ZALO_API_BASE) {
    throw new Error('Use --mode zalo with an HTTPS VITE_ZALO_API_BASE origin')
  }
  return {
    root,
    base: './',
    publicDir: false,
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [react(), {
      name: 'opengym-zalo-config',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'app-config.json',
          source: readFileSync(new URL('./app-config.json', import.meta.url), 'utf8'),
        })
      },
    }],
    build: {
      outDir: 'dist',
      modulePreload: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/zalo.module.js',
          chunkFileNames: 'assets/[name].[hash].module.js',
        },
      },
    },
  }
})
