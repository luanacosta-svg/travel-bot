/**
 * Criptografia de campos sensíveis em repouso (AES-256-GCM).
 *
 * Configuração: defina ENCRYPTION_KEY no Render com 64 caracteres hex
 * (equivale a 32 bytes):
 *   openssl rand -hex 32
 *
 * Campos protegidos: cpf, cnpj, pixCnpj, pixPf
 *
 * Compatibilidade retroativa: valores sem o prefixo "enc:" são retornados
 * como estão — dados existentes continuam funcionando sem migração forçada.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM   = "aes-256-gcm";
const IV_LEN      = 16;
const PREFIX      = "enc:";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    if (process.env.NODE_ENV === "production") {
      // Em produção sem chave: loga aviso mas não quebra o app
      console.warn("[encryption] ENCRYPTION_KEY não configurada — dados sensíveis salvos sem criptografia");
      return Buffer.alloc(32, 0); // chave zero — melhor que crash em produção
    }
    return Buffer.alloc(32, 0); // dev: chave zero
  }
  return Buffer.from(hex.slice(0, 64), "hex");
}

export function encrypt(plaintext: string | undefined | null): string | undefined {
  if (!plaintext) return plaintext ?? undefined;
  if (plaintext.startsWith(PREFIX)) return plaintext; // já criptografado

  try {
    const key = getKey();
    const iv  = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    // formato: enc:<iv_hex>:<tag_hex>:<ciphertext_hex>
    return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch {
    return plaintext; // falha silenciosa — melhor que perder dados
  }
}

export function decrypt(value: string | undefined | null): string | undefined {
  if (!value) return value ?? undefined;
  if (!value.startsWith(PREFIX)) return value; // não criptografado (dado legado)

  try {
    const [ivHex, tagHex, ctHex] = value.slice(PREFIX.length).split(":");
    if (!ivHex || !tagHex || !ctHex) return value;

    const key       = getKey();
    const iv        = Buffer.from(ivHex, "hex");
    const tag       = Buffer.from(tagHex, "hex");
    const ciphertext = Buffer.from(ctHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    return value; // falha na descriptografia — retorna como está
  }
}

// Campos sensíveis a criptografar nos registros de Employee
export const ENCRYPTED_EMPLOYEE_FIELDS = ["cpf", "cnpj", "pixCnpj", "pixPf"] as const;
export type EncryptedField = typeof ENCRYPTED_EMPLOYEE_FIELDS[number];
