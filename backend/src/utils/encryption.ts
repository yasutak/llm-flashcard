// Utility functions for encrypting and decrypting sensitive data like API keys

/**
 * Encrypts a string using AES-GCM
 * @param text The text to encrypt
 * @param key The encryption key
 * @returns The encrypted text as a base64 string
 */
export async function encrypt(text: string, key: string): Promise<string> {
  // Convert the key to a suitable format
  const keyMaterial = await getKeyMaterial(key);
  const cryptoKey = await getCryptoKey(keyMaterial);
  
  // Generate a random initialization vector
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the text
  const encodedText = new TextEncoder().encode(text);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encodedText
  );
  
  // Combine the IV and encrypted data
  const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  encryptedArray.set(iv);
  encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Convert to base64 for storage
  return bufferToBase64(encryptedArray);
}

/**
 * Decrypts a string that was encrypted with AES-GCM
 * @param encryptedText The encrypted text as a base64 string
 * @param key The encryption key
 * @returns The decrypted text
 */
export async function decrypt(encryptedText: string, key: string): Promise<string> {
  // Convert the key to a suitable format
  const keyMaterial = await getKeyMaterial(key);
  const cryptoKey = await getCryptoKey(keyMaterial);
  
  // Convert the base64 string back to a buffer
  const encryptedArray = base64ToBuffer(encryptedText);
  
  // Extract the IV and encrypted data
  const iv = encryptedArray.slice(0, 12);
  const encryptedData = encryptedArray.slice(12);
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encryptedData
  );
  
  // Convert the decrypted buffer back to a string
  return new TextDecoder().decode(decryptedBuffer);
}

// Helper function to derive key material from a string
async function getKeyMaterial(key: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

// Helper function to derive a CryptoKey from key material
async function getCryptoKey(keyMaterial: CryptoKey): Promise<CryptoKey> {
  // Use a constant salt for deterministic key derivation
  const salt = new TextEncoder().encode('llm-flashcard-salt');
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Helper function to convert a buffer to a base64 string
function bufferToBase64(buffer: Uint8Array): string {
  const binary = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  return btoa(binary);
}

// Helper function to convert a base64 string to a buffer
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
