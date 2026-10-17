import { ImageProvider, ImageGenerationOptions } from './ImageProvider';

export class LocalImageProvider implements ImageProvider {
  public name = 'Anime Lo-Fi Studio (Ghibli & Shinkai Aesthetic)';

  async generateImages(prompt: string, options: ImageGenerationOptions): Promise<string[]> {
    const isLandscape = options.aspectRatio === '16:9';
    const width = isLandscape ? 1280 : 1080;
    const height = isLandscape ? 720 : 1920;

    // ── Derive unique titles from the real video title in options ───────────
    const rawTitle = options.videoTitle || '';

    /** Strip common lo-fi filler words, return short UPPER CASE heading */
    function makeTitle(text: string, maxWords = 4): string {
      const cleaned = text
        .replace(/\b(lofi|lo-fi|lo fi|beats|music|songs|chill|mix|playlist|hour|hours|study|sleep|relaxing|background)\b/gi, '')
        .replace(/[^a-zA-Z0-9 ]/g, ' ')
        .trim()
        .toUpperCase();
      const words = cleaned.split(/\s+/).filter(Boolean);
      let out = words.slice(0, maxWords).join(' ');
      if (out.length > 22) out = words.slice(0, 3).join(' ');
      if (out.length > 22) out = words.slice(0, 2).join(' ');
      return out || 'LO-FI CHILL';
    }

    const baseShort = rawTitle ? makeTitle(rawTitle, 2) : 'NIGHT';
    const titleText1 = rawTitle ? `LO-FI ${baseShort}`.slice(0, 22).trim() : 'LO-FI NIGHT TRAM';
    const titleText2 = rawTitle ? makeTitle(rawTitle, 4) : 'LAST TRAIN HOME';
    const titleText3 = rawTitle ? `LATE NIGHT ${makeTitle(rawTitle, 2)}`.slice(0, 22).trim() : 'KYOTO RAIN CHILL';

    const variations = [
      {
        title: titleText1,
        subtitle: '\u6df1 \u591c \u30c8 \u30e9 \u30e0 \u2022 CHILLHOP BEATS',
        skyTop: '#0b091a',
        skyMid: '#241b4b',
        skyBottom: '#4c1d95',
        windowGlow: '#818cf8',
        neonGlow: '#f59e0b',
        interiorWood: '#1c1917',
        seatVelvet: '#0f172a',
        seatAccent: '#4338ca',
        lampGlow: 'rgba(251, 191, 36, 0.45)',
        headphoneColor: '#f43f5e',
      },
      {
        title: titleText2,
        subtitle: '\u7d42 \u96fb \u2022 LATE NIGHT STUDY',
        skyTop: '#050c1e',
        skyMid: '#1e1b4b',
        skyBottom: '#1e3a8a',
        windowGlow: '#38bdf8',
        neonGlow: '#ec4899',
        interiorWood: '#18181b',
        seatVelvet: '#172554',
        seatAccent: '#2563eb',
        lampGlow: 'rgba(253, 230, 138, 0.40)',
        headphoneColor: '#38bdf8',
      },
      {
        title: titleText3,
        subtitle: '\u96e8 \u306e \u90fd \u2022 RELAX & FOCUS',
        skyTop: '#140c1d',
        skyMid: '#3b0764',
        skyBottom: '#581c87',
        windowGlow: '#c084fc',
        neonGlow: '#10b981',
        interiorWood: '#262626',
        seatVelvet: '#2e1065',
        seatAccent: '#7e22ce',
        lampGlow: 'rgba(252, 211, 77, 0.50)',
        headphoneColor: '#a855f7',
      },
    ];

    const results: string[] = [];
    const count = Math.min(options.count || 3, 3);

    for (let i = 0; i < count; i++) {
      const v = variations[i % variations.length];
      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Shinkai-inspired Sky Gradient -->
    <linearGradient id="skyGrad${i}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${v.skyTop}" />
      <stop offset="45%" stop-color="${v.skyMid}" />
      <stop offset="100%" stop-color="${v.skyBottom}" />
    </linearGradient>

    <!-- Warm Amber Interior Ceiling Lamp Glow -->
    <radialGradient id="lampGlow${i}" cx="50%" cy="15%" r="65%">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.9" />
      <stop offset="30%" stop-color="#f59e0b" stop-opacity="0.45" />
      <stop offset="70%" stop-color="#b45309" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Rainy Wet Street Bokeh Glow -->
    <radialGradient id="bokeh1${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${v.neonGlow}" stop-opacity="0.75" />
      <stop offset="60%" stop-color="${v.neonGlow}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${v.neonGlow}" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="bokeh2${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${v.windowGlow}" stop-opacity="0.8" />
      <stop offset="60%" stop-color="${v.windowGlow}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${v.windowGlow}" stop-opacity="0" />
    </radialGradient>

    <!-- Hand-lettered Storybook Title Glow Filter -->
    <filter id="storybookGlow${i}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4c1d95" flood-opacity="0.95" />
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#f59e0b" flood-opacity="0.55" />
    </filter>

    <!-- Steamy Window Frame Shadow -->
    <filter id="windowShadow${i}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="8" stdDeviation="10" flood-color="#020617" flood-opacity="0.85" />
    </filter>
  </defs>

  <!-- 1. BASE BACKGROUND: Rainy Kyoto Night Sky -->
  <rect width="100%" height="100%" fill="url(#skyGrad${i})" />

  <!-- 2. WATERCOLOR TEXTURE / STARS / TWILIGHT HAZE -->
  <g opacity="0.35">
    <circle cx="${width * 0.2}" cy="${height * 0.15}" r="2" fill="#ffffff" />
    <circle cx="${width * 0.4}" cy="${height * 0.12}" r="1.5" fill="#ffffff" opacity="0.8" />
    <circle cx="${width * 0.7}" cy="${height * 0.18}" r="2.5" fill="#fef08a" />
    <circle cx="${width * 0.85}" cy="${height * 0.10}" r="1.5" fill="#ffffff" />
    <ellipse cx="${width * 0.5}" cy="${height * 0.28}" rx="${width * 0.4}" ry="60" fill="${v.windowGlow}" opacity="0.15" />
  </g>

  <!-- 3. OUTSIDE VIEW: Distant Kyoto Shopfronts, Lanterns & Street Lights (Through Window) -->
  <g opacity="0.85">
    <!-- Traditional Eaves Silhouette -->
    <polygon points="
      ${width * 0.15},${height * 0.62}
      ${width * 0.35},${height * 0.58}
      ${width * 0.55},${height * 0.63}
      ${width * 0.55},${height * 0.75}
      ${width * 0.15},${height * 0.75}
    " fill="#090a15" />

    <!-- Distant Passing Tram with Amber Windows -->
    <rect x="${width * 0.22}" y="${height * 0.60}" width="${width * 0.28}" height="${height * 0.055}" rx="8" fill="#1e1b4b" stroke="#f59e0b" stroke-width="2" />
    <rect x="${width * 0.24}" y="${height * 0.61}" width="22" height="14" rx="2" fill="#fbbf24" opacity="0.9" />
    <rect x="${width * 0.29}" y="${height * 0.61}" width="22" height="14" rx="2" fill="#fbbf24" opacity="0.9" />
    <rect x="${width * 0.34}" y="${height * 0.61}" width="22" height="14" rx="2" fill="#fbbf24" opacity="0.9" />
    <rect x="${width * 0.39}" y="${height * 0.61}" width="22" height="14" rx="2" fill="#fbbf24" opacity="0.9" />
    <rect x="${width * 0.44}" y="${height * 0.61}" width="22" height="14" rx="2" fill="#f43f5e" opacity="0.9" />

    <!-- Glowing Lanterns / Wet Street Bokeh Reflections -->
    <circle cx="${width * 0.18}" cy="${height * 0.66}" r="32" fill="url(#bokeh1${i})" />
    <circle cx="${width * 0.48}" cy="${height * 0.68}" r="45" fill="url(#bokeh2${i})" />
    <circle cx="${width * 0.32}" cy="${height * 0.72}" r="50" fill="url(#bokeh1${i})" opacity="0.6" />
    <circle cx="${width * 0.60}" cy="${height * 0.65}" r="38" fill="url(#bokeh2${i})" opacity="0.7" />

    <!-- Wet Asphalt Ground with Shimmer Reflections -->
    <rect x="0" y="${height * 0.68}" width="${width}" height="${height * 0.32}" fill="#05070e" />
    <ellipse cx="${width * 0.35}" cy="${height * 0.71}" rx="${width * 0.25}" ry="12" fill="${v.neonGlow}" opacity="0.25" />
    <ellipse cx="${width * 0.55}" cy="${height * 0.73}" rx="${width * 0.3}" ry="16" fill="${v.windowGlow}" opacity="0.2" />
  </g>

  <!-- 4. STEAMY RAIN-STREAKED WINDOW PANE (Diagonal rain streaks & droplets) -->
  <g opacity="0.65">
    <line x1="${width * 0.12}" y1="${height * 0.38}" x2="${width * 0.14}" y2="${height * 0.46}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />
    <line x1="${width * 0.28}" y1="${height * 0.35}" x2="${width * 0.30}" y2="${height * 0.49}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8" />
    <line x1="${width * 0.45}" y1="${height * 0.40}" x2="${width * 0.47}" y2="${height * 0.54}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
    <line x1="${width * 0.58}" y1="${height * 0.36}" x2="${width * 0.60}" y2="${height * 0.48}" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.6" />
    <line x1="${width * 0.22}" y1="${height * 0.52}" x2="${width * 0.23}" y2="${height * 0.62}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.75" />
    <line x1="${width * 0.38}" y1="${height * 0.50}" x2="${width * 0.40}" y2="${height * 0.64}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.85" />
  </g>

  <!-- 5. COZY TRAM INTERIOR: Wooden Window Frame & Ambient Ceiling Light -->
  <g filter="url(#windowShadow${i})">
    <!-- Window Arch & Mahogany Frame -->
    <path d="
      M 0 0
      L ${width} 0
      L ${width} ${height}
      L 0 ${height}
      Z
      M ${width * 0.08} ${height * (isLandscape ? 0.14 : 0.28)}
      L ${width * 0.72} ${height * (isLandscape ? 0.14 : 0.28)}
      L ${width * 0.72} ${height * (isLandscape ? 0.88 : 0.74)}
      L ${width * 0.08} ${height * (isLandscape ? 0.88 : 0.74)}
      Z
    " fill="${v.interiorWood}" fill-rule="evenodd" />

    <!-- Warm Amber Ceiling Ambient Glow -->
    <rect x="0" y="0" width="${width}" height="${height * 0.35}" fill="url(#lampGlow${i})" />

    <!-- Tram Ceiling Hanging Hand-straps & Lamps -->
    <g stroke="#78716c" stroke-width="4" stroke-linecap="round">
      <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height * 0.15}" />
      <circle cx="${width * 0.25}" cy="${height * 0.17}" r="16" fill="none" stroke="#fbbf24" stroke-width="4" />

      <line x1="${width * 0.55}" y1="0" x2="${width * 0.55}" y2="${height * 0.14}" />
      <circle cx="${width * 0.55}" cy="${height * 0.16}" r="16" fill="none" stroke="#fbbf24" stroke-width="4" />
    </g>

    <!-- Warm Ceiling Lamp Fixture -->
    <ellipse cx="${width * 0.40}" cy="8" rx="60" ry="24" fill="#fbbf24" />
    <ellipse cx="${width * 0.40}" cy="10" rx="45" ry="16" fill="#fffbeb" opacity="0.9" />
  </g>

  <!-- 6. EMPTY VELVET TRAM SEATS & MAHOGANY INTERIOR -->
  <g>
    <!-- Rear Bench Velvet Cushion -->
    <rect x="${width * 0.06}" y="${height * (isLandscape ? 0.76 : 0.70)}" width="${width * 0.68}" height="${height * 0.12}" rx="16" fill="${v.seatVelvet}" stroke="${v.seatAccent}" stroke-width="3" />
    <rect x="${width * 0.08}" y="${height * (isLandscape ? 0.78 : 0.72)}" width="${width * 0.64}" height="10" rx="4" fill="${v.seatAccent}" opacity="0.6" />

    <!-- Foreground Wooden Handrail -->
    <line x1="0" y1="${height * 0.84}" x2="${width}" y2="${height * 0.84}" stroke="#a8a29e" stroke-width="12" />
    <line x1="${width * 0.78}" y1="${height * 0.2}" x2="${width * 0.78}" y2="${height}" stroke="#d6d3d1" stroke-width="16" stroke-linecap="round" />
  </g>

  <!-- 7. ANIME GIRL WITH SLEEK HEADPHONES GAZING OUT THE STEAMY WINDOW -->
  <g transform="translate(${width * (isLandscape ? 0.42 : 0.32)}, ${height * (isLandscape ? 0.38 : 0.45)}) scale(${isLandscape ? 0.9 : 1.15})">
    <!-- Steaming Coffee Cup on Ledge -->
    <rect x="22" y="148" width="28" height="34" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
    <!-- Steam drifting up -->
    <path d="M 32 144 Q 30 134, 34 126 T 32 114" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.55" />
    <path d="M 40 144 Q 44 136, 40 128 T 42 116" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.45" />

    <!-- Oversized Knitted Lo-Fi Sweater / Torso -->
    <path d="
      M 70 110
      C 90 95, 150 95, 175 110
      C 195 130, 205 180, 200 240
      L 50 240
      C 45 180, 55 130, 70 110
      Z
    " fill="${v.seatVelvet}" stroke="#0f172a" stroke-width="4" />

    <!-- Arm resting on window sill, hand propping chin -->
    <path d="M 80 145 C 60 160, 45 175, 52 205 L 85 205 Z" fill="${v.seatVelvet}" />
    <circle cx="52" cy="148" r="14" fill="#fcd34d" opacity="0.85" />

    <!-- Anime Head & Neck -->
    <rect x="110" y="80" width="22" height="30" rx="6" fill="#fed7aa" />
    <ellipse cx="120" cy="62" rx="36" ry="42" fill="#fed7aa" />

    <!-- Soft Dark Anime Hair (Side Profile looking left out window) -->
    <path d="
      M 85 55
      C 85 15, 160 15, 165 55
      C 168 85, 160 115, 150 120
      C 140 95, 140 70, 115 62
      C 95 62, 85 70, 85 55
      Z
    " fill="#090d16" />

    <!-- Sleek Studio Headphones over Ear -->
    <!-- Headband -->
    <path d="M 100 24 C 120 18, 145 22, 155 35" fill="none" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round" />
    <!-- Ear Cup -->
    <ellipse cx="140" cy="58" rx="14" ry="20" fill="${v.headphoneColor}" stroke="#ffffff" stroke-width="3" />
    <ellipse cx="140" cy="58" rx="8" ry="12" fill="#0f172a" />

    <!-- Soft Rim Light on Girl from Rainy Kyoto Street -->
    <path d="M 86 35 C 84 55, 84 80, 88 100" fill="none" stroke="${v.windowGlow}" stroke-width="3" opacity="0.8" />
  </g>

  <!-- 8. MANDATORY TITLE TEXT: LARGE BOLD STORYBOOK SERIF AT TOP CENTER -->
  <!-- Cream-white text with soft violet and amber glow, thin dark indigo outline -->
  <g filter="url(#storybookGlow${i})">
    <!-- Subtitle Pill / Tag -->
    <rect x="${(width - (isLandscape ? 400 : 540)) / 2}" y="${height * (isLandscape ? 0.04 : 0.065)}" width="${isLandscape ? 400 : 540}" height="${isLandscape ? 36 : 46}" rx="23" fill="#0f172a" fill-opacity="0.8" stroke="#fbbf24" stroke-width="2" />
    <text x="${width / 2}" y="${height * (isLandscape ? 0.04 : 0.065) + (isLandscape ? 24 : 31)}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${isLandscape ? 17 : 22}" fill="#fbbf24" text-anchor="middle" letter-spacing="4">
      ${v.subtitle}
    </text>

    <!-- Main Bold Title -->
    <text
      x="${width / 2}"
      y="${height * (isLandscape ? 0.16 : 0.165)}"
      font-family="Georgia, 'Times New Roman', serif"
      font-weight="900"
      font-size="${isLandscape ? 68 : 86}"
      fill="#FFFDF0"
      stroke="#1e1b4b"
      stroke-width="5"
      paint-order="stroke fill"
      text-anchor="middle"
      letter-spacing="2"
    >
      ${v.title}
    </text>
  </g>

  <!-- 9. MANDATORY WATERMARK: SUBTLE VERTICAL "SUSHIBEATS" ALONG RIGHT MARGIN -->
  <g transform="translate(${width - 28}, ${height * 0.50}) rotate(90)" opacity="0.75">
    <rect x="-85" y="-14" width="170" height="28" rx="14" fill="#020617" fill-opacity="0.65" stroke="#4338ca" stroke-width="1.5" />
    <text x="0" y="5" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="14" fill="#f8fafc" text-anchor="middle" letter-spacing="5">
      SUSHIBEATS
    </text>
    <circle cx="-65" cy="0" r="5" fill="#f43f5e" />
  </g>

  <!-- 10. AESTHETIC VIGNETTE & CRISP BORDER -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#312e81" stroke-width="${isLandscape ? 8 : 12}" opacity="0.6" />
</svg>
      `.trim();

      const base64 = Buffer.from(svg).toString('base64');
      results.push(`data:image/svg+xml;base64,${base64}`);
    }

    return results;
  }
}
