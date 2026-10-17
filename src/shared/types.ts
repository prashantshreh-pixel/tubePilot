export type VideoType = 'Short' | 'Long';

export type IdeaStatus = 'idea' | 'generated' | 'uploaded';

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt?: string;
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
  };
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface VideoPerformance {
  videoId: string;
  title: string;
  publishedAt: string;
  type: VideoType;
  views: number;
  likes: number;
  comments: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number; // in seconds
  ctr: number; // percentage e.g. 5.4
  retentionRate: number; // percentage e.g. 48.2
  thumbnailUrl?: string;
}

export interface DailyMetricPoint {
  date: string;
  views: number;
  subscribersGained: number;
  watchTimeHours: number;
  impressions: number;
}

export interface ChannelAnalytics {
  channelInfo: ChannelInfo;
  periodDays: number; // 90
  lastUpdated: string;
  views90d: number;
  viewsTrend: number; // percentage change vs prior 90d e.g. +14.2
  watchTimeHours: number;
  watchTimeTrend: number;
  avgViewDurationSec: number;
  avgViewDurationTrend: number;
  impressions: number;
  impressionsTrend: number;
  ctr: number; // e.g. 6.8
  ctrTrend: number;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
  subscribersTrend: number;
  trafficSources: {
    source: string;
    percentage: number;
  }[];
  shortsVsLongSplit: {
    shortsViews: number;
    shortsCount: number;
    longViews: number;
    longCount: number;
    shortsViewPercentage: number;
  };
  topVideos: VideoPerformance[];
  bottomVideos: VideoPerformance[];
  chartData: DailyMetricPoint[];
  aiDiagnosis?: AIDiagnosis;
}

export interface AIDiagnosis {
  healthScore: number; // 1-100
  headline: string;
  whatIsWorking: string[];
  whatIsNotWorking: string[];
  strategicShiftThisWeek: string;
  focusMetrics: {
    metric: string;
    current: string;
    target: string;
    action: string;
  }[];
}

export interface VideoIdea {
  id: string;
  date: string; // YYYY-MM-DD
  type: VideoType;
  title: string;
  hook: string;
  reason: string;
  targetKeyword: string;
  searchIntent: string;
  scriptOutline: string[];
  bestPostingTime: string;
  status: IdeaStatus;
  createdAt: string;
  // Generated assets links
  thumbnailId?: string;
  loopVideoId?: string;
  uploadKitId?: string;
}

export interface ThumbnailVariation {
  id: string;
  imageUrl: string;
  aspectRatio: '16:9' | '9:16';
  width: number;
  height: number;
  fileSizeBytes?: number;
}

export interface ThumbnailData {
  id: string;
  ideaId: string;
  videoTitle: string;
  videoType: VideoType;
  prompt: string;
  negativePrompt: string;
  textOverlay: {
    text: string;
    suggestedPlacement: string;
    fontColor: string;
    psychologicalTrigger: string;
  };
  checklist: {
    highContrast: boolean;
    mobileReadable: boolean;
    singleFocalPoint: boolean;
    curiosityGap: string;
  };
  predictedCTRScore: number;
  expertCritique: string;
  variations: ThumbnailVariation[];
  selectedVariationIndex: number;
  exportedFilePath?: string;
  createdAt: string;
}

export interface LoopVideoData {
  id: string;
  ideaId: string;
  videoTitle: string;
  videoType: VideoType;
  aspectRatio: '9:16' | '16:9';
  prompt: string;
  cameraMotion: string;
  lightingStyle: string;
  loopTechnique: 'circular_motion' | 'forward_reverse_pingpong' | 'seamless_crossfade';
  ambientAudioPrompt?: string;
  loopRetentionTip: string;
  targetDurationSeconds: number; // 8-30 for Shorts; 600, 3600, etc. for Long
  videoPath?: string;
  previewUrl?: string;
  status: 'idle' | 'generating' | 'rendering' | 'completed' | 'failed';
  progress: number; // 0-100
  statusMessage?: string;
  fallbackUsed: boolean;
  exportPath?: string;
  createdAt: string;
}

export interface ChapterItem {
  timestamp: string;
  title: string;
}

export interface UploadKitData {
  id: string;
  ideaId: string;
  videoTitle: string;
  videoType: VideoType;
  titles: string[];
  selectedTitleIndex: number;
  description: string;
  hashtags: string[];
  backendTags: string[];
  chapters?: ChapterItem[];
  pinnedComment: string;
  endScreenSuggestion?: string;
  onScreenTextHook?: string;
  loopTip?: string;
  seoScore: number;
  seoBreakdown: Record<string, string>;
  whyTheseHashtags: string;
  uploadedToYouTube?: boolean;
  youtubeVideoId?: string;
  createdAt: string;
}

export interface AppSettings {
  // AI Providers
  textProvider: 'claude' | 'openai' | 'gemini';
  imageProvider: 'gemini' | 'openai' | 'stability' | 'replicate';
  videoProvider: 'local_ffmpeg' | 'runway' | 'luma' | 'replicate' | 'kling';

  // API Keys (Encrypted)
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  stabilityApiKey?: string;
  replicateApiKey?: string;
  runwayApiKey?: string;
  lumaApiKey?: string;

  // YouTube OAuth Credentials
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  youtubeTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  isYouTubeConnected: boolean;

  // Manual / Fallback Channel Profile
  manualMode: boolean;
  channelNiche: string;
  channelDescription: string;
  targetAudience: string;
  recentVideoTitles: string[];

  // Preferences
  dailyMix: {
    shorts: number;
    long: number;
  };
  theme: 'dark' | 'light';
  outputDirectory: string;
  lastAnalyticsRefresh?: string;
  onboardingCompleted: boolean;
}

export interface YouTubeUploadPayload {
  uploadKitId: string;
  videoFilePath: string;
  thumbnailFilePath?: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'unlisted' | 'public';
  scheduledPublishTime?: string;
}

export interface YouTubeQuotaInfo {
  estimatedUsed: number;
  dailyLimit: number;
  resetsAt: string;
}
