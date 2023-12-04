import { defineConfig } from 'vite'

import preactPlugin from '@preact/preset-vite'
import rollupPluginSizes from 'rollup-plugin-sizes'

const plugins = [preactPlugin()]

export default defineConfig(({ mode, command }) => {
    console.log(`[Vite] Mode: ${mode}`)
    console.log(`[Vite] Command: ${command}`)

    return {
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
        },
        build: {
            outDir: 'out/',
            emptyOutDir: true,
            minify: mode === 'production' ? 'terser' : false,
            rollupOptions: {
                input: ['index.html', 'demo.html'],
            },
        },
        server: {
            port: 3000,
        },
        plugins:
            command === 'build'
                ? // mostro alcune metriche sul bundle generato
                  [...plugins, rollupPluginSizes()]
                : // altrimenti non usiamo nessun plugin per ora
                  [...plugins],
    }
})
