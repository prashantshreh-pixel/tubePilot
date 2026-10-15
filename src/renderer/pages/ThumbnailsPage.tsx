import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Copy,
  Check,
  Sparkles,
  Download,
  FolderOpen,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Type,
  Palette,
  Layout,
  Maximize2,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { WorkflowBar } from '../components/WorkflowBar';

export const ThumbnailsPage: React.FC = () => {
  const {
    thumbnails,
    selectedThumbnail,
    setSelectedThumbnail,
    ideas,
    selectedIdea,
    setSelectedIdea,
    createThumbnailForIdea,
    addToast,
    settings,
  } = useAppStore();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [customText, setCustomText] = useState(selectedThumbnail?.textOverlay?.text || 'STOP DOING THIS!');
  const [fontColor, setFontColor] = useState(selectedThumbnail?.textOverlay?.fontColor || '#FFE500');
  const [placement, setPlacement] = useState<'top-left' | 'center' | 'bottom-center' | 'bottom-right'>('top-left');
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const thumb = selectedThumbnail || thumbnails[0];

  const handleCopyPrompt = () => {
    if (!thumb) return;
    navigator.clipboard.writeText(thumb.prompt);
    setCopiedPrompt(true);
    addToast('info', 'Detailed thumbnail prompt copied to clipboard!');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleSelectVariation = (index: number) => {
    if (!thumb) return;
    const updated = { ...thumb, selectedVariationIndex: index };
    const matchingIdea = ideas.find((i) => i.id === thumb.ideaId);
    if (matchingIdea) {
      window.tubePilotAPI?.saveIdea({ ...matchingIdea, thumbnailId: thumb.id });
    }
    setSelectedThumbnail(updated);
  };

  const handleRegenerateImages = async () => {
    if (!thumb) return;
    try {
      addToast('info', 'Generating 3 fresh thumbnail visual variations...');
      const updated = await window.tubePilotAPI?.generateThumbnailImages(thumb.id);
      if (updated) {
        setSelectedThumbnail(updated);
        addToast('success', 'New variations generated!');
      }
    } catch (err: any) {
      addToast('error', `Generation failed: ${err.message}`);
    }
  };

  const handleExport = async () => {
    if (!thumb) return;
    try {
      setIsExporting(true);
      const res = await window.tubePilotAPI?.exportThumbnail(
        thumb.id,
        thumb.selectedVariationIndex || 0,
        customText
      );
      if (res?.filePath) {
        setExportedPath(res.filePath);
        addToast('success', `Exported to: ${res.filePath}`);
      }
    } catch (err: any) {
      addToast('error', `Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenFolder = () => {
    if (settings?.outputDirectory) {
      window.tubePilotAPI?.openFolder(settings.outputDirectory);
    }
  };

  const getPlacementClass = () => {
    switch (placement) {
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
      case 'bottom-center':
        return 'bottom-6 left-1/2 -translate-x-1/2 text-center';
      case 'bottom-right':
        return 'bottom-6 right-6 text-right';
      case 'top-left':
      default:
        return 'top-6 left-6 text-left';
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'normal':
        return 'text-xl sm:text-2xl px-2.5 py-1';
      case 'huge':
        return 'text-3xl sm:text-4xl px-3.5 py-2';
      case 'large':
      default:
        return 'text-2xl sm:text-3xl px-3 py-1.5';
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Workflow Navigation Ribbon */}
      <WorkflowBar />

      {/* Top Selector: Choose which idea to work on */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Thumbnail Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold">
              High CTR Mode
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft high-converting thumbnails: copyable AI prompt, 3 visual variations, text overlay editor & checklist.
          </p>
        </div>

        {/* Idea Switcher Dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={thumb?.ideaId || selectedIdea?.id || ''}
            onChange={(e) => {
              const foundIdea = ideas.find((i) => i.id === e.target.value);
              if (foundIdea) {
                setSelectedIdea(foundIdea);
                const foundThumb = thumbnails.find((t) => t.ideaId === foundIdea.id);
                if (foundThumb) {
                  setSelectedThumbnail(foundThumb);
                } else {
                  createThumbnailForIdea(foundIdea);
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

      {!thumb ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Thumbnail Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select an idea from Today's Plan and click "Generate Thumbnail" to build prompts and variations.
          </p>
          {ideas[0] && (
            <button
              onClick={() => createThumbnailForIdea(ideas[0])}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
            >
              Generate For "{ideas[0].title.slice(0, 30)}..."
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Visual Variations & Live Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Master Preview Box */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Main Preview</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold">
                    {thumb.videoType === 'Long' ? '16:9 (1280x720)' : '9:16 (1080x1920)'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>Variation {(thumb.selectedVariationIndex || 0) + 1} of 3</span>
                  {thumb.variations && thumb.variations[thumb.selectedVariationIndex || 0] && (
                    <button
                      onClick={() => setLightboxUrl(thumb.variations[thumb.selectedVariationIndex || 0].imageUrl)}
                      className="p-1 hover:text-white transition"
                      title="Inspect full screen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Master Image Canvas Container */}
              <div
                className={`relative rounded-xl overflow-hidden bg-black/60 border border-dark-border flex items-center justify-center group ${
                  thumb.videoType === 'Long' ? 'aspect-video w-full' : 'aspect-[9/16] max-w-[340px] mx-auto'
                }`}
              >
                {thumb.variations && thumb.variations[thumb.selectedVariationIndex || 0] ? (
                  <img
                    src={thumb.variations[thumb.selectedVariationIndex || 0].imageUrl}
                    alt="Selected Variation"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500 space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto" />
                    <p className="text-xs">No image rendered</p>
                  </div>
                )}

                {/* Custom Text Overlay on preview */}
                {customText && (
                  <div
                    className={`absolute ${getPlacementClass()} max-w-[85%] pointer-events-none drop-shadow-2xl select-none transition-all duration-200`}
                    style={{
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      textShadow: '0 4px 14px rgba(0,0,0,0.95), 0 0 6px #000',
                    }}
                  >
                    <span
                      className={`${getTextSizeClass()} font-black uppercase rounded-lg bg-black/75 border-2 inline-block`}
                      style={{ color: fontColor, borderColor: fontColor }}
                    >
                      {customText}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 Variations Picker */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-medium text-slate-300">
                  <span>Pick Your Favorite Variation:</span>
                  <button
                    onClick={handleRegenerateImages}
                    className="flex items-center space-x-1 text-brand-400 hover:text-brand-300 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Regenerate 3 Variations</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(thumb.variations || []).map((variation, vIdx) => {
                    const isSelected = (thumb.selectedVariationIndex || 0) === vIdx;
                    return (
                      <div
                        key={variation.id}
                        onClick={() => handleSelectVariation(vIdx)}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                          isSelected
                            ? 'border-brand-500 shadow-lg shadow-brand-500/30'
                            : 'border-dark-border opacity-70 hover:opacity-100 hover:border-slate-500'
                        } ${thumb.videoType === 'Long' ? 'aspect-video' : 'aspect-[9/16]'}`}
                      >
                        <img src={variation.imageUrl} alt={`Var ${vIdx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                          #{vIdx + 1}
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-1 right-1 bg-brand-500 p-1 rounded-full text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Export Controls */}
              <div className="pt-4 border-t border-dark-border/60 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Output: PNG/JPG • High DPI • Optimized &lt; 2 MB
                </div>

                <div className="flex items-center space-x-2">
                  {exportedPath && (
                    <button
                      onClick={handleOpenFolder}
                      className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300"
                      title="Open Export Folder"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Exporting...' : 'Export Thumbnail (PNG)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Text Overlay Customizer */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Live Text Overlay Customizer</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                    <span>Overlay Hook Text (Max 3-4 Words)</span>
                    <span className="text-slate-500 text-[11px]">{customText.split(' ').filter(Boolean).length} words</span>
                  </div>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white focus:outline-none focus:border-brand-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Color */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-dark-card border border-dark-border cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-slate-400">{fontColor}</span>
                    </div>
                  </div>

                  {/* Placement */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Position</label>
                    <select
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-dark-card border border-dark-border text-white text-xs"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Scale</label>
                    <select
                      value={textSize}
                      onChange={(e) => setTextSize(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-dark-card border border-dark-border text-white text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="large">Large</option>
                      <option value="huge">Huge (Mobile Punch)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Prompt, Checklist & Score (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Predicted CTR Score & Expert Critique */}
            <div className="glass-panel p-5 rounded-2xl space-y-4 bg-gradient-to-br from-dark-card to-dark-surface border border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">Predicted CTR Score</h3>
                </div>
                <div className="text-xl font-black text-brand-400">
                  {thumb.predictedCTRScore} / 100
                </div>
              </div>

              <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${thumb.predictedCTRScore}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic bg-dark-bg/60 p-3 rounded-xl border border-dark-border/50">
                "{thumb.expertCritique}"
              </p>
            </div>

            {/* Thumbnail Checklist */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                High-CTR Checklist
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 text-xs">
                  <span className="text-slate-300">Extreme Visual Contrast</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 text-xs">
                  <span className="text-slate-300">Readable on Mobile Feed (80px)</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 text-xs">
                  <span className="text-slate-300">One Clear Focal Point</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 text-xs space-y-1">
                  <span className="text-slate-300 font-medium">Curiosity Gap Trigger:</span>
                  <p className="text-slate-400">{thumb.checklist.curiosityGap}</p>
                </div>
              </div>
            </div>

            {/* AI Image Generation Prompt (Copyable) */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4 text-brand-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Detailed Generative Prompt
                  </h3>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 text-xs transition"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-bg/80 border border-dark-border font-mono text-[11px] text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                {thumb.prompt}
              </div>

              {thumb.negativePrompt && (
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-medium">Negative Prompt:</span>
                  <div className="p-2 rounded-lg bg-dark-bg/40 border border-dark-border text-[11px] text-slate-400">
                    {thumb.negativePrompt}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-brand-400 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={lightboxUrl} alt="Enlarged Thumbnail" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
