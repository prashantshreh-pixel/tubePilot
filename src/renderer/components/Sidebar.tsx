import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Image,
  Repeat,
  UploadCloud,
  FolderArchive,
  Settings,
  Youtube,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useAppStore, PageId } from '../store/useAppStore';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'today', label: "Today's Plan", icon: CalendarCheck, badge: 'Daily' },
  { id: 'thumbnails', label: 'Thumbnails', icon: Image },
  { id: 'loop-videos', label: 'Loop Videos', icon: Repeat },
  { id: 'upload-kits', label: 'Upload Kits', icon: UploadCloud },
  { id: 'library', label: 'Library', icon: FolderArchive },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, settings, saveSettingsData } = useAppStore();

  const isDark = settings?.theme !== 'light';

  const toggleTheme = () => {
    saveSettingsData({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center justify-between border-b border-dark-border/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-white tracking-tight">TubePilot</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Desktop Growth Suite</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-dark-card/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Channel Status & Quick Toggles */}
      <div className="p-4 border-t border-dark-border/50 space-y-3">
        {/* Connection status banner */}
        <div className="p-3 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                settings?.isYouTubeConnected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-400'
              }`}
            />
            <div className="text-xs">
              <p className="font-medium text-slate-200">
                {settings?.isYouTubeConnected ? 'YouTube Linked' : 'Manual / Demo Mode'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                {settings?.channelNiche || 'General Niche'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('settings')}
            className="text-xs text-brand-400 hover:text-brand-300 hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Theme & AI Indicator */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="capitalize">{settings?.textProvider || 'claude'} AI</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-dark-card text-slate-400 hover:text-white transition"
            title="Toggle Light / Dark mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
