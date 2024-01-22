import { resolve } from 'path'

import { defineConfig } from 'vite'

import rollupPluginSizes from 'rollup-plugin-sizes'
import preactPlugin from '@preact/preset-vite'

/** @type {import('vite').PluginOption[]} */
const plugins = [preactPlugin()]

export default defineConfig(({ mode, command }) => {
    const BASE_URL = process.env.BASE_URL || ''
    console.log(`[Vite] Base URL: ${BASE_URL}`)

    const MANAGE_API_URL =
        process.env.MANAGE_API_URL || 'https://manage.develop.lb.cs.dm.unipi.it/api/v0'
    console.log(`[Vite] Manage API: ${MANAGE_API_URL}`)

    return {
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.BASE_URL': JSON.stringify(BASE_URL),
            'process.env.MANAGE_API_URL': JSON.stringify(MANAGE_API_URL),
        },
        server: {
            port: 3000,
        },
        build: {
            outDir: 'out/lib/',
            emptyOutDir: false,
            minify: 'terser',
            lib: {
                formats: ['iife'],
                entry: [resolve(__dirname, 'src/element.jsx')],
                name: 'DMPlanimetrie',
                fileName: 'dm-planimetrie-element',
            },
            rollupOptions: {
                output: {
                    assetFileNames: 'dm-planimetrie-element.[ext]',
                },
            },
        },
        plugins:
            command === 'build'
                ? // mostro alcune metriche sul bundle generato
                  [...plugins, rollupPluginSizes()]
                : // altrimenti non usiamo nessun plugin per ora
                  [...plugins],
    }
})
