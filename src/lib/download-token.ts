/**
 * Signed Download Tokens
 *
 * Stateless, self-contained tokens using HMAC-SHA256.
 * No database required — all data lives inside the signed token.
 *
 * Token format:  base64url(json_payload).base64url(hmac_signature)
 * Secret:       PAYSTACK_SECRET_KEY (if set), else NEXTAUTH_SECRET, else fallback
 */

import crypto from "crypto";

// ---------- types ----------

export interface TokenPayload {
  email: string;
  reference: string;
  productTitle: string;
  fileId: string;
  fileName: string;
  exp: number; // unix seconds
  iat: number; // issued at
}

// ---------- helpers ----------

function getSecret(): string {
  return (
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "epm-ministry-download-2024-secure"
  );
}

function base64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): Buffer {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// ---------- public API ----------

/**
 * Create a signed download token.
 * Uses PAYSTACK_SECRET_KEY if available, else NEXTAUTH_SECRET, else a fallback.
 */
export function createDownloadToken(params: {
  email?: string;
  reference: string;
  productTitle: string;
  fileId: string;
  fileName: string;
  hours?: number;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    email: params.email?.toLowerCase().trim() || "purchaser",
    reference: params.reference,
    productTitle: params.productTitle,
    fileId: params.fileId,
    fileName: params.fileName,
    exp: now + (params.hours || 24) * 60 * 60,
    iat: now,
  };

  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${sig}`;
}

/**
 * Verify and decode a download token.
 * Returns null if invalid, expired, or tampered.
 */
export function verifyDownloadToken(
  token: string
): TokenPayload | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const payloadB64 = token.substring(0, dotIdx);
    const sig = token.substring(dotIdx + 1);

    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("base64url");

    if (sig !== expectedSig) {
      console.error("Download token: invalid signature");
      return null;
    }

    const payload = JSON.parse(
      fromBase64url(payloadB64).toString("utf-8")
    ) as TokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.error("Download token: expired");
      return null;
    }

    return payload;
  } catch (err) {
    console.error("Download token: malformed", err);
    return null;
  }
}
