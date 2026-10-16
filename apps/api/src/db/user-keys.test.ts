import { expect, test } from "vitest";
import { CipherError, newDataKey, unwrapKey, wrapKey } from "../lib/crypto.js";
import { masterKeys, rewrapToV2 } from "./user-keys.js";

const wrapUnderNewest = (key: Buffer) =>
  wrapKey(key, masterKeys.newest, masterKeys.byId.get(masterKeys.newest)!);

test("with only DATA_KEY_V1 set, the newest master key is v1 and holds 32 bytes", () => {
  expect(masterKeys.newest).toBe("v1");
  expect([...masterKeys.byId.keys()]).toEqual(["v1"]);
  expect(masterKeys.byId.get("v1")).toHaveLength(32);
});

test("a new data key wrapped under DATA_KEY_V1 starts with the v1 id and unwraps to the same key", () => {
  const { key } = newDataKey();
  const wrapped = wrapUnderNewest(key);

  expect(wrapped).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
  expect(unwrapKey(wrapped, masterKeys.byId).equals(key)).toBe(true);
});

test("a wrapped key that names a master key id that is not set fails closed", () => {
  const wrapped = wrapUnderNewest(newDataKey().key).replace(/^v1\./, "v2.");

  expect(() => unwrapKey(wrapped, masterKeys.byId)).toThrow(
    new CipherError("A wrapped data key names a master key that is not set."),
  );
});

test("a wrapped key with a changed character fails authentication", () => {
  const [id, nonce, ciphertext, tag] = wrapUnderNewest(newDataKey().key).split(".");
  const tampered = [id, nonce, (ciphertext![0] === "A" ? "B" : "A") + ciphertext!.slice(1), tag];

  expect(() => unwrapKey(tampered.join("."), masterKeys.byId)).toThrow(
    new CipherError("An encrypted value failed authentication."),
  );
});

test("a rewrap refuses to start while DATA_KEY_V2 is not set", async () => {
  await expect(rewrapToV2()).rejects.toThrow("Set DATA_KEY_V2 before a rewrap.");
});
