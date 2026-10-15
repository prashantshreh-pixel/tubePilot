import React from 'react';
import { RefreshCw, FolderOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useAppStore, PageId } from '../store/useAppStore';

const TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Channel Growth Dashboard', subtitle: '90-day telemetry, retention diagnostics & AI channel audit' },
  today: { title: "Today's Content Plan", subtitle: 'Fresh algorithmic video concepts tailored to your viewer behavior' },
  thumbnails: { title: 'Thumbnail Studio', subtitle: '16:9 & 9:16 high-CTR prompt engineering & 3-variation image generator' },
  'loop-videos': { title: 'Seamless Loop Studio', subtitle: 'Retention-engineered video prompts & local FFmpeg looping export' },
  'upload-kits': { title: 'Metadata & Upload Kits', subtitle: 'Fold-optimized titles, descriptions, chapters, and 3-5 hashtag rules' },
  library: { title: 'Project Asset Library', subtitle: 'All generated concepts, thumbnails, videos and metadata organized by date' },
  settings: { title: 'Settings & AI Providers', subtitle: 'Manage API keys, YouTube OAuth, daily mix, and local storage' },
};

export const Header: React.FC = () => {
  const { currentPage, refreshAnalyticsData, generateNewIdeas, isLoading, quota, settings } = useAppStore();
  const info = TITLES[currentPage] || TITLES.dashboard;

  const handleOpenFolder = () => {
    if (settings?.outputDirectory) {
      window.tubePilotAPI?.openFolder(settings.outputDirectory);
    }
  };

  return (
    <header className="h-20 bg-dark-surface/60 backdrop-blur-md border-b border-dark-border px-8 flex items-center justify-between select-none">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>{info.title}</span>
          {settings?.manualMode && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Demo / Manual Mode
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{info.subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quota Counter */}
        {quota && (
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-slate-400">Quota:</span>
            <span className="font-semibold text-white">{quota.estimatedUsed}</span>
            <span className="text-slate-500">/ {quota.dailyLimit}</span>
          </div>
        )}

        {/* Open Folder Button */}
        <button
          onClick={handleOpenFolder}
          className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 hover:text-white transition"
          title="Open Exports Folder on disk"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Refresh Analytics Button */}
        <button
          onClick={() => refreshAnalyticsData(true)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : 'text-slate-400'}`} />
          <span>Refresh Data</span>
        </button>

        {/* Generate Today's Plan Button */}
        <button
          onClick={() => generateNewIdeas(true)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Today's Plan</span>
        </button>
      </div>
    </header>
  );
};
