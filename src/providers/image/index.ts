import { AppSettings } from '../../shared/types';
import { ImageProvider } from './ImageProvider';
import { OpenAIImageProvider } from './OpenAIImageProvider';
import { StabilityImageProvider } from './StabilityImageProvider';
import { ReplicateImageProvider } from './ReplicateImageProvider';
import { LocalImageProvider } from './LocalImageProvider';

export * from './ImageProvider';
export * from './OpenAIImageProvider';
export * from './StabilityImageProvider';
export * from './ReplicateImageProvider';
export * from './LocalImageProvider';

export function getImageProvider(settings: AppSettings): ImageProvider {
  switch (settings.imageProvider) {
    case 'openai':
      if (settings.openaiApiKey) {
        return new OpenAIImageProvider(settings.openaiApiKey);
      }
      break;
    case 'stability':
      if (settings.stabilityApiKey) {
        return new StabilityImageProvider(settings.stabilityApiKey);
      }
      break;
    case 'replicate':
      if (settings.replicateApiKey) {
        return new ReplicateImageProvider(settings.replicateApiKey);
      }
      break;
  }

  // Fallback to whichever key is set or local generator
  if (settings.openaiApiKey) return new OpenAIImageProvider(settings.openaiApiKey);
  if (settings.stabilityApiKey) return new StabilityImageProvider(settings.stabilityApiKey);
  if (settings.replicateApiKey) return new ReplicateImageProvider(settings.replicateApiKey);

  return new LocalImageProvider();
}
