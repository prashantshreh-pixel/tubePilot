import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  MousePointerClick,
  Users,
  Sparkles,
  RefreshCw,
  ExternalLink,
  PieChart as PieIcon,
  Video,
  Flame,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

export const DashboardPage: React.FC = () => {
  const { analytics, refreshAnalyticsData, isLoading, setCurrentPage, settings } = useAppStore();

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading channel analytics...</p>
      </div>
    );
  }

  const { channelInfo, aiDiagnosis, topVideos, bottomVideos, chartData, trafficSources, shortsVsLongSplit } = analytics;

  const kpis = [
    {
      title: '90-Day Views',
      value: analytics.views90d.toLocaleString(),
      trend: analytics.viewsTrend,
      icon: Eye,
      detail: 'Compounding reach',
    },
    {
      title: 'Watch Time (Hours)',
      value: analytics.watchTimeHours.toLocaleString(),
      trend: analytics.watchTimeTrend,
      icon: Clock,
      detail: 'Viewer retention volume',
    },
    {
      title: 'Impression CTR',
      value: `${analytics.ctr}%`,
      trend: analytics.ctrTrend,
      icon: MousePointerClick,
      detail: 'Benchmark: 4-10%',
    },
    {
      title: 'Net Subscribers',
      value: `+${analytics.netSubscribers.toLocaleString()}`,
      trend: analytics.subscribersTrend,
      icon: Users,
      detail: `${analytics.subscribersGained} gained, ${analytics.subscribersLost} lost`,
    },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* 1. Channel Header Profile Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 p-0.5 shadow-xl">
            {channelInfo.thumbnails?.high ? (
              <img
                src={channelInfo.thumbnails.high}
                alt={channelInfo.title}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-dark-card flex items-center justify-center font-bold text-xl text-white">
                {channelInfo.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{channelInfo.title}</h2>
              {settings?.isYouTubeConnected ? (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Channel</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                  Manual Profile
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-1">{channelInfo.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-300">
              <span><strong>{channelInfo.subscriberCount.toLocaleString()}</strong> subscribers</span>
              <span>•</span>
              <span><strong>{channelInfo.videoCount}</strong> public videos</span>
              <span>•</span>
              <span><strong>{channelInfo.viewCount.toLocaleString()}</strong> lifetime views</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => setCurrentPage('today')}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/30 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Today's Plan</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend >= 0;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{kpi.title}</span>
                <div className="p-2 rounded-xl bg-dark-card border border-dark-border">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
                <div className="flex items-center space-x-1.5 mt-1">
                  <div
                    className={`flex items-center text-xs font-semibold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                    <span>{isPositive ? `+${kpi.trend}%` : `${kpi.trend}%`}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">vs prior 90d</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-border/40 text-[11px] text-slate-400">
                {kpi.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Plain English AI "How is my channel doing?" Diagnosis */}
      {aiDiagnosis && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-dark-card to-dark-surface border border-brand-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-dark-border/60 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">AI Channel Diagnosis</h3>
                <p className="text-xs text-slate-400">Algorithmic plain-English audit based on your 90-day retention curve</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-dark-bg/80 px-4 py-2 rounded-xl border border-dark-border">
                <span className="text-xs text-slate-400 font-medium">Channel Health Score:</span>
                <span className="text-base font-black text-brand-400">{aiDiagnosis.healthScore} / 100</span>
              </div>
            </div>
          </div>

          <div className="text-sm font-semibold text-white mb-4 bg-brand-500/10 border border-brand-500/20 p-3.5 rounded-xl">
            💡 "{aiDiagnosis.headline}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* What is working */}
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>What Is Working</span>
              </div>
              <ul className="space-y-2">
                {aiDiagnosis.whatIsWorking.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2 bg-dark-bg/40 p-2.5 rounded-lg border border-dark-border/50">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What is not working */}
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>What Is Not Working</span>
              </div>
              <ul className="space-y-2">
                {aiDiagnosis.whatIsNotWorking.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2 bg-dark-bg/40 p-2.5 rounded-lg border border-dark-border/50">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strategic Shift this week */}
          <div className="mt-5 pt-4 border-t border-dark-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-white">Strategic Shift This Week: </span>
              <span className="text-slate-300">{aiDiagnosis.strategicShiftThisWeek}</span>
            </div>
            <button
              onClick={() => setCurrentPage('today')}
              className="flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold shrink-0"
            >
              <span>View Recommended Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Chart & Traffic Distribution Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts 90-Day Velocity Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">90-Day Views & Subscriber Trajectory</h3>
              <p className="text-xs text-slate-400">Daily velocity curve tracking algorithmic distribution</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-brand-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span>Views</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Subs</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#ff0033" stop-opacity={0.4} />
                    <stop offset="95%" stop-color="#ff0033" stop-opacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c3144" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1d212f',
                    borderColor: '#2c3144',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#ff0033" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Line type="monotone" dataKey="subscribersGained" stroke="#34d399" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources & Shorts vs Long Split */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Traffic Acquisition & Formats</h3>
            <p className="text-xs text-slate-400 mb-4">Where your audience discovers your content</p>

            {/* Traffic sources progress bars */}
            <div className="space-y-3">
              {trafficSources.map((ts, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{ts.source}</span>
                    <span className="font-semibold text-white">{ts.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-amber-500"
                      style={{ width: `${ts.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shorts vs Long Split Box */}
          <div className="pt-4 border-t border-dark-border space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Shorts View Share</span>
              <span className="text-brand-400 font-bold">{shortsVsLongSplit.shortsViewPercentage}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-dark-bg">
              <div
                style={{ width: `${shortsVsLongSplit.shortsViewPercentage}%` }}
                className="bg-brand-500 h-full"
                title={`Shorts: ${shortsVsLongSplit.shortsViews.toLocaleString()} views`}
              />
              <div
                style={{ width: `${100 - shortsVsLongSplit.shortsViewPercentage}%` }}
                className="bg-blue-600 h-full"
                title={`Long: ${shortsVsLongSplit.longViews.toLocaleString()} views`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{shortsVsLongSplit.shortsCount} Shorts ({shortsVsLongSplit.shortsViews.toLocaleString()} views)</span>
              <span>{shortsVsLongSplit.longCount} Long ({shortsVsLongSplit.longViews.toLocaleString()} views)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Top 5 & Bottom 5 Performing Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Videos */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-white">Top 5 Performing Videos</h3>
            </div>
            <span className="text-xs text-slate-400">High CTR & Retention</span>
          </div>

          <div className="space-y-3">
            {topVideos.slice(0, 5).map((v) => (
              <div
                key={v.videoId}
                className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-dark-bg shrink-0 relative">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <Video className="w-5 h-5 m-auto text-slate-600" />
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] px-1 bg-black/80 text-white rounded font-bold">
                      {v.type}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{v.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {v.views.toLocaleString()} views • {v.likes.toLocaleString()} likes
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-400">{v.ctr}% CTR</div>
                  <div className="text-[10px] text-slate-400">{v.retentionRate}% retention</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 5 Performing Videos */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Underperforming Opportunities</h3>
            </div>
            <span className="text-xs text-slate-400">Candidate for Packaging Makeover</span>
          </div>

          <div className="space-y-3">
            {bottomVideos.slice(0, 5).map((v) => (
              <div
                key={v.videoId}
                className="p-3 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-dark-bg shrink-0 relative">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <Video className="w-5 h-5 m-auto text-slate-600" />
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] px-1 bg-black/80 text-white rounded font-bold">
                      {v.type}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{v.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {v.views.toLocaleString()} views • {v.likes.toLocaleString()} likes
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-rose-400">{v.ctr}% CTR</div>
                  <div className="text-[10px] text-slate-400">{v.retentionRate}% retention</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
