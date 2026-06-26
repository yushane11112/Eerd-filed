import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 550,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.indexOf('node_modules') === -1) {
                        return;
                    }
                    if (id.indexOf('/node_modules/@pixi/react/') !== -1) {
                        return 'pixi-react';
                    }
                    if (id.indexOf('/node_modules/pixi.js/') !== -1 || id.indexOf('/node_modules/@pixi/') !== -1) {
                        return 'pixi';
                    }
                    if (id.indexOf('/node_modules/react/') !== -1 || id.indexOf('/node_modules/react-dom/') !== -1) {
                        return 'react';
                    }
                    if (id.indexOf('/node_modules/lucide-react/') !== -1) {
                        return 'icons';
                    }
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
});
