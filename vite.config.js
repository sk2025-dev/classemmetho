import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appUrl = env.APP_URL || env.VITE_APP_URL || '';
    let base = '/build/';

    try {
        if (appUrl) {
            const pathname = new URL(appUrl).pathname.replace(/\/+$/, '');
            base = pathname ? `${pathname}/build/` : '/build/';
        }
    } catch {
        base = '/build/';
    }

    return {
        base,
        plugins: [
            react(),
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.jsx'],
                refresh: true,
            }),
            tailwindcss(),
        ],
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**', '**/node_modules/**'],
            },
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        if (id.includes('@react-google-maps')) {
                            return 'vendor-google-maps';
                        }
                        if (id.includes('node_modules')) {
                            return 'vendor';
                        }
                    },
                },
            },
            chunkSizeWarningLimit: 800,
            sourcemap: false,
        },
        define: {
            'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ''),
        },
    };
});
