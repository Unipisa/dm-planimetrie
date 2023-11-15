import preactPlugin from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        out: 'out',
        emptyOutDir: true,
    },
    server: {
        port: 3000,
    },
    plugins: [preactPlugin()],
})
