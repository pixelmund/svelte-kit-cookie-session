import type { BinaryLike } from "./types";
import {
  makeStringDecrypterSync,
  makeStringEncrypterSync,
} from "./make-crypter.js";

const encryptString = makeStringEncrypterSync({ algorithm: "aes-256-gcm" });
const decryptString = makeStringDecrypterSync({ algorithm: "aes-256-gcm" });

export function encrypt(encryptionKey: BinaryLike): (text: string) => string {
  return (text) => encryptString(text, encryptionKey);
}

export function decrypt(
  encryptionKey: BinaryLike
): (encrypted_string: string) => string {
  return (encrypted_string) => decryptString(encrypted_string, encryptionKey);
}
