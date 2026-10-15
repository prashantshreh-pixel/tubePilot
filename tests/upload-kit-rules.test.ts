import { describe, it, expect } from 'vitest';
import { MockTextProvider } from '../src/providers/text/MockTextProvider';

describe('YouTube Upload Kit Optimization Rules', () => {
  const mockProvider = new MockTextProvider();

  it('generates a long-form video kit that strictly obeys YouTube constraints', async () => {
    const raw = await mockProvider.generateText(
      'You are an elite YouTube SEO strategist for long-form YouTube video.',
      'videoTitle: Clean Architecture\nchapters: yes'
    );
    const kit = JSON.parse(raw);

    // 1. Long video titles: 3 options, each under 60 characters
    expect(kit.titles).toBeInstanceOf(Array);
    expect(kit.titles.length).toBe(3);
    for (const title of kit.titles) {
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title.length).toBeGreaterThan(10);
    }

    // 2. Hashtags: strictly 3 to 5 (never > 15)
    expect(kit.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(kit.hashtags.length).toBeLessThanOrEqual(5);
    for (const tag of kit.hashtags) {
      expect(tag.startsWith('#')).toBe(true);
    }

    // 3. Backend tags: 8 to 12 relevant tags with primary keyword
    expect(kit.backendTags.length).toBeGreaterThanOrEqual(8);
    expect(kit.backendTags.length).toBeLessThanOrEqual(12);

    // 4. Description fold-optimized
    expect(kit.description.length).toBeGreaterThan(100);
    expect(kit.chapters.length).toBeGreaterThanOrEqual(3);
    expect(kit.chapters[0].timestamp).toBe('00:00');

    // 5. Educational rationale
    expect(kit.whyTheseHashtags).toBeDefined();
    expect(kit.whyTheseHashtags.length).toBeGreaterThan(20);
    expect(kit.seoScore).toBeGreaterThanOrEqual(85);
  });

  it('generates a Shorts upload kit that strictly obeys YouTube Shorts rules', async () => {
    const raw = await mockProvider.generateText(
      'You are an elite YouTube Shorts algorithm specialist.',
      'videoTitle: Python Loops\nonScreenTextHook: yes'
    );
    const kit = JSON.parse(raw);

    // 1. Shorts titles: under 40 characters and naturally contains #Shorts
    expect(kit.titles.length).toBeGreaterThanOrEqual(1);
    for (const title of kit.titles) {
      expect(title.length).toBeLessThanOrEqual(40);
      expect(title.toLowerCase()).toContain('#shorts');
    }

    // 2. Hashtags: 3 to 5 including #Shorts
    expect(kit.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(kit.hashtags.length).toBeLessThanOrEqual(5);
    expect(kit.hashtags).toContain('#Shorts');

    // 3. First-line on-screen hook and loop retention tip
    expect(kit.onScreenTextHook).toBeDefined();
    expect(kit.loopTip).toBeDefined();
    expect(kit.loopTip.length).toBeGreaterThan(15);
  });
});
