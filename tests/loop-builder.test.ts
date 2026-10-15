import { describe, it, expect } from 'vitest';
import { ffmpegService } from '../src/services/ffmpeg/ffmpegService';
import fs from 'fs';

describe('FFmpeg Seamless Looping Video Builder', () => {
  it('locates bundled ffmpeg binary', () => {
    const binPath = ffmpegService.getBinaryPath();
    expect(binPath).toBeDefined();
    expect(fs.existsSync(binPath)).toBe(true);
  });

  it('supports cancelling active render tasks safely', () => {
    const cancelled = ffmpegService.cancelRender('non-existent-task-id');
    expect(cancelled).toBe(false);
  });
});
