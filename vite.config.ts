import { defineConfig } from 'vite'
import { tanstackStartVite } from '@lovable.dev/vite-tanstack-config'

export default defineConfig({
  plugins: [
    tanstackStartVite({
      nitro: true
    })
  ]
})
