export interface VideoGenerationOptions {
  aspectRatio: '9:16' | '16:9';
  durationSeconds: number;
}

export interface VideoProvider {
  name: string;
  generateVideo(prompt: string, options: VideoGenerationOptions): Promise<{ videoUrl: string }>;
}
