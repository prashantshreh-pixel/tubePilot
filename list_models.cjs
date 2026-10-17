const { app, safeStorage } = require('electron');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const dir = process.env.APPDATA || '.';
  const dbPath = path.join(dir, 'TubePilot', 'tubepilot.sqlite');
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(dbPath);
  const db = new SQL.Database(new Uint8Array(buf));
  const res = db.exec('SELECT key, value FROM settings');
  const settings = JSON.parse(res[0].values[0][1]);
  
  let geminiKey = settings.geminiApiKey;
  if (geminiKey && geminiKey.startsWith('safe:')) {
    geminiKey = safeStorage.decryptString(Buffer.from(geminiKey.slice(5), 'base64'));
  }
  
  console.log('Gemini Key:', geminiKey ? geminiKey.slice(0, 10) + '...' : 'none');

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    const d = await r.json();
    if (d.models) {
      console.log('Found ' + d.models.length + ' models:');
      const imageOrGenModels = d.models.filter(m => 
        m.name.includes('image') || 
        m.name.includes('imagen') || 
        m.supportedGenerationMethods.some(method => method.includes('image') || method.includes('generateImages'))
      );
      console.log('Image-related models:', JSON.stringify(imageOrGenModels, null, 2));
      
      const allNames = d.models.map(m => m.name.replace('models/', ''));
      console.log('All model names:', allNames.join(', '));
    } else {
      console.log('Models error:', JSON.stringify(d));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  app.exit(0);
});
