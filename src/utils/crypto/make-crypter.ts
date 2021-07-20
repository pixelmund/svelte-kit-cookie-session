/**
 *
 *  This work is mostly copied over from `string-cipher` => `https://github.com/limplash/string-cipher`, but since it doesn't support esm(yet) i decided to copy
 *  only the bits needed for `svelte-kit-cookie-session`. Thank you limplash!
 *  MIT License
 *  Copyright (c) 2021 limplash
 *
 */

import {
  pbkdf2Sync,
  createDecipheriv,
  createCipheriv,
  randomBytes,
} from "crypto";

import {
  DecrypterOptions,
  EncrypterOptions,
  EncryptionFunction,
} from "./types";

const keyLengthHint = (algo: string): number => {
  switch (algo) {
    case "aes-256-gcm":
      return 32;
    case "aes-192-gcm":
      return 24;
    case "aes-128-gcm":
      return 16;
    default:
      throw new Error(`Unsupported algorithm ${algo}`);
  }
};

export const makeStringDecrypterSync: (
  opt: DecrypterOptions
) => EncryptionFunction<string> =
  ({
    algorithm,
    inputEncoding = "base64",
    stringEncoding = "utf8",
    ivLength = 12,
    authTagLength = 16,
    saltLength = 32,
    iterations = 1,
    digest = "sha256",
  }) =>
  (text, password) => {
    const buffer = Buffer.from(text, inputEncoding);
    // data is packed in this sequence [salt iv tag cipherTest]
    const tagStartIndex = saltLength + ivLength;
    const textStartIndex = tagStartIndex + authTagLength;
    const salt = buffer.slice(0, saltLength);
    const iv = buffer.slice(saltLength, tagStartIndex);
    const tag = buffer.slice(tagStartIndex, textStartIndex);
    const cipherText = buffer.slice(textStartIndex);
    const key = pbkdf2Sync(
      password,
      salt,
      iterations,
      keyLengthHint(algorithm),
      digest
    );
    const decipher = createDecipheriv(algorithm, key, iv, {
      authTagLength,
    }).setAuthTag(tag);
    //@ts-ignore
    return `${decipher.update(
      cipherText,
      "binary",
      stringEncoding
    )}${decipher.final(stringEncoding)}`;
  };

export const makeStringEncrypterSync: (
  opt: EncrypterOptions
) => EncryptionFunction<string> =
  ({
    algorithm,
    outputEncoding = "base64",
    stringEncoding = "utf8",
    authTagLength = 16,
    ivLength = 12,
    saltLength = 32,
    iterations = 1,
    digest = "sha256",
  }) =>
  (text, password) => {
    const iv = randomBytes(ivLength);
    const salt = randomBytes(saltLength);
    const key = pbkdf2Sync(
      password,
      salt,
      iterations,
      keyLengthHint(algorithm),
      digest
    );
    const cipher = createCipheriv(algorithm, key, iv, { authTagLength });
    const cipherText = Buffer.concat([
      cipher.update(text, stringEncoding),
      cipher.final(),
    ]);
    return Buffer.concat([salt, iv, cipher.getAuthTag(), cipherText]).toString(
      outputEncoding
    );
  };
