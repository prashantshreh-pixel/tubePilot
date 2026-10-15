import React, { useState } from 'react';
import { Youtube, Sparkles, Check, ArrowRight, ShieldCheck, Sliders } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, settings, saveSettingsData, refreshAnalyticsData } = useAppStore();
  const [step, setStep] = useState(1);

  // Form states
  const [channelNiche, setChannelNiche] = useState(settings?.channelNiche || 'Tech & AI Coding');
  const [channelDescription, setChannelDescription] = useState(
    settings?.channelDescription || 'Tutorials and deep dives on building modern software with AI.'
  );
  const [anthropicApiKey, setAnthropicApiKey] = useState(settings?.anthropicApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings?.openaiApiKey || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
  const [shortsCount, setShortsCount] = useState(settings?.dailyMix?.shorts ?? 2);
  const [longCount, setLongCount] = useState(settings?.dailyMix?.long ?? 1);

  if (!showOnboarding) return null;

  const handleFinish = async () => {
    await saveSettingsData({
      channelNiche,
      channelDescription,
      anthropicApiKey: anthropicApiKey.trim() || undefined,
      openaiApiKey: openaiApiKey.trim() || undefined,
      geminiApiKey: geminiApiKey.trim() || undefined,
      dailyMix: { shorts: shortsCount, long: longCount },
      onboardingCompleted: true,
      manualMode: !settings?.isYouTubeConnected,
    });
    setShowOnboarding(false);
    await refreshAnalyticsData(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Progress Bar Header */}
        <div className="bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Welcome to TubePilot</h2>
              <p className="text-xs text-slate-400">Step {step} of 3: Personalized Workspace Setup</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-brand-500' : s < step ? 'w-3 bg-emerald-500' : 'w-3 bg-dark-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Channel Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Define Your Channel Identity</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  TubePilot uses this context to generate high-relevance viral hooks and SEO metadata.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Niche / Topic</label>
                <input
                  type="text"
                  value={channelNiche}
                  onChange={(e) => setChannelNiche(e.target.value)}
                  placeholder="e.g. Personal Finance, Tech Coding, Fitness, Gaming"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Channel Description & Target Audience</label>
                <textarea
                  rows={3}
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="What is your channel about? Who are your ideal viewers?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-dark-card/60 border border-dark-border/80 text-xs text-slate-400 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  You can link your live YouTube channel via Google OAuth anytime in <strong>Settings</strong>. Manual mode lets you start immediately with offline seed data!
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: AI Provider & API Keys */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Configure AI Credentials (Optional)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Keys are stored encrypted on your machine using the OS Keychain. If empty, TubePilot will run in demo mode.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Anthropic Claude API Key (Default)</span>
                    <span className="text-slate-500 text-[10px]">Recommended</span>
                  </div>
                  <input
                    type="password"
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>OpenAI API Key (GPT-4o & DALL-E 3)</span>
                  </div>
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Google Gemini API Key</span>
                  </div>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Daily Mix Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Growth Mix</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the daily balance of YouTube Shorts and long-form videos to recommend each morning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-200 mb-2">
                    <span>YouTube Shorts Per Day</span>
                    <span className="text-brand-400 font-bold">{shortsCount} Shorts</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={shortsCount}
                    onChange={(e) => setShortsCount(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500 h-1.5 bg-dark-surface rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-200 mb-2">
                    <span>Long Videos Per Day</span>
                    <span className="text-brand-400 font-bold">{longCount} Long</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={longCount}
                    onChange={(e) => setLongCount(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500 h-1.5 bg-dark-surface rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
                <span>
                  Total daily batch: <strong>{shortsCount + longCount} tailored video concepts</strong> generated every 24 hours.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-dark-card border-t border-dark-border p-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition"
            >
              <Check className="w-4 h-4" />
              <span>Launch TubePilot</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
