import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: command === 'serve' ? 'demo' : '.',
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.js',
      formats: ['es'],
      fileName: () => 'remote.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}));