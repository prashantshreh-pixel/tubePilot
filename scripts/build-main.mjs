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

async function build() {
  const mainCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: [path.resolve(__dirname, '../src/main/index.ts')],
    outfile: path.resolve(__dirname, '../dist/main/index.js'),
    format: 'cjs',
  });

  const preloadCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: [path.resolve(__dirname, '../src/preload/index.ts')],
    outfile: path.resolve(__dirname, '../dist/preload/index.js'),
    format: 'cjs',
  });

  if (isWatch) {
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

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
