import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  FolderOpen,
  Image as ImageIcon,
  Repeat,
  UploadCloud,
  Film,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Sparkles,
  ExternalLink,
  Calendar,
  Layers,
  Maximize2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ThumbnailData, LoopVideoData, VideoIdea } from '../../shared/types';

export const LibraryPage: React.FC = () => {
  const {
    ideas,
    thumbnails,
    loopVideos,
    uploadKits,
    reloadLibrary,
    setCurrentPage,
    setSelectedIdea,
    setSelectedThumbnail,
    setSelectedLoopVideo,
    settings,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'thumbnails' | 'videos' | 'ideas'>('all');
  const [formatFilter, setFormatFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleCopyPrompt = (id: string, promptText: string, label: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    addToast('info', `${label} prompt copied to clipboard!`);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleOpenFolder = () => {
    if (settings?.outputDirectory) {
      window.tubePilotAPI?.openFolder(settings.outputDirectory);
    }
  };

  const handleDelete = async (id: string) => {
    await window.tubePilotAPI?.deleteIdea(id);
    addToast('info', 'Idea deleted from library.');
    await reloadLibrary();
  };

  // Filtered thumbnails (both Short and Long)
  const filteredThumbnails = thumbnails.filter((thumb) => {
    if (formatFilter !== 'All' && thumb.videoType !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (thumb.videoTitle || '').toLowerCase().includes(q);
      const matchPrompt = (thumb.prompt || '').toLowerCase().includes(q);
      return matchTitle || matchPrompt;
    }
    return true;
  });

  // Filtered loop videos (both Short and Long)
  const filteredLoopVideos = loopVideos.filter((loop) => {
    if (formatFilter !== 'All' && loop.videoType !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (loop.videoTitle || '').toLowerCase().includes(q);
      const matchPrompt = (loop.prompt || '').toLowerCase().includes(q);
      return matchTitle || matchPrompt;
    }
    return true;
  });

  // Filtered ideas
  const filteredIdeas = ideas.filter((idea) => {
    if (formatFilter !== 'All' && idea.type !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (idea.title || '').toLowerCase().includes(q);
      const matchKeyword = (idea.targetKeyword || '').toLowerCase().includes(q);
      return matchTitle || matchKeyword;
    }
    return true;
  });

  const totalAssetsCount = thumbnails.length + loopVideos.length;

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight">Project Asset Library & Showcase</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold">
              {totalAssetsCount} Assets Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            View all Shorts (9:16) & Long (16:9) thumbnails and seamless loop videos side-by-side in one unified gallery.
          </p>
        </div>

        <button
          onClick={handleOpenFolder}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-white text-xs font-semibold shadow-sm transition"
        >
          <FolderOpen className="w-4 h-4 text-brand-400" />
          <span>Open Exports Folder</span>
        </button>
      </div>

      {/* Main Tab Switcher & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex bg-dark-surface border border-dark-border rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-dark-card/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Showcase (Thumbnails & Videos)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {totalAssetsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('thumbnails')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'thumbnails'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-dark-card/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Thumbnails</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {thumbnails.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'videos'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-dark-card/50'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Loop Videos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {loopVideos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'ideas'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-dark-card/50'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Ideas List</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {ideas.length}
            </span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          {/* Format Toggle */}
          <div className="flex bg-dark-card border border-dark-border rounded-xl p-1 text-xs w-full sm:w-auto justify-center">
            {(['All', 'Short', 'Long'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  formatFilter === fmt ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt === 'All' ? 'All (Short & Long)' : fmt === 'Short' ? '9:16 Shorts' : '16:9 Long-Form'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets or prompts..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: UNIFIED SHOWCASE (ALL THUMBNAILS + ALL LOOP VIDEOS TOGETHER) */}
      {(activeTab === 'all' || activeTab === 'thumbnails' || activeTab === 'videos') && (
        <div className="space-y-8">
          {/* Section A: Thumbnails (Short & Long) */}
          {(activeTab === 'all' || activeTab === 'thumbnails') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Thumbnail Gallery ({filteredThumbnails.length} Items - Shorts & Long)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Ghibli & Shinkai Anime Aesthetic</span>
              </div>

              {filteredThumbnails.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-xs">
                  No thumbnails found matching current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredThumbnails.map((thumb) => {
                    const isPortrait = thumb.videoType === 'Short';
                    const activeVar = thumb.variations[thumb.selectedVariationIndex || 0] || thumb.variations[0];
                    const idea = ideas.find((i) => i.id === thumb.ideaId);

                    return (
                      <div
                        key={thumb.id}
                        className="glass-panel rounded-2xl border border-dark-border hover:border-slate-500/60 transition overflow-hidden flex flex-col justify-between group"
                      >
                        {/* Image Canvas Container */}
                        <div
                          className={`relative w-full bg-black/70 flex items-center justify-center overflow-hidden cursor-pointer ${
                            isPortrait ? 'aspect-[9/16] max-h-[420px]' : 'aspect-video'
                          }`}
                          onClick={() => activeVar?.imageUrl && setLightboxUrl(activeVar.imageUrl)}
                        >
                          {activeVar?.imageUrl ? (
                            <img
                              src={activeVar.imageUrl}
                              alt={thumb.videoTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="text-slate-600 text-xs flex flex-col items-center space-y-1">
                              <ImageIcon className="w-8 h-8" />
                              <span>No image rendered</span>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${
                                isPortrait
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {isPortrait ? '9:16 Short' : '16:9 Long'}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeVar?.imageUrl) setLightboxUrl(activeVar.imageUrl);
                              }}
                              className="p-1 rounded-md bg-black/60 text-white hover:bg-black/90 pointer-events-auto transition"
                              title="Full screen preview"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Watermark Pill */}
                          <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
                            <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-black/70 text-slate-300 border border-white/10 uppercase">
                              sushibeats
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Actions */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                              {thumb.videoTitle}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {thumb.prompt}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-dark-border/50 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleCopyPrompt(thumb.id, thumb.prompt, 'Thumbnail')}
                              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 hover:text-white text-[11px] transition"
                            >
                              {copiedPromptId === thumb.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Prompt</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                if (idea) setSelectedIdea(idea);
                                setSelectedThumbnail(thumb);
                                setCurrentPage('thumbnails');
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-[11px] font-semibold transition"
                            >
                              <span>Edit Studio ↗</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section B: Loop Videos (Short & Long Playable Videos) */}
          {(activeTab === 'all' || activeTab === 'videos') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Seamless Loop Videos ({filteredLoopVideos.length} Items - Shorts & Long)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Locked Static Camera • 8-10s Seamless Cycles</span>
              </div>

              {filteredLoopVideos.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-xs">
                  No loop videos found matching current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredLoopVideos.map((loop) => {
                    const isPortrait = loop.aspectRatio === '9:16' || loop.videoType === 'Short';
                    const idea = ideas.find((i) => i.id === loop.ideaId);
                    const formattedVideoSrc = loop.videoPath
                      ? loop.videoPath.startsWith('http')
                        ? loop.videoPath
                        : `file:///${loop.videoPath.replace(/\\/g, '/')}`
                      : '';

                    return (
                      <div
                        key={loop.id}
                        className="glass-panel rounded-2xl border border-dark-border hover:border-slate-500/60 transition overflow-hidden flex flex-col justify-between"
                      >
                        {/* Playable Video Player Container */}
                        <div
                          className={`relative w-full bg-black/80 flex items-center justify-center overflow-hidden ${
                            isPortrait ? 'aspect-[9/16] max-h-[420px]' : 'aspect-video'
                          }`}
                        >
                          {formattedVideoSrc ? (
                            <video
                              src={formattedVideoSrc}
                              controls
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-slate-600 text-xs flex flex-col items-center space-y-2 p-6 text-center">
                              <Film className="w-8 h-8 text-slate-500" />
                              <span className="font-semibold text-slate-400">Prompt Ready</span>
                              <span className="text-[10px] text-slate-500">Render in Studio to preview</span>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${
                                isPortrait
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {isPortrait ? '9:16 Short' : '16:9 Long'}
                            </span>

                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/70 text-emerald-400 border border-emerald-500/30 uppercase">
                              {loop.videoPath ? 'MP4 Ready' : 'Configured'}
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Actions */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                              {loop.videoTitle}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {loop.prompt}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-dark-border/50 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleCopyPrompt(loop.id, loop.prompt, 'Video Loop')}
                              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 hover:text-white text-[11px] transition"
                            >
                              {copiedPromptId === loop.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Prompt</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                if (idea) setSelectedIdea(idea);
                                setSelectedLoopVideo(loop);
                                setCurrentPage('loop-videos');
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-semibold transition"
                            >
                              <span>Studio ↗</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ORGANIZED BY CONCEPT (ORIGINAL FOLDER LIST) */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {filteredIdeas.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
              <FolderArchive className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Concepts Found</h3>
              <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            filteredIdeas.map((idea) => {
              const thumb = thumbnails.find((t) => t.ideaId === idea.id);
              const loop = loopVideos.find((l) => l.ideaId === idea.id);
              const kit = uploadKits.find((k) => k.ideaId === idea.id);

              return (
                <div
                  key={idea.id}
                  className="glass-panel p-5 rounded-2xl border border-dark-border hover:border-slate-600 transition space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          idea.type === 'Short'
                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {idea.type}
                      </span>

                      <h3 className="text-sm font-bold text-white tracking-tight">{idea.title}</h3>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{idea.date}</span>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Delete from Library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-assets grid: Thumbnail preview, Loop Video status, Upload Kit status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-dark-border/50 text-xs">
                    {/* Thumbnail Card */}
                    <div
                      onClick={() => {
                        setSelectedIdea(idea);
                        if (thumb) setSelectedThumbnail(thumb);
                        setCurrentPage('thumbnails');
                      }}
                      className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/50 cursor-pointer transition flex items-center space-x-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-dark-bg shrink-0 overflow-hidden flex items-center justify-center">
                        {thumb?.variations?.[0] ? (
                          <img src={thumb.variations[0].imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">Thumbnail</p>
                        <p className="text-[11px] text-slate-400">
                          {thumb ? `${thumb.variations.length} variations` : 'Not generated yet'}
                        </p>
                      </div>
                    </div>

                    {/* Loop Video Card */}
                    <div
                      onClick={() => {
                        setSelectedIdea(idea);
                        if (loop) setSelectedLoopVideo(loop);
                        setCurrentPage('loop-videos');
                      }}
                      className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/50 cursor-pointer transition flex items-center space-x-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-dark-bg shrink-0 flex items-center justify-center text-blue-400">
                        <Repeat className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Seamless Loop</p>
                        <p className="text-[11px] text-slate-400">
                          {loop?.videoPath ? 'Ready (MP4)' : loop ? 'Prompt configured' : 'Not generated yet'}
                        </p>
                      </div>
                    </div>

                    {/* Upload Kit Card */}
                    <div
                      onClick={() => {
                        setSelectedIdea(idea);
                        setCurrentPage('upload-kits');
                      }}
                      className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/50 cursor-pointer transition flex items-center space-x-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-dark-bg shrink-0 flex items-center justify-center text-emerald-400">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Upload Kit</p>
                        <p className="text-[11px] text-slate-400">
                          {kit ? `SEO Score: ${kit.seoScore}/100` : 'Not generated yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Lightbox Modal for Full Screen Image Inspection */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxUrl}
              alt="Enlarged Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-dark-border"
            />
          </div>
        </div>
      )}
    </div>
  );
};
