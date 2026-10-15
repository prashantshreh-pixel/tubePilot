import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import {
  AppSettings,
  ChannelAnalytics,
  VideoIdea,
  ThumbnailData,
  LoopVideoData,
  UploadKitData,
} from '../../shared/types';
import { DEMO_CHANNEL_ANALYTICS, DEMO_IDEAS } from './seedData';
import { encryptSecret, decryptSecret } from '../security/keychain';

export class DatabaseService {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private dbFilePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbFilePath = customPath;
    } else {
      // Default to user data or local app folder
      const dir = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
      const baseDir = path.join(dir || '.', 'TubePilot');
      if (!fs.existsSync(baseDir)) {
        try {
          fs.mkdirSync(baseDir, { recursive: true });
        } catch {
          // fallback
        }
      }
      this.dbFilePath = path.join(baseDir, 'tubepilot.sqlite');
    }
  }

  public async initialize(): Promise<void> {
    if (this.db) return;

    this.SQL = await initSqlJs();

    let fileBuffer: Buffer | null = null;
    if (fs.existsSync(this.dbFilePath)) {
      try {
        fileBuffer = fs.readFileSync(this.dbFilePath);
      } catch (err) {
        console.warn('[Database] Could not read existing DB file:', err);
      }
    }

    if (fileBuffer && fileBuffer.length > 0) {
      this.db = new this.SQL.Database(new Uint8Array(fileBuffer));
      console.log(`[Database] Loaded existing database from ${this.dbFilePath}`);
    } else {
      this.db = new this.SQL.Database();
      console.log(`[Database] Created new SQLite database in memory.`);
    }

    this.createTables();
    this.ensureDefaultData();
    this.saveToDisk();
  }

  private createTables(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS analytics_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS content_ideas (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        hook TEXT NOT NULL,
        reason TEXT NOT NULL,
        target_keyword TEXT,
        search_intent TEXT,
        script_outline TEXT,
        best_posting_time TEXT,
        status TEXT NOT NULL,
        thumbnail_id TEXT,
        loop_video_id TEXT,
        upload_kit_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS thumbnails (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        video_title TEXT NOT NULL,
        video_type TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        text_overlay TEXT NOT NULL,
        checklist TEXT NOT NULL,
        predicted_score REAL,
        expert_critique TEXT,
        variations TEXT NOT NULL,
        selected_index INTEGER DEFAULT 0,
        exported_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loop_videos (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        video_title TEXT NOT NULL,
        video_type TEXT NOT NULL,
        aspect_ratio TEXT NOT NULL,
        prompt TEXT NOT NULL,
        camera_motion TEXT,
        lighting_style TEXT,
        loop_technique TEXT NOT NULL,
        ambient_audio_prompt TEXT,
        loop_retention_tip TEXT,
        target_duration INTEGER NOT NULL,
        video_path TEXT,
        preview_url TEXT,
        status TEXT NOT NULL,
        progress REAL DEFAULT 0,
        status_message TEXT,
        fallback_used INTEGER DEFAULT 0,
        export_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS upload_kits (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        video_title TEXT NOT NULL,
        video_type TEXT NOT NULL,
        titles TEXT NOT NULL,
        selected_title_index INTEGER DEFAULT 0,
        description TEXT NOT NULL,
        hashtags TEXT NOT NULL,
        backend_tags TEXT NOT NULL,
        chapters TEXT,
        pinned_comment TEXT,
        end_screen_suggestion TEXT,
        on_screen_text_hook TEXT,
        loop_tip TEXT,
        seo_score INTEGER DEFAULT 0,
        seo_breakdown TEXT,
        why_these_hashtags TEXT,
        uploaded INTEGER DEFAULT 0,
        youtube_video_id TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  private ensureDefaultData(): void {
    if (!this.db) return;

    // Check if settings exist
    const settingsCheck = this.db.exec(`SELECT value FROM settings WHERE key = 'app_settings'`);
    if (settingsCheck.length === 0 || settingsCheck[0].values.length === 0) {
      const defaultSettings: AppSettings = {
        textProvider: 'claude',
        imageProvider: 'openai',
        videoProvider: 'local_ffmpeg',
        isYouTubeConnected: false,
        manualMode: true,
        channelNiche: 'Tech, AI Coding & Software Development',
        channelDescription: 'Practical deep dives, tutorials, and Shorts on building AI-powered apps, developer productivity, and full-stack software.',
        targetAudience: 'Software engineers, tech enthusiasts, indie hackers, and developers',
        recentVideoTitles: [
          'I Built a SaaS with AI in 48 Hours',
          'Stop Writing CSS! Use This AI Prompt Instead',
          'The Clean Architecture Guide Nobody Showed You',
        ],
        dailyMix: { shorts: 2, long: 1 },
        theme: 'dark',
        outputDirectory: path.join(path.dirname(this.dbFilePath), 'TubePilot_Exports'),
        onboardingCompleted: false,
      };

      if (!fs.existsSync(defaultSettings.outputDirectory!)) {
        try {
          fs.mkdirSync(defaultSettings.outputDirectory!, { recursive: true });
        } catch {}
      }

      this.saveSettings(defaultSettings);
    }

    // Check if analytics cache exists
    const analyticsCheck = this.db.exec(`SELECT id FROM analytics_cache WHERE id = 'latest'`);
    if (analyticsCheck.length === 0 || analyticsCheck[0].values.length === 0) {
      this.saveAnalyticsCache(DEMO_CHANNEL_ANALYTICS);
    }

    // Check if demo ideas exist
    const ideasCheck = this.db.exec(`SELECT count(*) FROM content_ideas`);
    const count = ideasCheck[0]?.values[0]?.[0] as number;
    if (count === 0) {
      for (const idea of DEMO_IDEAS) {
        this.saveIdea(idea);
      }
    }
  }

  public saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, buffer);
    } catch (err) {
      console.error('[Database] Failed to write database to disk:', err);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToDisk();
      this.saveTimeout = null;
    }, 250);
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    if (!this.db) throw new Error('Database not initialized');
    const res = this.db.exec(`SELECT value FROM settings WHERE key = 'app_settings'`);
    if (res.length > 0 && res[0].values.length > 0) {
      const raw = JSON.parse(res[0].values[0][0] as string) as AppSettings;
      // Ensure exports folder always exists on disk
      if (raw.outputDirectory && !fs.existsSync(raw.outputDirectory)) {
        try {
          fs.mkdirSync(raw.outputDirectory, { recursive: true });
        } catch {}
      }
      // Decrypt secrets
      if (raw.anthropicApiKey) raw.anthropicApiKey = decryptSecret(raw.anthropicApiKey);
      if (raw.openaiApiKey) raw.openaiApiKey = decryptSecret(raw.openaiApiKey);
      if (raw.geminiApiKey) raw.geminiApiKey = decryptSecret(raw.geminiApiKey);
      if (raw.stabilityApiKey) raw.stabilityApiKey = decryptSecret(raw.stabilityApiKey);
      if (raw.replicateApiKey) raw.replicateApiKey = decryptSecret(raw.replicateApiKey);
      if (raw.runwayApiKey) raw.runwayApiKey = decryptSecret(raw.runwayApiKey);
      if (raw.lumaApiKey) raw.lumaApiKey = decryptSecret(raw.lumaApiKey);
      if (raw.youtubeClientSecret) raw.youtubeClientSecret = decryptSecret(raw.youtubeClientSecret);
      return raw;
    }
    throw new Error('Default settings missing');
  }

  public saveSettings(patch: Partial<AppSettings>): AppSettings {
    if (!this.db) throw new Error('Database not initialized');
    let current: Partial<AppSettings> = {};
    try {
      current = this.getSettings();
    } catch {
      current = {};
    }

    const merged = { ...current, ...patch } as AppSettings;

    // Encrypt sensitive fields before saving
    const toStore: AppSettings = {
      ...merged,
      anthropicApiKey: merged.anthropicApiKey ? encryptSecret(merged.anthropicApiKey) : undefined,
      openaiApiKey: merged.openaiApiKey ? encryptSecret(merged.openaiApiKey) : undefined,
      geminiApiKey: merged.geminiApiKey ? encryptSecret(merged.geminiApiKey) : undefined,
      stabilityApiKey: merged.stabilityApiKey ? encryptSecret(merged.stabilityApiKey) : undefined,
      replicateApiKey: merged.replicateApiKey ? encryptSecret(merged.replicateApiKey) : undefined,
      runwayApiKey: merged.runwayApiKey ? encryptSecret(merged.runwayApiKey) : undefined,
      lumaApiKey: merged.lumaApiKey ? encryptSecret(merged.lumaApiKey) : undefined,
      youtubeClientSecret: merged.youtubeClientSecret ? encryptSecret(merged.youtubeClientSecret) : undefined,
    };

    const stmt = this.db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?);`);
    stmt.run([JSON.stringify(toStore)]);
    stmt.free();

    this.scheduleSave();
    return merged;
  }

  // --- TOKEN USAGE TRACKING ---
  public addTokenUsage(tokens: number): number {
    if (!this.db || !tokens) return this.getTotalTokens();
    const current = this.getTotalTokens();
    const updated = current + Math.round(tokens);
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('total_tokens_used', ?);`);
    stmt.run([String(updated)]);
    stmt.free();
    this.scheduleSave();
    return updated;
  }

  public getTotalTokens(): number {
    if (!this.db) return 0;
    try {
      const res = this.db.exec(`SELECT value FROM settings WHERE key = 'total_tokens_used'`);
      if (res.length > 0 && res[0].values.length > 0) {
        return parseInt(res[0].values[0][0] as string, 10) || 0;
      }
    } catch {}
    return 0;
  }

  // --- ANALYTICS CACHE ---
  public getAnalyticsCache(): ChannelAnalytics | null {
    if (!this.db) return null;
    const res = this.db.exec(`SELECT data FROM analytics_cache WHERE id = 'latest'`);
    if (res.length > 0 && res[0].values.length > 0) {
      return JSON.parse(res[0].values[0][0] as string);
    }
    return null;
  }

  public saveAnalyticsCache(data: ChannelAnalytics): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`INSERT OR REPLACE INTO analytics_cache (id, data, updated_at) VALUES ('latest', ?, ?);`);
    stmt.run([JSON.stringify(data), new Date().toISOString()]);
    stmt.free();
    this.scheduleSave();
  }

  // --- CONTENT IDEAS ---
  public getIdeas(date?: string): VideoIdea[] {
    if (!this.db) return [];
    let query = `SELECT * FROM content_ideas`;
    let params: any[] = [];
    if (date) {
      query += ` WHERE date = ?`;
      params.push(date);
    }
    query += ` ORDER BY created_at DESC;`;

    const stmt = this.db.prepare(query);
    if (params.length > 0) stmt.bind(params);

    const ideas: VideoIdea[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      ideas.push({
        id: row.id,
        date: row.date,
        type: row.type,
        title: row.title,
        hook: row.hook,
        reason: row.reason,
        targetKeyword: row.target_keyword || '',
        searchIntent: row.search_intent || '',
        scriptOutline: row.script_outline ? JSON.parse(row.script_outline) : [],
        bestPostingTime: row.best_posting_time || '',
        status: row.status,
        thumbnailId: row.thumbnail_id || undefined,
        loopVideoId: row.loop_video_id || undefined,
        uploadKitId: row.upload_kit_id || undefined,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return ideas;
  }

  public getIdea(id: string): VideoIdea | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(`SELECT * FROM content_ideas WHERE id = ?`);
    stmt.bind([id]);
    let idea: VideoIdea | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      idea = {
        id: row.id,
        date: row.date,
        type: row.type,
        title: row.title,
        hook: row.hook,
        reason: row.reason,
        targetKeyword: row.target_keyword || '',
        searchIntent: row.search_intent || '',
        scriptOutline: row.script_outline ? JSON.parse(row.script_outline) : [],
        bestPostingTime: row.best_posting_time || '',
        status: row.status,
        thumbnailId: row.thumbnail_id || undefined,
        loopVideoId: row.loop_video_id || undefined,
        uploadKitId: row.upload_kit_id || undefined,
        createdAt: row.created_at,
      };
    }
    stmt.free();
    return idea;
  }

  public saveIdea(idea: VideoIdea): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO content_ideas (
        id, date, type, title, hook, reason, target_keyword, search_intent,
        script_outline, best_posting_time, status, thumbnail_id, loop_video_id,
        upload_kit_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([
      idea.id,
      idea.date,
      idea.type,
      idea.title,
      idea.hook,
      idea.reason,
      idea.targetKeyword,
      idea.searchIntent,
      JSON.stringify(idea.scriptOutline || []),
      idea.bestPostingTime,
      idea.status,
      idea.thumbnailId || null,
      idea.loopVideoId || null,
      idea.uploadKitId || null,
      idea.createdAt,
    ]);
    stmt.free();
    this.scheduleSave();
  }

  public deleteIdea(id: string): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`DELETE FROM content_ideas WHERE id = ?`);
    stmt.run([id]);
    stmt.free();
    this.scheduleSave();
  }

  // --- THUMBNAILS ---
  public getThumbnails(ideaId?: string): ThumbnailData[] {
    if (!this.db) return [];
    let query = `SELECT * FROM thumbnails`;
    let params: any[] = [];
    if (ideaId) {
      query += ` WHERE idea_id = ?`;
      params.push(ideaId);
    }
    query += ` ORDER BY created_at DESC;`;

    const stmt = this.db.prepare(query);
    if (params.length > 0) stmt.bind(params);

    const thumbnails: ThumbnailData[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      thumbnails.push({
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt || '',
        textOverlay: JSON.parse(row.text_overlay),
        checklist: JSON.parse(row.checklist),
        predictedCTRScore: row.predicted_score,
        expertCritique: row.expert_critique || '',
        variations: JSON.parse(row.variations || '[]'),
        selectedVariationIndex: row.selected_index,
        exportedFilePath: row.exported_path || undefined,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return thumbnails;
  }

  public getThumbnail(id: string): ThumbnailData | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(`SELECT * FROM thumbnails WHERE id = ?`);
    stmt.bind([id]);
    let thumb: ThumbnailData | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      thumb = {
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt || '',
        textOverlay: JSON.parse(row.text_overlay),
        checklist: JSON.parse(row.checklist),
        predictedCTRScore: row.predicted_score,
        expertCritique: row.expert_critique || '',
        variations: JSON.parse(row.variations || '[]'),
        selectedVariationIndex: row.selected_index,
        exportedFilePath: row.exported_path || undefined,
        createdAt: row.created_at,
      };
    }
    stmt.free();
    return thumb;
  }

  public saveThumbnail(t: ThumbnailData): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO thumbnails (
        id, idea_id, video_title, video_type, prompt, negative_prompt,
        text_overlay, checklist, predicted_score, expert_critique,
        variations, selected_index, exported_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([
      t.id,
      t.ideaId,
      t.videoTitle,
      t.videoType,
      t.prompt,
      t.negativePrompt || '',
      JSON.stringify(t.textOverlay),
      JSON.stringify(t.checklist),
      t.predictedCTRScore,
      t.expertCritique,
      JSON.stringify(t.variations),
      t.selectedVariationIndex,
      t.exportedFilePath || null,
      t.createdAt,
    ]);
    stmt.free();

    // Link back to idea
    if (t.ideaId) {
      const updateIdea = this.db.prepare(`UPDATE content_ideas SET thumbnail_id = ?, status = 'generated' WHERE id = ?`);
      updateIdea.run([t.id, t.ideaId]);
      updateIdea.free();
    }

    this.scheduleSave();
  }

  // --- LOOP VIDEOS ---
  public getLoopVideos(ideaId?: string): LoopVideoData[] {
    if (!this.db) return [];
    let query = `SELECT * FROM loop_videos`;
    let params: any[] = [];
    if (ideaId) {
      query += ` WHERE idea_id = ?`;
      params.push(ideaId);
    }
    query += ` ORDER BY created_at DESC;`;

    const stmt = this.db.prepare(query);
    if (params.length > 0) stmt.bind(params);

    const list: LoopVideoData[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      list.push({
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        aspectRatio: row.aspect_ratio,
        prompt: row.prompt,
        cameraMotion: row.camera_motion || '',
        lightingStyle: row.lighting_style || '',
        loopTechnique: row.loop_technique,
        ambientAudioPrompt: row.ambient_audio_prompt || undefined,
        loopRetentionTip: row.loop_retention_tip || '',
        targetDurationSeconds: row.target_duration,
        videoPath: row.video_path || undefined,
        previewUrl: row.preview_url || undefined,
        status: row.status,
        progress: row.progress,
        statusMessage: row.status_message || undefined,
        fallbackUsed: Boolean(row.fallback_used),
        exportPath: row.export_path || undefined,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return list;
  }

  public getLoopVideo(id: string): LoopVideoData | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(`SELECT * FROM loop_videos WHERE id = ?`);
    stmt.bind([id]);
    let item: LoopVideoData | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      item = {
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        aspectRatio: row.aspect_ratio,
        prompt: row.prompt,
        cameraMotion: row.camera_motion || '',
        lightingStyle: row.lighting_style || '',
        loopTechnique: row.loop_technique,
        ambientAudioPrompt: row.ambient_audio_prompt || undefined,
        loopRetentionTip: row.loop_retention_tip || '',
        targetDurationSeconds: row.target_duration,
        videoPath: row.video_path || undefined,
        previewUrl: row.preview_url || undefined,
        status: row.status,
        progress: row.progress,
        statusMessage: row.status_message || undefined,
        fallbackUsed: Boolean(row.fallback_used),
        exportPath: row.export_path || undefined,
        createdAt: row.created_at,
      };
    }
    stmt.free();
    return item;
  }

  public saveLoopVideo(v: LoopVideoData): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO loop_videos (
        id, idea_id, video_title, video_type, aspect_ratio, prompt,
        camera_motion, lighting_style, loop_technique, ambient_audio_prompt,
        loop_retention_tip, target_duration, video_path, preview_url,
        status, progress, status_message, fallback_used, export_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([
      v.id,
      v.ideaId,
      v.videoTitle,
      v.videoType,
      v.aspectRatio,
      v.prompt,
      v.cameraMotion || '',
      v.lightingStyle || '',
      v.loopTechnique,
      v.ambientAudioPrompt || null,
      v.loopRetentionTip || '',
      v.targetDurationSeconds,
      v.videoPath || null,
      v.previewUrl || null,
      v.status,
      v.progress,
      v.statusMessage || null,
      v.fallbackUsed ? 1 : 0,
      v.exportPath || null,
      v.createdAt,
    ]);
    stmt.free();

    // Link back to idea
    if (v.ideaId) {
      const updateIdea = this.db.prepare(`UPDATE content_ideas SET loop_video_id = ?, status = 'generated' WHERE id = ?`);
      updateIdea.run([v.id, v.ideaId]);
      updateIdea.free();
    }

    this.scheduleSave();
  }

  // --- UPLOAD KITS ---
  public getUploadKits(ideaId?: string): UploadKitData[] {
    if (!this.db) return [];
    let query = `SELECT * FROM upload_kits`;
    let params: any[] = [];
    if (ideaId) {
      query += ` WHERE idea_id = ?`;
      params.push(ideaId);
    }
    query += ` ORDER BY created_at DESC;`;

    const stmt = this.db.prepare(query);
    if (params.length > 0) stmt.bind(params);

    const kits: UploadKitData[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      kits.push({
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        titles: JSON.parse(row.titles),
        selectedTitleIndex: row.selected_title_index,
        description: row.description,
        hashtags: JSON.parse(row.hashtags),
        backendTags: JSON.parse(row.backend_tags),
        chapters: row.chapters ? JSON.parse(row.chapters) : undefined,
        pinnedComment: row.pinned_comment || '',
        endScreenSuggestion: row.end_screen_suggestion || undefined,
        onScreenTextHook: row.on_screen_text_hook || undefined,
        loopTip: row.loop_tip || undefined,
        seoScore: row.seo_score,
        seoBreakdown: row.seo_breakdown ? JSON.parse(row.seo_breakdown) : {},
        whyTheseHashtags: row.why_these_hashtags || '',
        uploadedToYouTube: Boolean(row.uploaded),
        youtubeVideoId: row.youtube_video_id || undefined,
        createdAt: row.created_at,
      });
    }
    stmt.free();
    return kits;
  }

  public getUploadKit(id: string): UploadKitData | null {
    if (!this.db) return null;
    const stmt = this.db.prepare(`SELECT * FROM upload_kits WHERE id = ?`);
    stmt.bind([id]);
    let kit: UploadKitData | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      kit = {
        id: row.id,
        ideaId: row.idea_id,
        videoTitle: row.video_title,
        videoType: row.video_type,
        titles: JSON.parse(row.titles),
        selectedTitleIndex: row.selected_title_index,
        description: row.description,
        hashtags: JSON.parse(row.hashtags),
        backendTags: JSON.parse(row.backend_tags),
        chapters: row.chapters ? JSON.parse(row.chapters) : undefined,
        pinnedComment: row.pinned_comment || '',
        endScreenSuggestion: row.end_screen_suggestion || undefined,
        onScreenTextHook: row.on_screen_text_hook || undefined,
        loopTip: row.loop_tip || undefined,
        seoScore: row.seo_score,
        seoBreakdown: row.seo_breakdown ? JSON.parse(row.seo_breakdown) : {},
        whyTheseHashtags: row.why_these_hashtags || '',
        uploadedToYouTube: Boolean(row.uploaded),
        youtubeVideoId: row.youtube_video_id || undefined,
        createdAt: row.created_at,
      };
    }
    stmt.free();
    return kit;
  }

  public saveUploadKit(k: UploadKitData): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO upload_kits (
        id, idea_id, video_title, video_type, titles, selected_title_index,
        description, hashtags, backend_tags, chapters, pinned_comment,
        end_screen_suggestion, on_screen_text_hook, loop_tip, seo_score,
        seo_breakdown, why_these_hashtags, uploaded, youtube_video_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([
      k.id,
      k.ideaId,
      k.videoTitle,
      k.videoType,
      JSON.stringify(k.titles),
      k.selectedTitleIndex,
      k.description,
      JSON.stringify(k.hashtags),
      JSON.stringify(k.backendTags),
      k.chapters ? JSON.stringify(k.chapters) : null,
      k.pinnedComment || '',
      k.endScreenSuggestion || null,
      k.onScreenTextHook || null,
      k.loopTip || null,
      k.seoScore,
      JSON.stringify(k.seoBreakdown || {}),
      k.whyTheseHashtags || '',
      k.uploadedToYouTube ? 1 : 0,
      k.youtubeVideoId || null,
      k.createdAt,
    ]);
    stmt.free();

    // Link back to idea
    if (k.ideaId) {
      const updateIdea = this.db.prepare(`UPDATE content_ideas SET upload_kit_id = ? WHERE id = ?`);
      updateIdea.run([k.id, k.ideaId]);
      updateIdea.free();
    }

    this.scheduleSave();
  }

  // --- LIBRARY CONSOLIDATION ---
  public getLibraryItems(): {
    ideas: VideoIdea[];
    thumbnails: ThumbnailData[];
    loopVideos: LoopVideoData[];
    uploadKits: UploadKitData[];
  } {
    return {
      ideas: this.getIdeas(),
      thumbnails: this.getThumbnails(),
      loopVideos: this.getLoopVideos(),
      uploadKits: this.getUploadKits(),
    };
  }
}

// Singleton database instance
export const dbService = new DatabaseService();
