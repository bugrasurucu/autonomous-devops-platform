import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const V2_PREFIX = 'v2:';

function deriveKey(rawSecret: string): Buffer {
    return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts plaintext using Node.js native AES-256-GCM.
 * Output format: `v2:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptSecret(plaintext: string, rawSecret: string): string {
    const key = deriveKey(rawSecret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${V2_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a secret produced by `encryptSecret` (AES-256-GCM `v2:...`),
 * with transparent backward-compatibility for legacy CryptoJS ciphertexts.
 */
export function decryptSecret(ciphertext: string, rawSecret: string): string {
    if (!ciphertext) return '';
    if (ciphertext.startsWith(V2_PREFIX)) {
        const parts = ciphertext.slice(V2_PREFIX.length).split(':');
        if (parts.length !== 3) {
            throw new Error('Malformed v2 encrypted payload');
        }
        const [ivHex, authTagHex, encryptedHex] = parts;
        const key = deriveKey(rawSecret);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }

    // Legacy fallback for existing CryptoJS ciphertexts in DB
    const bytes = CryptoJS.AES.decrypt(ciphertext, rawSecret);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Creates an HMAC-SHA256 signed, time-limited OAuth state parameter to prevent CSRF.
 */
export function signOAuthState(userId: string, secret: string, ttlMs = 10 * 60 * 1000): string {
    const exp = Date.now() + ttlMs;
    const nonce = crypto.randomBytes(8).toString('hex');
    const payload = `${userId}.${exp}.${nonce}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return Buffer.from(`${payload}.${sig}`, 'utf8').toString('base64url');
}

/**
 * Verifies an HMAC-SHA256 signed OAuth state parameter and returns the `userId`.
 */
export function verifyOAuthState(stateToken: string, secret: string): string | null {
    try {
        const decoded = Buffer.from(stateToken, 'base64url').toString('utf8');
        const parts = decoded.split('.');
        if (parts.length !== 4) return null;
        const [userId, expStr, nonce, providedSig] = parts;
        const exp = Number(expStr);
        if (!userId || Number.isNaN(exp) || Date.now() > exp) {
            return null;
        }
        const payload = `${userId}.${expStr}.${nonce}`;
        const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const a = Buffer.from(providedSig, 'hex');
        const b = Buffer.from(expectedSig, 'hex');
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return null;
        }
        return userId;
    } catch {
        return null;
    }
}

