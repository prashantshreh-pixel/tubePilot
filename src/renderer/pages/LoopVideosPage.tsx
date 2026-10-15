import React, { useState, useRef, useEffect } from 'react';
import {
  Repeat,
  Copy,
  Check,
  Play,
  Pause,
  Download,
  FolderOpen,
  Sparkles,
  Sliders,
  AlertCircle,
  Film,
  Camera,
  Sun,
  Volume2,
  Clock,
  XCircle,
  RefreshCw,
  Cpu,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { WorkflowBar } from '../components/WorkflowBar';

export const LoopVideosPage: React.FC = () => {
  const {
    loopVideos,
    selectedLoopVideo,
    setSelectedLoopVideo,
    ideas,
    selectedIdea,
    setSelectedIdea,
    createLoopVideoForIdea,
    addToast,
    settings,
  } = useAppStore();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [customDuration, setCustomDuration] = useState<number>(15);
  const [technique, setTechnique] = useState<'forward_reverse_pingpong' | 'seamless_crossfade'>('forward_reverse_pingpong');
  const [loopCount, setLoopCount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loop = selectedLoopVideo || loopVideos[0];

  useEffect(() => {
    setLoopCount(0);
  }, [loop?.videoPath]);

  const handleVideoEnded = () => {
    setLoopCount((prev) => prev + 1);
  };

  const handleCopyPrompt = () => {
    if (!loop) return;
    navigator.clipboard.writeText(loop.prompt);
    setCopiedPrompt(true);
    addToast('info', 'Seamless video loop prompt copied!');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleStartRender = async () => {
    if (!loop) return;
    try {
      addToast('info', `Rendering seamless loop (${customDuration}s)...`);
      const updated = await window.tubePilotAPI?.renderLoopVideo(loop.id, {
        durationSeconds: customDuration,
        fallback: settings?.videoProvider === 'local_ffmpeg',
      });
      if (updated) {
        setSelectedLoopVideo(updated);
        addToast('success', 'Loop video render completed successfully!');
      }
    } catch (err: any) {
      addToast('error', `Render failed: ${err.message}`);
    }
  };

  const handleCancelRender = async () => {
    if (!loop) return;
    await window.tubePilotAPI?.cancelLoopRender(loop.id);
    addToast('warning', 'Loop render cancelled.');
  };

  const handleOpenFolder = () => {
    if (settings?.outputDirectory) {
      window.tubePilotAPI?.openFolder(settings.outputDirectory);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Workflow Navigation Ribbon */}
      <WorkflowBar />

      {/* Top Header & Selector */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Seamless Loop Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
              130%+ Retention Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Engineered cyclic videos for hypnotic Shorts replay watch time & extended ambient focus streams.
          </p>
        </div>

        {/* Idea Switcher Dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={loop?.ideaId || selectedIdea?.id || ''}
            onChange={(e) => {
              const foundIdea = ideas.find((i) => i.id === e.target.value);
              if (foundIdea) {
                setSelectedIdea(foundIdea);
                const foundLoop = loopVideos.find((l) => l.ideaId === foundIdea.id);
                if (foundLoop) {
                  setSelectedLoopVideo(foundLoop);
                } else {
                  createLoopVideoForIdea(foundIdea);
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

      {!loop ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
          <Repeat className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Loop Video Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select an idea from Today's Plan and click "Generate Loop Video" to configure seamless loop prompts.
          </p>
          {ideas[0] && (
            <button
              onClick={() => createLoopVideoForIdea(ideas[0])}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
            >
              Generate For "{ideas[0].title.slice(0, 30)}..."
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Video Player, Progress Bar & Render Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Preview Player</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                    {loop.aspectRatio} • {loop.videoType} Form
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  {loopCount > 0 && (
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Repeat className="w-3 h-3 animate-spin" />
                      <span>Looped {loopCount}x smoothly</span>
                    </span>
                  )}
                  <span>
                    Mode: <strong className="text-slate-200">{loop.fallbackUsed ? 'Local FFmpeg' : settings?.videoProvider || 'Local FFmpeg'}</strong>
                  </span>
                </div>
              </div>

              {/* HTML5 Video Player Container */}
              <div
                className={`relative rounded-xl overflow-hidden bg-black/80 border border-dark-border flex items-center justify-center ${
                  loop.aspectRatio === '16:9' ? 'aspect-video w-full' : 'aspect-[9/16] max-w-[340px] mx-auto'
                }`}
              >
                {loop.videoPath ? (
                  <video
                    ref={videoRef}
                    src={`file://${loop.videoPath}`}
                    controls
                    autoPlay
                    loop
                    onEnded={handleVideoEnded}
                    onTimeUpdate={() => {
                      if (videoRef.current && videoRef.current.currentTime < 0.25 && videoRef.current.currentTime > 0) {
                        // Increments loop counter on smooth rewind
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-500 space-y-3">
                    <Film className="w-10 h-10 mx-auto text-slate-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Video Not Rendered Yet</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                        Pick duration preset below and click "Render Seamless Loop".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Render Progress Indicator */}
              {loop.status === 'rendering' && (
                <div className="p-4 rounded-xl bg-dark-card border border-brand-500/40 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                      <span>{loop.statusMessage || 'Encoding seamless video loop...'}</span>
                    </span>
                    <span className="font-mono text-brand-400 font-bold">{loop.progress}%</span>
                  </div>

                  <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${loop.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleCancelRender}
                      className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Render</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Render Settings & Duration Selector */}
              <div className="p-4 rounded-xl bg-dark-card/60 border border-dark-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    <span>Loop Duration & Animation Presets</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Bundled FFmpeg (H.264 / AAC)</span>
                  </div>
                </div>

                {/* Duration Fast Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">Duration Quick Select:</label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {loop.videoType === 'Short' ? (
                      [
                        { sec: 8, label: '8s (Micro Replay)' },
                        { sec: 15, label: '15s (Standard Viral)' },
                        { sec: 30, label: '30s (Deep Loop)' },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          onClick={() => setCustomDuration(item.sec)}
                          className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                            customDuration === item.sec
                              ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                              : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-500'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      [
                        { sec: 60, label: '1m (Preview)' },
                        { sec: 600, label: '10m (Ambient)' },
                        { sec: 3600, label: '1h (Focus)' },
                        { sec: 10800, label: '3h (Deep Stream)' },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          onClick={() => setCustomDuration(item.sec)}
                          className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                            customDuration === item.sec
                              ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                              : 'bg-dark-bg text-slate-300 border-dark-border hover:border-slate-500'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Loop Technique */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">Seamless Loop Algorithm</label>
                    <select
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white"
                    >
                      <option value="forward_reverse_pingpong">Ping-Pong (Forward + Reverse 0 Pop)</option>
                      <option value="seamless_crossfade">Seamless 1s Crossfade Blend</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border text-xs text-slate-300 flex items-center space-x-2 w-full">
                      <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Looped ambient pad crossfaded without audio clicks</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-400">
                    Resolution: {loop.aspectRatio === '16:9' ? '1920x1080 (16:9)' : '1080x1920 (9:16)'}
                  </div>

                  <div className="flex items-center space-x-2">
                    {loop.exportPath && (
                      <button
                        onClick={handleOpenFolder}
                        className="p-2 rounded-xl bg-dark-bg hover:bg-dark-hover border border-dark-border text-slate-300"
                        title="Open Export Folder"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={handleStartRender}
                      disabled={loop.status === 'rendering'}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{loop.status === 'completed' ? 'Re-Render Seamless Loop' : 'Render Seamless Loop'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI Video Prompt, Camera, Lighting & Retention Strategy (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Retention Strategy Tip */}
            <div className="glass-panel p-5 rounded-2xl space-y-3 bg-gradient-to-br from-dark-card to-dark-surface border border-blue-500/20">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>130%+ Replay Watch Time Strategy</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed italic bg-dark-bg/60 p-3 rounded-xl border border-dark-border/50">
                "{loop.loopRetentionTip}"
              </p>
            </div>

            {/* AI Video Generation Prompt (Copyable) */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Loop Video AI Prompt
                </h3>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 text-xs transition"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-bg/80 border border-dark-border font-mono text-[11px] text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                {loop.prompt}
              </div>
            </div>

            {/* Technical Parameters */}
            <div className="glass-panel p-5 rounded-2xl space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Animation Parameters
              </h3>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 flex items-start space-x-2.5">
                  <Camera className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Camera Motion: </span>
                    <span className="text-slate-400">{loop.cameraMotion}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 flex items-start space-x-2.5">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Lighting Atmosphere: </span>
                    <span className="text-slate-400">{loop.lightingStyle}</span>
                  </div>
                </div>

                {loop.ambientAudioPrompt && (
                  <div className="p-2.5 rounded-lg bg-dark-card/60 border border-dark-border/50 flex items-start space-x-2.5">
                    <Volume2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200">Ambient Soundtrack: </span>
                      <span className="text-slate-400">{loop.ambientAudioPrompt}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
