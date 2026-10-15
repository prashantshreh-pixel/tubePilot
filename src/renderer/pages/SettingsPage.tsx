import React, { useState } from 'react';
import {
  Settings,
  Key,
  Youtube,
  Sparkles,
  Image,
  Repeat,
  Sliders,
  FolderOpen,
  Save,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Cpu,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettingsData, addToast, refreshAnalyticsData } = useAppStore();

  // Local form states
  const [textProvider, setTextProvider] = useState(settings?.textProvider || 'claude');
  const [imageProvider, setImageProvider] = useState(settings?.imageProvider || 'openai');
  const [videoProvider, setVideoProvider] = useState(settings?.videoProvider || 'local_ffmpeg');

  const [anthropicApiKey, setAnthropicApiKey] = useState(settings?.anthropicApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings?.openaiApiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
  const [stabilityApiKey, setStabilityApiKey] = useState(settings?.stabilityApiKey || '');
  const [replicateApiKey, setReplicateApiKey] = useState(settings?.replicateApiKey || '');
  const [runwayApiKey, setRunwayApiKey] = useState(settings?.runwayApiKey || '');
  const [lumaApiKey, setLumaApiKey] = useState(settings?.lumaApiKey || '');

  const [youtubeClientId, setYoutubeClientId] = useState(settings?.youtubeClientId || '');
  const [youtubeClientSecret, setYoutubeClientSecret] = useState(settings?.youtubeClientSecret || '');

  const [channelNiche, setChannelNiche] = useState(settings?.channelNiche || '');
  const [channelDescription, setChannelDescription] = useState(settings?.channelDescription || '');
  const [targetAudience, setTargetAudience] = useState(settings?.targetAudience || '');
  const [outputDirectory, setOutputDirectory] = useState(settings?.outputDirectory || '');

  const [shortsCount, setShortsCount] = useState(settings?.dailyMix?.shorts ?? 2);
  const [longCount, setLongCount] = useState(settings?.dailyMix?.long ?? 1);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isConnectingYt, setIsConnectingYt] = useState(false);

  const toggleShowKey = (name: string) => {
    setShowKeys((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async () => {
    await saveSettingsData({
      textProvider,
      imageProvider,
      videoProvider,
      anthropicApiKey: anthropicApiKey.trim() || undefined,
      openaiApiKey: openaiApiKey.trim() || undefined,
      geminiApiKey: geminiApiKey.trim() || undefined,
      stabilityApiKey: stabilityApiKey.trim() || undefined,
      replicateApiKey: replicateApiKey.trim() || undefined,
      runwayApiKey: runwayApiKey.trim() || undefined,
      lumaApiKey: lumaApiKey.trim() || undefined,
      youtubeClientId: youtubeClientId.trim() || undefined,
      youtubeClientSecret: youtubeClientSecret.trim() || undefined,
      channelNiche,
      channelDescription,
      targetAudience,
      outputDirectory,
      dailyMix: { shorts: shortsCount, long: longCount },
    });
  };

  const handleConnectYouTube = async () => {
    if (!youtubeClientId) {
      addToast('error', 'Please enter your Google OAuth Client ID first.');
      return;
    }

    try {
      setIsConnectingYt(true);
      addToast('info', 'Starting Google OAuth loopback flow... Check your web browser.');
      // Save client credentials first
      await saveSettingsData({
        youtubeClientId: youtubeClientId.trim(),
        youtubeClientSecret: youtubeClientSecret.trim() || undefined,
      });

      const res = await window.tubePilotAPI?.startYouTubeAuth();
      if (res?.success) {
        addToast('success', 'YouTube channel linked successfully!');
        await refreshAnalyticsData(true);
      } else {
        addToast('error', res?.error || 'Authentication was cancelled or failed.');
      }
    } catch (err: any) {
      addToast('error', `OAuth error: ${err.message}`);
    } finally {
      setIsConnectingYt(false);
    }
  };

  const handleDisconnectYouTube = async () => {
    await window.tubePilotAPI?.disconnectYouTube();
    addToast('info', 'Disconnected from YouTube channel.');
    await refreshAnalyticsData(true);
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)] select-none">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">App Settings & AI Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure pluggable providers, secure OS Keychain API keys, YouTube OAuth, and daily mix settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. YouTube Connection & OAuth */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-500 flex items-center justify-center">
                <Youtube className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">YouTube Integration</h3>
            </div>

            {settings?.isYouTubeConnected ? (
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                Manual Mode
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                value={youtubeClientId}
                onChange={(e) => setYoutubeClientId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Google Client Secret (Optional)</label>
              <input
                type="password"
                value={youtubeClientSecret}
                onChange={(e) => setYoutubeClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {settings?.isYouTubeConnected ? (
                <button
                  onClick={handleDisconnectYouTube}
                  className="px-4 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-rose-400 font-semibold"
                >
                  Disconnect YouTube Channel
                </button>
              ) : (
                <button
                  onClick={handleConnectYouTube}
                  disabled={isConnectingYt}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 transition disabled:opacity-50"
                >
                  <Youtube className="w-4 h-4" />
                  <span>{isConnectingYt ? 'Connecting...' : 'Connect YouTube (OAuth PKCE)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Manual Channel Profile Mode */}
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manual Channel Profile</h3>
              <p className="text-[11px] text-slate-400">Used when not connected via Google OAuth</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Channel Niche / Topic</label>
              <input
                type="text"
                value={channelNiche}
                onChange={(e) => setChannelNiche(e.target.value)}
                placeholder="e.g. AI Coding, Productivity, SaaS"
                className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Audience Profile</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Developers and tech founders"
                className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Channel Description</label>
              <textarea
                rows={2}
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Text AI Provider (Claude / OpenAI / Gemini) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Text AI Engine</h3>
          </div>

          {/* Provider Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['claude', 'openai', 'gemini'] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => setTextProvider(prov)}
                className={`p-2.5 rounded-xl border font-bold capitalize transition ${
                  textProvider === prov
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-dark-border bg-dark-card text-slate-400 hover:text-white'
                }`}
              >
                {prov === 'claude' ? 'Claude 3.5' : prov === 'openai' ? 'OpenAI GPT-4o' : 'Google Gemini'}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {textProvider === 'claude' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Anthropic Claude API Key</label>
                <div className="relative">
                  <input
                    type={showKeys['claude'] ? 'text' : 'password'}
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3.5 py-2 pr-10 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={() => toggleShowKey('claude')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeys['claude'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {textProvider === 'openai' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showKeys['openai'] ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3.5 py-2 pr-10 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={() => toggleShowKey('openai')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {textProvider === 'gemini' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Google Gemini API Key</label>
                <div className="relative">
                  <input
                    type={showKeys['gemini'] ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2 pr-10 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Image AI Provider (OpenAI / Stability / Replicate) */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Thumbnail Image AI Engine</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['openai', 'stability', 'replicate'] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => setImageProvider(prov)}
                className={`p-2.5 rounded-xl border font-bold capitalize transition ${
                  imageProvider === prov
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-dark-border bg-dark-card text-slate-400 hover:text-white'
                }`}
              >
                {prov === 'openai' ? 'DALL-E 3' : prov === 'stability' ? 'Stability AI' : 'Replicate Flux'}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {imageProvider === 'stability' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Stability API Key</label>
                <input
                  type="password"
                  value={stabilityApiKey}
                  onChange={(e) => setStabilityApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                />
              </div>
            )}

            {imageProvider === 'replicate' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Replicate API Token</label>
                <input
                  type="password"
                  value={replicateApiKey}
                  onChange={(e) => setReplicateApiKey(e.target.value)}
                  placeholder="r8_..."
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                />
              </div>
            )}

            {imageProvider === 'openai' && (
              <p className="text-slate-400 text-[11px]">
                Uses your configured OpenAI API Key from above (DALL-E 3 model).
              </p>
            )}
          </div>
        </div>

        {/* 5. Video AI Provider & FFmpeg Fallback */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Loop Video Engine</h3>
              <p className="text-[11px] text-slate-400">Cloud AI video models or local offline FFmpeg loop generator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(['local_ffmpeg', 'runway', 'luma', 'replicate'] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => setVideoProvider(prov)}
                className={`p-2.5 rounded-xl border font-bold capitalize transition ${
                  videoProvider === prov
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-dark-border bg-dark-card text-slate-400 hover:text-white'
                }`}
              >
                {prov === 'local_ffmpeg' ? 'FFmpeg Local' : prov === 'runway' ? 'Runway' : prov === 'luma' ? 'Luma' : 'Replicate'}
              </button>
            ))}
          </div>

          {videoProvider === 'local_ffmpeg' ? (
            <div className="p-3.5 rounded-xl bg-dark-card/60 border border-dark-border/60 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4" />
                <span>Zero-Cost Local Fallback Active</span>
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Seamless Ken Burns animation, ping-pong reverse loop, and crossfaded ambient audio runs 100% locally on your CPU/GPU using bundled FFmpeg.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2 text-xs">
              {videoProvider === 'runway' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Runway API Key</label>
                  <input
                    type="password"
                    value={runwayApiKey}
                    onChange={(e) => setRunwayApiKey(e.target.value)}
                    placeholder="key_..."
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                  />
                </div>
              )}
              {videoProvider === 'luma' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Luma Dream Machine API Key</label>
                  <input
                    type="password"
                    value={lumaApiKey}
                    onChange={(e) => setLumaApiKey(e.target.value)}
                    placeholder="luma-..."
                    className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Daily Mix & Output Storage */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Daily Growth Preferences</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                <span>Daily Shorts to Generate</span>
                <span className="text-brand-400 font-bold">{shortsCount} Shorts</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={shortsCount}
                onChange={(e) => setShortsCount(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 h-1.5 bg-dark-bg rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                <span>Daily Long Videos to Generate</span>
                <span className="text-brand-400 font-bold">{longCount} Long</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={longCount}
                onChange={(e) => setLongCount(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 h-1.5 bg-dark-bg rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <label className="block text-slate-300 font-medium mb-1">Local Export Directory</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={outputDirectory}
                  onChange={(e) => setOutputDirectory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border text-white font-mono text-[11px]"
                />
                <button
                  onClick={() => window.tubePilotAPI?.openFolder(outputDirectory)}
                  className="p-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300"
                  title="Open folder"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
