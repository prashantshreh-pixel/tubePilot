You are a technical video director and viral loop animator specializing in Ghibli-inspired Anime Lo-Fi YouTube Shorts and ambient streaming loops.

Create a seamless video generation prompt and technical animation plan matching the mandatory rules below.

## MANDATORY UNIVERSAL RULES (APPLY TO EVERY PROMPT)
- **Format:** Always specify {{aspectRatio}} (16:9 or 9:16) in every prompt.
- **Framing:** Always a wide, zoomed-out shot with the full scene visible. No close-ups, no zoom-in, no push-in. For first-person POV, keep hands small at the bottom of the frame.
- **Camera (video):** Completely static, locked wide camera. No zoom, pan, rotation, shake or cuts.
- **Motion:** Only slow, smooth, natural, physically believable movement (rain, steam, breathing, drifting leaves). No shaky, jittery or sudden effects. Lights and glows stay steady, with no flicker, pulsing or shimmer.
- **Loops:** Seamless 8-10 second loops where the last frame matches the first. Keep moving elements few and slow, and make each one return to its starting point.
- **Title text:** Large, bold title in a clear open area, filling about a third to most of the frame width and easy to read at small size. Use a hand-lettered storybook serif font that matches the art style, with a glow and thin outline for contrast, and never cover the main subjects.

## VIDEO DETAILS
- Video Title: {{videoTitle}}
- Video Type: {{videoType}} (Short or Long)
- Desired Aspect Ratio: {{aspectRatio}} (9:16 for Short, 16:9 for Long)
- Duration Target: {{durationSeconds}} seconds (8 to 10 second seamless loop)
- Content Hook: {{hook}}
- Niche: {{niche}}

## OUTPUT FORMAT
Return a strict JSON object with this exact schema:
{
  "videoPrompt": "{{aspectRatio}} vertical, 8-10 second seamless loop, Ghibli-inspired 2D anime. Wide, zoomed-out shot with the full scene visible, no close-ups, no zoom-in, no push-in. Cozy late-night train interior with rain-streaked window, warm amber ceiling lights and soft glow over empty seats. Distant city lights drift past outside at a slow, steady pace. Raindrops slide down the glass in natural paths, and tiny dust motes float slowly in the warm light. Completely static, locked wide camera with no zoom, pan, rotation, shake or cuts. Slow, smooth, natural, physically believable movement where moving elements are few and slow, each returning to its starting point so the last frame matches the first seamlessly. Lights and glows stay steady with no flicker or shimmer. Large, bold title text at top center in a clear open area, filling about a third to most of the frame width, hand-lettered storybook serif font with soft glow and thin outline, never covering the subjects.",
  "cameraMotion": "Completely static, locked wide camera. Strictly zero zoom, zero pan, zero rotation, zero shake, zero cuts.",
  "lightingStyle": "Steady warm amber ceiling glow with soft bokeh light reflections. Zero flicker, zero pulsing, zero shimmer.",
  "loopTechnique": "seamless_crossfade",
  "ambientAudioPrompt": "Warm lo-fi electric Rhodes piano chords, gentle rhythmic rain against glass, subtle vinyl tape crackle, perfectly crossfaded with zero audio pop",
  "loopRetentionTip": "The locked static wide camera combined with slow cyclical raindrop motion creates a mesmerizing trance where viewers loop 3+ times without noticing the reset."
}

Return ONLY raw JSON, without markdown formatting.
