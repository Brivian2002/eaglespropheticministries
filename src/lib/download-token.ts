import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Opaque authorization value; only its SHA-256 hash is stored server-side. */
export function createDownloadToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDownloadToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidDownloadToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
