import React, { useState } from 'react';
import {
  UploadCloud,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Youtube,
  BookOpen,
  Calendar,
  Lock,
  Globe,
  EyeOff,
  AlertTriangle,
  HelpCircle,
  Tag,
  Hash,
  FileText,
  MessageSquare,
  ListOrdered,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { WorkflowBar } from '../components/WorkflowBar';

export const UploadKitsPage: React.FC = () => {
  const {
    uploadKits,
    selectedUploadKit,
    setSelectedUploadKit,
    ideas,
    selectedIdea,
    setSelectedIdea,
    createUploadKitForIdea,
    addToast,
    quota,
    settings,
  } = useAppStore();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState<number>(0);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewFoldMode, setViewFoldMode] = useState<'full' | 'fold'>('fold');

  const kit = selectedUploadKit || uploadKits[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast('info', `${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyFullKit = () => {
    if (!kit) return;
    const full = `
TITLE:
${kit.titles[selectedTitleIdx] || kit.titles[0]}

DESCRIPTION:
${kit.description}

TAGS:
${kit.backendTags.join(', ')}

PINNED COMMENT:
${kit.pinnedComment}
    `.trim();
    handleCopy(full, 'Full Upload Kit');
  };

  const handleDirectUpload = async () => {
    if (!kit) return;
    try {
      setIsUploading(true);
      const res = await window.tubePilotAPI?.uploadToYouTube({
        uploadKitId: kit.id,
        videoFilePath: '',
        title: kit.titles[selectedTitleIdx] || kit.titles[0],
        description: kit.description,
        tags: kit.backendTags,
        privacyStatus,
        scheduledPublishTime: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      });

      if (res?.success) {
        addToast('success', `Video registered to YouTube API! ID: ${res.videoId}`);
        setShowUploadModal(false);
      }
    } catch (err: any) {
      addToast('error', `YouTube upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Split description into above fold (first 2 lines) and below fold
  const descLines = (kit?.description || '').split('\n');
  const aboveFold = descLines.slice(0, 2).join('\n');
  const belowFold = descLines.slice(2).join('\n');

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Workflow Navigation Ribbon */}
      <WorkflowBar />

      {/* Top Header & Selector */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Metadata & Upload Kits</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              SEO Optimized
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fold-optimized descriptions, 3-5 hashtag rules, backend tags & SEO score tailored for Shorts and Long videos.
          </p>
        </div>

        {/* Idea Switcher Dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={kit?.ideaId || selectedIdea?.id || ''}
            onChange={(e) => {
              const foundIdea = ideas.find((i) => i.id === e.target.value);
              if (foundIdea) {
                setSelectedIdea(foundIdea);
                const foundKit = uploadKits.find((k) => k.ideaId === foundIdea.id);
                if (foundKit) {
                  setSelectedUploadKit(foundKit);
                } else {
                  createUploadKitForIdea(foundIdea);
                }
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
          >
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                [{idea.type}] {idea.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {!kit ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
          <UploadCloud className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Upload Kit Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select an idea from Today's Plan and click "Generate Titles + Description + Tags".
          </p>
          {ideas[0] && (
            <button
              onClick={() => createUploadKitForIdea(ideas[0])}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
            >
              Generate For "{ideas[0].title.slice(0, 30)}..."
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Complete Upload Package (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Title Variations (3 options) */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {kit.videoType === 'Short' ? 'Short Titles (< 40 Chars)' : 'Long Titles (< 60 Chars)'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold">
                    3 Variations
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(kit.titles[selectedTitleIdx] || kit.titles[0], 'Selected Title')}
                  className="flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  {copiedField === 'Selected Title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Title</span>
                </button>
              </div>

              <div className="space-y-2">
                {kit.titles.map((title, idx) => {
                  const isSelected = selectedTitleIdx === idx;
                  const charCount = title.length;
                  const limit = kit.videoType === 'Short' ? 40 : 60;
                  const isSafe = charCount <= limit;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedTitleIdx(idx)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/10'
                          : 'border-dark-border bg-dark-card/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-brand-500 text-white' : 'bg-dark-bg text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white leading-relaxed">{title}</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isSafe ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {charCount}/{limit}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Fold-Optimized Description */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Fold-Optimized Description
                    </h3>
                  </div>

                  {/* Fold view mode toggle */}
                  <div className="flex bg-dark-bg border border-dark-border rounded-lg p-0.5 text-[10px]">
                    <button
                      onClick={() => setViewFoldMode('fold')}
                      className={`px-2 py-0.5 rounded font-medium transition ${
                        viewFoldMode === 'fold' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fold Breakdown
                    </button>
                    <button
                      onClick={() => setViewFoldMode('full')}
                      className={`px-2 py-0.5 rounded font-medium transition ${
                        viewFoldMode === 'full' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Full Raw Text
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(kit.description, 'Description')}
                  className="flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  {copiedField === 'Description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Description</span>
                </button>
              </div>

              {viewFoldMode === 'fold' ? (
                <div className="space-y-3">
                  {/* Above fold line */}
                  <div className="p-3.5 rounded-xl bg-dark-card/90 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>Above The Fold (Visible before 'Show more' click)</span>
                      </span>
                      <span>Primary Retention Contract</span>
                    </div>
                    <div className="font-mono text-xs text-white leading-relaxed whitespace-pre-wrap select-text">
                      {aboveFold}
                    </div>
                  </div>

                  {/* Below fold */}
                  <div className="p-3.5 rounded-xl bg-dark-bg/80 border border-dark-border text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto select-text">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">
                      Below The Fold (Chapters, Resource Links & Hashtags):
                    </div>
                    {belowFold}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-dark-bg border border-dark-border font-mono text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-text">
                  {kit.description}
                </div>
              )}
            </div>

            {/* 3. 3-5 Hashtags + Backend Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hashtags (3-5 max) */}
              <div className="glass-panel p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                    <Hash className="w-3.5 h-3.5 text-brand-400" />
                    <span>Hashtags ({kit.hashtags.length} Tags - Golden Limit)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(kit.hashtags.join(' '), 'Hashtags')}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {kit.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-bold text-brand-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Backend Tags (8-12 tags) */}
              <div className="glass-panel p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Backend Tags ({kit.backendTags.length} Tags)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(kit.backendTags.join(', '), 'Backend Tags')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {kit.backendTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-dark-bg border border-dark-border text-[11px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Timestamps & Pinned Comment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pinned Engagement Comment</span>
                  </div>
                  <button
                    onClick={() => handleCopy(kit.pinnedComment, 'Pinned Comment')}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-300 bg-dark-bg/60 p-3 rounded-lg border border-dark-border/50 select-text">
                  "{kit.pinnedComment}"
                </p>
              </div>

              {kit.chapters && kit.chapters.length > 0 && (
                <div className="glass-panel p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                      <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Video Chapters</span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(
                          kit.chapters?.map((c) => `${c.timestamp} - ${c.title}`).join('\n') || '',
                          'Chapters'
                        )
                      }
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {kit.chapters.map((ch, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300 bg-dark-bg/40 px-2 py-1 rounded">
                        <span className="font-mono text-emerald-400 font-bold">{ch.timestamp}</span>
                        <span className="truncate ml-2">{ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* One Click Actions: Copy All & Direct YouTube Upload */}
            <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleCopyFullKit}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-white text-xs font-bold shadow-md transition"
              >
                <Copy className="w-4 h-4 text-brand-400" />
                <span>One-Click Copy All (Title + Desc + Tags)</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition"
              >
                <Youtube className="w-4 h-4" />
                <span>Upload Directly to YouTube</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Educational "Why These Hashtags" & SEO Score Meter (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* SEO Score Meter */}
            <div className="glass-panel p-5 rounded-2xl space-y-4 bg-gradient-to-br from-dark-card to-dark-surface border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Algorithmic SEO Score</h3>
                </div>
                <div className="text-xl font-black text-emerald-400">
                  {kit.seoScore} / 100
                </div>
              </div>

              <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${kit.seoScore}%` }}
                />
              </div>

              <div className="space-y-2 pt-2 text-xs">
                {Object.entries(kit.seoBreakdown || {}).map(([crit, val], idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-dark-bg/60 border border-dark-border/50">
                    <span className="font-semibold text-slate-200 capitalize">{crit}: </span>
                    <span className="text-slate-400">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* "Why These Hashtags" Educational Guide */}
            <div className="glass-panel p-5 rounded-2xl space-y-3 border border-brand-500/20 bg-dark-card/40">
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Why These Specific Hashtags?</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-dark-bg/60 p-3 rounded-xl border border-dark-border/50">
                {kit.whyTheseHashtags}
              </p>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>The 15-Hashtag Danger Zone</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  YouTube officially ignores ALL hashtags on a video if you exceed 15 tags. Only the first 3 appear above the video title. TubePilot strictly generates 3-5 tags (1 broad, 2 niche, 1 specific) for optimal indexing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct YouTube Upload Modal */}
      {showUploadModal && kit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-lg w-full bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-500">
                <Youtube className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct YouTube API Upload</h3>
                <p className="text-xs text-slate-400">Publish or schedule via videos.insert</p>
              </div>
            </div>

            {/* Quota warning */}
            <div className="p-3 rounded-xl bg-dark-card border border-dark-border text-xs flex justify-between items-center">
              <span className="text-slate-400">Estimated Quota Usage:</span>
              <span className="font-semibold text-brand-400">~1,600 units / {quota?.dailyLimit || 10000}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Privacy Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['private', 'unlisted', 'public'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setPrivacyStatus(st)}
                      className={`p-2.5 rounded-xl border font-bold capitalize transition ${
                        privacyStatus === st
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                          : 'border-dark-border bg-dark-card text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Schedule Publish (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDirectUpload}
                disabled={isUploading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                <Youtube className="w-4 h-4" />
                <span>{isUploading ? 'Registering...' : 'Confirm Upload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
