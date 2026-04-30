import path from 'node:path'
import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { defineConfig, type Plugin } from 'vite'

// Dev-only endpoint: POST { filename, data } → writes hint-reports/<filename>.
// Used by the Leva "Report Missing Hint" button to persist debug snapshots
// of unsolvable hint states into a gitignored folder for offline review.
function hintReportPlugin(): Plugin {
    return {
        name: 'boxle-hint-report',
        apply: 'serve',
        configureServer(server) {
            const reportDir = path.resolve(import.meta.dirname, 'hint-reports')
            server.middlewares.use('/__hint-report', (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405
                    res.end()
                    return
                }
                let body = ''
                req.on('data', (chunk) => { body += chunk })
                req.on('end', () => {
                    try {
                        const { filename, data } = JSON.parse(body) as { filename?: unknown; data?: unknown }
                        if (typeof filename !== 'string' || filename.length === 0) {
                            res.statusCode = 400
                            res.end(JSON.stringify({ error: 'filename required' }))
                            return
                        }
                        const safe = path.basename(filename)
                        fs.mkdirSync(reportDir, { recursive: true })
                        const full = path.join(reportDir, safe)
                        fs.writeFileSync(full, JSON.stringify(data, null, 2))
                        res.statusCode = 200
                        res.setHeader('content-type', 'application/json')
                        res.end(JSON.stringify({ ok: true, path: path.relative(process.cwd(), full) }))
                    } catch (err) {
                        res.statusCode = 500
                        res.end(JSON.stringify({ error: String(err) }))
                    }
                })
            })
        },
    }
}

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production'

    return {
        root: 'src/',
        publicDir: '../public/',
        envDir: '../',
        // Tamagui's react-native-web shim reads process.env.NODE_ENV at runtime;
        // Vite only exposes import.meta.env on its own.
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
        },
        resolve: {
            alias: {
                'react-native': 'react-native-web',
            },
        },
        optimizeDeps: {
            // @tamagui/normalize-css-color imports `@react-native/normalize-color`
            // which is plain CommonJS and must be pre-bundled for the dev server.
            include: ['@react-native/normalize-color'],
        },
        plugins: [
            // The Tamagui plugin only does production-time optimization (CSS
            // extraction, view flattening). In dev it does nothing useful and
            // its `define` entries clobber Vite's env handling — keep it
            // production-only.
            ...(isProd
                ? [
                      tamaguiPlugin({
                          config: 'src/tamagui.config.ts',
                          components: ['tamagui'],
                          useReactNativeWebLite: true,
                      }),
                  ]
                : []),
            react(),
            hintReportPlugin(),
        ],
        server: {
            host: true,
            open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env),
        },
        build: {
            outDir: '../dist',
            emptyOutDir: true,
            sourcemap: isProd ? 'hidden' : true,
            assetsDir: 'boxle/assets',
            rollupOptions: {
                output: {
                    assetFileNames: 'boxle/assets/[name]-[hash][extname]',
                    chunkFileNames: 'boxle/assets/[name]-[hash].js',
                    entryFileNames: 'boxle/assets/[name]-[hash].js',
                },
            },
        },
    }
})
