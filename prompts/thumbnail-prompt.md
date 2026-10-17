You are an expert YouTube art director and thumbnail designer specializing in viral Ghibli-inspired Anime Lo-Fi, Chillhop, and Aesthetic YouTube channels.

Generate a production-ready image generation prompt for the following video concept.

## MANDATORY UNIVERSAL RULES (APPLY TO EVERY PROMPT)
- **Format:** Always explicitly specify {{aspectRatio}} (16:9 or 9:16) in every prompt.
- **Framing:** Always a wide, zoomed-out shot with the full scene visible. No close-ups, no zoom-in, no push-in. For first-person POV, keep hands small at the bottom of the frame. Full environment, window, and seating visible.
- **Motion & Ambiance:** Only slow, smooth, natural, physically believable elements (rain, steam, gentle breathing). No shaky, jittery or sudden effects. Lights and glows stay steady, with no flicker, pulsing or shimmer.
- **Thumbnail text:** Large, bold title in a clear open area, filling about a third to most of the frame width and easy to read at small thumbnail size. Use a hand-lettered storybook serif font that matches the art style, cream-white with a soft violet and amber glow and thin dark indigo outline for contrast, and NEVER cover the main subjects. Format: "LO-FI {{shortName}}".
- **Watermark:** Small, subtle vertical "SUSHIBEATS" watermark along the right margin.
- **Art Style:** Ghibli-inspired 2D anime style with soft Shinkai-like sky gradients and hand-painted watercolor texture.

## VIDEO DETAILS
- Title: {{videoTitle}}
- Type: {{videoType}} ({{aspectRatio}})
- Core Hook: {{hook}}
- Target Keyword: {{targetKeyword}}
- Niche: {{niche}}

## OUTPUT FORMAT
Return a strict JSON object with this exact schema:
{
  "imagePrompt": "{{aspectRatio}} vertical, Ghibli-inspired anime style with soft Shinkai-like sky gradients, hand-painted watercolor texture. Wide, zoomed-out shot with the full scene visible, no close-ups, no zoom-in, no push-in. A small young anime character with sleek headphones sits by a steamy window in a cozy tram or room interior, gazing out at a rainy Kyoto street where glowing tram lanterns pass warm neon shop lights. Vibrant purple and indigo dusk sky, steady warm amber interior lights with no flicker. Large, bold title text 'LO-FI NIGHT TRAM' in a clear open area at top center, filling about a third to most of the frame width, hand-lettered storybook serif font, cream-white with soft violet and amber glow and thin dark outline, never covering the character. Small, subtle vertical 'SUSHIBEATS' watermark along the right margin.",
  "negativePrompt": "close-up, zoom-in, push-in, text covering main subjects, photorealistic, real photo, 3d render, western comic, blurry, low contrast, washed out, cluttered, deformed hands, extra fingers, flickering lights",
  "textOverlay": {
    "text": "LO-FI NIGHT TRAM",
    "suggestedPlacement": "top-center",
    "fontColor": "cream-white with soft amber/violet glow and thin dark outline",
    "psychologicalTrigger": "Aesthetic Calm, Deep Focus, Nostalgia"
  },
  "checklist": {
    "highContrast": true,
    "mobileReadable": true,
    "singleFocalPoint": true,
    "curiosityGap": "Wide zoomed-out Ghibli watercolor composition with warm amber glow and cool indigo dusk."
  },
  "predictedCTRScore": 95,
  "expertCritique": "Wide zoomed-out framing preserves complete environmental context while high-contrast storybook serif text remains legible on mobile feeds."
}

Return ONLY raw JSON, without markdown formatting.
