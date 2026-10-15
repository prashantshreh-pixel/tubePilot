import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  ChannelAnalytics,
  AIDiagnosis,
  VideoIdea,
  ThumbnailData,
  LoopVideoData,
  UploadKitData,
  YouTubeUploadPayload,
  YouTubeQuotaInfo,
} from '../shared/types';

export const tubePilotAPI = {
  // --- Settings & App ---
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('db:saveSettings', settings),
  getAppInfo: (): Promise<{ version: string; platform: string; isEncrypted: boolean }> =>
    ipcRenderer.invoke('app:getInfo'),
  openFolder: (folderPath: string): Promise<void> => ipcRenderer.invoke('app:openFolder', folderPath),
  openExternalUrl: (url: string): Promise<void> => ipcRenderer.invoke('app:openExternal', url),
  getTotalTokens: (): Promise<number> => ipcRenderer.invoke('app:getTotalTokens'),

  // --- YouTube & Analytics ---
  getAnalyticsCache: (): Promise<ChannelAnalytics | null> => ipcRenderer.invoke('db:getAnalyticsCache'),
  refreshAnalytics: (force?: boolean): Promise<ChannelAnalytics> =>
    ipcRenderer.invoke('youtube:refreshAnalytics', force),
  startYouTubeAuth: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('youtube:startAuth'),
  disconnectYouTube: (): Promise<void> => ipcRenderer.invoke('youtube:disconnect'),
  getYouTubeQuota: (): Promise<YouTubeQuotaInfo> => ipcRenderer.invoke('youtube:getQuota'),
  uploadToYouTube: (payload: YouTubeUploadPayload): Promise<{ videoId: string; success: boolean }> =>
    ipcRenderer.invoke('youtube:uploadVideo', payload),

  // --- AI Diagnosis & Ideas ---
  generateChannelSummary: (): Promise<AIDiagnosis> => ipcRenderer.invoke('ai:generateChannelSummary'),
  getIdeas: (date?: string): Promise<VideoIdea[]> => ipcRenderer.invoke('db:getIdeas', date),
  generateDailyIdeas: (force?: boolean): Promise<VideoIdea[]> =>
    ipcRenderer.invoke('ai:generateDailyIdeas', force),
  regenerateIdea: (ideaId: string): Promise<VideoIdea> =>
    ipcRenderer.invoke('ai:regenerateIdea', ideaId),
  saveIdea: (idea: VideoIdea): Promise<void> => ipcRenderer.invoke('db:saveIdea', idea),
  deleteIdea: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteIdea', id),

  // --- Thumbnails ---
  getThumbnails: (ideaId?: string): Promise<ThumbnailData[]> =>
    ipcRenderer.invoke('db:getThumbnails', ideaId),
  generateThumbnailPrompt: (ideaId: string): Promise<ThumbnailData> =>
    ipcRenderer.invoke('ai:generateThumbnailPrompt', ideaId),
  generateThumbnailImages: (thumbnailId: string): Promise<ThumbnailData> =>
    ipcRenderer.invoke('ai:generateThumbnailImages', thumbnailId),
  exportThumbnail: (
    thumbnailId: string,
    variationIndex: number,
    customOverlay?: string
  ): Promise<{ filePath: string }> =>
    ipcRenderer.invoke('ai:exportThumbnail', thumbnailId, variationIndex, customOverlay),

  // --- Loop Videos ---
  getLoopVideos: (ideaId?: string): Promise<LoopVideoData[]> =>
    ipcRenderer.invoke('db:getLoopVideos', ideaId),
  generateLoopPrompt: (ideaId: string): Promise<LoopVideoData> =>
    ipcRenderer.invoke('ai:generateLoopPrompt', ideaId),
  renderLoopVideo: (
    loopVideoId: string,
    config?: { durationSeconds?: number; fallback?: boolean }
  ): Promise<LoopVideoData> => ipcRenderer.invoke('ai:renderLoopVideo', loopVideoId, config),
  cancelLoopRender: (loopVideoId: string): Promise<void> =>
    ipcRenderer.invoke('ai:cancelLoopRender', loopVideoId),
  onLoopProgress: (
    callback: (event: { id: string; progress: number; message: string }) => void
  ) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('loop:progress', handler);
    return () => {
      ipcRenderer.removeListener('loop:progress', handler);
    };
  },

  // --- Upload Kits ---
  getUploadKits: (ideaId?: string): Promise<UploadKitData[]> =>
    ipcRenderer.invoke('db:getUploadKits', ideaId),
  generateUploadKit: (ideaId: string): Promise<UploadKitData> =>
    ipcRenderer.invoke('ai:generateUploadKit', ideaId),
  saveUploadKit: (kit: UploadKitData): Promise<void> => ipcRenderer.invoke('db:saveUploadKit', kit),

  // --- Library ---
  getLibraryItems: (): Promise<{
    ideas: VideoIdea[];
    thumbnails: ThumbnailData[];
    loopVideos: LoopVideoData[];
    uploadKits: UploadKitData[];
  }> => ipcRenderer.invoke('db:getLibraryItems'),
};

contextBridge.exposeInMainWorld('tubePilotAPI', tubePilotAPI);
