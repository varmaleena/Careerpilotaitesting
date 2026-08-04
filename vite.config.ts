import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // PERF FIX: Expose all 7 Gemini API keys so load balancer works at runtime
      'import.meta.env.VITE_GEMINI_API_KEY':   JSON.stringify(env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY_2': JSON.stringify(env.VITE_GEMINI_API_KEY_2),
      'import.meta.env.VITE_GEMINI_API_KEY_3': JSON.stringify(env.VITE_GEMINI_API_KEY_3),
      'import.meta.env.VITE_GEMINI_API_KEY_4': JSON.stringify(env.VITE_GEMINI_API_KEY_4),
      'import.meta.env.VITE_GEMINI_API_KEY_5': JSON.stringify(env.VITE_GEMINI_API_KEY_5),
      'import.meta.env.VITE_GEMINI_API_KEY_6': JSON.stringify(env.VITE_GEMINI_API_KEY_6),
      'import.meta.env.VITE_GEMINI_API_KEY_7': JSON.stringify(env.VITE_GEMINI_API_KEY_7),
      // Firebase env vars
      'import.meta.env.VITE_FIREBASE_API_KEY':             JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN':         JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID':          JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET':      JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID':              JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID':      JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      // Job APIs
      'import.meta.env.VITE_ADZUNA_APP_ID':  JSON.stringify(env.VITE_ADZUNA_APP_ID),
      'import.meta.env.VITE_ADZUNA_APP_KEY': JSON.stringify(env.VITE_ADZUNA_APP_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // PERFORMANCE: Build optimizations
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // PERF: Granular chunk splitting — avoids shipping all vendors in one blob
          manualChunks: {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
            'vendor-ai':       ['@google/genai'],
            'vendor-charts':   ['recharts'],
            'vendor-pdf':      ['pdfjs-dist'],
            'vendor-icons':    ['lucide-react'],
          }
        }
      }
    },
    // PERFORMANCE: Pre-bundle frequently-used deps to avoid per-import overhead
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', '@google/genai']
    }
  };
});
