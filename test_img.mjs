import { dbService } from './src/services/db/database.js';

async function test() {
  await dbService.initialize();
  const settings = dbService.getSettings();
  console.log('Gemini key exists:', !!settings.geminiApiKey);
  if (!settings.geminiApiKey) {
    console.log('No gemini key in DB');
    return;
  }
  
  const prompt = "masterpiece anime artwork, lo-fi aesthetic girl studying at desk with headphones, rainy window, cozy warm lamp lighting, sushibeats watermark on side";

  // Test gemini-3.1-flash-image
  console.log('Testing gemini-3.1-flash-image...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    console.log('gemini-3.1-flash-image status:', res.status);
    const data = await res.json();
    if (res.ok) {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p.inlineData);
      console.log('Got inline image data:', !!imgPart);
    } else {
      console.log('Error payload:', JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    console.log('Error testing 3.1:', e.message);
  }

  // Test imagen-3.0-generate-002:predict
  console.log('Testing imagen-3.0-generate-002:predict...');
  try {
    const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '16:9' }
      })
    });
    console.log('imagen status:', res2.status);
    const data2 = await res2.json();
    if (res2.ok) {
      console.log('Got prediction:', !!data2.predictions?.[0]?.bytesBase64Encoded);
    } else {
      console.log('Imagen Error:', JSON.stringify(data2).slice(0, 300));
    }
  } catch (e) {
    console.log('Error testing imagen:', e.message);
  }
}

test();
