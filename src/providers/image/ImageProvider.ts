export interface ImageGenerationOptions {
  aspectRatio: '16:9' | '9:16';
  count: number;
  negativePrompt?: string;
}

export interface ImageProvider {
  name: string;
  generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]>;
}
