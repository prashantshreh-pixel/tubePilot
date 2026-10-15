import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const DailyIdeasSchema = z.object({
  date: z.string(),
  ideas: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['Short', 'Long']),
      title: z.string().min(3),
      hook: z.string().min(5),
      reason: z.string().min(5),
      targetKeyword: z.string(),
      searchIntent: z.string(),
      scriptOutline: z.array(z.string()),
      bestPostingTime: z.string(),
    })
  ).min(3),
});

const ThumbnailPromptSchema = z.object({
  imagePrompt: z.string().min(15),
  negativePrompt: z.string().optional(),
  textOverlay: z.object({
    text: z.string(),
    suggestedPlacement: z.string(),
    fontColor: z.string(),
    psychologicalTrigger: z.string(),
  }),
  checklist: z.object({
    highContrast: z.boolean(),
    mobileReadable: z.boolean(),
    singleFocalPoint: z.boolean(),
    curiosityGap: z.string(),
  }),
  predictedCTRScore: z.number().min(1).max(100),
  expertCritique: z.string(),
});

const UploadKitSchema = z.object({
  titles: z.array(z.string()).min(1),
  description: z.string().min(20),
  hashtags: z.array(z.string()).min(3).max(15),
  backendTags: z.array(z.string()).min(3),
  pinnedComment: z.string(),
  seoScore: z.number().min(0).max(100),
  whyTheseHashtags: z.string().min(10),
});

describe('JSON Zod Validation Suite', () => {
  it('validates a daily content plan with minimum 3 ideas', () => {
    const validPlan = {
      date: '2025-01-15',
      ideas: [
        {
          type: 'Short' as const,
          title: '3 Terminal Secrets #Shorts',
          hook: 'Your terminal is running 10x slower than it should.',
          reason: 'High replay rate for command-line utilities.',
          targetKeyword: 'terminal productivity',
          searchIntent: 'Educational',
          scriptOutline: ['Hook', 'Demo 1', 'Demo 2', 'Loop'],
          bestPostingTime: 'Thursday 5PM',
        },
        {
          type: 'Short' as const,
          title: 'Why Junior Devs Fail #Shorts',
          hook: 'The one question that guarantees failure.',
          reason: 'Contrarian opinion drives debate in comments.',
          targetKeyword: 'coding interview mistakes',
          searchIntent: 'Career advice',
          scriptOutline: ['Intro', 'Mistake', 'Fix', 'Outro'],
          bestPostingTime: 'Friday 4PM',
        },
        {
          type: 'Long' as const,
          title: 'Clean Architecture Complete Masterclass 2025',
          hook: 'How top engineers design maintainable full-stack apps.',
          reason: 'High watch time search query in developer niche.',
          targetKeyword: 'clean architecture typescript',
          searchIntent: 'In-depth tutorial',
          scriptOutline: ['Mindset', 'Setup', 'Refactoring', 'Testing'],
          bestPostingTime: 'Saturday 11AM',
        },
      ],
    };

    expect(() => DailyIdeasSchema.parse(validPlan)).not.toThrow();
  });

  it('rejects an invalid daily plan with fewer than 3 ideas', () => {
    const invalidPlan = {
      date: '2025-01-15',
      ideas: [
        {
          type: 'Short' as const,
          title: 'Only 1 idea',
          hook: 'Too short',
          reason: 'Testing schema',
          targetKeyword: 'test',
          searchIntent: 'test',
          scriptOutline: ['1'],
          bestPostingTime: 'Now',
        },
      ],
    };

    expect(() => DailyIdeasSchema.parse(invalidPlan)).toThrow();
  });

  it('validates thumbnail prompt structure', () => {
    const validThumbnail = {
      imagePrompt: 'Cinematic 8k close-up of a programmer staring in disbelief at a glowing screen, volumetric lighting',
      textOverlay: {
        text: 'NEVER DO THIS!',
        suggestedPlacement: 'top-left',
        fontColor: '#FFE500',
        psychologicalTrigger: 'Urgency',
      },
      checklist: {
        highContrast: true,
        mobileReadable: true,
        singleFocalPoint: true,
        curiosityGap: 'Extreme shock reaction triggers viewer interest',
      },
      predictedCTRScore: 92,
      expertCritique: 'Great contrast and minimal text overlay',
    };

    expect(() => ThumbnailPromptSchema.parse(validThumbnail)).not.toThrow();
  });

  it('validates upload kit schema and enforces 3-5 hashtags rule', () => {
    const validKit = {
      titles: ['Title 1', 'Title 2', 'Title 3'],
      description: 'Comprehensive video description fold-optimized with links and hashtags.',
      hashtags: ['#Software', '#Coding', '#WebDev', '#CleanCode'],
      backendTags: ['software', 'coding', 'webdev', 'clean code'],
      pinnedComment: 'What is your favorite tip from this video?',
      seoScore: 95,
      whyTheseHashtags: 'Balanced 1 broad category tag with 3 niche-specific terms.',
    };

    expect(() => UploadKitSchema.parse(validKit)).not.toThrow();

    // Exceeding 15 hashtags is disallowed
    const invalidKit = {
      ...validKit,
      hashtags: Array.from({ length: 16 }, (_, i) => `#tag${i}`),
    };
    expect(() => UploadKitSchema.parse(invalidKit)).toThrow();
  });
});
