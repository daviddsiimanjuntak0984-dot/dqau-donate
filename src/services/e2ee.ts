/**
 * Web Crypto API native End-to-End Encryption (E2EE)
 * Standards-compliant ECDH (P-256) key exchange + AES-GCM (256-bit) message encryption.
 * Private keys remain strictly on the client device and are never sent to the server.
 */

const DB_NAME = 'dqau_crypto_store';
const STORE_NAME = 'keys';

interface KeyPairRecord {
  id: string;
  publicKeyJWK: JsonWebKey;
  privateKeyCryptoKey: CryptoKey;
  fingerprint: string;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Calculate SHA-256 fingerprint from JWK
async function calculateFingerprint(jwk: JsonWebKey): Promise<string> {
  const str = `${jwk.crv || 'P-256'}:${jwk.x}:${jwk.y}`;
  const encoded = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hash));
  // Return formatted 12-digit safety number
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

class E2EEService {
  private keyPair: KeyPairRecord | null = null;
  private initPromise: Promise<KeyPairRecord> | null = null;

  public async initialize(userId: string = 'current_device_user'): Promise<KeyPairRecord> {
    if (this.keyPair) return this.keyPair;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1. Try to load from IndexedDB
      try {
        const stored = await this.loadKeyFromIndexedDB(userId);
        if (stored) {
          this.keyPair = stored;
          return stored;
        }
      } catch (e) {
        console.warn('[E2EE] IndexedDB read error, generating new session keypair', e);
      }

      // 2. Generate new ECDH P-256 KeyPair
      const generated = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true, // extractable
        ['deriveKey', 'deriveBits']
      );

      const pubJWK = await crypto.subtle.exportKey('jwk', generated.publicKey);
      const fingerprint = await calculateFingerprint(pubJWK);

      const record: KeyPairRecord = {
        id: userId,
        publicKeyJWK: pubJWK,
        privateKeyCryptoKey: generated.privateKey,
        fingerprint,
      };

      try {
        await this.saveKeyToIndexedDB(record);
      } catch (e) {
        console.warn('[E2EE] IndexedDB save error', e);
      }

      this.keyPair = record;
      return record;
    })();

    return this.initPromise;
  }

  public async getPublicKey(): Promise<{ jwk: JsonWebKey; fingerprint: string }> {
    const kp = await this.initialize();
    return { jwk: kp.publicKeyJWK, fingerprint: kp.fingerprint };
  }

  /**
   * Encrypts plaintext message into AES-GCM ciphertext using derived key from recipient's public key
   * If recipientPublicKeyJWK is not supplied, uses local conversation master key.
   */
  public async encryptMessage(
    text: string,
    recipientPublicKeyJWK?: JsonWebKey
  ): Promise<{ ciphertext: string; nonce: string; fingerprint: string }> {
    const kp = await this.initialize();

    let aesKey: CryptoKey;
    if (recipientPublicKeyJWK) {
      // Import recipient public key
      const importedRecipientKey = await crypto.subtle.importKey(
        'jwk',
        recipientPublicKeyJWK,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      // Derive shared AES-GCM 256-bit key
      aesKey = await crypto.subtle.deriveKey(
        { name: 'ECDH', public: importedRecipientKey },
        kp.privateKeyCryptoKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } else {
      // Self-encryption for conversation local test
      aesKey = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: await crypto.subtle.importKey(
            'jwk',
            kp.publicKeyJWK,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
          ),
        },
        kp.privateKeyCryptoKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    // Generate random 12-byte IV/nonce
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoded
    );

    return {
      ciphertext: arrayBufferToBase64(encryptedBuffer),
      nonce: arrayBufferToBase64(iv.buffer),
      fingerprint: kp.fingerprint,
    };
  }

  /**
   * Decrypts ciphertext back to plaintext using the sender's public key and our private key
   */
  public async decryptMessage(
    ciphertextBase64: string,
    nonceBase64: string,
    senderPublicKeyJWK?: JsonWebKey
  ): Promise<string> {
    const kp = await this.initialize();

    let aesKey: CryptoKey;
    if (senderPublicKeyJWK) {
      const importedSenderKey = await crypto.subtle.importKey(
        'jwk',
        senderPublicKeyJWK,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      aesKey = await crypto.subtle.deriveKey(
        { name: 'ECDH', public: importedSenderKey },
        kp.privateKeyCryptoKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } else {
      aesKey = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: await crypto.subtle.importKey(
            'jwk',
            kp.publicKeyJWK,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
          ),
        },
        kp.privateKeyCryptoKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    const encryptedData = base64ToArrayBuffer(ciphertextBase64);
    const iv = new Uint8Array(base64ToArrayBuffer(nonceBase64));

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encryptedData
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch {
      return '[Gagal mendekripsi: Kunci tidak cocok]';
    }
  }

  // --- IndexedDB Key Storage Helpers ---
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveKeyToIndexedDB(record: KeyPairRecord): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async loadKeyFromIndexedDB(userId: string): Promise<KeyPairRecord | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => resolve((req.result as KeyPairRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }
}

export const e2eeService = new E2EEService();
