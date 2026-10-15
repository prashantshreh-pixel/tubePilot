import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  FolderOpen,
  Image,
  Repeat,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const LibraryPage: React.FC = () => {
  const { ideas, thumbnails, loopVideos, uploadKits, reloadLibrary, setCurrentPage, setSelectedIdea, settings, addToast } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'idea' | 'generated' | 'uploaded'>('All');

  const filteredIdeas = ideas.filter((idea) => {
    if (formatFilter !== 'All' && idea.type !== formatFilter) return false;
    if (statusFilter !== 'All' && idea.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = idea.title.toLowerCase().includes(q);
      const matchKeyword = idea.targetKeyword.toLowerCase().includes(q);
      return matchTitle || matchKeyword;
    }
    return true;
  });

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

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Project Asset Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every concept, thumbnail image, loop animation, and upload kit safely preserved on your local machine.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Format Filter */}
          <div className="flex bg-dark-card border border-dark-border rounded-xl p-1 text-xs">
            {(['All', 'Short', 'Long'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  formatFilter === fmt ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-dark-card border border-dark-border text-xs text-slate-300"
          >
            <option value="All">All Statuses</option>
            <option value="idea">Idea Only</option>
            <option value="generated">Assets Generated</option>
            <option value="uploaded">Uploaded</option>
          </select>
        </div>
      </div>

      {/* Grouped Ideas & Associated Assets */}
      <div className="space-y-4">
        {filteredIdeas.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <FolderArchive className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Assets Found</h3>
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
                      setCurrentPage('thumbnails');
                    }}
                    className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/50 cursor-pointer transition flex items-center space-x-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-dark-bg shrink-0 overflow-hidden flex items-center justify-center">
                      {thumb?.variations?.[0] ? (
                        <img src={thumb.variations[0].imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-slate-500" />
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
    </div>
  );
};
