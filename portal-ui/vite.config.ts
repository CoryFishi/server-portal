import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5154',
                changeOrigin: true,
                timeout: 300000, // 5 minutes for large uploads
            },
            '/hubs': {
                target: 'http://localhost:5154',
                changeOrigin: true,
                ws: true,
            },
        },
    },
})