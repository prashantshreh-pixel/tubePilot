import { create } from 'zustand';
import {
  AppSettings,
  ChannelAnalytics,
  VideoIdea,
  ThumbnailData,
  LoopVideoData,
  UploadKitData,
  YouTubeQuotaInfo,
} from '../../shared/types';

export type PageId =
  | 'dashboard'
  | 'today'
  | 'thumbnails'
  | 'loop-videos'
  | 'upload-kits'
  | 'library'
  | 'settings';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppState {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;

  settings: AppSettings | null;
  analytics: ChannelAnalytics | null;
  quota: YouTubeQuotaInfo | null;

  ideas: VideoIdea[];
  selectedIdea: VideoIdea | null;
  setSelectedIdea: (idea: VideoIdea | null) => void;

  thumbnails: ThumbnailData[];
  selectedThumbnail: ThumbnailData | null;
  setSelectedThumbnail: (t: ThumbnailData | null) => void;

  loopVideos: LoopVideoData[];
  selectedLoopVideo: LoopVideoData | null;
  setSelectedLoopVideo: (v: LoopVideoData | null) => void;

  uploadKits: UploadKitData[];
  selectedUploadKit: UploadKitData | null;
  setSelectedUploadKit: (k: UploadKitData | null) => void;

  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;

  toasts: ToastItem[];
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;

  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  // Actions
  initializeApp: () => Promise<void>;
  refreshAnalyticsData: (force?: boolean) => Promise<void>;
  saveSettingsData: (patch: Partial<AppSettings>) => Promise<void>;
  generateNewIdeas: (force?: boolean) => Promise<void>;
  regenerateIdeaItem: (ideaId: string) => Promise<void>;
  createThumbnailForIdea: (idea: VideoIdea) => Promise<void>;
  createLoopVideoForIdea: (idea: VideoIdea) => Promise<void>;
  createUploadKitForIdea: (idea: VideoIdea) => Promise<void>;
  reloadLibrary: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  settings: null,
  analytics: null,
  quota: null,

  ideas: [],
  selectedIdea: null,
  setSelectedIdea: (idea) => set({ selectedIdea: idea }),

  thumbnails: [],
  selectedThumbnail: null,
  setSelectedThumbnail: (t) => set({ selectedThumbnail: t }),

  loopVideos: [],
  selectedLoopVideo: null,
  setSelectedLoopVideo: (v) => set({ selectedLoopVideo: v }),

  uploadKits: [],
  selectedUploadKit: null,
  setSelectedUploadKit: (k) => set({ selectedUploadKit: k }),

  isLoading: false,
  loadingMessage: '',
  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),

  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),

  initializeApp: async () => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      get().setLoading(true, 'Initializing TubePilot workspace...');
      const settings = await api.getSettings();
      set({ settings });

      // Apply theme
      if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }

      if (!settings.onboardingCompleted) {
        set({ showOnboarding: true });
      }

      // Fetch analytics cache or demo data
      const analytics = await api.getAnalyticsCache();
      if (analytics) {
        set({ analytics });
      } else {
        const refreshed = await api.refreshAnalytics(false);
        set({ analytics: refreshed });
      }

      // Fetch ideas, thumbnails, loop videos, upload kits
      const [ideas, thumbnails, loopVideos, uploadKits, quota] = await Promise.all([
        api.getIdeas(),
        api.getThumbnails(),
        api.getLoopVideos(),
        api.getUploadKits(),
        api.getYouTubeQuota(),
      ]);

      set({
        ideas,
        thumbnails,
        loopVideos,
        uploadKits,
        quota,
        selectedIdea: ideas[0] || null,
        selectedThumbnail: thumbnails[0] || null,
        selectedLoopVideo: loopVideos[0] || null,
        selectedUploadKit: uploadKits[0] || null,
      });

      // Listen for loop video progress
      api.onLoopProgress(({ id, progress, message }) => {
        set((state) => {
          const updated = state.loopVideos.map((lv) =>
            lv.id === id ? { ...lv, progress, statusMessage: message, status: progress === 100 ? 'completed' : 'rendering' } : lv
          );
          const sel = state.selectedLoopVideo?.id === id ? { ...state.selectedLoopVideo, progress, statusMessage: message } : state.selectedLoopVideo;
          return { loopVideos: updated, selectedLoopVideo: sel };
        });
      });
    } catch (err: any) {
      get().addToast('error', `Failed to load workspace: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  refreshAnalyticsData: async (force = true) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      get().setLoading(true, 'Fetching latest YouTube channel telemetry...');
      const analytics = await api.refreshAnalytics(force);
      set({ analytics });
      const quota = await api.getYouTubeQuota();
      set({ quota });
      get().addToast('success', 'YouTube channel data refreshed successfully.');
    } catch (err: any) {
      get().addToast('error', `Refresh failed: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  saveSettingsData: async (patch) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      const updated = await api.saveSettings(patch);
      set({ settings: updated });
      if (patch.theme) {
        if (patch.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }
      get().addToast('success', 'Settings updated.');
    } catch (err: any) {
      get().addToast('error', `Failed to save settings: ${err.message}`);
    }
  },

  generateNewIdeas: async (force = true) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      get().setLoading(true, 'AI analyzing channel metrics & generating daily content package...');
      const ideas = await api.generateDailyIdeas(force);
      set({ ideas, selectedIdea: ideas[0] || null });
      get().addToast('success', `Generated ${ideas.length} fresh video concepts!`);
    } catch (err: any) {
      get().addToast('error', `Idea generation failed: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  regenerateIdeaItem: async (ideaId) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      get().setLoading(true, 'Regenerating video concept...');
      const updated = await api.regenerateIdea(ideaId);
      set((state) => ({
        ideas: state.ideas.map((i) => (i.id === ideaId ? updated : i)),
        selectedIdea: updated,
      }));
      get().addToast('success', 'New concept generated.');
    } catch (err: any) {
      get().addToast('error', `Failed to regenerate: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  createThumbnailForIdea: async (idea) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      set({ selectedIdea: idea });
      get().setLoading(true, 'Synthesizing high-CTR thumbnail prompt & variations...');
      // 1. Generate prompt
      const thumbData = await api.generateThumbnailPrompt(idea.id);
      // 2. Generate 3 image variations
      const fullThumb = await api.generateThumbnailImages(thumbData.id);
      set((state) => ({
        thumbnails: [fullThumb, ...state.thumbnails.filter((t) => t.id !== fullThumb.id)],
        selectedThumbnail: fullThumb,
        currentPage: 'thumbnails',
      }));
      get().addToast('success', 'Thumbnail variations ready for review!');
    } catch (err: any) {
      get().addToast('error', `Thumbnail failed: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  createLoopVideoForIdea: async (idea) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      set({ selectedIdea: idea });
      get().setLoading(true, 'Generating seamless loop prompt...');
      const loopData = await api.generateLoopPrompt(idea.id);
      set((state) => ({
        loopVideos: [loopData, ...state.loopVideos.filter((v) => v.id !== loopData.id)],
        selectedLoopVideo: loopData,
        currentPage: 'loop-videos',
      }));
      get().addToast('success', 'Loop video configuration prepared.');
    } catch (err: any) {
      get().addToast('error', `Loop setup failed: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  createUploadKitForIdea: async (idea) => {
    const api = window.tubePilotAPI;
    if (!api) return;

    try {
      set({ selectedIdea: idea });
      get().setLoading(true, 'Optimizing titles, description, hashtags and tags...');
      const kit = await api.generateUploadKit(idea.id);
      set((state) => ({
        uploadKits: [kit, ...state.uploadKits.filter((k) => k.id !== kit.id)],
        selectedUploadKit: kit,
        currentPage: 'upload-kits',
      }));
      get().addToast('success', 'Upload kit ready to copy-paste!');
    } catch (err: any) {
      get().addToast('error', `Upload kit failed: ${err.message}`);
    } finally {
      get().setLoading(false);
    }
  },

  reloadLibrary: async () => {
    const api = window.tubePilotAPI;
    if (!api) return;
    try {
      const data = await api.getLibraryItems();
      set({
        ideas: data.ideas,
        thumbnails: data.thumbnails,
        loopVideos: data.loopVideos,
        uploadKits: data.uploadKits,
      });
    } catch (err) {
      console.warn('Library reload warning:', err);
    }
  },
}));
