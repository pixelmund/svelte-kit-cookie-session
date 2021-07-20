import { CipherGCMTypes } from "crypto";

type DriveKeyOptions = {
  keyLength: number;
  saltLength?: number;
  iterations?: number;
  digest?: "sha256" | "sha512";
};

export type DecrypterOptions = Partial<Omit<DriveKeyOptions, "KeyLength">> & {
  algorithm: CipherGCMTypes;
  inputEncoding?: "base64" | "hex";
  stringEncoding?: "utf8" | "ascii";
  ivLength?: number;
  authTagLength?: number;
};

export type EncrypterOptions = Partial<Omit<DriveKeyOptions, "KeyLength">> & {
  algorithm: CipherGCMTypes;
  outputEncoding?: "base64" | "hex";
  stringEncoding?: "utf8" | "ascii";
  ivLength?: number;
  authTagLength?: number;
};

export type EncryptionFunction<T> = (text: string, password: string) => T;
