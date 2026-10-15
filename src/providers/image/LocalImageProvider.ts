import { ImageProvider, ImageGenerationOptions } from './ImageProvider';

export class LocalImageProvider implements ImageProvider {
  public name = 'TubePilot Studio Canvas (Offline/Demo)';

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    const isLandscape = options.aspectRatio === '16:9';
    const width = isLandscape ? 1280 : 1080;
    const height = isLandscape ? 720 : 1920;

    // Generate 3 visually distinct, high-contrast aesthetic thumbnail themes
    const palettes = [
      {
        bgStart: '#0f172a',
        bgEnd: '#1e1b4b',
        accent1: '#f43f5e',
        accent2: '#fbbf24',
        tag: 'HIGH IMPACT',
        glow: 'rgba(244, 63, 94, 0.4)',
      },
      {
        bgStart: '#052e16',
        bgEnd: '#022c22',
        accent1: '#10b981',
        accent2: '#38bdf8',
        tag: 'CASE STUDY',
        glow: 'rgba(16, 185, 129, 0.4)',
      },
      {
        bgStart: '#18181b',
        bgEnd: '#2e1065',
        accent1: '#a855f7',
        accent2: '#06b6d4',
        tag: 'REVEALED',
        glow: 'rgba(168, 85, 247, 0.4)',
      },
    ];

    const results: string[] = [];
    const count = Math.min(options.count || 3, 3);

    for (let i = 0; i < count; i++) {
      const p = palettes[i % palettes.length];
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bgStart}" />
      <stop offset="100%" stop-color="${p.bgEnd}" />
    </linearGradient>
    <radialGradient id="glowGrad${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${p.accent1}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${p.accent1}" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow${i}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.9" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#bgGrad${i})" />

  <!-- Dynamic Radial Glow Ambient -->
  <circle cx="${width * 0.75}" cy="${height * 0.4}" r="${width * 0.45}" fill="url(#glowGrad${i})" />

  <!-- Grid Pattern Overlay for High Tech Atmosphere -->
  <g opacity="0.12" stroke="#ffffff" stroke-width="1.5">
    ${Array.from({ length: 8 }, (_, idx) => `<line x1="0" y1="${(height / 8) * idx}" x2="${width}" y2="${(height / 8) * idx}" />`).join('')}
    ${Array.from({ length: 12 }, (_, idx) => `<line x1="${(width / 12) * idx}" y1="0" x2="${(width / 12) * idx}" y2="${height}" />`).join('')}
  </g>

  <!-- Geometric Hero Accent Shield -->
  <g filter="url(#shadow${i})">
    <rect x="${width * 0.08}" y="${height * 0.12}" width="${isLandscape ? 380 : 700}" height="70" rx="14" fill="${p.accent1}" />
    <text x="${width * 0.08 + (isLandscape ? 190 : 350)}" y="${height * 0.12 + 48}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="3">${p.tag} #${i + 1}</text>
  </g>

  <!-- Curiosity Dramatic Icon / Badge Graphic -->
  <g transform="translate(${width * (isLandscape ? 0.68 : 0.45)}, ${height * (isLandscape ? 0.32 : 0.65)}) scale(${isLandscape ? 1.6 : 2.0})" filter="url(#shadow${i})">
    <circle cx="60" cy="60" r="54" fill="${p.accent2}" />
    <polygon points="46,36 86,60 46,84" fill="#0f172a" />
    <circle cx="60" cy="60" r="62" fill="none" stroke="${p.accent1}" stroke-width="6" stroke-dasharray="14 10" />
  </g>

  <!-- High-CTR Text Framing Area -->
  <g filter="url(#shadow${i})">
    <rect x="${width * 0.08}" y="${height * (isLandscape ? 0.32 : 0.30)}" width="${width * (isLandscape ? 0.58 : 0.84)}" height="${height * (isLandscape ? 0.45 : 0.28)}" rx="24" fill="#000000" fill-opacity="0.65" stroke="${p.accent2}" stroke-width="3" />
    <text x="${width * 0.11}" y="${height * (isLandscape ? 0.48 : 0.41)}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${isLandscape ? 56 : 64}" fill="#ffffff">
      VIRAL BLUEPRINT
    </text>
    <text x="${width * 0.11}" y="${height * (isLandscape ? 0.62 : 0.50)}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${isLandscape ? 48 : 54}" fill="${p.accent2}">
      100X CTR OPTIMIZED
    </text>
  </g>

  <!-- Mobile Contrast Border -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${p.accent1}" stroke-width="${isLandscape ? 12 : 18}" />
</svg>
      `.trim();

      const base64 = Buffer.from(svg).toString('base64');
      results.push(`data:image/svg+xml;base64,${base64}`);
    }

    return results;
  }
}
