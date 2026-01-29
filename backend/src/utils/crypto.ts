import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encryptName(plain: string) {
  const key = Buffer.from(process.env.AES_KEY || '', 'base64');
  if (!key || key.length !== 32) throw new Error('Invalid AES_KEY');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptName(ciphertext: string) {
  const data = Buffer.from(ciphertext, 'base64');
  const key = Buffer.from(process.env.AES_KEY || '', 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}