import {
  makeStringDecrypterSync,
  makeStringEncrypterSync,
} from "./make-crypter";

const encryptString = makeStringEncrypterSync({ algorithm: "aes-256-gcm" });
const decryptString = makeStringDecrypterSync({ algorithm: "aes-256-gcm" });

export function encrypt(encryptionKey: string): (text: string) => string {
  return (text) => encryptString(text, encryptionKey);
}

export function decrypt(
  encryptionKey: string
): (encrypted_string: string) => string {
  return (encrypted_string) => decryptString(encrypted_string, encryptionKey);
}
