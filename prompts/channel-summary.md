You are an expert YouTube strategist and channel growth consultant.
Analyze the following channel metrics and performance data, and provide a clear, actionable, plain-English diagnosis.

## CHANNEL CONTEXT
- Channel Name: {{channelTitle}}
- Niche: {{niche}}
- Channel Description: {{channelDescription}}
- Total Subscribers: {{subscribers}}
- Total Videos: {{videoCount}}
- Total Views: {{totalViews}}

## LAST 90 DAYS ANALYTICS
- 90-Day Views: {{views90d}} ({{viewsTrend}}% vs prior 90d)
- 90-Day Watch Time (hours): {{watchTimeHours}}
- Average View Duration: {{avgViewDuration}}
- Impressions: {{impressions}}
- Click-Through Rate (CTR): {{ctr}}%
- Net Subscribers Gained: {{subscribersGained}}
- Traffic Sources Split: {{trafficSources}}
- Shorts vs Long-Form Split: {{shortsSplit}}

## TOP PERFORMING VIDEOS (Last 90 Days)
{{topVideos}}

## BOTTOM PERFORMING VIDEOS (Last 90 Days)
{{bottomVideos}}

## INSTRUCTIONS
Provide a diagnostic summary in valid JSON format matching this schema:
{
  "healthScore": <number from 1 to 100>,
  "headline": "<punchy 1-sentence channel status>",
  "whatIsWorking": [
    "<specific observation supported by the metrics>",
    "<specific observation supported by the metrics>",
    "<specific observation supported by the metrics>"
  ],
  "whatIsNotWorking": [
    "<critical bottleneck or dropoff area>",
    "<critical bottleneck or dropoff area>"
  ],
  "strategicShiftThisWeek": "<concise high-impact shift to make this week to boost CTR, retention, or subscriber conversion>",
  "focusMetrics": [
    { "metric": "<name e.g. CTR>", "current": "<value>", "target": "<value>", "action": "<brief fix>" }
  ]
}

Return ONLY the raw JSON object. Do not include markdown code block syntax or extra commentary.
