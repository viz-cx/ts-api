import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core-signer.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  platform: 'neutral',
  minify: false,
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
