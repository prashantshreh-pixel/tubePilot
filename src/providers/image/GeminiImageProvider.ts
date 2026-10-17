import { ImageProvider, ImageGenerationOptions } from './ImageProvider';
import { LocalImageProvider } from './LocalImageProvider';

// 3 visually distinct scene templates for uniqueness per variation
const SCENE_VARIATIONS = [
  {
    scene: 'Wide, zoomed-out view of a cozy late-night tram interior. A young anime girl with sleek studio headphones sits by a steamy rain-streaked window gazing out at a rainy Kyoto street where lanterns and neon shop signs glow. Warm amber ceiling lamps overhead. Wet asphalt outside reflects vibrant bokeh. Vibrant purple and indigo dusk sky visible through the window.',
    palette: 'deep indigo, violet purple, warm amber neon, bokeh teal and rose',
    mood: 'late-night city commute',
  },
  {
    scene: 'Wide, zoomed-out view of a cozy room at night. A young anime girl with sleek studio headphones sits at a wooden desk by a large rain-streaked window. Steaming cup of tea beside a glowing laptop with code. Warm amber desk lamp glow. Outside: rainy Kyoto rooftops, glowing distant pagoda, soft neon pink and blue reflections on wet tiles.',
    palette: 'warm amber, deep navy, soft cherry blossom pink, misty blue',
    mood: 'midnight study session',
  },
  {
    scene: 'Wide, zoomed-out view of an empty late-night Japanese train carriage. Emerald green velvet seats, polished mahogany wood, steady warm amber ceiling light fixtures. Rain streaks across the panoramic windows overlooking a glowing Kyoto twilight skyline with distant streetlamps.',
    palette: 'emerald velvet, warm amber gold, deep plum and indigo night',
    mood: 'last train home chill',
  },
];

/** Convert a video title into a short, punchy 2-4 word UPPERCASE header */
function toLoFiTitle(rawTitle: string): string {
  const cleaned = rawTitle
    .replace(/\b(lofi|lo-fi|lo fi|beats|music|songs|chill|mix|playlist|hour|hours|study|with me|relaxing)\b/gi, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .toUpperCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  let short = words.slice(0, 4).join(' ');
  if (short.length > 20) short = words.slice(0, 3).join(' ');
  if (short.length > 20) short = words.slice(0, 2).join(' ');
  return short || 'LO-FI CHILL';
}

export class GeminiImageProvider implements ImageProvider {
  public name = 'Google Gemini (Nano Banana / Imagen 3)';
  private apiKey: string;
  private localFallback = new LocalImageProvider();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('[GeminiImageProvider] No Gemini API key provided.');
      return this.localFallback.generateImages(prompt, options);
    }

    const count = options.count || 3;
    const format = options.aspectRatio;
    const rawTitle = options.videoTitle || '';
    const loFiTitle = rawTitle ? toLoFiTitle(rawTitle) : 'LO-FI CHILL';

    // Official Google Gemini Nano Banana image models:
    const candidateModels = [
      'gemini-3.1-flash-image',       // Nano Banana 2 (Latest)
      'gemini-2.5-flash-image',       // Nano Banana (Standard)
      'gemini-3-pro-image',           // Nano Banana Pro
      'gemini-nano-banana-2.1',       // Nano Banana 2.1
    ];

    const results: string[] = [];

    for (let varIndex = 0; varIndex < count; varIndex++) {
      const v = SCENE_VARIATIONS[varIndex % SCENE_VARIATIONS.length];

      const variantPrompt = `
${format} format, Ghibli-inspired 2D anime style with soft Shinkai-like sky gradients, hand-painted watercolor texture.
Framing: Wide, zoomed-out shot with full scene visible. No close-ups, no zoom-in, no push-in.
Scene: ${v.scene}
Palette: ${v.palette}. Mood: ${v.mood}.
Lighting: Steady warm amber interior lighting with no flicker or shimmer.
Title text: Large, bold "${loFiTitle}" positioned at top center in a clear open area, filling about one-third to most of frame width. Hand-lettered storybook serif font, cream-white with soft violet and amber glow and thin dark indigo outline, never covering the main setup or characters.
Watermark: Small, subtle vertical "SUSHIBEATS" watermark along the right margin.
Additional context: ${prompt}
Style: High quality painterly 2D anime, soft bokeh background, natural proportions.
Avoid: close-ups, camera zoom, text distortion, flickering lights, cluttered composition.
`.trim();

      let generated = false;

      // Method 1: Google Gemini Interactions API (official Gemini 3 image gen endpoint)
      for (const model of candidateModels) {
        if (generated) break;
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions`, {
            method: 'POST',
            headers: {
              'x-goog-api-key': this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              input: [{ type: 'text', text: variantPrompt }],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const b64 = data.interaction?.output_image?.data || data.output_image?.data;
            if (b64) {
              results.push(`data:image/png;base64,${b64}`);
              console.log(`[GeminiImageProvider] ✓ Var ${varIndex + 1} generated via interactions with ${model}`);
              generated = true;
              break;
            }
          }
        } catch (e: any) {
          console.warn(`[GeminiImageProvider] Interactions error on ${model}:`, e.message);
        }
      }

      // Method 2: Google Gemini generateContent with responseModalities
      if (!generated) {
        for (const model of candidateModels) {
          if (generated) break;
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: variantPrompt }] }],
                  generationConfig: {
                    responseModalities: ['IMAGE', 'TEXT'],
                  },
                }),
              }
            );

            if (res.ok) {
              const data = await res.json();
              const parts = data.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const mime = part.inlineData.mimeType || 'image/png';
                  results.push(`data:${mime};base64,${part.inlineData.data}`);
                  console.log(`[GeminiImageProvider] ✓ Var ${varIndex + 1} generated via generateContent with ${model}`);
                  generated = true;
                  break;
                }
              }
            }
          } catch (e: any) {
            console.warn(`[GeminiImageProvider] generateContent error on ${model}:`, e.message);
          }
        }
      }

      // Method 3: Gemini OpenAI-compatible Image Generations Endpoint
      if (!generated) {
        for (const model of ['gemini-2.5-flash-image', 'gemini-3-pro-image']) {
          if (generated) break;
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/images/generations`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model,
                prompt: variantPrompt,
                response_format: 'b64_json',
                n: 1,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const b64 = data.data?.[0]?.b64_json;
              if (b64) {
                results.push(`data:image/png;base64,${b64}`);
                console.log(`[GeminiImageProvider] ✓ Var ${varIndex + 1} generated via OpenAI endpoint with ${model}`);
                generated = true;
                break;
              }
            }
          } catch (e: any) {
            console.warn(`[GeminiImageProvider] OpenAI compat error on ${model}:`, e.message);
          }
        }
      }

      // If the user's key hits the 0 requests/day free tier cap on all 3 methods, use local fallback
      if (!generated) {
        console.warn(`[GeminiImageProvider] Gemini API returned quota block. Falling back to local anime studio for variation ${varIndex + 1}.`);
        const locals = await this.localFallback.generateImages(variantPrompt, { ...options, count: 1, videoTitle: rawTitle });
        if (locals.length > 0) results.push(locals[0]);
      }
    }

    if (results.length === 0) {
      return this.localFallback.generateImages(prompt, options);
    }

    return results;
  }
}
