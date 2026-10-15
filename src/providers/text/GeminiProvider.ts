import { TextProvider } from './TextProvider';

export class GeminiProvider implements TextProvider {
  public name = 'Google Gemini';
  private apiKey: string;
  private model: string;
  private static cachedWorkingModel: string | null = null;

  constructor(apiKey: string, model: string = 'gemini-3.8-flash') {
    this.apiKey = apiKey;
    const initial = model === 'gemini-2.5-flash' ? 'gemini-3.8-flash' : model;
    this.model = GeminiProvider.cachedWorkingModel || initial;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured. Please set your key in Settings.');
    }

    // List of models to try in order: preferred model first, then resilient fallbacks
    const candidateModels = Array.from(
      new Set([
        this.model,
        GeminiProvider.cachedWorkingModel || 'gemini-3.8-flash',
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ])
    );

    let lastError: Error | null = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
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
              maxOutputTokens: 1200,
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

          // If the model was not found / deprecated (404), try next model in fallback list
          if (response.status === 404 && i < candidateModels.length - 1) {
            console.warn(`[GeminiProvider] Model ${currentModel} returned 404 (${parsedMessage}). Trying fallback model ${candidateModels[i + 1]}...`);
            continue;
          }

          throw new Error(`Gemini API request failed [${response.status}] for ${currentModel}: ${parsedMessage}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error(`Empty response received from Gemini API (${currentModel}).`);
        }

        // Cache working model so subsequent calls bypass trial models
        GeminiProvider.cachedWorkingModel = currentModel;
        this.model = currentModel;

        return candidate;
      } catch (err: any) {
        lastError = err;
        // If aborted/timeout or 404 and there are more candidates, try next
        if ((err.name === 'AbortError' || err.message?.includes('404')) && i < candidateModels.length - 1) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate text with Google Gemini API.');
  }
}

