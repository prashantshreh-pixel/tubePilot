export interface ImageGenerationOptions {
  aspectRatio: '16:9' | '9:16';
  count: number;
  negativePrompt?: string;
  /** The actual video title — used so each thumbnail is unique and on-brand */
  videoTitle?: string;
}

export interface ImageProvider {
  name: string;
  generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]>;
}
