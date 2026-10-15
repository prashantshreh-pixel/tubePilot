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

const ChannelSummarySchema = z.object({
  healthScore: z.number().min(1).max(100),
  headline: z.string().min(5),
  whatIsWorking: z.array(z.string()).min(1),
  whatIsNotWorking: z.array(z.string()).min(1),
  strategicShiftThisWeek: z.string().min(10),
  focusMetrics: z.array(
    z.object({
      metric: z.string(),
      current: z.string(),
      target: z.string(),
      action: z.string(),
    })
  ),
});

const DailyIdeasSchema = z.object({
  date: z.string(),
  ideas: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['Short', 'Long']),
      title: z.string().min(3),
      hook: z.string().min(5),
      reason: z.string().min(5),
      targetKeyword: z.string(),
      searchIntent: z.string(),
      scriptOutline: z.array(z.string()),
      bestPostingTime: z.string(),
    })
  ).min(3),
});

const ThumbnailPromptSchema = z.object({
  imagePrompt: z.string().min(15),
  negativePrompt: z.string().optional().default('blurry, deformed, cluttered'),
  textOverlay: z.object({
    text: z.string(),
    suggestedPlacement: z.string(),
    fontColor: z.string(),
    psychologicalTrigger: z.string(),
  }),
  checklist: z.object({
    highContrast: z.boolean(),
    mobileReadable: z.boolean(),
    singleFocalPoint: z.boolean(),
    curiosityGap: z.string(),
  }),
  predictedCTRScore: z.number().min(1).max(100),
  expertCritique: z.string(),
});

const LoopPromptSchema = z.object({
  videoPrompt: z.string().min(15),
  cameraMotion: z.string(),
  lightingStyle: z.string(),
  loopTechnique: z.enum(['circular_motion', 'forward_reverse_pingpong', 'seamless_crossfade']),
  ambientAudioPrompt: z.string().optional(),
  loopRetentionTip: z.string(),
});

const UploadKitSchema = z.object({
  titles: z.array(z.string()).min(1),
  description: z.string().min(20),
  hashtags: z.array(z.string()).min(3).max(15),
  backendTags: z.array(z.string()).min(3),
  chapters: z.array(z.object({ timestamp: z.string(), title: z.string() })).optional(),
  pinnedComment: z.string(),
  endScreenSuggestion: z.string().optional(),
  onScreenTextHook: z.string().optional(),
  loopTip: z.string().optional(),
  seoScore: z.number().min(0).max(100),
  seoBreakdown: z.record(z.string()),
  whyTheseHashtags: z.string().min(10),
});

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
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    return text.trim();
  }

  /**
   * Executes prompt via text provider and validates with Zod, retrying once on failure
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
    const systemPrompt = 'You are an expert YouTube algorithm and growth strategist. Always respond with strict JSON.';

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const rawResponse = await provider.generateText(systemPrompt, userPrompt);
        const cleaned = this.cleanJson(rawResponse);
        const parsedJson = JSON.parse(cleaned);
        const validated = schema.parse(parsedJson);
        return validated;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AIService] Attempt ${attempt} failed for ${promptTemplateName}: ${err.message}`);
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

    const data = await this.executeWithZod<{ date: string; ideas: any[] }>(
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

    const matching = data.ideas.find((i) => i.type === current.type) || data.ideas[0];
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

    const promptData = await this.executeWithZod<any>(
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

    // If variation.imageUrl is data:image
    if (variation.imageUrl.startsWith('data:image')) {
      const base64Data = variation.imageUrl.replace(/^data:image\/\w+;base64,/, '');
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

    const promptData = await this.executeWithZod<any>(
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
    // 1. Get or generate source image for Ken Burns loop
    let sourceImagePath = '';
    const existingThumb = dbService.getThumbnails(loop.ideaId)[0];

    if (existingThumb?.variations?.[0]?.imageUrl) {
      const variationUrl = existingThumb.variations[existingThumb.selectedVariationIndex || 0].imageUrl;
      const tempImg = path.join(outDir, `temp_source_${loop.id}.png`);
      if (variationUrl.startsWith('data:image')) {
        const base64 = variationUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(tempImg, Buffer.from(base64, 'base64'));
      } else {
        const r = await fetch(variationUrl);
        fs.writeFileSync(tempImg, Buffer.from(await r.arrayBuffer()));
      }
      sourceImagePath = tempImg;
    } else {
      // Create quick local canvas asset
      const localImgProvider = getImageProvider({ ...settings, imageProvider: 'openai', openaiApiKey: '' });
      const [dataUrl] = await localImgProvider.generateImages(loop.prompt, {
        aspectRatio: loop.aspectRatio,
        count: 1,
      });
      const tempImg = path.join(outDir, `temp_source_${loop.id}.png`);
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(tempImg, Buffer.from(base64, 'base64'));
      sourceImagePath = tempImg;
    }

    try {
      // Render base seamless loop (e.g. 15s)
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
      }

      // Cleanup temp source image
      try { fs.unlinkSync(sourceImagePath); } catch {}

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
