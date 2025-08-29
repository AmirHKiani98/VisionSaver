// electron-vite.config.js
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
          splash: resolve(__dirname, 'src/renderer/loading.html')
        },
        // Add this section to exclude native modules
        external: [
          'nodejs-polars',
          'nodejs-polars-win32-x64-msvc',
          /\.node$/
        ]
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    optimizeDeps: {
      // Add this section to exclude nodejs-polars from optimization
      exclude: ['nodejs-polars']
    },
    plugins: [react(), tailwindcss()]
  }
})
