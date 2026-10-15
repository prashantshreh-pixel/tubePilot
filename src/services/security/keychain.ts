import { safeStorage } from 'electron';
import crypto from 'crypto';
import os from 'os';

// Fallback encryption key generated from machine ID & user info
function getFallbackKey(): Buffer {
  const machineId = `${os.hostname()}-${os.platform()}-${os.userInfo().username}-tubepilot-key`;
  return crypto.createHash('sha256').update(machineId).digest();
}

/**
 * Encrypts a sensitive string (API key, OAuth token).
 * Uses Electron's native safeStorage (OS Keychain / DPAPI) when available,
 * with AES-256-GCM fallback.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';

  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const encryptedBuffer = safeStorage.encryptString(plainText);
      return `safe:${encryptedBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.warn('[Security] safeStorage encrypt failed, using fallback:', err);
  }

  // Fallback AES-256-GCM
  const key = getFallbackKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `aes:${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts an encrypted secret string.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';

  if (cipherText.startsWith('safe:')) {
    try {
      const base64Data = cipherText.slice(5);
      const buffer = Buffer.from(base64Data, 'base64');
      return safeStorage.decryptString(buffer);
    } catch (err) {
      console.error('[Security] safeStorage decrypt failed:', err);
      return '';
    }
  }

  if (cipherText.startsWith('aes:')) {
    try {
      const parts = cipherText.slice(4).split(':');
      if (parts.length !== 3) return '';
      const [ivHex, tagHex, encryptedHex] = parts;
      const key = getFallbackKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[Security] AES fallback decrypt failed:', err);
      return '';
    }
  }

  // If plain (legacy or unencrypted)
  return cipherText;
}
