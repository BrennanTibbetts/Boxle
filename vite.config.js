import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'

export default {
    root: 'src/',
    publicDir: '../public/',
    plugins:
    [
        // React support
        react(),

        // .js file support as if it was JSX
        {
            name: 'load+transform-js-files-as-jsx',
            async transform(code, id)
            {
                if (!id.match(/src\/.*\.js$/))
                    return null

                return transformWithEsbuild(code, id, {
                    loader: 'jsx',
                    jsx: 'automatic',
                })
            },
        },
    ],
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        assetsDir: 'boxle/assets', // Explicitly set assets directory
        // Add asset handling configuration
        rollupOptions: {
            output: {
                assetFileNames: 'boxle/assets/[name]-[hash][extname]',
                chunkFileNames: 'boxle/assets/[name]-[hash].js',
                entryFileNames: 'boxle/assets/[name]-[hash].js',
            }
        }
    },
}