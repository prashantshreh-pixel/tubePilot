import { describe, it, expect, beforeAll } from 'vitest';
import { DatabaseService } from '../src/services/db/database';
import { encryptSecret, decryptSecret } from '../src/services/security/keychain';
import path from 'path';
import fs from 'fs';

describe('Security Keychain', () => {
  it('encrypts and decrypts secrets properly', () => {
    const secret = 'sk-ant-api03-test-token-12345';
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toBe(secret);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });
});

describe('SQLite Database Service', () => {
  const testDbPath = path.join(__dirname, 'test-tubepilot.sqlite');
  let db: DatabaseService;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new DatabaseService(testDbPath);
    await db.initialize();
  });

  it('initializes default settings and allows updates', () => {
    const settings = db.getSettings();
    expect(settings).toBeDefined();
    expect(settings.theme).toBe('dark');
    expect(settings.textProvider).toBe('claude');

    db.saveSettings({ theme: 'light', anthropicApiKey: 'test-key-999' });
    const updated = db.getSettings();
    expect(updated.theme).toBe('light');
    expect(updated.anthropicApiKey).toBe('test-key-999');
  });

  it('stores and retrieves analytics cache', () => {
    const cache = db.getAnalyticsCache();
    expect(cache).not.toBeNull();
    expect(cache?.channelInfo.title).toBe('CodeCraft & AI Tech');
    expect(cache?.views90d).toBeGreaterThan(0);
  });

  it('manages content ideas with full CRUD', () => {
    const ideas = db.getIdeas();
    expect(ideas.length).toBeGreaterThan(0);

    const newIdea = {
      id: 'test-idea-vitest',
      date: '2025-01-01',
      type: 'Short' as const,
      title: 'Vitest Unit Testing YouTube Video',
      hook: 'Can you test an entire YouTube channel with 1 command?',
      reason: 'Testing data persistence',
      targetKeyword: 'vitest tutorial',
      searchIntent: 'Informational',
      scriptOutline: ['Intro', 'Demo', 'Outro'],
      bestPostingTime: 'Friday 5PM',
      status: 'idea' as const,
      createdAt: new Date().toISOString(),
    };

    db.saveIdea(newIdea);
    const retrieved = db.getIdea('test-idea-vitest');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe(newIdea.title);

    db.deleteIdea('test-idea-vitest');
    expect(db.getIdea('test-idea-vitest')).toBeNull();
  });
});
