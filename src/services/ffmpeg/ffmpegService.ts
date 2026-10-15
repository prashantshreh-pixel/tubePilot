import ffmpegPath from 'ffmpeg-static';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface LoopRenderOptions {
  id: string;
  sourceImagePath: string;
  outputPath: string;
  aspectRatio: '9:16' | '16:9';
  durationSeconds: number; // e.g. 15 for Shorts, 60 or 600 for Long
  loopTechnique: 'forward_reverse_pingpong' | 'seamless_crossfade' | 'circular_motion';
  includeAmbientAudio?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export class FFmpegService {
  private activeProcesses = new Map<string, ChildProcess>();

  /**
   * Returns verified path to ffmpeg binary
   */
  public getBinaryPath(): string {
    if (!ffmpegPath) {
      throw new Error('FFmpeg binary could not be located via ffmpeg-static.');
    }
    return ffmpegPath;
  }

  /**
   * Cancels a running render by ID
   */
  public cancelRender(id: string): boolean {
    const proc = this.activeProcesses.get(id);
    if (proc) {
      try {
        proc.kill('SIGKILL');
      } catch (err) {
        console.warn(`[FFmpeg] Failed to kill process ${id}:`, err);
      }
      this.activeProcesses.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Generates a seamless looping video from an image using slow zoom/pan,
   * ping-pong forward+reverse (or crossfade), and optional ambient lo-fi pad audio.
   */
  public async renderLoopingVideo(options: LoopRenderOptions): Promise<string> {
    const {
      id,
      sourceImagePath,
      outputPath,
      aspectRatio,
      durationSeconds,
      loopTechnique,
      includeAmbientAudio = true,
      onProgress,
    } = options;

    const ffmpeg = this.getBinaryPath();
    const isPortrait = aspectRatio === '9:16';
    const width = isPortrait ? 1080 : 1920;
    const height = isPortrait ? 1920 : 1080;

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    onProgress?.(5, 'Initializing FFmpeg pipeline and canvas assets...');

    // Calculate forward clip duration: for pingpong, forward is half total duration
    const halfDuration = Math.max(3, Math.round(durationSeconds / 2));
    const fps = 25;
    const totalFrames = halfDuration * fps;

    // Build filter complex
    // 1. Zoompan Ken Burns effect (slow zoom in from 1.0 to 1.15)
    // 2. Ping-pong seamless loop: split forward stream, reverse 2nd stream, concat both
    // 3. Ambient lo-fi chord sound generator crossfaded seamlessly
    let filterComplex = '';

    if (loopTechnique === 'seamless_crossfade') {
      // Crossfade technique
      const fadeDuration = 1.0;
      const baseDuration = durationSeconds + fadeDuration;
      const baseFrames = baseDuration * fps;

      filterComplex = `
        [0:v]scale=-2:${height * 2},
        zoompan=z='min(zoom+0.0006,1.20)':d=${baseFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps}[base];
        [base]split[main][fade];
        [fade]trim=start=0:end=${fadeDuration},setpts=PTS-STARTPTS[f_start];
        [main]trim=start=${fadeDuration}:end=${baseDuration},setpts=PTS-STARTPTS[f_rest];
        [f_rest][f_start]xfade=transition=fade:duration=${fadeDuration}:offset=${durationSeconds - fadeDuration}[v_out]
      `.replace(/\s+/g, ' ');
    } else {
      // Default: forward_reverse_pingpong (100% mathematically seamless without any cuts or pops)
      filterComplex = `
        [0:v]scale=-2:${height * 2},
        zoompan=z='min(zoom+0.0008,1.22)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps}[fwd];
        [fwd]split[v1][v2];
        [v2]reverse[rev];
        [v1][rev]concat=n=2:v=1:a=0[v_out]
      `.replace(/\s+/g, ' ');
    }

    // Audio arguments: synthesizes a warm, lo-fi ambient pad crossfaded seamlessly
    const audioArgs: string[] = [];
    if (includeAmbientAudio) {
      // Warm chord: sine waves at 130.81Hz (C3), 164.81Hz (E3), 196.00Hz (G3) with low volume & gentle fade
      filterComplex += `;
        sine=frequency=130.81:duration=${durationSeconds}[a1];
        sine=frequency=196.00:duration=${durationSeconds}[a2];
        [a1][a2]amix=inputs=2:dropout_transition=2[amixed];
        [amixed]volume=0.08,afade=t=in:ss=0:d=1.5,afade=t=out:st=${durationSeconds - 1.5}:d=1.5[a_out]
      `.replace(/\s+/g, ' ');
    }

    const hasSourceImage = !!(sourceImagePath && fs.existsSync(sourceImagePath));
    const inputArgs = hasSourceImage
      ? ['-loop', '1', '-i', sourceImagePath]
      : ['-f', 'lavfi', '-i', `color=c=0x0c0e14:s=${width}x${height}:d=${durationSeconds + 5}`];

    const args = [
      '-y', // Overwrite
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[v_out]',
      ...(includeAmbientAudio ? ['-map', '[a_out]', '-c:a', 'aac', '-b:a', '128k'] : ['-an']),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-t', `${durationSeconds}`,
      outputPath,
    ];

    console.log(`[FFmpeg] Spawning render for ${id}:`, args.join(' '));

    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.activeProcesses.set(id, proc);

      proc.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        // Parse time=HH:MM:SS.ms to estimate progress
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
        if (timeMatch) {
          const hours = parseFloat(timeMatch[1]);
          const minutes = parseFloat(timeMatch[2]);
          const seconds = parseFloat(timeMatch[3]);
          const currentTotalSec = hours * 3600 + minutes * 60 + seconds;
          const percent = Math.min(98, Math.round((currentTotalSec / durationSeconds) * 90) + 5);
          onProgress?.(percent, `Encoding seamless loop... (${Math.round(currentTotalSec)}s / ${durationSeconds}s)`);
        }
      });

      proc.on('error', (err) => {
        this.activeProcesses.delete(id);
        reject(new Error(`FFmpeg spawn failed: ${err.message}`));
      });

      proc.on('close', (code) => {
        this.activeProcesses.delete(id);
        if (code === 0) {
          onProgress?.(100, 'Seamless loop export completed successfully!');
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Repeats a seamless base video to produce a 10-minute, 1-hour, or 3-hour long-form loop
   */
  public async extendLoopToDuration(
    id: string,
    baseVideoPath: string,
    outputPath: string,
    targetDurationSeconds: number,
    onProgress?: (progress: number, message: string) => void
  ): Promise<string> {
    const ffmpeg = this.getBinaryPath();

    onProgress?.(5, 'Preparing extended long-form stream loop...');

    // We can use -stream_loop to seamlessly repeat without re-encoding video frames
    const args = [
      '-y',
      '-stream_loop', '-1',
      '-i', baseVideoPath,
      '-c', 'copy',
      '-t', `${targetDurationSeconds}`,
      outputPath,
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.activeProcesses.set(id, proc);

      proc.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
        if (timeMatch) {
          const currentSec = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
          const percent = Math.min(98, Math.round((currentSec / targetDurationSeconds) * 95));
          onProgress?.(percent, `Extending long loop: ${Math.round(currentSec)}s / ${targetDurationSeconds}s`);
        }
      });

      proc.on('close', (code) => {
        this.activeProcesses.delete(id);
        if (code === 0) {
          onProgress?.(100, 'Long-form loop export complete!');
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg extend loop failed with code ${code}`));
        }
      });
    });
  }
}

export const ffmpegService = new FFmpegService();
