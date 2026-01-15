import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs({
      filter(id) {
        // Traiter hexasphere.js avec le plugin CommonJS
        if (id.includes('hexasphere.js')) {
          return true;
        }
        return false;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gaia/shared': path.resolve(__dirname, '../../packages/shared/src'),
      // Exclure react-native complètement (incompatible avec le web)
      'react-native': path.resolve(__dirname, './src/utils/react-native-stub.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Configuration pour gérer hexasphere.js (CommonJS)
    commonjsOptions: {
      include: [/hexasphere\.js/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  // Configuration pour les assets GLB/GLTF
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Exclure react-native et hexasphere.js du bundling (incompatible avec Vite)
  optimizeDeps: {
    exclude: ['react-native', 'react-native-get-random-values', 'hexasphere.js'],
  },
  ssr: {
    noExternal: [],
    external: ['react-native'],
  },
});

