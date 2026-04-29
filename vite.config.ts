import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
    root: 'src/',
    publicDir: '../public/',
    envDir: '../',
    plugins: [react()],
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: mode === 'development' ? true : 'hidden',
        assetsDir: 'boxle/assets',
        rollupOptions: {
            output: {
                assetFileNames: 'boxle/assets/[name]-[hash][extname]',
                chunkFileNames: 'boxle/assets/[name]-[hash].js',
                entryFileNames: 'boxle/assets/[name]-[hash].js',
            }
        }
    },
}))
