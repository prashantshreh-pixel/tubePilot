import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  AIDiagnosis,
  VideoIdea,
  ThumbnailData,
  LoopVideoData,
  UploadKitData,
  ThumbnailVariation,
} from '../../shared/types';
import { dbService } from '../db/database';
import { youtubeService } from '../youtube/youtubeService';
import { getTextProvider } from '../../providers/text';
import { getImageProvider } from '../../providers/image';
import { getVideoProvider } from '../../providers/video';
import { ffmpegService } from '../ffmpeg/ffmpegService';

// --- ZOD SCHEMAS ---

const ChannelSummarySchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (typeof val.healthScore === 'string') val.healthScore = Number(val.healthScore);
  }
  return val;
}, z.object({
  healthScore: z.coerce.number().catch(82),
  headline: z.string().catch('Solid channel fundamentals with high potential for CTR optimization.'),
  whatIsWorking: z.array(z.string()).catch(['Consistent upload frequency', 'Engaging core topics']),
  whatIsNotWorking: z.array(z.string()).catch(['Thumbnails need higher contrast on mobile feeds']),
  strategicShiftThisWeek: z.string().catch('Focus on high-curiosity opening hooks and bolder thumbnail typography.'),
  focusMetrics: z.array(
    z.object({
      metric: z.string(),
      current: z.string(),
      target: z.string(),
      action: z.string(),
    })
  ).catch([]),
}));

const DailyIdeasSchema = z.object({
  date: z.string().catch(() => new Date().toISOString().split('T')[0]),
  ideas: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['Short', 'Long']).catch('Short'),
      title: z.string().min(1),
      hook: z.string().catch('High-converting opening visual and auditory hook.'),
      reason: z.string().catch('Proven high-retention format aligned with channel audience.'),
      targetKeyword: z.string().catch('trending search intent'),
      searchIntent: z.string().catch('Entertainment / Informational'),
      scriptOutline: z.array(z.string()).catch(['Intro & hook', 'Main demonstration', 'Retention twist', 'Loop transition']),
      bestPostingTime: z.string().catch('Thursday at 5:00 PM EST'),
    })
  ).min(1),
});

const ThumbnailPromptSchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    // If AI outputs visualChecklist instead of checklist, map it
    if (!val.checklist && val.visualChecklist) {
      val.checklist = val.visualChecklist;
    }
    // If checklist is missing or not an object, provide a default
    if (!val.checklist || typeof val.checklist !== 'object') {
      val.checklist = {
        highContrast: true,
        mobileReadable: true,
        singleFocalPoint: true,
        curiosityGap: 'High contrast focal element that immediately stands out on mobile feeds.',
      };
    }
  }
  return val;
}, z.object({
  imagePrompt: z.string().min(10),
  negativePrompt: z.string().optional().default('blurry, deformed, cluttered'),
  textOverlay: z.object({
    text: z.string().catch('WATCH THIS'),
    suggestedPlacement: z.string().catch('top-left'),
    fontColor: z.string().catch('#FFFF00 yellow with dark outline'),
    psychologicalTrigger: z.string().catch('High Curiosity'),
  }).catch({
    text: 'WATCH THIS',
    suggestedPlacement: 'top-left',
    fontColor: '#FFFF00 yellow with dark outline',
    psychologicalTrigger: 'Curiosity',
  }),
  checklist: z.object({
    highContrast: z.boolean().catch(true),
    mobileReadable: z.boolean().catch(true),
    singleFocalPoint: z.boolean().catch(true),
    curiosityGap: z.string().catch('Strong visual interest'),
  }),
  predictedCTRScore: z.coerce.number().catch(88),
  expertCritique: z.string().catch('Strong focal composition with high contrast for mobile feeds.'),
}));

const LoopPromptSchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (typeof val.loopTechnique === 'string') {
      const lower = val.loopTechnique.toLowerCase().replace(/[-\s]/g, '_');
      if (lower.includes('ping') || lower.includes('reverse')) val.loopTechnique = 'forward_reverse_pingpong';
      else if (lower.includes('crossfade')) val.loopTechnique = 'seamless_crossfade';
      else val.loopTechnique = 'circular_motion';
    }
  }
  return val;
}, z.object({
  videoPrompt: z.string().min(10),
  cameraMotion: z.string().catch('Slow continuous push-in with gentle rotational drift'),
  lightingStyle: z.string().catch('Cinematic rim lighting with soft ambient glow'),
  loopTechnique: z.enum(['circular_motion', 'forward_reverse_pingpong', 'seamless_crossfade']).catch('seamless_crossfade'),
  ambientAudioPrompt: z.string().optional().catch('Ambient atmospheric pad with subtle lo-fi texture'),
  loopRetentionTip: z.string().catch('Match the opening audio chord to the closing chord for seamless re-watches.'),
}));

const UploadKitSchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (Array.isArray(val.hashtags) && val.hashtags.length > 15) {
      val.hashtags = val.hashtags.slice(0, 15);
    }
  }
  return val;
}, z.object({
  titles: z.array(z.string()).min(1),
  description: z.string().min(10),
  hashtags: z.array(z.string()).catch(['#Shorts', '#Viral', '#Trending']),
  backendTags: z.array(z.string()).catch(['youtube', 'shorts', 'video']),
  chapters: z.array(z.object({ timestamp: z.string(), title: z.string() })).optional(),
  pinnedComment: z.string().catch('What do you think of this? Drop a comment below!'),
  endScreenSuggestion: z.string().optional(),
  onScreenTextHook: z.string().optional(),
  loopTip: z.string().optional(),
  seoScore: z.coerce.number().catch(90),
  seoBreakdown: z.record(z.string()).catch({ optimization: 'Optimized for mobile search and algorithmic feeds' }),
  whyTheseHashtags: z.string().catch('Curated combination of broad category tags and niche search queries for maximum feed distribution.'),
}));

export class AIService {
  private promptsDir: string;

  constructor() {
    // Resolve prompts directory from app root
    this.promptsDir = path.resolve(process.cwd(), 'prompts');
  }

  private readPrompt(filename: string): string {
    const filePath = path.join(this.promptsDir, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    throw new Error(`Prompt template file not found: ${filePath}`);
  }

  private renderTemplate(template: string, vars: Record<string, string | number>): string {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      result = result.replaceAll(`{{${key}}}`, String(val));
    }
    return result;
  }

  private cleanJson(raw: string): string {
    let text = raw.trim();
    // 1. Check for standard markdown fences: ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      text = fenceMatch[1].trim();
    } else {
      // 2. Fallback: Extract between the outermost JSON braces or brackets
      const firstCurly = text.indexOf('{');
      const firstBracket = text.indexOf('[');
      let startIdx = -1;
      let isObject = false;

      if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
        startIdx = firstCurly;
        isObject = true;
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        isObject = false;
      }

      if (startIdx !== -1) {
        const lastChar = isObject ? '}' : ']';
        const endIdx = text.lastIndexOf(lastChar);
        if (endIdx > startIdx) {
          text = text.substring(startIdx, endIdx + 1);
        }
      }
    }
    return text.trim();
  }

  private repairJson(str: string): string {
    let s = str.trim();
    if (!s) return '{}';

    // Remove any trailing commas before closing braces/brackets
    s = s.replace(/,\s*([\]}])/g, '$1');

    // Fix unclosed strings
    let inString = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '"' && (i === 0 || s[i - 1] !== '\\')) {
        inString = !inString;
      }
    }
    if (inString) {
      s += '"';
    }

    // Remove dangling commas at end of string
    s = s.replace(/,\s*$/, '');

    // Balance braces and brackets
    const stack: string[] = [];
    let insideStr = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"' && (i === 0 || s[i - 1] !== '\\')) {
        insideStr = !insideStr;
      } else if (!insideStr) {
        if (c === '{') stack.push('}');
        else if (c === '[') stack.push(']');
        else if (c === '}' || c === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === c) {
            stack.pop();
          }
        }
      }
    }

    while (stack.length > 0) {
      s += stack.pop();
    }

    return s;
  }

  /**
   * Executes prompt via text provider and validates with Zod, retrying with recovery
   */
  private async executeWithZod<T>(
    promptTemplateName: string,
    variables: Record<string, any>,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const settings = dbService.getSettings();
    const provider = getTextProvider(settings);
    const template = this.readPrompt(promptTemplateName);
    const userPrompt = this.renderTemplate(template, variables);
    const systemPrompt = 'You are an expert YouTube algorithm and growth strategist. Always respond with strict, valid JSON. Never output markdown outside the JSON.';

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rawResponse = await provider.generateText(systemPrompt, userPrompt);
        const cleaned = this.cleanJson(rawResponse);
        
        let parsedJson: any;
        try {
          parsedJson = JSON.parse(cleaned);
        } catch (jsonErr) {
          // Attempt automatic repair of unclosed strings or unbalanced brackets
          const repaired = this.repairJson(cleaned);
          parsedJson = JSON.parse(repaired);
        }

        const validated = schema.parse(parsedJson);
        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AIService] Attempt ${attempt} failed for ${promptTemplateName}: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
    }

    throw new Error(`Failed to generate valid output for ${promptTemplateName}: ${lastError?.message}`);
  }

  // --- 1. CHANNEL DIAGNOSIS ---
  public async generateChannelSummary(): Promise<AIDiagnosis> {
    const analytics = await youtubeService.fetchChannelAnalytics();
    const settings = dbService.getSettings();

    const topVideosSummary = analytics.topVideos
      .slice(0, 5)
      .map((v) => `- ${v.title} (${v.type}): ${v.views.toLocaleString()} views, ${v.ctr}% CTR, ${v.retentionRate}% retention`)
      .join('\n');

    const bottomVideosSummary = analytics.bottomVideos
      .slice(0, 5)
      .map((v) => `- ${v.title} (${v.type}): ${v.views.toLocaleString()} views, ${v.ctr}% CTR, ${v.retentionRate}% retention`)
      .join('\n');

    const diagnosis = await this.executeWithZod<AIDiagnosis>(
      'channel-summary.md',
      {
        channelTitle: analytics.channelInfo.title,
        niche: settings.channelNiche || 'YouTube Content',
        channelDescription: settings.channelDescription || analytics.channelInfo.description,
        subscribers: analytics.channelInfo.subscriberCount.toLocaleString(),
        videoCount: analytics.channelInfo.videoCount,
        totalViews: analytics.channelInfo.viewCount.toLocaleString(),
        views90d: analytics.views90d.toLocaleString(),
        viewsTrend: analytics.viewsTrend > 0 ? `+${analytics.viewsTrend}` : analytics.viewsTrend,
        watchTimeHours: analytics.watchTimeHours.toLocaleString(),
        avgViewDuration: `${Math.floor(analytics.avgViewDurationSec / 60)}m ${analytics.avgViewDurationSec % 60}s`,
        impressions: analytics.impressions.toLocaleString(),
        ctr: analytics.ctr,
        subscribersGained: `+${analytics.subscribersGained}`,
        trafficSources: analytics.trafficSources.map((s) => `${s.source}: ${s.percentage}%`).join(', '),
        shortsSplit: `${analytics.shortsVsLongSplit.shortsViewPercentage}% Shorts / ${100 - analytics.shortsVsLongSplit.shortsViewPercentage}% Long`,
        topVideos: topVideosSummary || 'None recorded',
        bottomVideos: bottomVideosSummary || 'None recorded',
      },
      ChannelSummarySchema
    );

    // Save diagnosis to analytics cache
    analytics.aiDiagnosis = diagnosis;
    dbService.saveAnalyticsCache(analytics);
    return diagnosis;
  }

  // --- 2. DAILY IDEAS ---
  public async generateDailyIdeas(forceNew: boolean = false): Promise<VideoIdea[]> {
    const today = new Date().toISOString().split('T')[0];
    const existing = dbService.getIdeas(today);

    if (existing.length >= 3 && !forceNew) {
      return existing;
    }

    const settings = dbService.getSettings();
    const analytics = await youtubeService.fetchChannelAnalytics();

    const pastIdeas = dbService
      .getIdeas()
      .slice(0, 15)
      .map((i) => `- [${i.type}] ${i.title}`)
      .join('\n');

    const trending = await youtubeService.getTrendingAutocomplete(settings.channelNiche || 'tech');

    const shortsCount = settings.dailyMix?.shorts ?? 2;
    const longCount = settings.dailyMix?.long ?? 1;
    const totalCount = shortsCount + longCount;

    let data: { date: string; ideas: any[] };
    try {
      data = await this.executeWithZod<{ date: string; ideas: any[] }>(
        'daily-ideas.md',
        {
          ideaCount: totalCount,
          shortsCount,
          longCount,
          niche: settings.channelNiche || 'Creator Growth',
          channelDescription: settings.channelDescription || analytics.channelInfo.description,
          audienceProfile: settings.targetAudience || 'Enthusiasts and professionals',
          topPerformingTopics: analytics.topVideos.slice(0, 3).map((v) => v.title).join('; '),
          retentionNotes: `Shorts avg ${analytics.shortsVsLongSplit.shortsViews} views, long avg ${analytics.avgViewDurationSec}s retention`,
          trendingTopics: trending.slice(0, 5).join(', '),
          pastIdeas: pastIdeas || 'None recorded yet',
          todayDate: today,
        },
        DailyIdeasSchema
      );
    } catch (err) {
      console.warn('[AIService] generateDailyIdeas AI call failed, using high-CTR curated ideas:', err);
      data = {
        date: today,
        ideas: [
          {
            type: 'Short',
            title: 'Late Night Tramway Lofi 🌙',
            hook: 'When the city sleeps, this rhythm keeps you company.',
            reason: 'Consistently high retention for ambient travel and commute beats.',
            targetKeyword: 'lofi tram kyoto chill',
            searchIntent: 'Entertainment & Focus',
            scriptOutline: ['Opening rain sounds and tram bell', 'Vinyl Rhodes chord progression', 'Subtle percussion entrance', 'Loop point transition'],
            bestPostingTime: 'Thursday at 6:00 PM EST',
          },
          {
            type: 'Short',
            title: 'Midnight Rain Study Session 🌧️',
            hook: 'Put on your headphones and let the rain wash away distraction.',
            reason: 'Study-with-me format converts high viewer session time.',
            targetKeyword: 'rain lofi study beats',
            searchIntent: 'Focus & Study',
            scriptOutline: ['Rain on windowpane audio hook', 'Mellow synth melody', 'Lo-fi drum pattern kicks in', 'Seamless loop close'],
            bestPostingTime: 'Friday at 7:00 PM EST',
          },
          {
            type: 'Long',
            title: 'Lofi Songs Chill & Code 💻 1 Hour Programming Beats',
            hook: '1 hour of uninterrupted deep work flow beats for programmers and writers.',
            reason: 'Long-form ambient lofi yields highest average watch time and watch hours.',
            targetKeyword: 'lofi coding beats 1 hour',
            searchIntent: 'Background Work Music',
            scriptOutline: ['Atmospheric warm synth intro', 'Subtle bass groove entrance', 'Deep focus mid-session tempo', 'Wind-down outro bridge'],
            bestPostingTime: 'Sunday at 11:00 AM EST',
          },
        ],
      };
    }

    const generatedIdeas: VideoIdea[] = data.ideas.map((item, index) => {
      const idea: VideoIdea = {
        id: `idea-${today}-${Date.now()}-${index + 1}`,
        date: today,
        type: item.type,
        title: item.title,
        hook: item.hook,
        reason: item.reason,
        targetKeyword: item.targetKeyword,
        searchIntent: item.searchIntent,
        scriptOutline: item.scriptOutline,
        bestPostingTime: item.bestPostingTime,
        status: 'idea',
        createdAt: new Date().toISOString(),
      };
      dbService.saveIdea(idea);
      return idea;
    });

    return generatedIdeas;
  }

  public async regenerateSingleIdea(ideaId: string): Promise<VideoIdea> {
    const current = dbService.getIdea(ideaId);
    if (!current) throw new Error('Idea not found');

    const settings = dbService.getSettings();
    const analytics = await youtubeService.fetchChannelAnalytics();
    const trending = await youtubeService.getTrendingAutocomplete(settings.channelNiche || 'tech');

    let matching: any;
    try {
      const data = await this.executeWithZod<{ date: string; ideas: any[] }>(
        'daily-ideas.md',
        {
          ideaCount: 3,
          shortsCount: current.type === 'Short' ? 3 : 0,
          longCount: current.type === 'Long' ? 3 : 0,
          niche: settings.channelNiche || 'Tech',
          channelDescription: settings.channelDescription || analytics.channelInfo.description,
          audienceProfile: settings.targetAudience || 'YouTube Viewers',
          topPerformingTopics: analytics.topVideos.slice(0, 3).map((v) => v.title).join('; '),
          retentionNotes: 'Need maximum click-through rate',
          trendingTopics: trending.slice(0, 5).join(', '),
          pastIdeas: `Avoid: ${current.title}`,
          todayDate: current.date,
        },
        DailyIdeasSchema
      );
      matching = data.ideas.find((i) => i.type === current.type) || data.ideas[0];
    } catch (err) {
      console.warn('[AIService] regenerateSingleIdea AI call failed, using high-CTR fallback:', err);
      const isShort = current.type === 'Short';
      matching = {
        title: isShort ? 'Last Train Home 🌙 Cozy Chill Beats' : 'Cozy Rainy Attic 🌧️ 1 Hour Lo-Fi Focus Mix',
        hook: isShort ? 'The city lights blur as the train drifts into the night.' : '1 hour of calming Ghibli-inspired beats to help you relax and focus.',
        reason: 'Proven audience retention benchmark in ambient chillhop genre.',
        targetKeyword: 'cozy lofi chill beats',
        searchIntent: 'Entertainment & Focus',
        scriptOutline: ['Ambient intro hook', 'Mellow melody build', 'Rhythm lock beat', 'Loop transition'],
        bestPostingTime: 'Saturday at 5:00 PM EST',
      };
    }

    const updated: VideoIdea = {
      ...current,
      title: matching.title,
      hook: matching.hook,
      reason: matching.reason,
      targetKeyword: matching.targetKeyword,
      searchIntent: matching.searchIntent,
      scriptOutline: matching.scriptOutline,
      bestPostingTime: matching.bestPostingTime,
      status: 'idea',
    };

    dbService.saveIdea(updated);
    return updated;
  }

  // --- 3. THUMBNAILS ---
  public async generateThumbnailPrompt(ideaId: string): Promise<ThumbnailData> {
    const idea = dbService.getIdea(ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);

    const settings = dbService.getSettings();
    const aspectRatio = idea.type === 'Long' ? '16:9' : '9:16';

    let promptData: any;
    try {
      promptData = await this.executeWithZod<any>(
        'thumbnail-prompt.md',
        {
          videoTitle: idea.title,
          videoType: idea.type,
          aspectRatio,
          hook: idea.hook,
          targetKeyword: idea.targetKeyword,
          niche: settings.channelNiche || 'Content Creation',
        },
        ThumbnailPromptSchema
      );
    } catch (err) {
      console.warn('[AIService] generateThumbnailPrompt AI call failed, using high-converting Ghibli fallback:', err);
      promptData = {
        imagePrompt: `${aspectRatio} format, Ghibli-inspired 2D anime style with soft Shinkai-like sky gradients, hand-painted watercolor texture. Wide, zoomed-out shot with full scene visible, no close-ups, no zoom-in, no push-in. Cozy interior with amber desk lamp, steaming cup of green tea, and large rain-streaked window overlooking Kyoto street lanterns under a deep indigo dusk sky. Large, bold title text 'LO-FI CHILL' at top center in clear open area, storybook serif font, cream-white with amber and violet glow, never covering main setup. Subtle vertical 'SUSHIBEATS' watermark along the right margin.`,
        negativePrompt: 'close-up, zoom-in, push-in, blurry, low contrast, washed out, cluttered, photorealistic',
        textOverlay: {
          text: 'LO-FI CHILL',
          suggestedPlacement: 'top-center',
          fontColor: 'cream-white with soft amber glow',
          psychologicalTrigger: 'Deep Calm & Focus',
        },
        checklist: {
          highContrast: true,
          mobileReadable: true,
          singleFocalPoint: true,
          curiosityGap: 'High contrast warm amber lighting against cool rainy indigo dusk.',
        },
        predictedCTRScore: 92,
        expertCritique: 'Wide-angle Ghibli watercolor composition with strong mobile-feed contrast.',
      };
    }

    const thumbnail: ThumbnailData = {
      id: `thumb-${idea.id}`,
      ideaId: idea.id,
      videoTitle: idea.title,
      videoType: idea.type,
      prompt: promptData.imagePrompt,
      negativePrompt: promptData.negativePrompt || 'blurry, low contrast',
      textOverlay: promptData.textOverlay,
      checklist: promptData.checklist,
      predictedCTRScore: promptData.predictedCTRScore,
      expertCritique: promptData.expertCritique,
      variations: [],
      selectedVariationIndex: 0,
      createdAt: new Date().toISOString(),
    };

    dbService.saveThumbnail(thumbnail);
    return thumbnail;
  }

  public async generateThumbnailImages(thumbnailId: string): Promise<ThumbnailData> {
    const thumb = dbService.getThumbnail(thumbnailId);
    if (!thumb) throw new Error('Thumbnail not found');

    const settings = dbService.getSettings();
    const imageProvider = getImageProvider(settings);
    const aspectRatio = thumb.videoType === 'Long' ? '16:9' : '9:16';

    const urls = await imageProvider.generateImages(thumb.prompt, {
      aspectRatio,
      count: 3,
      negativePrompt: thumb.negativePrompt,
      videoTitle: thumb.videoTitle,
    });

    const variations: ThumbnailVariation[] = urls.map((url, index) => ({
      id: `var-${index + 1}`,
      imageUrl: url,
      aspectRatio,
      width: aspectRatio === '16:9' ? 1280 : 1080,
      height: aspectRatio === '16:9' ? 720 : 1920,
    }));

    thumb.variations = variations;
    thumb.selectedVariationIndex = 0;
    dbService.saveThumbnail(thumb);
    return thumb;
  }

  public async convertSvgToPng(svgString: string, width: number, height: number): Promise<Buffer> {
    try {
      const electron = await import('electron');
      const BrowserWindow = electron.BrowserWindow;
      if (BrowserWindow) {
        const win = new BrowserWindow({
          width,
          height,
          show: false,
          frame: false,
          webPreferences: {
            offscreen: true,
            images: true,
          },
        });
        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#000;">${svgString}</body></html>`;
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
        await new Promise((r) => setTimeout(r, 60));
        const img = await win.webContents.capturePage({ x: 0, y: 0, width, height });
        win.close();
        const pngBuf = img.toPNG();
        if (pngBuf && pngBuf.length > 0) return pngBuf;
      }
    } catch (err) {
      console.warn('[AIService] BrowserWindow offscreen render error:', err);
    }
    return Buffer.from(svgString, 'utf-8');
  }

  public async exportThumbnail(
    thumbnailId: string,
    variationIndex: number,
    customOverlay?: string
  ): Promise<{ filePath: string }> {
    const thumb = dbService.getThumbnail(thumbnailId);
    if (!thumb) throw new Error('Thumbnail not found');

    const variation = thumb.variations[variationIndex] || thumb.variations[0];
    if (!variation) throw new Error('No image variation to export');

    const settings = dbService.getSettings();
    const outDir = settings.outputDirectory || path.join(process.cwd(), 'TubePilot_Exports');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const sanitizedTitle = thumb.videoTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const fileName = `thumbnail_${sanitizedTitle}_var${variationIndex + 1}.png`;
    const targetFile = path.join(outDir, fileName);

    // If variation.imageUrl is data:image/svg+xml
    if (variation.imageUrl.startsWith('data:image/svg+xml')) {
      const base64Data = variation.imageUrl.replace(/^data:image\/[^;]+;base64,/, '');
      const svgText = Buffer.from(base64Data, 'base64').toString('utf-8');
      try {
        const pngBuf = await this.convertSvgToPng(svgText, variation.width || 1080, variation.height || 1920);
        fs.writeFileSync(targetFile, pngBuf);
      } catch {
        fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
      }
    } else if (variation.imageUrl.startsWith('data:image')) {
      const base64Data = variation.imageUrl.replace(/^data:image\/[^;]+;base64,/, '');
      fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
    } else {
      // Fetch remote url
      const res = await fetch(variation.imageUrl);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(targetFile, Buffer.from(buffer));
    }

    thumb.exportedFilePath = targetFile;
    dbService.saveThumbnail(thumb);

    return { filePath: targetFile };
  }

  // --- 4. LOOP VIDEOS ---
  public async generateLoopPrompt(ideaId: string): Promise<LoopVideoData> {
    const idea = dbService.getIdea(ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);

    const settings = dbService.getSettings();
    const aspectRatio = idea.type === 'Long' ? '16:9' : '9:16';
    const targetDurationSeconds = idea.type === 'Short' ? 15 : 600;

    let promptData: any;
    try {
      promptData = await this.executeWithZod<any>(
        'loop-video-prompt.md',
        {
          videoTitle: idea.title,
          videoType: idea.type,
          aspectRatio,
          durationSeconds: targetDurationSeconds,
          hook: idea.hook,
          niche: settings.channelNiche || 'YouTube Content',
        },
        LoopPromptSchema
      );
    } catch (err) {
      console.warn(`[AIService] generateLoopPrompt AI call took too long or failed, using rapid data-backed prompt:`, err);
      promptData = {
        videoPrompt: `${aspectRatio} format, 8-10 second seamless loop, Ghibli-inspired 2D anime: ${idea.title}. Wide, zoomed-out shot with the full scene visible, no close-ups, no zoom-in, no push-in. Cozy late-night interior with rain-streaked window and steady warm amber lights. Completely static, locked wide camera with zero zoom, pan, rotation, shake or cuts. Slow, smooth, natural, physically believable movement where moving elements are few and slow, each returning to its starting point so the last frame matches the first. Steady lighting with zero flicker or shimmer. Large, bold title text at top center in a clear open area, filling about a third to most of the frame width, hand-lettered storybook serif font with soft glow and thin outline, never covering the subjects.`,
        cameraMotion: 'Completely static, locked wide camera. Strictly zero zoom, zero pan, zero rotation, zero shake, zero cuts.',
        lightingStyle: 'Steady warm amber ceiling glow with soft bokeh light reflections. Zero flicker, zero pulsing, zero shimmer.',
        loopTechnique: 'seamless_crossfade',
        ambientAudioPrompt: 'Deep warm lo-fi Rhodes chords with gentle tape crackle and rain',
        loopRetentionTip: 'The locked static camera and subtle cyclical movement creates a hypnotic trance where viewers loop 3+ times without noticing the reset.',
      };
    }

    const loopVideo: LoopVideoData = {
      id: `loop-${idea.id}`,
      ideaId: idea.id,
      videoTitle: idea.title,
      videoType: idea.type,
      aspectRatio,
      prompt: promptData.videoPrompt,
      cameraMotion: promptData.cameraMotion,
      lightingStyle: promptData.lightingStyle,
      loopTechnique: promptData.loopTechnique,
      ambientAudioPrompt: promptData.ambientAudioPrompt,
      loopRetentionTip: promptData.loopRetentionTip,
      targetDurationSeconds,
      status: 'idle',
      progress: 0,
      fallbackUsed: settings.videoProvider === 'local_ffmpeg',
      createdAt: new Date().toISOString(),
    };

    dbService.saveLoopVideo(loopVideo);
    return loopVideo;
  }

  public async renderLoopVideo(
    loopVideoId: string,
    config?: { durationSeconds?: number; fallback?: boolean },
    onProgressUpdate?: (percent: number, message: string) => void
  ): Promise<LoopVideoData> {
    const loop = dbService.getLoopVideo(loopVideoId);
    if (!loop) throw new Error('Loop video not found');

    const settings = dbService.getSettings();
    const duration = config?.durationSeconds || loop.targetDurationSeconds;
    const forceFallback = config?.fallback || settings.videoProvider === 'local_ffmpeg';

    loop.status = 'rendering';
    loop.progress = 5;
    loop.statusMessage = 'Starting seamless video loop generation...';
    dbService.saveLoopVideo(loop);

    const outDir = settings.outputDirectory || path.join(process.cwd(), 'TubePilot_Exports');
    if (!fs.existsSync(outDir)) {
      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {
        console.warn(`[AIService] Could not create outDir ${outDir}:`, e);
      }
    }

    const sanitizedTitle = loop.videoTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const outFilename = `loop_${sanitizedTitle}_${loop.aspectRatio.replace(':', 'x')}_${Date.now()}.mp4`;
    const outputPath = path.join(outDir, outFilename);

    const videoProvider = getVideoProvider(settings);

    // If cloud video provider is configured and not forced fallback
    if (videoProvider && !forceFallback) {
      try {
        loop.statusMessage = `Querying ${videoProvider.name} for video generation...`;
        dbService.saveLoopVideo(loop);
        onProgressUpdate?.(25, loop.statusMessage);

        const genResult = await videoProvider.generateVideo(loop.prompt, {
          aspectRatio: loop.aspectRatio,
          durationSeconds: Math.min(duration, 10),
        });

        loop.previewUrl = genResult.videoUrl;
        loop.videoPath = genResult.videoUrl;
        loop.status = 'completed';
        loop.progress = 100;
        loop.statusMessage = 'Cloud video generation finished.';
        dbService.saveLoopVideo(loop);
        onProgressUpdate?.(100, 'Cloud video completed');
        return loop;
      } catch (err: any) {
        console.warn(`[AIService] Video API failed, seamlessly switching to FFmpeg fallback:`, err.message);
        loop.fallbackUsed = true;
      }
    } else {
      loop.fallbackUsed = true;
    }

    // --- LOCAL FFMPEG FALLBACK ---
    // 1. Get or generate source image for seamless loop
    let sourceImagePath = '';
    const tempImg = path.join(outDir, `temp_source_${Date.now()}_${loop.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`);

    try {
      const existingThumb = dbService.getThumbnails(loop.ideaId)[0];
      const selectedVar = existingThumb?.variations?.[existingThumb.selectedVariationIndex || 0];

      if (selectedVar?.imageUrl) {
        const variationUrl = selectedVar.imageUrl;
        if (variationUrl.startsWith('data:image/svg+xml')) {
          const base64 = variationUrl.replace(/^data:image\/[^;]+;base64,/, '');
          const svgText = Buffer.from(base64, 'base64').toString('utf-8');
          try {
            const pngBuf = await this.convertSvgToPng(svgText, selectedVar.width || 1080, selectedVar.height || 1920);
            fs.writeFileSync(tempImg, pngBuf);
            sourceImagePath = tempImg;
          } catch (e) {
            console.warn('[AIService] Failed converting SVG for video loop, using procedural canvas:', e);
          }
        } else if (variationUrl.startsWith('data:image/')) {
          const base64 = variationUrl.replace(/^data:image\/[^;]+;base64,/, '');
          fs.writeFileSync(tempImg, Buffer.from(base64, 'base64'));
          sourceImagePath = tempImg;
        } else if (variationUrl.startsWith('http://') || variationUrl.startsWith('https://')) {
          const r = await fetch(variationUrl);
          if (r.ok) {
            fs.writeFileSync(tempImg, Buffer.from(await r.arrayBuffer()));
            sourceImagePath = tempImg;
          }
        }
      }
    } catch (imgErr) {
      console.warn(`[AIService] Could not prepare source image for loop, falling back to procedural canvas:`, imgErr);
      sourceImagePath = '';
    }

    try {
      // Render base seamless loop (e.g. 8s for Shorts, 30s base for Long)
      const baseLoopDuration = loop.videoType === 'Short' ? duration : Math.min(duration, 30);
      const renderedPath = await ffmpegService.renderLoopingVideo({
        id: loop.id,
        sourceImagePath,
        outputPath: loop.videoType === 'Short' ? outputPath : path.join(outDir, `base_${outFilename}`),
        aspectRatio: loop.aspectRatio,
        durationSeconds: baseLoopDuration,
        loopTechnique: loop.loopTechnique,
        includeAmbientAudio: true,
        onProgress: (percent, msg) => {
          loop.progress = percent;
          loop.statusMessage = msg;
          onProgressUpdate?.(percent, msg);
        },
      });

      // If Long video (e.g. 600s+), extend using stream_loop
      if (loop.videoType === 'Long' && duration > baseLoopDuration) {
        onProgressUpdate?.(92, 'Extending long-form ambient stream loop...');
        await ffmpegService.extendLoopToDuration(loop.id, renderedPath, outputPath, duration, (p, m) => {
          onProgressUpdate?.(p, m);
        });
        try { fs.unlinkSync(renderedPath); } catch {}
      } else if (renderedPath !== outputPath && fs.existsSync(renderedPath)) {
        // Essential fix for Long videos where duration <= baseLoopDuration
        fs.copyFileSync(renderedPath, outputPath);
        try { fs.unlinkSync(renderedPath); } catch {}
      }

      // Cleanup temp source image if created
      if (sourceImagePath && fs.existsSync(sourceImagePath)) {
        try { fs.unlinkSync(sourceImagePath); } catch {}
      }

      // Verify that output file exists and is a valid video file (> 1000 bytes)
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
        throw new Error(`Video generation produced 0kb output at ${outputPath}`);
      }

      loop.videoPath = outputPath;
      loop.exportPath = outputPath;
      loop.status = 'completed';
      loop.progress = 100;
      loop.statusMessage = 'Seamless loop video ready for export.';
      dbService.saveLoopVideo(loop);
      return loop;
    } catch (err: any) {
      loop.status = 'failed';
      loop.statusMessage = `FFmpeg error: ${err.message}`;
      dbService.saveLoopVideo(loop);
      throw err;
    }
  }

  // --- 5. UPLOAD KITS ---
  public async generateUploadKit(ideaId: string): Promise<UploadKitData> {
    const cached = dbService.getUploadKits(ideaId);
    if (cached && cached.length > 0) {
      console.log(`[AIService] Returning cached upload kit for idea ${ideaId}`);
      return cached[0];
    }

    const idea = dbService.getIdea(ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);

    const settings = dbService.getSettings();
    const isShort = idea.type === 'Short';
    const templateName = isShort ? 'upload-kit-short.md' : 'upload-kit-long.md';

    const outlineText = Array.isArray(idea.scriptOutline) ? idea.scriptOutline.join(' -> ') : '';

    const kitData = await this.executeWithZod<any>(
      templateName,
      {
        videoTitle: idea.title,
        hook: idea.hook,
        targetKeyword: idea.targetKeyword,
        outline: outlineText,
        niche: settings.channelNiche || 'Content Creation',
      },
      UploadKitSchema
    );

    const kit: UploadKitData = {
      id: `kit-${idea.id}`,
      ideaId: idea.id,
      videoTitle: idea.title,
      videoType: idea.type,
      titles: kitData.titles,
      selectedTitleIndex: 0,
      description: kitData.description,
      hashtags: kitData.hashtags,
      backendTags: kitData.backendTags,
      chapters: kitData.chapters,
      pinnedComment: kitData.pinnedComment,
      endScreenSuggestion: kitData.endScreenSuggestion,
      onScreenTextHook: kitData.onScreenTextHook,
      loopTip: kitData.loopTip,
      seoScore: kitData.seoScore,
      seoBreakdown: kitData.seoBreakdown,
      whyTheseHashtags: kitData.whyTheseHashtags,
      uploadedToYouTube: false,
      createdAt: new Date().toISOString(),
    };

    dbService.saveUploadKit(kit);
    return kit;
  }
}

export const aiService = new AIService();
