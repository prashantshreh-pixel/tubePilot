import { TextProvider } from './TextProvider';

export class ClaudeProvider implements TextProvider {
  public name = 'Claude (Anthropic)';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-latest') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic Claude API key is not configured. Please set your key in Settings.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API request failed [${response.status}]: ${errorData}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error('Empty response received from Claude API.');
    }

    const totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    if (totalTokens > 0) {
      try {
        const { dbService } = await import('../../services/db/database');
        dbService.addTokenUsage(totalTokens);
      } catch {}
    }

    return content;
  }
}
