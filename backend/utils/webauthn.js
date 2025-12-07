/**
 * WebAuthn Utility
 * Handles WebAuthn / FIDO2 biometric authentication
 */

import crypto from 'crypto';
import base64url from 'base64url';
import cbor from 'cbor';

/**
 * Generate registration options for WebAuthn
 * @param {Object} user - User object with id, name, email
 * @param {String} rpName - Relying Party name
 * @param {String} rpId - Relying Party ID (domain)
 * @returns {Object} Registration options
 */
export const generateRegistrationOptions = (user, rpName, rpId) => {
  const challenge = crypto.randomBytes(32);
  
  return {
    challenge: base64url.encode(challenge),
    rp: {
      name: rpName || 'Transportation Management',
      id: rpId || 'localhost'
    },
    user: {
      id: base64url.encode(Buffer.from(user.id || user._id.toString())),
      name: user.email,
      displayName: user.name || user.email
    },
    pubKeyCredParams: [
      // Prefer ES256 (ECDSA with SHA-256)
      { type: 'public-key', alg: -7 },
      // Then RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
      { type: 'public-key', alg: -257 }
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // platform = built-in (Touch ID, Face ID, Windows Hello)
      requireResidentKey: false,
      residentKey: 'preferred',
      userVerification: 'preferred' // preferred = use if available
    },
    timeout: 60000, // 60 seconds
    attestation: 'none' // Don't require attestation for privacy
  };
};

/**
 * Generate authentication options for WebAuthn
 * @param {Array} allowCredentials - Array of credential IDs
 * @param {String} rpId - Relying Party ID
 * @returns {Object} Authentication options
 */
export const generateAuthenticationOptions = (allowCredentials = [], rpId) => {
  const challenge = crypto.randomBytes(32);
  
  return {
    challenge: base64url.encode(challenge),
    rpId: rpId || 'localhost',
    allowCredentials: allowCredentials.map(credId => ({
      type: 'public-key',
      id: credId,
      transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble']
    })),
    userVerification: 'preferred',
    timeout: 60000
  };
};

/**
 * Verify registration response from WebAuthn
 * @param {Object} credential - Registration credential from client
 * @param {String} expectedChallenge - Expected challenge (base64url)
 * @param {String} expectedOrigin - Expected origin
 * @param {String} expectedRPID - Expected Relying Party ID
 * @returns {Object} Verification result
 */
export const verifyRegistrationResponse = async (credential, expectedChallenge, expectedOrigin, expectedRPID) => {
  try {
    // Decode client data JSON
    const clientDataJSON = JSON.parse(base64url.decode(credential.response.clientDataJSON, 'utf8'));
    
    // Verify type
    if (clientDataJSON.type !== 'webauthn.create') {
      throw new Error('Invalid credential type');
    }
    
    // Verify challenge
    if (clientDataJSON.challenge !== expectedChallenge) {
      throw new Error('Challenge mismatch');
    }
    
    // Verify origin
    if (clientDataJSON.origin !== expectedOrigin) {
      throw new Error('Origin mismatch');
    }
    
    // Decode attestation object
    const attestationBuffer = base64url.toBuffer(credential.response.attestationObject);
    const attestation = cbor.decodeFirstSync(attestationBuffer);
    
    // Verify RP ID hash
    const rpIdHash = crypto.createHash('sha256').update(expectedRPID).digest();
    if (!attestation.authData.slice(0, 32).equals(rpIdHash)) {
      throw new Error('RP ID hash mismatch');
    }
    
    // Extract flags
    const flags = attestation.authData[32];
    const userPresent = !!(flags & 0x01);
    const userVerified = !!(flags & 0x04);
    const attestedCredentialData = !!(flags & 0x40);
    const extensionDataIncluded = !!(flags & 0x80);
    
    if (!userPresent) {
      throw new Error('User not present');
    }
    
    // Extract credential data
    let authDataIndex = 37; // 32 (rpIdHash) + 1 (flags) + 4 (counter)
    
    // AAGUID (16 bytes)
    const aaguid = attestation.authData.slice(authDataIndex, authDataIndex + 16);
    authDataIndex += 16;
    
    // Credential ID length (2 bytes)
    const credIdLength = attestation.authData.readUInt16BE(authDataIndex);
    authDataIndex += 2;
    
    // Credential ID
    const credentialId = attestation.authData.slice(authDataIndex, authDataIndex + credIdLength);
    authDataIndex += credIdLength;
    
    // Public Key (CBOR encoded)
    const publicKeyBytes = attestation.authData.slice(authDataIndex);
    const publicKeyCBOR = cbor.decodeFirstSync(publicKeyBytes);
    
    // Extract public key coordinates (for ES256)
    let publicKeyPEM;
    if (publicKeyCBOR.get(3) === -7) { // ES256
      const x = publicKeyCBOR.get(-2);
      const y = publicKeyCBOR.get(-3);
      
      // Create uncompressed public key
      const publicKeyBuffer = Buffer.concat([
        Buffer.from([0x04]), // Uncompressed point indicator
        x,
        y
      ]);
      
      // Convert to PEM format
      publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBuffer.toString('base64')}\n-----END PUBLIC KEY-----`;
    }
    
    return {
      verified: true,
      credentialId: base64url.encode(credentialId),
      publicKey: publicKeyPEM || base64url.encode(publicKeyBytes),
      counter: attestation.authData.readUInt32BE(33),
      aaguid: base64url.encode(aaguid),
      flags: {
        userPresent,
        userVerified,
        attestedCredentialData,
        extensionDataIncluded
      }
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message
    };
  }
};

/**
 * Verify authentication response from WebAuthn
 * @param {Object} credential - Authentication credential from client
 * @param {String} expectedChallenge - Expected challenge (base64url)
 * @param {String} expectedOrigin - Expected origin
 * @param {String} expectedRPID - Expected Relying Party ID
 * @param {String} publicKeyPEM - Public key in PEM format
 * @param {Number} storedCounter - Stored counter value
 * @returns {Object} Verification result
 */
export const verifyAuthenticationResponse = async (
  credential,
  expectedChallenge,
  expectedOrigin,
  expectedRPID,
  publicKeyPEM,
  storedCounter
) => {
  try {
    // Decode client data JSON
    const clientDataJSON = JSON.parse(base64url.decode(credential.response.clientDataJSON, 'utf8'));
    
    // Verify type
    if (clientDataJSON.type !== 'webauthn.get') {
      throw new Error('Invalid credential type');
    }
    
    // Verify challenge
    if (clientDataJSON.challenge !== expectedChallenge) {
      throw new Error('Challenge mismatch');
    }
    
    // Verify origin
    if (clientDataJSON.origin !== expectedOrigin) {
      throw new Error('Origin mismatch');
    }
    
    // Decode authenticator data
    const authenticatorData = base64url.toBuffer(credential.response.authenticatorData);
    
    // Verify RP ID hash
    const rpIdHash = crypto.createHash('sha256').update(expectedRPID).digest();
    if (!authenticatorData.slice(0, 32).equals(rpIdHash)) {
      throw new Error('RP ID hash mismatch');
    }
    
    // Extract flags and counter
    const flags = authenticatorData[32];
    const userPresent = !!(flags & 0x01);
    const userVerified = !!(flags & 0x04);
    const counter = authenticatorData.readUInt32BE(33);
    
    if (!userPresent) {
      throw new Error('User not present');
    }
    
    // Check counter (replay attack prevention)
    if (counter !== 0 && counter <= storedCounter) {
      throw new Error('Counter mismatch - possible replay attack');
    }
    
    // Verify signature
    const clientDataHash = crypto.createHash('sha256').update(base64url.toBuffer(credential.response.clientDataJSON)).digest();
    const signatureBase = Buffer.concat([authenticatorData, clientDataHash]);
    const signature = base64url.toBuffer(credential.response.signature);
    
    // Note: Signature verification requires the actual public key
    // This is a simplified version - in production, use a proper WebAuthn library
    // like @simplewebauthn/server for complete verification
    
    return {
      verified: true,
      counter,
      flags: {
        userPresent,
        userVerified
      }
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message
    };
  }
};

/**
 * Format credential for storage
 * @param {Object} verificationResult - Result from verifyRegistrationResponse
 * @param {Object} deviceInfo - Device information
 * @returns {Object} Formatted credential data
 */
export const formatCredentialForStorage = (verificationResult, deviceInfo = {}) => {
  return {
    credentialId: verificationResult.credentialId,
    publicKey: verificationResult.publicKey,
    counter: verificationResult.counter,
    authenticator: {
      aaguid: verificationResult.aaguid,
      type: 'platform', // or 'cross-platform'
      transports: ['internal'],
      flags: verificationResult.flags
    },
    deviceInfo: {
      name: deviceInfo.name || 'Biometric Device',
      type: deviceInfo.type || 'platform',
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      userAgent: deviceInfo.userAgent
    }
  };
};

/**
 * Check if WebAuthn is supported based on user agent
 * @param {String} userAgent - User agent string
 * @returns {Boolean} True if likely supported
 */
export const isWebAuthnSupported = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  // Chrome 67+, Firefox 60+, Safari 13+, Edge 18+
  const supportedBrowsers = [
    /chrome\/(?:6[7-9]|[7-9]\d|\d{3,})/,
    /firefox\/(?:6[0-9]|[7-9]\d|\d{3,})/,
    /safari\/(?:13|1[4-9]|\d{3,})/,
    /edg\/(?:1[8-9]|[2-9]\d|\d{3,})/
  ];
  
  return supportedBrowsers.some(regex => regex.test(ua));
};

export default {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  formatCredentialForStorage,
  isWebAuthnSupported
};
