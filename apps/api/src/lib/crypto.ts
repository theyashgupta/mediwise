import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const fieldVersion = "v1";
const fieldPrefix = `${fieldVersion}:`;
const algorithm = "aes-256-gcm";

export type DataKey = { id: string; key: Buffer };

export class CipherError extends Error {
  override name = "CipherError";
}

const encode = (bytes: Buffer) => bytes.toString("base64url");
const decode = (text: string) => Buffer.from(text, "base64url");

function seal(key: Buffer, plaintext: Buffer) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [nonce, ciphertext, cipher.getAuthTag()].map(encode);
}

/**
 * Decrypts and authenticates one AES-256-GCM value.
 *
 * @remarks
 * Node's own error text is replaced, so no caller can ever log more than this fixed message.
 */
function open(key: Buffer, [nonce, ciphertext, tag]: string[]) {
  try {
    const decipher = createDecipheriv(algorithm, key, decode(nonce!));
    decipher.setAuthTag(decode(tag!));
    return Buffer.concat([decipher.update(decode(ciphertext!)), decipher.final()]);
  } catch {
    throw new CipherError("An encrypted value failed authentication.");
  }
}

/** Makes a new random data key for one user. */
export function newDataKey(): DataKey {
  return { id: encode(randomBytes(6)), key: randomBytes(32) };
}

/** Wraps a data key with a master key as `<masterId>.<nonce>.<ciphertext>.<tag>`. */
export function wrapKey(key: Buffer, masterId: string, master: Buffer) {
  return [masterId, ...seal(master, key)].join(".");
}

/**
 * Unwraps a data key with the master key its prefix names.
 *
 * @remarks
 * A master id that is not configured fails closed, so a removed key never silently reads as no data.
 */
export function unwrapKey(wrapped: string, masters: ReadonlyMap<string, Buffer>) {
  const [masterId, ...parts] = wrapped.split(".");
  const master = masters.get(masterId!);
  if (!master) throw new CipherError("A wrapped data key names a master key that is not set.");
  if (parts.length !== 3) throw new CipherError("A wrapped data key is malformed.");
  return open(master, parts);
}

/** Tells whether a stored value is ciphertext of this format. */
export const isEncrypted = (value: string) => value.startsWith(fieldPrefix);

/** Encrypts one field value as `v1:<keyId>:<nonce>:<ciphertext>:<tag>`. */
export function encryptField({ id, key }: DataKey, text: string) {
  return [fieldVersion, id, ...seal(key, Buffer.from(text, "utf8"))].join(":");
}

/**
 * Decrypts one field value, and returns a value written before encryption as it is.
 *
 * @remarks
 * Rows stay plaintext until the backfill reaches them, so a value without the prefix passes through. A value with the
 * prefix and another key id fails closed.
 */
export function decryptField({ id, key }: DataKey, value: string) {
  if (!isEncrypted(value)) return value;
  const [, keyId, ...parts] = value.split(":");
  if (parts.length !== 3) throw new CipherError("An encrypted value is malformed.");
  if (keyId !== id) throw new CipherError("An encrypted value belongs to another data key.");
  return open(key, parts).toString("utf8");
}
