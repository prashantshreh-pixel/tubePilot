export interface TextProvider {
  name: string;
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}
