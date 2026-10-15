import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { dbService } from '../services/db/database';
import { youtubeService } from '../services/youtube/youtubeService';
import { aiService } from '../services/ai/aiService';
import { ffmpegService } from '../services/ffmpeg/ffmpegService';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  await dbService.initialize();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0c0e14',
    title: 'TubePilot - AI YouTube Growth Desktop App',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  setupIpcHandlers();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // App & System
  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    platform: process.platform,
    isEncrypted: true,
  }));

  ipcMain.handle('app:openFolder', async (_, folderPath: string) => {
    if (folderPath) {
      shell.openPath(folderPath);
    }
  });

  ipcMain.handle('app:openExternal', async (_, url: string) => {
    if (url) {
      shell.openExternal(url);
    }
  });

  // Settings
  ipcMain.handle('db:getSettings', () => {
    return dbService.getSettings();
  });

  ipcMain.handle('db:saveSettings', (_, patch) => {
    return dbService.saveSettings(patch);
  });

  // Analytics & YouTube
  ipcMain.handle('db:getAnalyticsCache', () => {
    return dbService.getAnalyticsCache();
  });

  ipcMain.handle('youtube:refreshAnalytics', async (_, force?: boolean) => {
    return youtubeService.fetchChannelAnalytics(force);
  });

  ipcMain.handle('youtube:startAuth', async () => {
    return youtubeService.startOAuthFlow();
  });

  ipcMain.handle('youtube:disconnect', async () => {
    dbService.saveSettings({
      isYouTubeConnected: false,
      youtubeTokens: undefined,
    });
  });

  ipcMain.handle('youtube:getQuota', async () => {
    return youtubeService.getQuotaInfo();
  });

  ipcMain.handle('youtube:uploadVideo', async (_, payload) => {
    return youtubeService.uploadVideo(payload);
  });

  // AI & Diagnosis
  ipcMain.handle('ai:generateChannelSummary', async () => {
    return aiService.generateChannelSummary();
  });

  // Ideas
  ipcMain.handle('db:getIdeas', (_, date?: string) => {
    return dbService.getIdeas(date);
  });

  ipcMain.handle('ai:generateDailyIdeas', async (_, force?: boolean) => {
    return aiService.generateDailyIdeas(force);
  });

  ipcMain.handle('ai:regenerateIdea', async (_, ideaId: string) => {
    return aiService.regenerateSingleIdea(ideaId);
  });

  ipcMain.handle('db:saveIdea', (_, idea) => {
    return dbService.saveIdea(idea);
  });

  ipcMain.handle('db:deleteIdea', (_, id: string) => {
    return dbService.deleteIdea(id);
  });

  // Thumbnails
  ipcMain.handle('db:getThumbnails', (_, ideaId?: string) => {
    return dbService.getThumbnails(ideaId);
  });

  ipcMain.handle('ai:generateThumbnailPrompt', async (_, ideaId: string) => {
    return aiService.generateThumbnailPrompt(ideaId);
  });

  ipcMain.handle('ai:generateThumbnailImages', async (_, thumbnailId: string) => {
    return aiService.generateThumbnailImages(thumbnailId);
  });

  ipcMain.handle('ai:exportThumbnail', async (_, thumbnailId: string, varIndex: number, text?: string) => {
    return aiService.exportThumbnail(thumbnailId, varIndex, text);
  });

  // Loop Videos
  ipcMain.handle('db:getLoopVideos', (_, ideaId?: string) => {
    return dbService.getLoopVideos(ideaId);
  });

  ipcMain.handle('ai:generateLoopPrompt', async (_, ideaId: string) => {
    return aiService.generateLoopPrompt(ideaId);
  });

  ipcMain.handle('ai:renderLoopVideo', async (_, loopVideoId: string, config?: any) => {
    return aiService.renderLoopVideo(loopVideoId, config, (progress, message) => {
      mainWindow?.webContents.send('loop:progress', { id: loopVideoId, progress, message });
    });
  });

  ipcMain.handle('ai:cancelLoopRender', async (_, loopVideoId: string) => {
    ffmpegService.cancelRender(loopVideoId);
  });

  // Upload Kits
  ipcMain.handle('db:getUploadKits', (_, ideaId?: string) => {
    return dbService.getUploadKits(ideaId);
  });

  ipcMain.handle('ai:generateUploadKit', async (_, ideaId: string) => {
    return aiService.generateUploadKit(ideaId);
  });

  ipcMain.handle('db:saveUploadKit', (_, kit) => {
    return dbService.saveUploadKit(kit);
  });

  // Library
  ipcMain.handle('db:getLibraryItems', () => {
    return dbService.getLibraryItems();
  });
}
