/**
 * Crypto utilities for serverless LLM proxy:
 * - AES-256-GCM encryption/decryption for LLM credentials at rest.
 * - One-way salted IP hashing with daily rotation for rate limiting.
 */

const crypto = require('crypto');

const DEFAULT_SECRET = 'dev-secret-key-32-bytes-agent-llm-proxy';
const DEFAULT_SALT = 'daily-agent-ip-salt-key';

/**
 * Derives a consistent 32-byte (256-bit) buffer key from any string secret.
 * @param {string} [secret]
 * @returns {Buffer}
 */
function deriveKey(secret) {
  const chosenSecret = secret || process.env.ENCRYPTION_SECRET || process.env.REACT_APP_ENCRYPTION_SECRET || DEFAULT_SECRET;
  return crypto.createHash('sha256').update(String(chosenSecret)).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string} plaintext
 * @param {string} [secret]
 * @returns {{ encrypted: string, iv: string, authTag: string, serialized: string }}
 */
function encrypt(plaintext, secret) {
  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext must be a string');
  }

  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12); // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return {
    encrypted,
    iv: ivHex,
    authTag,
    serialized: `${ivHex}:${authTag}:${encrypted}`
  };
}

/**
 * Decrypts AES-256-GCM encrypted data.
 * Supports:
 * - Serialized string ("iv:authTag:encrypted")
 * - Object ({ encrypted, iv, authTag })
 * - Direct arguments (encrypted, secret, iv, authTag)
 * 
 * @param {string|object} input
 * @param {string} [secret]
 * @param {string} [ivArg]
 * @param {string} [tagArg]
 * @returns {string} Decrypted plaintext
 */
function decrypt(input, secret, ivArg, tagArg) {
  let encryptedHex = '';
  let ivHex = '';
  let authTagHex = '';

  if (typeof input === 'string') {
    if (input.includes(':')) {
      const parts = input.split(':');
      if (parts.length === 3) {
        ivHex = parts[0];
        authTagHex = parts[1];
        encryptedHex = parts[2];
      } else {
        throw new Error('Invalid serialized ciphertext format. Expected iv:authTag:encrypted');
      }
    } else {
      encryptedHex = input;
      ivHex = ivArg;
      authTagHex = tagArg;
    }
  } else if (input && typeof input === 'object') {
    encryptedHex = input.encrypted || input.api_key_encrypted || '';
    ivHex = input.iv || '';
    authTagHex = input.authTag || input.auth_tag || '';
  } else {
    throw new TypeError('Input must be a serialized string or an object with encrypted, iv, and authTag');
  }

  if (!encryptedHex || !ivHex || !authTagHex) {
    throw new Error('Missing encrypted payload, iv, or auth tag');
  }

  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Computes a one-way daily salted hash of the client IP address.
 * Formula: sha256(ip + date + SALT)
 * Ensures user IP cannot be reversed while strictly isolating daily rate limits.
 * 
 * @param {string} ip
 * @param {string} [dateStr] YYYY-MM-DD (defaults to UTC current date)
 * @param {string} [salt]
 * @returns {string} 64-character hex SHA-256 hash
 */
function hashIp(ip, dateStr, salt) {
  const safeIp = String(ip || '127.0.0.1').trim();
  const safeDate = String(dateStr || new Date().toISOString().slice(0, 10)).trim();
  const safeSalt = String(salt || process.env.IP_HASH_SALT || DEFAULT_SALT).trim();

  return crypto
    .createHash('sha256')
    .update(`${safeIp}:${safeDate}:${safeSalt}`)
    .digest('hex');
}

module.exports = {
  deriveKey,
  encrypt,
  decrypt,
  hashIp,
  DEFAULT_SECRET,
  DEFAULT_SALT
};
