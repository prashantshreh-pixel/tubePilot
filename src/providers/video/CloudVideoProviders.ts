import { VideoProvider, VideoGenerationOptions } from './VideoProvider';

export class RunwayProvider implements VideoProvider {
  public name = 'Runway (Gen-3 Alpha)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(prompt: string, options: VideoGenerationOptions): Promise<{ videoUrl: string }> {
    if (!this.apiKey) {
      throw new Error('Runway API key is required.');
    }

    const ratio = options.aspectRatio === '16:9' ? '1280:768' : '768:1280';

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-09-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promptText: prompt,
        model: 'gen3a_turbo',
        ratio,
        duration: Math.min(options.durationSeconds, 10),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Runway API request failed [${response.status}]: ${err}`);
    }

    const data = await response.json();
    return { videoUrl: data.output?.[0] || data.id };
  }
}

export class LumaProvider implements VideoProvider {
  public name = 'Luma Dream Machine';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(prompt: string, options: VideoGenerationOptions): Promise<{ videoUrl: string }> {
    if (!this.apiKey) {
      throw new Error('Luma API key is required.');
    }

    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: options.aspectRatio === '16:9' ? '16:9' : '9:16',
        loop: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Luma API error [${response.status}]: ${err}`);
    }

    const data = await response.json();
    return { videoUrl: data.assets?.video || data.id };
  }
}

export class ReplicateVideoProvider implements VideoProvider {
  public name = 'Replicate (Video Models)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(prompt: string, options: VideoGenerationOptions): Promise<{ videoUrl: string }> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required.');
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: 'kwaivgi/kling-v1',
        input: {
          prompt,
          aspect_ratio: options.aspectRatio === '16:9' ? '16:9' : '9:16',
          duration: options.durationSeconds,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Replicate Video error [${response.status}]: ${err}`);
    }

    const data = await response.json();
    const output = Array.isArray(data.output) ? data.output[0] : data.output;
    return { videoUrl: output || '' };
  }
}
