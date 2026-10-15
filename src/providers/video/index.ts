import { AppSettings } from '../../shared/types';
import { VideoProvider } from './VideoProvider';
import { RunwayProvider, LumaProvider, ReplicateVideoProvider } from './CloudVideoProviders';

export * from './VideoProvider';
export * from './CloudVideoProviders';

export function getVideoProvider(settings: AppSettings): VideoProvider | null {
  if (settings.videoProvider === 'local_ffmpeg') {
    return null; // Signals to use the local FFmpeg looping video fallback
  }

  if (settings.videoProvider === 'runway' && settings.runwayApiKey) {
    return new RunwayProvider(settings.runwayApiKey);
  }

  if (settings.videoProvider === 'luma' && settings.lumaApiKey) {
    return new LumaProvider(settings.lumaApiKey);
  }

  if (settings.videoProvider === 'replicate' && settings.replicateApiKey) {
    return new ReplicateVideoProvider(settings.replicateApiKey);
  }

  return null;
}
