import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  external: [
    'electron',
    'sql.js',
    'ffmpeg-static',
    'ffprobe-static',
  ],
  loader: {
    '.wasm': 'file',
  },
};

export async function build(watchMode = isWatch) {
  const mainCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: [path.resolve(__dirname, '../src/main/index.ts')],
    outfile: path.resolve(__dirname, '../dist/main/index.cjs'),
    format: 'cjs',
  });

  const preloadCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: [path.resolve(__dirname, '../src/preload/index.ts')],
    outfile: path.resolve(__dirname, '../dist/preload/index.cjs'),
    format: 'cjs',
  });

  if (watchMode) {
    await mainCtx.watch();
    await preloadCtx.watch();
    console.log('[esbuild] Watching main & preload scripts...');
  } else {
    await mainCtx.rebuild();
    await preloadCtx.rebuild();
    await mainCtx.dispose();
    await preloadCtx.dispose();
    console.log('[esbuild] Main & preload built successfully.');
  }
}

// If executed directly from CLI (e.g. npm run build:main)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

