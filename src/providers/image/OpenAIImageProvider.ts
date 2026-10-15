import { ImageProvider, ImageGenerationOptions } from './ImageProvider';

export class OpenAIImageProvider implements ImageProvider {
  public name = 'OpenAI (DALL-E 3)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for DALL-E image generation.');
    }

    // DALL-E 3 supports 1792x1024 (landscape) or 1024x1792 (portrait) or 1024x1024
    const size = options.aspectRatio === '16:9' ? '1792x1024' : '1024x1792';

    const results: string[] = [];
    const count = Math.min(options.count || 1, 3);

    for (let i = 0; i < count; i++) {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${prompt} (variation ${i + 1})`,
          n: 1,
          size,
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI DALL-E 3 error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      if (data.data?.[0]?.url) {
        results.push(data.data[0].url);
      }
    }

    return results;
  }
}
