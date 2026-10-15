import { AppSettings } from '../../shared/types';
import { TextProvider } from './TextProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { MockTextProvider } from './MockTextProvider';

export * from './TextProvider';
export * from './ClaudeProvider';
export * from './OpenAIProvider';
export * from './GeminiProvider';
export * from './MockTextProvider';

export function getTextProvider(settings: AppSettings): TextProvider {
  switch (settings.textProvider) {
    case 'claude':
      if (settings.anthropicApiKey) {
        return new ClaudeProvider(settings.anthropicApiKey);
      }
      break;
    case 'openai':
      if (settings.openaiApiKey) {
        return new OpenAIProvider(settings.openaiApiKey);
      }
      break;
    case 'gemini':
      if (settings.geminiApiKey) {
        return new GeminiProvider(settings.geminiApiKey);
      }
      break;
  }

  // Graceful fallback to any configured key, or Mock provider for instant demo
  if (settings.geminiApiKey) return new GeminiProvider(settings.geminiApiKey);
  if (settings.anthropicApiKey) return new ClaudeProvider(settings.anthropicApiKey);
  if (settings.openaiApiKey) return new OpenAIProvider(settings.openaiApiKey);

  return new MockTextProvider();
}
