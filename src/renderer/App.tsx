import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardPage } from './pages/DashboardPage';
import { TodayPlanPage } from './pages/TodayPlanPage';
import { ThumbnailsPage } from './pages/ThumbnailsPage';
import { LoopVideosPage } from './pages/LoopVideosPage';
import { UploadKitsPage } from './pages/UploadKitsPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './store/useAppStore';
import { Sparkles, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { currentPage, initializeApp, isLoading, loadingMessage, generateNewIdeas } = useAppStore();

  useEffect(() => {
    initializeApp();

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+G / Cmd+G -> Generate daily plan
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        generateNewIdeas(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'today':
        return <TodayPlanPage />;
      case 'thumbnails':
        return <ThumbnailsPage />;
      case 'loop-videos':
        return <LoopVideosPage />;
      case 'upload-kits':
        return <UploadKitsPage />;
      case 'library':
        return <LibraryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          {renderPage()}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-40 bg-dark-bg/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {loadingMessage || 'Processing AI workflow...'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Global Overlays & Toasts */}
      <ToastContainer />
      <OnboardingModal />
    </div>
  );
};
export default App;
