import { TextProvider } from './TextProvider';

export class MockTextProvider implements TextProvider {
  public name = 'TubePilot Local AI Engine (Demo/Fallback)';

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Channel Diagnosis
    if (userPrompt.includes('healthScore') || userPrompt.includes('whatIsWorking') || systemPrompt.includes('YouTube strategist')) {
      return JSON.stringify({
        healthScore: 88,
        headline: 'Strong search discoverability with massive upside in Short-to-Long audience retention loops.',
        whatIsWorking: [
          'Short-form retention is averaging 114%, resulting in strong algorithmic push on the YouTube Shorts shelf.',
          'Case study titles with specific timeline claims ("in 48 Hours") generate 9.8% CTR.',
          'Evergreen search keywords account for 46% of total channel traffic, providing stable baseline watch time.',
        ],
        whatIsNotWorking: [
          'Vague curiosity titles without a distinct hook experience 45% drop-off within the first 15 seconds.',
          'Hashtag dilution in past video descriptions caused algorithmic misclassification.',
        ],
        strategicShiftThisWeek: 'Implement high-contrast 3-word thumbnail overlays and frontload the core promise in the first 2 lines of the video description.',
        focusMetrics: [
          { metric: 'Click-Through Rate (CTR)', current: '7.4%', target: '9.2%', action: 'Rule of thirds composition + bold yellow overlay' },
          { metric: 'First 30s Retention', current: '52%', target: '68%', action: 'Cut channel intros; start with immediate problem hook' },
        ],
      });
    }

    // 2. Daily Ideas
    if (userPrompt.includes('bestPostingTime') || userPrompt.includes('scriptOutline') || systemPrompt.includes('daily content plan')) {
      return JSON.stringify({
        date: today,
        ideas: [
          {
            id: `idea-${Date.now()}-1`,
            type: 'Short',
            title: 'Stop Using Loops In Python! Do This Instead #Shorts',
            hook: 'If your Python script takes more than 10 seconds, you are definitely making this beginner loop mistake.',
            reason: 'Contrarian programming tips yield 115%+ replay rates and spark fierce debate in the comment section.',
            targetKeyword: 'python performance tips',
            searchIntent: 'Educational / Problem Avoidance',
            scriptOutline: [
              '0-3s: Screaming CPU usage graph overlay with red alarm',
              '3-12s: Slow for-loop code benchmarked on screen',
              '12-22s: Vectorized NumPy / List comprehension running 50x faster',
              '22-28s: Seamless transition loop back into the hook line',
            ],
            bestPostingTime: 'Wednesday at 5:00 PM EST',
          },
          {
            id: `idea-${Date.now()}-2`,
            type: 'Short',
            title: '3 Secret VS Code Extensions For 10x Speed #Shorts',
            hook: 'I tested 50 developer extensions this month. These 3 will save you 10 hours of manual typing every week.',
            reason: 'Tool curation videos consistently score above 11% CTR on developer channels.',
            targetKeyword: 'best vs code extensions',
            searchIntent: 'Productivity & Tool Discovery',
            scriptOutline: [
              '0-3s: Visual speedrun of code being written with hotkeys',
              '3-11s: Tool 1: AI inline autocomplete workflow',
              '11-19s: Tool 2: Instant API tester inside the editor',
              '19-27s: Tool 3: Automated test generator and error visualizer',
            ],
            bestPostingTime: 'Thursday at 6:30 PM EST',
          },
          {
            id: `idea-${Date.now()}-3`,
            type: 'Long',
            title: 'How Senior Engineers Write Clean Code (Full Architecture)',
            hook: 'Junior developers write code that works. Senior engineers write code that is impossible to break.',
            reason: 'Addresses the most frequent question from your top-viewed tutorial with estimated 450+ watch minutes per view.',
            targetKeyword: 'clean code architecture tutorial',
            searchIntent: 'Comprehensive Implementation Guide',
            scriptOutline: [
              '00:00 - The Senior vs Junior Mindset Shift',
              '03:20 - Real World Refactoring: 500-Line File into Clean Modules',
              '08:45 - Dependency Injection and Domain Boundaries Made Simple',
              '14:10 - Writing Bulletproof Unit Tests without Boilerplate',
              '18:30 - Check-list Summary and GitHub Repository Walkthrough',
            ],
            bestPostingTime: 'Saturday at 11:00 AM EST',
          },
        ],
      });
    }

    // 3. Thumbnail Prompt
    if (userPrompt.includes('predictedCTRScore') || systemPrompt.includes('thumbnail designer')) {
      return JSON.stringify({
        imagePrompt: 'Ultra high-definition YouTube thumbnail photograph, extreme close-up of a focused software engineer with wide eyes and intense expression of revelation, pointing towards a massive glowing holographic code interface, cinematic neon cyan and energetic amber lighting, dark moody tech background with depth of field blur, photorealistic 8k, aspect ratio 16:9, high emotional contrast',
        negativePrompt: 'blurry, washed out, small cluttered text, low resolution, multiple fingers, distorted eyes, watermark',
        textOverlay: {
          text: 'STOP DOING THIS!',
          suggestedPlacement: 'top-left',
          fontColor: '#FFE500',
          psychologicalTrigger: 'Urgent Mistake Avoidance',
        },
        checklist: {
          highContrast: true,
          mobileReadable: true,
          singleFocalPoint: true,
          curiosityGap: 'Visualizes an extreme breakthrough contrast that compels immediate click-through.',
        },
        predictedCTRScore: 93,
        expertCritique: 'Excellent psychological tension with the high-voltage neon palette. The 3-word warning overlay is easily legible even at 80px mobile thumbnail resolution.',
      });
    }

    // 4. Loop Video Prompt
    if (userPrompt.includes('loopTechnique') || systemPrompt.includes('loop animator')) {
      return JSON.stringify({
        videoPrompt: 'Seamless 360 continuous rotational pan around a glowing futuristic server rack with swirling ambient neon particles, hyper-smooth camera motion, moody cyberpunk volumetric lighting, the final frame aligns exactly with the opening frame, unbroken cyclic motion, 4k 60fps photorealistic cinematic render',
        cameraMotion: 'Continuous steady rotational orbit with subtle slow push-in',
        lightingStyle: 'Deep twilight obsidian with vibrant cobalt and magenta rim glows',
        loopTechnique: 'seamless_crossfade',
        ambientAudioPrompt: 'Deep atmospheric lo-fi synth drone with gentle melodic tape flutter, seamless 30-second loop',
        loopRetentionTip: 'End your voiceover on an incomplete inquisitive thought ("and the crazy part is...") that directly flows into the opening frame.',
      });
    }

    // 5. Upload Kit Long
    if (userPrompt.includes('chapters') || systemPrompt.includes('long-form YouTube video')) {
      return JSON.stringify({
        titles: [
          'Senior Engineers Write Code Differently (Here is How)',
          'How To Write Clean Code Like a Senior Engineer in 2025',
          'The Clean Architecture Secret That Transformed My Career',
        ],
        description: `Junior developers write code that works. Senior engineers design systems that never break. In this deep dive, we break down the exact architecture patterns used by top tech leads.\n\nHere is what you will learn step-by-step:\n- How to structure clean boundaries without over-engineering\n- Refactoring messy spaghetti code into modular services\n- Real world production testing strategies\n\n📌 TIMESTAMPS:\n00:00 - The Senior vs Junior Mindset\n02:40 - The Fatal Architecture Mistake\n06:15 - Modular Domain Boundaries\n11:30 - Live Code Refactoring\n16:45 - Key Rules Summary\n\n🔔 Subscribe for weekly developer tutorials\n💻 GitHub Code: https://github.com/example/tubepilot-clean-code\n\n#SoftwareEngineering #CleanCode #WebDev #CodingTutorial`,
        hashtags: ['#SoftwareEngineering', '#CleanCode', '#WebDev', '#CodingTutorial'],
        backendTags: [
          'clean code',
          'software engineering',
          'coding tutorial',
          'senior developer tips',
          'clean architecture',
          'javascript',
          'python programming',
          'software design patterns',
        ],
        chapters: [
          { timestamp: '00:00', title: 'The Senior vs Junior Mindset' },
          { timestamp: '02:40', title: 'The Fatal Architecture Mistake' },
          { timestamp: '06:15', title: 'Modular Domain Boundaries' },
          { timestamp: '11:30', title: 'Live Code Refactoring' },
          { timestamp: '16:45', title: 'Key Rules Summary' },
        ],
        pinnedComment: 'What is the biggest architecture mistake you’ve seen in a production codebase? Let’s discuss in the comments!',
        endScreenSuggestion: 'Watch our Full-Stack Architecture Masterclass next!',
        seoScore: 96,
        seoBreakdown: {
          titleOptimization: 'Primary keyword front-loaded within 56 characters',
          descriptionFold: 'Compelling retention hook positioned above the "Show more" cut',
          hashtagIntegrity: 'Exactly 4 targeted tags (1 broad, 2 niche, 1 specific)',
        },
        whyTheseHashtags: 'We selected exactly 4 tags: #SoftwareEngineering (broad topic anchor), #CleanCode & #WebDev (niche search terms), and #CodingTutorial (intent qualifier). Keeping under 5 hashtags ensures YouTube renders the top 3 prominently above the video title while avoiding algorithmic spam filtering.',
      });
    }

    // 6. Upload Kit Short
    return JSON.stringify({
      titles: [
        'Stop Using Loops In Python! #Shorts',
        'The #1 Python Mistake #Shorts',
        '50x Faster Python Tricks #Shorts',
      ],
      description: 'Stop using basic loops for large datasets. Use vectorized comprehensions for 50x faster code! #Shorts #Python #Programming #DevTips',
      hashtags: ['#Shorts', '#Python', '#Programming', '#DevTips'],
      backendTags: ['shorts', 'python', 'programming', 'code speed', 'python tips'],
      onScreenTextHook: 'STOP USING PYTHON LOOPS!',
      pinnedComment: 'Did you know about this Python trick? Drop your benchmark results below! 👇',
      loopTip: 'Cut the video immediately as the last word is spoken so the re-play feels completely instantaneous.',
      seoScore: 94,
      seoBreakdown: {
        length: 'Under 38 characters for full mobile feed visibility',
        hashtagIndex: '#Shorts placed prominently for shelf discovery',
      },
      whyTheseHashtags: '#Shorts flags the video for the vertical shelf, while #Python and #DevTips route the video directly to developer search feeds. Never exceed 5 hashtags on Shorts.',
    });
  }
}
