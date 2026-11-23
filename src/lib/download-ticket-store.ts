import "server-only";
import postgres from "postgres";
import { createDownloadToken, hashDownloadToken } from "@/lib/download-token";

type SqlClient = ReturnType<typeof postgres>;
const globals = globalThis as typeof globalThis & {
  __epmTicketSql?: SqlClient;
  __epmTicketSchema?: Promise<void>;
};

const DEFAULT_TICKET_TTL_SECONDS = 10 * 60;
const MAX_TICKET_TTL_SECONDS = 2 * 60 * 60;
const STREAM_LEASE_SECONDS = 305;

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
    });
  }
  return globals.__epmTicketSql;
}

export async function ensureDownloadTicketSchema(): Promise<void> {
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
          consumed_at TIMESTAMPTZ
        )
      `;
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
): Promise<{ token: string; expiresAt: string } | null> {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > MAX_TICKET_TTL_SECONDS) {
    throw new Error("Download authorization lifetime is outside the allowed range.");
  }
  await ensureDownloadTicketSchema();
  const token = createDownloadToken();
  const tokenHash = hashDownloadToken(token);
  const sql = getSql();
  const rows = await sql<{ expires_at: Date }[]>`
    INSERT INTO epm_download_tickets (
      reference, product_id, ticket_hash, state, issued_at, expires_at,
      stream_started_at, consumed_at
    )
    VALUES (
      ${reference}, ${productId}, ${tokenHash}, 'issued', NOW(),
      NOW() + ${ttlSeconds} * INTERVAL '1 second', NULL, NULL
    )
    ON CONFLICT (reference) DO UPDATE SET
      ticket_hash = EXCLUDED.ticket_hash,
      state = 'issued',
      issued_at = NOW(),
      expires_at = NOW() + ${ttlSeconds} * INTERVAL '1 second',
      stream_started_at = NULL,
      consumed_at = NULL
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

export async function claimDownloadTicket(
  tokenHash: string,
): Promise<{ productId: string } | null> {
  await ensureDownloadTicketSchema();
  const rows = await getSql()<
    { product_id: string }[]
  >`
    UPDATE epm_download_tickets
    SET state = 'streaming', stream_started_at = NOW()
    WHERE ticket_hash = ${tokenHash}
      AND expires_at > NOW()
      AND (
        state = 'issued'
        OR state = 'streaming'
      )
    RETURNING product_id
  `;
  return rows[0] ? { productId: rows[0].product_id } : null;
}

export async function markDownloadTicketConsumed(tokenHash: string): Promise<void> {
  await getSql()`
    UPDATE epm_download_tickets
    SET state = 'consumed', consumed_at = NOW()
    WHERE ticket_hash = ${tokenHash} AND state = 'streaming'
  `;
}

export async function releaseDownloadTicket(tokenHash: string): Promise<void> {
  await getSql()`
    UPDATE epm_download_tickets
    SET state = 'issued', stream_started_at = NULL
    WHERE ticket_hash = ${tokenHash}
      AND state = 'streaming'
      AND expires_at > NOW()
  `;
}

export async function getDownloadTicketState(
  tokenHash: string,
): Promise<"issued" | "streaming" | "consumed" | "expired" | null> {
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
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return "expired";
  }
  if (row.state === "streaming" && row.stream_stale) {
    return "issued";
  }
  return row.state;
}
