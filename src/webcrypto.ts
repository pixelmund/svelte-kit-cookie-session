import type { BinaryLike as CBinaryLike } from "crypto";

function base64Encode(input: any) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64");
  }

  return btoa(input);
}

function base64Decode(input: any) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64").toString("utf8");
  }

  return atob(input);
}

export async function aesEncrypt(plaintext: string, password: CBinaryLike) {
  const pwUtf8 =
    typeof password === "string"
      ? new TextEncoder().encode(password)
      : password; // encode password as UTF-8
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv
  const ivStr = Array.from(iv)
    .map((b) => String.fromCharCode(b))
    .join(""); // iv as utf-8 string

  const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "encrypt",
  ]); // generate key from pw

  const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

  const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
  const ctStr = ctArray.map((byte) => String.fromCharCode(byte)).join(""); // ciphertext as string

  return base64Encode(ivStr + ctStr); // iv+ciphertext base64-encoded
}

export async function aesDecrypt(ciphertext: string, password: CBinaryLike) {
  const pwUtf8 =
    typeof password === "string"
      ? new TextEncoder().encode(password)
      : password; // encode password as UTF-8
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const ivStr = base64Decode(ciphertext).slice(0, 12); // decode base64 iv
  const iv = new Uint8Array(Array.from(ivStr).map((ch) => ch.charCodeAt(0))); // iv as Uint8Array

  const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "decrypt",
  ]); // generate key from pw

  const ctStr = base64Decode(ciphertext).slice(12); // decode base64 ciphertext
  const ctUint8 = new Uint8Array(
    Array.from(ctStr).map((ch) => ch.charCodeAt(0))
  ); // ciphertext as Uint8Array

  try {
    // decrypt ciphertext using key
    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
    // return plaintext from ArrayBuffer
    return new TextDecoder().decode(plainBuffer);
  } catch (e) {
    throw new Error("Decrypt failed");
  }
}
