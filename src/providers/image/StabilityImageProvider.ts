import { ImageProvider, ImageGenerationOptions } from './ImageProvider';

export class StabilityImageProvider implements ImageProvider {
  public name = 'Stability AI (SD3 / Core)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Stability API key is required.');
    }

    const aspectRatio = options.aspectRatio === '16:9' ? '16:9' : '9:16';
    const results: string[] = [];
    const count = Math.min(options.count || 1, 3);

    for (let i = 0; i < count; i++) {
      const formData = new FormData();
      formData.append('prompt', `${prompt} variation ${i + 1}`);
      formData.append('aspect_ratio', aspectRatio);
      formData.append('output_format', 'png');

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stability API error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      if (data.image) {
        results.push(`data:image/png;base64,${data.image}`);
      }
    }

    return results;
  }
}
