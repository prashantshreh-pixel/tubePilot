import { BrowserWindow, Menu, clipboard } from 'electron';
import fs from 'fs';
import path from 'path';
import { dbService } from '../db/database';
import { ThumbnailData } from '../../shared/types';

export class GeminiWebService {
  private studioWindow: BrowserWindow | null = null;
  private activeThumbnailId: string | null = null;
  private activePrompt: string = '';
  private mainWindow: BrowserWindow | null = null;

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public openStudio(params: { thumbnailId: string; prompt: string }): void {
    this.activeThumbnailId = params.thumbnailId;
    this.activePrompt = params.prompt;

    // Automatically copy prompt to user's clipboard
    clipboard.writeText(params.prompt);

    if (this.studioWindow && !this.studioWindow.isDestroyed()) {
      this.studioWindow.focus();
      this.injectBridge();
      return;
    }

    this.studioWindow = new BrowserWindow({
      width: 1220,
      height: 860,
      title: 'Gemini Web Studio — Connected Google Account (TubePilot)',
      backgroundColor: '#131314',
      webPreferences: {
        partition: 'persist:gemini_user_account', // Persists Google account session indefinitely
        contextIsolation: false,
        nodeIntegration: false,
      },
    });

    this.studioWindow.loadURL('https://gemini.google.com/app');

    this.studioWindow.webContents.on('did-finish-load', () => {
      this.injectBridge();
    });

    // Right-click context menu on any image in Gemini Web
    this.studioWindow.webContents.on('context-menu', (_, props) => {
      if (props.mediaType === 'image' && props.srcURL) {
        const menu = Menu.buildFromTemplate([
          {
            label: '📥 Send Image to TubePilot Thumbnail',
            click: async () => {
              await this.grabImageFromUrl(props.srcURL);
            },
          },
        ]);
        menu.popup();
      }
    });

    this.studioWindow.on('closed', () => {
      this.studioWindow = null;
    });
  }

  private async injectBridge(): Promise<void> {
    if (!this.studioWindow || this.studioWindow.isDestroyed()) return;

    const promptText = JSON.stringify(this.activePrompt);
    const script = `
      (function() {
        window.__tp_prompt = ${promptText};
        
        let existing = document.getElementById('tubepilot-gemini-bridge');
        if (existing) existing.remove();

        const bar = document.createElement('div');
        bar.id = 'tubepilot-gemini-bridge';
        bar.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999;background:rgba(15,23,42,0.95);border:2px solid #6366f1;border-radius:16px;padding:10px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 12px 36px rgba(0,0,0,0.7);color:white;font-family:system-ui,sans-serif;font-size:13px;backdrop-filter:blur(12px);';
        bar.innerHTML = \`
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;">✨</span>
            <span style="font-weight:700;color:#a5b4fc;letter-spacing:0.5px;">TubePilot Gemini Bridge</span>
          </div>
          <button id="tp-paste-btn" style="background:#4f46e5;color:white;border:none;padding:7px 14px;border-radius:10px;font-weight:600;cursor:pointer;font-size:12px;box-shadow:0 2px 8px rgba(79,70,229,0.4);display:flex;align-items:center;gap:6px;">
            <span>📋</span><span>Paste Lo-Fi Prompt</span>
          </button>
          <button id="tp-capture-btn" style="background:#10b981;color:white;border:none;padding:7px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-size:12px;box-shadow:0 2px 8px rgba(16,185,129,0.4);display:flex;align-items:center;gap:6px;">
            <span>📥</span><span>Grab Image into TubePilot</span>
          </button>
        \`;
        document.body.appendChild(bar);

        // Paste Prompt handler
        document.getElementById('tp-paste-btn')?.addEventListener('click', () => {
          const prompt = window.__tp_prompt || '';
          navigator.clipboard.writeText(prompt);
          
          // Try to find the Gemini prompt input
          const input = document.querySelector('rich-textarea p, textarea, [contenteditable="true"]');
          if (input) {
            input.focus();
            document.execCommand('insertText', false, prompt);
          }
        });

        // Grab Image handler
        document.getElementById('tp-capture-btn')?.addEventListener('click', () => {
          document.title = 'TUBEPILOT_TRIGGER_GRAB_' + Date.now();
        });
      })();
    `;

    try {
      await this.studioWindow.webContents.executeJavaScript(script);

      // Listen for title trigger
      this.studioWindow.on('page-title-updated', async (_, title) => {
        if (title.startsWith('TUBEPILOT_TRIGGER_GRAB_')) {
          await this.grabLatestImage();
        }
      });
    } catch (err) {
      console.warn('[GeminiWebService] Inject bridge script error:', err);
    }
  }

  public async grabLatestImage(): Promise<{ success: boolean; message: string }> {
    if (!this.studioWindow || this.studioWindow.isDestroyed()) {
      return { success: false, message: 'Gemini Web Studio window is not open.' };
    }

    try {
      // Find the latest generated image on the page and extract canvas base64
      const extractScript = `
        (function() {
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || '';
            const isLarge = (img.naturalWidth > 250 || img.width > 250);
            return isLarge && (src.includes('googleusercontent') || src.includes('blob:') || src.startsWith('data:image'));
          });

          if (imgs.length === 0) return null;
          const target = imgs[imgs.length - 1]; // Latest generated image

          try {
            const canvas = document.createElement('canvas');
            canvas.width = target.naturalWidth || target.width;
            canvas.height = target.naturalHeight || target.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(target, 0, 0);
            return {
              dataUrl: canvas.toDataURL('image/png'),
              width: canvas.width,
              height: canvas.height,
            };
          } catch(e) {
            return { src: target.src, error: e.message };
          }
        })();
      `;

      const result = await this.studioWindow.webContents.executeJavaScript(extractScript);

      if (!result) {
        return { success: false, message: 'No generated image found on Gemini Web page yet. Generate one first!' };
      }

      if (result.dataUrl) {
        await this.saveCapturedImage(result.dataUrl, result.width, result.height);
        return { success: true, message: 'Image successfully captured from Gemini Web!' };
      }

      if (result.src) {
        await this.grabImageFromUrl(result.src);
        return { success: true, message: 'Image successfully fetched from Gemini Web!' };
      }

      return { success: false, message: 'Could not extract image data from page.' };
    } catch (err: any) {
      return { success: false, message: `Error grabbing image: ${err.message}` };
    }
  }

  private async grabImageFromUrl(imageUrl: string): Promise<void> {
    try {
      const res = await fetch(imageUrl);
      const arrayBuf = await res.arrayBuffer();
      const b64 = Buffer.from(arrayBuf).toString('base64');
      const dataUrl = `data:${res.headers.get('content-type') || 'image/png'};base64,${b64}`;
      await this.saveCapturedImage(dataUrl, 1280, 720);
    } catch (err: any) {
      console.warn('[GeminiWebService] grabImageFromUrl error:', err);
    }
  }

  private async saveCapturedImage(dataUrl: string, width: number, height: number): Promise<void> {
    if (!this.activeThumbnailId) return;

    const thumb = dbService.getThumbnail(this.activeThumbnailId);
    if (!thumb) return;

    const isLandscape = thumb.videoType === 'Long';
    const settings = dbService.getSettings();
    const outDir = settings.outputDirectory || path.join(process.cwd(), 'TubePilot_Exports');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const sanitizedTitle = thumb.videoTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const fileName = `thumbnail_${sanitizedTitle}_gemini_web.png`;
    const targetFile = path.join(outDir, fileName);

    const base64Data = dataUrl.replace(/^data:image\/[^;]+;base64,/, '');
    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));

    const newVariation = {
      id: `var-gemini-web-${Date.now()}`,
      imageUrl: dataUrl,
      aspectRatio: isLandscape ? ('16:9' as const) : ('9:16' as const),
      width: width || (isLandscape ? 1280 : 1080),
      height: height || (isLandscape ? 720 : 1920),
    };

    thumb.variations = [newVariation, ...(thumb.variations || []).filter((v) => !v.id.startsWith('var-gemini-web-'))];
    thumb.selectedVariationIndex = 0;
    thumb.exportedFilePath = targetFile;

    dbService.saveThumbnail(thumb);

    // Notify main window to reload thumbnail
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('thumbnail:updated', thumb);
      this.mainWindow.focus();
    }
  }
}

export const geminiWebService = new GeminiWebService();
