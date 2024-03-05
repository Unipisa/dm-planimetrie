import { defineConfig } from 'vite'

import path from 'path'
import fs from 'fs'

import preactPlugin from '@preact/preset-vite'
import rollupPluginSizes from 'rollup-plugin-sizes'

export default defineConfig(({ mode, command }) => {
    console.log(`[Vite] Mode: ${mode}`)
    console.log(`[Vite] Command: ${command}`)

    // base url without trailing slash
    const BASE_URL = process.env.BASE_URL || ''
    console.log(`[Vite] Base URL: ${BASE_URL}`)

    const plugins = [preactPlugin(), rewriteHtmlLinksPlugin(BASE_URL), gzipDevFix()]

    // url to the planimetrie service (no trailing slash)

    const MANAGE_API_URL = process.env.MANAGE_API_URL || 'https://manage.dm.unipi.it/api/v0'
    console.log(`[Vite] Manage API: ${MANAGE_API_URL}`)

    // url to manage (no trailing slash)
    const MANAGE_URL = process.env.MANAGE_URL || 'https://manage.dm.unipi.it'
    console.log(`[Vite] Manage: ${MANAGE_URL}`)

    return {
        base: BASE_URL + '/',
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.BASE_URL': JSON.stringify(BASE_URL),
            'process.env.MANAGE_URL': JSON.stringify(MANAGE_URL),
            'process.env.MANAGE_API_URL': JSON.stringify(MANAGE_API_URL),
        },
        build: {
            outDir: 'out/',
            emptyOutDir: true,
            minify: mode === 'production' ? 'terser' : false,
            rollupOptions: {
                input: ['index.html', 'demo/index.html', 'tool/index.html'],
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

/** @type {(baseUrl: string) => import('vite').Plugin} */
function rewriteHtmlLinksPlugin(baseUrl) {
    return {
        transformIndexHtml(html) {
            // fix anchor tag base path
            return html.replace(/<a href="(.*?)">/g, (match, p1) => {
                if (p1.startsWith('http')) {
                    return match
                } else {
                    return `<a href="${baseUrl}${p1}">`
                }
            })
        },
    }
}

// vite automatically adds "Content-Encoding: gzip" to .gz files so the client
// automatically decompresses the file. GitHub pages instead just sends the
// file without that header so an actually compressed file arrives to the
// client.
// The following "gzipDevFix" vite plugin manually sends .gz files without that
// header to correctly use this during development.

/** @type {(baseUrl: string) => import('vite').Plugin} */
function gzipDevFix() {
    return {
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.method === 'GET' && req.url.endsWith('.gz')) {
                    const gzFilePath = path.join(__dirname, 'public', req.url)
                    if (fs.existsSync(gzFilePath)) {
                        const fileStream = fs.createReadStream(gzFilePath)
                        res.writeHead(200, { 'Content-Type': 'application/gzip' })

                        fileStream.pipe(res)
                    } else {
                        res.writeHead(404)
                        res.end('File not found')
                    }
                } else {
                    next()
                }
            })
        },
    }
}
