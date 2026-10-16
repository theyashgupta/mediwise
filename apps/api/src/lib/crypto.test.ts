import { describe, expect, test } from "vitest";
import {
  CipherError,
  decryptField,
  encryptField,
  isEncrypted,
  newDataKey,
  unwrapKey,
  wrapKey,
} from "./crypto.js";

const key = newDataKey();
const masterV1 = Buffer.alloc(32, 1);
const masterV2 = Buffer.alloc(32, 2);
const base64url = /^[A-Za-z0-9_-]+$/;

/** Changes one character of one part of a field value, keeping it valid base64url. */
function tamper(value: string, part: number) {
  const parts = value.split(":");
  const text = parts[part]!;
  parts[part] = (text[0] === "A" ? "B" : "A") + text.slice(1);
  return parts.join(":");
}

describe("field cipher", () => {
  test("a value encrypts to v1:<keyId>:<nonce>:<ciphertext>:<tag> in base64url and decrypts back", () => {
    const value = encryptField(key, "Asha Rao, 1984-03-02");
    const parts = value.split(":");
    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe("v1");
    expect(parts[1]).toBe(key.id);
    for (const part of parts.slice(1)) expect(part).toMatch(base64url);
    expect(Buffer.from(parts[2]!, "base64url")).toHaveLength(12);
    expect(Buffer.from(parts[4]!, "base64url")).toHaveLength(16);
    expect(decryptField(key, value)).toBe("Asha Rao, 1984-03-02");
  });

  test("text with colons, unicode and an empty string round trip", () => {
    for (const text of [
      "",
      "a:b:c",
      "नमस्ते 🙂",
      JSON.stringify({ hash: "x", sentences: ["one."] }),
    ]) {
      expect(decryptField(key, encryptField(key, text))).toBe(text);
    }
  });

  test("two encryptions of one value differ, because each takes a new nonce", () => {
    expect(encryptField(key, "same")).not.toBe(encryptField(key, "same"));
  });

  test("a value with a tag cut to 4 bytes fails closed", () => {
    const parts = encryptField(key, "Asha Rao").split(":");
    parts[4] = Buffer.from(parts[4]!, "base64url").subarray(0, 4).toString("base64url");
    expect(() => decryptField(key, parts.join(":"))).toThrow(CipherError);
  });

  test("only a value of the full ciphertext shape counts as encrypted, so a note starting with v1: is plaintext", () => {
    expect(isEncrypted(encryptField(key, "Asha"))).toBe(true);
    expect(isEncrypted(encryptField(key, ""))).toBe(true);
    expect(isEncrypted("v1: draft before the visit")).toBe(false);
  });

  test("a value without the prefix is a legacy plaintext value and passes through", () => {
    expect(isEncrypted("Asha")).toBe(false);
    expect(decryptField(key, "Asha")).toBe("Asha");
  });

  test.each([
    ["tag", 4],
    ["ciphertext", 3],
    ["nonce", 2],
  ])("a value with a modified %s fails closed", (_, part) => {
    const value = encryptField(key, "Asha Rao");
    expect(() => decryptField(key, tamper(value, part))).toThrow(CipherError);
  });

  test("a value of another data key fails closed, even when it is well formed", () => {
    const other = newDataKey();
    expect(() => decryptField(key, encryptField(other, "Asha Rao"))).toThrow(
      "belongs to another data key",
    );
    expect(() => decryptField({ ...other, id: key.id }, encryptField(key, "Asha Rao"))).toThrow(
      CipherError,
    );
  });

  test("a malformed v1 value fails closed", () => {
    expect(() => decryptField(key, `v1:${key.id}:abc`)).toThrow("malformed");
  });

  test("an error names no key, no ciphertext and no plaintext", () => {
    const value = encryptField(key, "Asha Rao");
    try {
      decryptField(key, tamper(value, 4));
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      for (const secret of ["Asha", ...value.split(":").slice(1), key.key.toString("base64")]) {
        expect(message).not.toContain(secret);
      }
    }
  });
});

describe("wrapped data keys", () => {
  test("a wrapped key starts with its master id, holds no raw key and unwraps back", () => {
    const wrapped = wrapKey(key.key, "v1", masterV1);
    expect(wrapped.split(".")[0]).toBe("v1");
    expect(wrapped).not.toContain(key.key.toString("base64url"));
    expect(unwrapKey(wrapped, new Map([["v1", masterV1]]))).toEqual(key.key);
  });

  test("a wrapped key whose master id is not configured fails closed", () => {
    const wrapped = wrapKey(key.key, "v2", masterV2);
    expect(() => unwrapKey(wrapped, new Map([["v1", masterV1]]))).toThrow(
      "names a master key that is not set",
    );
  });

  test("a wrapped key under the wrong master bytes fails closed", () => {
    const wrapped = wrapKey(key.key, "v1", masterV1);
    expect(() => unwrapKey(wrapped, new Map([["v1", masterV2]]))).toThrow(CipherError);
  });

  test("a rewrap from v1 to v2 keeps every value written under v1 readable", () => {
    const value = encryptField(key, "Asha Rao");
    const v1 = wrapKey(key.key, "v1", masterV1);
    const v2 = wrapKey(unwrapKey(v1, new Map([["v1", masterV1]])), "v2", masterV2);
    const rewrapped = { id: key.id, key: unwrapKey(v2, new Map([["v2", masterV2]])) };
    expect(decryptField(rewrapped, value)).toBe("Asha Rao");
  });
});
