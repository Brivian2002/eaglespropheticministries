import "server-only";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { createDownloadToken, hashDownloadToken } from "@/lib/download-token";
import { InMemoryDownloadTicketStore } from "@/lib/download-ticket-memory-store";
import { isStagingVerificationBuild } from "@/lib/staging";

type SqlClient = ReturnType<typeof postgres>;
const globals = globalThis as typeof globalThis & {
  __epmTicketSql?: SqlClient;
  __epmTicketSchema?: Promise<void>;
};

const DEFAULT_TICKET_TTL_SECONDS = 10 * 60;
const MAX_TICKET_TTL_SECONDS = 2 * 60 * 60;
const STREAM_LEASE_SECONDS = 305;
const stagingTickets = new InMemoryDownloadTicketStore();

export interface DownloadTicketClaim {
  productId: string;
  leaseId: string;
}

function getSql(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) {
    throw new Error("A PostgreSQL DATABASE_URL is required for secure download fulfillment.");
  }
  if (!globals.__epmTicketSql) {
    globals.__epmTicketSql = postgres(url, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
      prepare: false,
      ...(process.env.DATABASE_PASSWORD
        ? { password: process.env.DATABASE_PASSWORD, ssl: "require" as const }
        : {}),
    });
  }
  return globals.__epmTicketSql;
}

export async function ensureDownloadTicketSchema(): Promise<void> {
  if (isStagingVerificationBuild()) return;
  const sql = getSql();
  if (!globals.__epmTicketSchema) {
    globals.__epmTicketSchema = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS epm_download_tickets (
          reference TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          ticket_hash TEXT NOT NULL UNIQUE,
          state TEXT NOT NULL CHECK (state IN ('issued', 'streaming', 'consumed')),
          issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          stream_started_at TIMESTAMPTZ,
          consumed_at TIMESTAMPTZ,
          next_byte_offset BIGINT NOT NULL DEFAULT 0,
          active_start BIGINT,
          active_end BIGINT,
          active_lease_id TEXT
        )
      `;
      await sql`ALTER TABLE epm_download_tickets ADD COLUMN IF NOT EXISTS next_byte_offset BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE epm_download_tickets ADD COLUMN IF NOT EXISTS active_start BIGINT`;
      await sql`ALTER TABLE epm_download_tickets ADD COLUMN IF NOT EXISTS active_end BIGINT`;
      await sql`ALTER TABLE epm_download_tickets ADD COLUMN IF NOT EXISTS active_lease_id TEXT`;
      await sql`
        CREATE INDEX IF NOT EXISTS epm_download_tickets_expiry_idx
        ON epm_download_tickets (expires_at)
      `;
    })();
  }

  try {
    await globals.__epmTicketSchema;
  } catch (error) {
    globals.__epmTicketSchema = undefined;
    throw error;
  }
}

export async function issueDownloadTicket(
  reference: string,
  productId: string,
  ttlSeconds = DEFAULT_TICKET_TTL_SECONDS,
  initialByteOffset = 0,
): Promise<{ token: string; expiresAt: string } | null> {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > MAX_TICKET_TTL_SECONDS) {
    throw new Error("Download authorization lifetime is outside the allowed range.");
  }
  if (!Number.isSafeInteger(initialByteOffset) || initialByteOffset < 0) {
    throw new Error("Download authorization start offset is invalid.");
  }
  if (!isStagingVerificationBuild() && initialByteOffset !== 0) {
    throw new Error("A nonzero ticket start offset is permitted only in the staging mock flow.");
  }
  const token = createDownloadToken();
  const tokenHash = hashDownloadToken(token);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  if (isStagingVerificationBuild()) {
    const issued = stagingTickets.issue(reference, productId, tokenHash, expiresAt, initialByteOffset);
    return issued ? { token, expiresAt: new Date(expiresAt).toISOString() } : null;
  }

  await ensureDownloadTicketSchema();
  const sql = getSql();
  const rows = await sql<{ expires_at: Date }[]>`
    INSERT INTO epm_download_tickets (
      reference, product_id, ticket_hash, state, issued_at, expires_at,
      stream_started_at, consumed_at, next_byte_offset, active_start, active_end, active_lease_id
    )
    VALUES (
      ${reference}, ${productId}, ${tokenHash}, 'issued', NOW(),
      NOW() + ${ttlSeconds} * INTERVAL '1 second', NULL, NULL, 0, NULL, NULL, NULL
    )
    ON CONFLICT (reference) DO UPDATE SET
      ticket_hash = EXCLUDED.ticket_hash,
      state = 'issued',
      issued_at = NOW(),
      expires_at = NOW() + ${ttlSeconds} * INTERVAL '1 second',
      stream_started_at = NULL,
      consumed_at = NULL,
      next_byte_offset = 0,
      active_start = NULL,
      active_end = NULL,
      active_lease_id = NULL
    WHERE epm_download_tickets.product_id = EXCLUDED.product_id
      AND (
        epm_download_tickets.state = 'issued'
        OR (epm_download_tickets.state = 'streaming' AND epm_download_tickets.expires_at <= NOW())
      )
    RETURNING expires_at
  `;

  const row = rows[0];
  return row ? { token, expiresAt: new Date(row.expires_at).toISOString() } : null;
}

export async function getDownloadTicketProductId(tokenHash: string): Promise<string | null> {
  if (isStagingVerificationBuild()) return stagingTickets.productIdFor(tokenHash);
  await ensureDownloadTicketSchema();
  const rows = await getSql()<{ product_id: string }[]>`
    SELECT product_id
    FROM epm_download_tickets
    WHERE ticket_hash = ${tokenHash}
      AND expires_at > NOW()
      AND state <> 'consumed'
    LIMIT 1
  `;
  return rows[0]?.product_id ?? null;
}

export async function claimDownloadTicket(
  tokenHash: string,
  rangeStart: number,
  rangeEnd: number,
  fileSize: number,
): Promise<DownloadTicketClaim | null> {
  const leaseId = randomUUID();
  if (isStagingVerificationBuild()) {
    const productId = stagingTickets.claim(
      tokenHash,
      rangeStart,
      rangeEnd,
      fileSize,
      leaseId,
      Date.now(),
      STREAM_LEASE_SECONDS * 1000,
    );
    return productId ? { productId, leaseId } : null;
  }

  await ensureDownloadTicketSchema();
  const rows = await getSql()<{ product_id: string }[]>`
    UPDATE epm_download_tickets
    SET state = 'streaming',
        stream_started_at = NOW(),
        active_start = ${rangeStart},
        active_end = ${rangeEnd},
        active_lease_id = ${leaseId}
    WHERE ticket_hash = ${tokenHash}
      AND expires_at > NOW()
      AND ${rangeStart} >= 0
      AND ${rangeEnd} >= ${rangeStart}
      AND ${rangeEnd} < ${fileSize}
      AND (
        (state = 'issued' AND next_byte_offset = ${rangeStart})
        OR (
          state = 'streaming'
          AND stream_started_at <= NOW() - ${STREAM_LEASE_SECONDS} * INTERVAL '1 second'
          AND active_start IS NOT NULL
          AND active_end IS NOT NULL
          AND ${rangeStart} >= active_start
          AND ${rangeStart} <= active_end + 1
        )
      )
    RETURNING product_id
  `;
  return rows[0] ? { productId: rows[0].product_id, leaseId } : null;
}

export async function markDownloadTicketConsumed(
  tokenHash: string,
  leaseId: string,
  fileSize: number,
): Promise<void> {
  if (isStagingVerificationBuild()) {
    stagingTickets.consume(tokenHash, leaseId, fileSize);
    return;
  }
  await getSql()`
    UPDATE epm_download_tickets
    SET state = 'consumed',
        consumed_at = NOW(),
        next_byte_offset = ${fileSize},
        stream_started_at = NULL,
        active_start = NULL,
        active_end = NULL,
        active_lease_id = NULL
    WHERE ticket_hash = ${tokenHash}
      AND state = 'streaming'
      AND active_lease_id = ${leaseId}
  `;
}

export async function releaseDownloadTicket(
  tokenHash: string,
  leaseId: string,
  nextByteOffset: number,
): Promise<void> {
  if (isStagingVerificationBuild()) {
    stagingTickets.release(tokenHash, leaseId, nextByteOffset);
    return;
  }
  await getSql()`
    UPDATE epm_download_tickets
    SET state = 'issued',
        next_byte_offset = ${nextByteOffset},
        stream_started_at = NULL,
        active_start = NULL,
        active_end = NULL,
        active_lease_id = NULL
    WHERE ticket_hash = ${tokenHash}
      AND state = 'streaming'
      AND active_lease_id = ${leaseId}
      AND expires_at > NOW()
      AND active_start IS NOT NULL
      AND active_end IS NOT NULL
      AND ${nextByteOffset} >= active_start
      AND ${nextByteOffset} <= active_end + 1
  `;
}

export async function getDownloadTicketState(
  tokenHash: string,
): Promise<"issued" | "streaming" | "consumed" | "expired" | null> {
  if (isStagingVerificationBuild()) {
    return stagingTickets.state(tokenHash, Date.now(), STREAM_LEASE_SECONDS * 1000);
  }
  await ensureDownloadTicketSchema();
  const rows = await getSql()<
    { state: "issued" | "streaming" | "consumed"; expires_at: Date; stream_stale: boolean }[]
  >`
    SELECT state, expires_at,
      (state = 'streaming' AND stream_started_at <= NOW() - ${STREAM_LEASE_SECONDS} * INTERVAL '1 second') AS stream_stale
    FROM epm_download_tickets
    WHERE ticket_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return "expired";
  if (row.state === "streaming" && row.stream_stale) return "issued";
  return row.state;
}

export async function deleteStagingTestTicket(reference: string): Promise<void> {
  if (!isStagingVerificationBuild() || !/^staging-mock-[0-9a-f-]{36}$/.test(reference)) {
    throw new Error("Only staging mock tickets may be cleaned up here.");
  }
  stagingTickets.delete(reference);
}
