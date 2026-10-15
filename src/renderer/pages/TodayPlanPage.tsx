import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  Key,
  ChevronRight,
  RotateCcw,
  Image,
  Repeat,
  UploadCloud,
  CheckCircle2,
  Bookmark,
  Share2,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VideoIdea } from '../../shared/types';

export const TodayPlanPage: React.FC = () => {
  const {
    ideas,
    generateNewIdeas,
    regenerateIdeaItem,
    createThumbnailForIdea,
    createLoopVideoForIdea,
    createUploadKitForIdea,
    isLoading,
    saveSettingsData,
  } = useAppStore();

  const [filterType, setFilterType] = useState<'All' | 'Short' | 'Long'>('All');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const filteredIdeas = ideas.filter((i) => {
    if (filterType !== 'All' && i.type !== filterType) return false;
    return true;
  });

  const handleMarkDone = (idea: VideoIdea) => {
    const updated: VideoIdea = {
      ...idea,
      status: idea.status === 'uploaded' ? 'idea' : 'uploaded',
    };
    window.tubePilotAPI?.saveIdea(updated);
    useAppStore.setState((s) => ({
      ideas: s.ideas.map((item) => (item.id === idea.id ? updated : item)),
    }));
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Today's Content Plan</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
              {filteredIdeas.length} Recommendations Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic concepts calculated against your 90-day search retention and top-performing keywords.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Format Filter */}
          <div className="flex bg-dark-card border border-dark-border rounded-xl p-1 text-xs">
            {(['All', 'Short', 'Long'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === type ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Generate Again Button */}
          <button
            onClick={() => generateNewIdeas(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Again</span>
          </button>
        </div>
      </div>

      {/* Idea Cards List */}
      <div className="space-y-6">
        {filteredIdeas.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
            <Sparkles className="w-10 h-10 text-brand-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Ideas for this Filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click Generate Again to generate fresh ideas based on your channel niche and analytics.
            </p>
            <button
              onClick={() => generateNewIdeas(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
            >
              Generate Daily Plan
            </button>
          </div>
        ) : (
          filteredIdeas.map((idea, index) => {
            const isShort = idea.type === 'Short';
            const isDone = idea.status === 'uploaded';

            return (
              <div
                key={idea.id}
                className={`glass-panel rounded-2xl p-6 space-y-5 transition duration-200 border ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'hover:border-slate-600 border-dark-border'
                }`}
              >
                {/* Header row: Type badge, Title, Status & Regenerate */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                          isShort
                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {idea.type} Form
                      </span>

                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Best Time: <strong>{idea.bestPostingTime}</strong></span>
                      </div>

                      {isDone && (
                        <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Uploaded / Completed</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                      {idea.title}
                    </h3>
                  </div>

                  {/* Regenerate single idea */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => regenerateIdeaItem(idea.id)}
                      disabled={isLoading}
                      className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-400 hover:text-white text-xs transition"
                      title="Regenerate this single idea"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleMarkDone(idea)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-dark-card hover:bg-dark-hover border-dark-border text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isDone ? 'Done' : 'Mark as Done'}</span>
                    </button>
                  </div>
                </div>

                {/* Hook & Retention Strategy Box */}
                <div className="p-4 rounded-xl bg-dark-card/70 border border-dark-border/80 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{isShort ? 'First 3-Second Visual & Auditory Hook' : 'First 30-Second Retention Contract'}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium italic">
                    "{idea.hook}"
                  </p>
                </div>

                {/* Data-backed reason and target keyword */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-dark-card/40 border border-dark-border/60 space-y-1">
                    <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span>Why this will work for your channel:</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{idea.reason}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-dark-card/40 border border-dark-border/60 space-y-1">
                    <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Keyword & Search Intent:</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded text-[11px] font-bold">
                        {idea.targetKeyword}
                      </span>
                      <span className="text-slate-400 text-[11px]">• {idea.searchIntent}</span>
                    </div>
                  </div>
                </div>

                {/* Script Beats Outline */}
                {idea.scriptOutline && idea.scriptOutline.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Content Beats / Milestones:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {idea.scriptOutline.map((beat, bIdx) => (
                        <div
                          key={bIdx}
                          className="px-3 py-2 rounded-lg bg-dark-bg/60 border border-dark-border/50 text-xs text-slate-300 flex items-center space-x-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-dark-card text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {bIdx + 1}
                          </span>
                          <span className="truncate">{beat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Generation Buttons */}
                <div className="pt-3 border-t border-dark-border/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* 1. Generate Thumbnail */}
                    <button
                      onClick={() => createThumbnailForIdea(idea)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold hover:border-brand-500/50 transition"
                    >
                      <Image className="w-3.5 h-3.5 text-brand-400" />
                      <span>Generate Thumbnail</span>
                    </button>

                    {/* 2. Generate Loop Video */}
                    <button
                      onClick={() => createLoopVideoForIdea(idea)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold hover:border-blue-500/50 transition"
                    >
                      <Repeat className="w-3.5 h-3.5 text-blue-400" />
                      <span>Generate Loop Video</span>
                    </button>

                    {/* 3. Generate Upload Kit */}
                    <button
                      onClick={() => createUploadKitForIdea(idea)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold hover:border-emerald-500/50 transition"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Generate Titles + Description + Tags</span>
                    </button>
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
