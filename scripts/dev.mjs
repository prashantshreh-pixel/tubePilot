import { spawn } from 'child_process';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startDev() {
  // 1. Build main and preload
  const buildProc = spawn('node', [path.resolve(__dirname, 'build-main.mjs')], {
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    buildProc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Main build failed with exit code ${code}`));
    });
  });

  // 2. Start Vite dev server for renderer
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
  const electronProc = spawn(electronPath, [path.resolve(__dirname, '../dist/main/index.js')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  electronProc.on('close', () => {
    viteServer.close();
    process.exit(0);
  });
}

startDev().catch((err) => {
  console.error('[dev] Failed to start:', err);
  process.exit(1);
});
