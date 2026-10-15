import { ImageProvider, ImageGenerationOptions } from './ImageProvider';

export class ReplicateImageProvider implements ImageProvider {
  public name = 'Replicate (Flux 1.1 Pro)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required.');
    }

    const aspectRatio = options.aspectRatio === '16:9' ? '16:9' : '9:16';
    const count = Math.min(options.count || 1, 3);
    const results: string[] = [];

    for (let i = 0; i < count; i++) {
      // Create prediction for black-forest-labs/flux-schnell or flux-1.1-pro
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          version: 'black-forest-labs/flux-schnell',
          input: {
            prompt: `${prompt} (variation ${i + 1})`,
            aspect_ratio: aspectRatio,
            output_format: 'jpg',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Replicate API error [${response.status}]: ${errorText}`);
      }

      const prediction = await response.json();
      if (Array.isArray(prediction.output) && prediction.output[0]) {
        results.push(prediction.output[0]);
      } else if (typeof prediction.output === 'string') {
        results.push(prediction.output);
      }
    }

    return results;
  }
}
