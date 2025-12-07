/**
 * Encryption Utility Module
 * 
 * Provides field-level encryption for sensitive data at rest using AES-256-GCM.
 * Supports key rotation, versioning, and deterministic encryption for searchable fields.
 * 
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Key versioning for rotation support
 * - Deterministic encryption for searchable fields (like email)
 * - Random IV generation for maximum security
 * - Automatic key derivation from master key
 * - Support for multiple encryption keys
 * 
 * Security Considerations:
 * - Master key must be stored in environment variable (ENCRYPTION_MASTER_KEY)
 * - Keys are derived using PBKDF2 with unique salts
 * - Each encrypted value includes version, IV, and auth tag
 * - Deterministic encryption uses fixed IV for same plaintext = same ciphertext
 */

import crypto from 'crypto';

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const ENCODING = 'base64';

/**
 * Get encryption master key from environment
 * @returns {string} Master key
 * @throws {Error} If master key not configured
 */
function getMasterKey() {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set. Please configure encryption.');
  }
  
  if (masterKey.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters long.');
  }
  
  return masterKey;
}

/**
 * Derive encryption key from master key and salt using PBKDF2
 * @param {string} masterKey - Master key
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Generate a new encryption key with salt
 * @returns {Object} Key object with version, salt, and creation date
 */
export function generateEncryptionKey() {
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  return {
    version: Date.now(), // Use timestamp as version
    salt: salt.toString(ENCODING),
    createdAt: new Date(),
    isActive: true
  };
}

/**
 * Encrypt a value using specified key version
 * @param {string} plaintext - Value to encrypt
 * @param {Object} keyData - Key data object from EncryptionKey model
 * @param {boolean} deterministic - Use deterministic encryption (for searchable fields)
 * @returns {string} Encrypted value in format: version:iv:authTag:ciphertext
 */
export function encrypt(plaintext, keyData, deterministic = false) {
  if (!plaintext) {
    return null;
  }
  
  try {
    const masterKey = getMasterKey();
    const salt = Buffer.from(keyData.salt, ENCODING);
    const key = deriveKey(masterKey, salt);
    
    // Generate IV (deterministic uses hash of plaintext, random otherwise)
    const iv = deterministic 
      ? crypto.createHash('sha256').update(plaintext).digest().slice(0, IV_LENGTH)
      : crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', ENCODING);
    ciphertext += cipher.final(ENCODING);
    
    const authTag = cipher.getAuthTag();
    
    // Format: version:iv:authTag:ciphertext
    return [
      keyData.version,
      iv.toString(ENCODING),
      authTag.toString(ENCODING),
      ciphertext
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted value
 * @param {string} encryptedValue - Encrypted value from database
 * @param {Function} getKeyByVersion - Function to retrieve key data by version
 * @returns {string} Decrypted plaintext
 */
export async function decrypt(encryptedValue, getKeyByVersion) {
  if (!encryptedValue) {
    return null;
  }
  
  try {
    const parts = encryptedValue.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted value format');
    }
    
    const [version, ivString, authTagString, ciphertext] = parts;
    
    // Get key data for this version
    const keyData = await getKeyByVersion(parseInt(version));
    
    if (!keyData) {
      throw new Error(`Encryption key version ${version} not found`);
    }
    
    const masterKey = getMasterKey();
    const salt = Buffer.from(keyData.salt, ENCODING);
    const key = deriveKey(masterKey, salt);
    const iv = Buffer.from(ivString, ENCODING);
    const authTag = Buffer.from(authTagString, ENCODING);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertext, ENCODING, 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Re-encrypt a value with a new key version
 * @param {string} encryptedValue - Currently encrypted value
 * @param {Function} getKeyByVersion - Function to retrieve key data by version
 * @param {Object} newKeyData - New key data to encrypt with
 * @param {boolean} deterministic - Use deterministic encryption
 * @returns {string} Re-encrypted value with new key version
 */
export async function reencrypt(encryptedValue, getKeyByVersion, newKeyData, deterministic = false) {
  if (!encryptedValue) {
    return null;
  }
  
  try {
    // Decrypt with old key
    const plaintext = await decrypt(encryptedValue, getKeyByVersion);
    
    // Encrypt with new key
    return encrypt(plaintext, newKeyData, deterministic);
  } catch (error) {
    console.error('Re-encryption error:', error.message);
    throw new Error('Failed to re-encrypt data');
  }
}

/**
 * Hash a value for deterministic searching
 * Used to create searchable indexes without storing plaintext
 * @param {string} value - Value to hash
 * @returns {string} SHA-256 hash
 */
export function hashForSearch(value) {
  if (!value) {
    return null;
  }
  
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Encrypt multiple fields in a document
 * @param {Object} document - Document with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @param {Object} keyData - Active encryption key data
 * @param {Array<string>} deterministicFields - Fields requiring deterministic encryption
 * @returns {Object} Document with encrypted fields
 */
export function encryptFields(document, fields, keyData, deterministicFields = []) {
  const encrypted = { ...document };
  
  for (const field of fields) {
    if (encrypted[field]) {
      const deterministic = deterministicFields.includes(field);
      encrypted[field] = encrypt(encrypted[field], keyData, deterministic);
      
      // Add search hash for deterministic fields
      if (deterministic) {
        encrypted[`${field}Hash`] = hashForSearch(document[field]);
      }
    }
  }
  
  return encrypted;
}

/**
 * Decrypt multiple fields in a document
 * @param {Object} document - Document with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @param {Function} getKeyByVersion - Function to retrieve key data by version
 * @returns {Object} Document with decrypted fields
 */
export async function decryptFields(document, fields, getKeyByVersion) {
  const decrypted = { ...document };
  
  for (const field of fields) {
    if (decrypted[field]) {
      try {
        decrypted[field] = await decrypt(decrypted[field], getKeyByVersion);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        decrypted[field] = null; // Set to null if decryption fails
      }
    }
  }
  
  return decrypted;
}

/**
 * Check if encryption is properly configured
 * @returns {boolean} True if encryption is configured
 */
export function isEncryptionConfigured() {
  try {
    getMasterKey();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a random master key (for initial setup)
 * @returns {string} Random master key (hex encoded)
 */
export function generateMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate master key strength
 * @param {string} masterKey - Master key to validate
 * @returns {Object} Validation result with strength and recommendations
 */
export function validateMasterKey(masterKey) {
  const result = {
    valid: true,
    strength: 'strong',
    issues: [],
    recommendations: []
  };
  
  if (!masterKey) {
    result.valid = false;
    result.strength = 'none';
    result.issues.push('Master key is required');
    return result;
  }
  
  if (masterKey.length < 32) {
    result.valid = false;
    result.strength = 'weak';
    result.issues.push('Master key must be at least 32 characters');
  }
  
  if (masterKey.length < 64) {
    result.strength = 'medium';
    result.recommendations.push('Consider using a longer key (64+ characters) for maximum security');
  }
  
  // Check entropy
  const uniqueChars = new Set(masterKey.split('')).size;
  if (uniqueChars < 16) {
    result.strength = 'weak';
    result.recommendations.push('Use more diverse characters for better entropy');
  }
  
  // Check for common patterns
  if (/(.)\1{3,}/.test(masterKey)) {
    result.strength = 'weak';
    result.recommendations.push('Avoid repeated characters');
  }
  
  if (/^[0-9]+$/.test(masterKey) || /^[a-z]+$/i.test(masterKey)) {
    result.strength = 'weak';
    result.recommendations.push('Mix numbers, letters, and special characters');
  }
  
  return result;
}

export default {
  generateEncryptionKey,
  encrypt,
  decrypt,
  reencrypt,
  hashForSearch,
  encryptFields,
  decryptFields,
  isEncryptionConfigured,
  generateMasterKey,
  validateMasterKey
};
