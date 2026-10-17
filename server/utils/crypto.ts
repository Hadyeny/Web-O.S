import crypto from 'crypto';

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'plioou_master_encryption_key_32bytes_sec!';
// Derive a strictly 32-byte key using sha256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'plioou_hmac_signature_secret_2026!';

/**
 * Encrypts sensitive string data using AES-256-GCM.
 * Output format: iv:tag:ciphertext in hex encoding.
 */
export function encryptField(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted field.
 */
export function decryptField(cipherWithIvAndTag: string): string {
  if (!cipherWithIvAndTag || !cipherWithIvAndTag.includes(':')) return '';
  try {
    const parts = cipherWithIvAndTag.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '[DESCRIPTOGRAFIA_FALHOU]';
  }
}

/**
 * Redacts any passwords or credentials found in free-text fields.
 */
export function redactSensitiveText(text: string): { redactedText: string; foundSecrets: string[] } {
  if (!text) return { redactedText: '', foundSecrets: [] };
  const foundSecrets: string[] = [];
  // Match common password patterns like "senha: xyz", "pwd: xyz", "senha xyz"
  const passwordRegex = /(?:senha|password|pass|pwd|chave|pin)[\s:=]+([^\s,;.]+)/gi;
  const redactedText = text.replace(passwordRegex, (match, secret) => {
    foundSecrets.push(secret);
    return match.replace(secret, '[REDACTED]');
  });
  return { redactedText, foundSecrets };
}

/**
 * Generates an HMAC-SHA256 signature for remote OS signing link.
 * Default expiration is 7 days from now.
 */
export function generateRemoteSignatureToken(osId: string, ttlSeconds: number = 7 * 24 * 3600): { exp: number; sig: string; urlParams: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${osId}:${exp}`;
  const sig = crypto.createHmac('sha256', SIGNATURE_SECRET).update(payload).digest('hex');
  return {
    exp,
    sig,
    urlParams: `assinar=${encodeURIComponent(osId)}&exp=${exp}&sig=${sig}`,
  };
}

/**
 * Verifies the validity and expiration of an HMAC-SHA256 signature token.
 */
export function verifyRemoteSignatureToken(osId: string, expStr?: string | number, sig?: string): { valid: boolean; reason?: string } {
  if (!osId) {
    return { valid: false, reason: 'ID da O.S. ausente.' };
  }
  if (!expStr || !sig) {
    return { valid: false, reason: 'Parâmetros de assinatura digital (exp, sig) ausentes.' };
  }

  const exp = Number(expStr);
  if (isNaN(exp)) {
    return { valid: false, reason: 'Timestamp de expiração inválido.' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > exp) {
    return { valid: false, reason: 'Link de assinatura expirou (validade máxima de 7 dias).' };
  }

  const expectedPayload = `${osId}:${exp}`;
  const expectedSig = crypto.createHmac('sha256', SIGNATURE_SECRET).update(expectedPayload).digest('hex');

  // Constant-time buffer comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');
  const actualBuffer = Buffer.from(String(sig), 'utf8');

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { valid: false, reason: 'Assinatura digital inválida ou adulterada.' };
  }

  return { valid: true };
}
