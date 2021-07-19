import crypto from "crypto";

// encryptionKey must be 256 bits (32 characters)
const IV_LENGTH: number = 16; // For AES, this is always 16

export function encrypt(encryptionKey: string): (text: string) => string {
  return (text) => {
    let iv = Buffer.from(crypto.randomBytes(IV_LENGTH))
      .toString("hex")
      .slice(0, IV_LENGTH);
    let cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey),
      iv
    );
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv + ":" + encrypted.toString("hex");
  };
}

export function decrypt(
  encryptionKey: string
): (encrypted_string: string) => string {
  return (encrypted_string) => {
    let textParts: string[] = encrypted_string.includes(":")
      ? encrypted_string.split(":")
      : [];
    let iv = Buffer.from(textParts.shift() || "", "binary");
    let encryptedText = Buffer.from(textParts.join(":"), "hex");
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey),
      iv
    );
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  };
}
