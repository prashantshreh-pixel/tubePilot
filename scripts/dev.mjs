import { spawn } from 'child_process';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from './build-main.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startDev() {
  console.log('[dev] Building main and preload scripts...');
  // 1. Build main and preload directly in-process (avoiding shell path quoting issues)
  await build(false);

  // 2. Start Vite dev server for renderer
  console.log('[dev] Starting Vite dev server...');
  const viteServer = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    server: { port: 5173 },
  });
  await viteServer.listen();
  viteServer.printUrls();

  // 3. Launch Electron pointing to local Vite server
  process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';

  // Find electron executable from node_modules
  const electronPath = (await import('electron')).default;
  const mainScriptPath = path.resolve(__dirname, '../dist/main/index.cjs');

  console.log(`[dev] Launching Electron (${electronPath})...`);
  const electronProc = spawn(electronPath, [mainScriptPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  electronProc.on('error', (err) => {
    console.error('[dev] Electron process failed to spawn:', err);
  });

  electronProc.on('close', (code) => {
    console.log(`[dev] Electron closed with code ${code}`);
    viteServer.close();
    process.exit(code || 0);
  });
}

startDev().catch((err) => {
  console.error('[dev] Failed to start:', err);
  process.exit(1);
});
