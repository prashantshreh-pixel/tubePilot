import { TextProvider } from './TextProvider';

export class GeminiProvider implements TextProvider {
  public name = 'Google Gemini';
  private apiKey: string;
  private model: string;
  private static cachedWorkingModel: string | null = null;

  constructor(apiKey: string, model: string = 'gemini-3-flash-preview') {
    this.apiKey = apiKey;
    const initial = (model === 'gemini-2.5-flash' || model === 'gemini-3.8-flash') ? 'gemini-3-flash-preview' : model;
    this.model = GeminiProvider.cachedWorkingModel || initial;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured. Please set your key in Settings.');
    }

    // List of models to try in order: confirmed active models first, then fallbacks
    const candidateModels = Array.from(
      new Set([
        GeminiProvider.cachedWorkingModel || 'gemini-3-flash-preview',
        this.model,
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite-preview',
        'gemini-3.8-flash',
      ])
    );

    let lastError: Error | null = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];

      // Try up to 3 times per model on transient errors (503 High Demand, 429 Rate Limit)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;

          // 8-second timeout per attempt to guarantee fast response
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
              },
            }),
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            let parsedMessage = errorText;
            try {
              const errObj = JSON.parse(errorText);
              if (errObj.error?.message) {
                parsedMessage = errObj.error.message;
              }
            } catch {
              // Keep errorText
            }

            // If 503 (high demand) or 429 (rate limit), retry once, then switch model
            if ((response.status === 503 || response.status === 429) && attempt < 2) {
              console.warn(`[GeminiProvider] ${currentModel} returned ${response.status} (attempt ${attempt}/2). Retrying in 500ms...`);
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }

            // If model is 404 (not found), 503 (high demand), or 429 (quota), try next fallback model
            if ((response.status === 404 || response.status === 503 || response.status === 429) && i < candidateModels.length - 1) {
              console.warn(`[GeminiProvider] Model ${currentModel} returned ${response.status} (${parsedMessage}). Switching to fallback model ${candidateModels[i + 1]}...`);
              break; // breaks inner attempt loop to try next model
            }

            throw new Error(`Gemini API request failed [${response.status}] for ${currentModel}: ${parsedMessage}`);
          }

          const data = await response.json();
          const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!candidate) {
            throw new Error(`Empty response received from Gemini API (${currentModel}).`);
          }

          // Track tokens used
          const totalTokens = data.usageMetadata?.totalTokenCount || Math.round((userPrompt.length + candidate.length) / 3.5);
          try {
            const { dbService } = await import('../../services/db/database');
            dbService.addTokenUsage(totalTokens);
          } catch {}

          // Cache working model so subsequent calls bypass trial models
          GeminiProvider.cachedWorkingModel = currentModel;
          this.model = currentModel;

          return candidate;
        } catch (err: any) {
          lastError = err;
          // If aborted/timeout or network error, retry attempt or next model
          if (attempt < 3 && err.name !== 'AbortError') {
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
            continue;
          }
          if (i < candidateModels.length - 1) {
            break; // Try next model
          }
          throw err;
        }
      }
    }

    throw lastError || new Error('Failed to generate text with Google Gemini API after retrying.');
  }
}

