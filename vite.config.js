import { defineConfig } from 'vite'

import preactPlugin from '@preact/preset-vite'
import rollupPluginSizes from 'rollup-plugin-sizes'

/**
 * @type {import('vite').PluginOption[]}
 */
const plugins = [preactPlugin()]

export default defineConfig(({ mode, command }) => {
    console.log(`[Vite] Mode: ${mode}`)
    console.log(`[Vite] Command: ${command}`)

    // base url without trailing slash
    const BASE_URL = process.env.BASE_URL || ''
    console.log(`[Vite] Base URL: ${BASE_URL}`)

    // url to the planimetrie service (no trailing slash)
    const PLANIMETRIE_API_URL =
        process.env.PLANIMETRIE_API_URL ||
        'https://manage.develop.lb.cs.dm.unipi.it/api/v0/process/planimetrie'
    console.log(`[Vite] Planimetrie URL: ${PLANIMETRIE_API_URL}`)

    return {
        base: BASE_URL + '/',
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.BASE_URL': JSON.stringify(BASE_URL),
            'process.env.PLANIMETRIE_API_URL': JSON.stringify(PLANIMETRIE_API_URL),
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
