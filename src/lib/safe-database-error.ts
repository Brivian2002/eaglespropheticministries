export interface SafeDatabaseErrorSummary {
  errorName: string;
  databaseCode: string;
  failureClass: string;
}

/** Returns only fixed labels and sanitized codes; never returns the raw database message. */
export function getSafeDatabaseErrorSummary(error: unknown): SafeDatabaseErrorSummary {
  const candidate = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const rawName = typeof candidate.name === "string" ? candidate.name : "unknown";
  const errorName = /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(rawName) ? rawName : "unknown";
  const rawCode = [candidate.code, candidate.sqlState, candidate.sqlstate]
    .find((value) => typeof value === "string") as string | undefined;
  const databaseCode = rawCode && /^(?:[A-Z0-9]{5}|E[A-Z0-9]{2,12})$/i.test(rawCode)
    ? rawCode.toUpperCase()
    : "unavailable";
  const message = typeof candidate.message === "string" ? candidate.message : "";

  let failureClass = "database-error";
  if (/DATABASE_URL|required for secure/i.test(message)) failureClass = "database-url-missing-or-invalid";
  else if (/permission denied|insufficient privilege/i.test(message)) failureClass = "permission-denied";
  else if (/password authentication|authentication failed|SASL|invalid authorization/i.test(message)) failureClass = "authentication-failed";
  else if (/timed? out|timeout/i.test(message)) failureClass = "connection-timeout";
  else if (/ENOTFOUND|could not translate host|name or service not known|no address associated/i.test(message)) failureClass = "host-resolution-failed";
  else if (/ECONNREFUSED|connection refused|could not connect|connection terminated|socket hang up/i.test(message)) failureClass = "connection-failed";
  else if (/pg_hba|network access|no route to host|not allowed to connect/i.test(message)) failureClass = "network-policy-denied";
  else if (/SSL|TLS|certificate/i.test(message)) failureClass = "tls-connection-failed";
  else if (/syntax error/i.test(message)) failureClass = "schema-syntax-error";
  else if (/relation .* does not exist|undefined table/i.test(message)) failureClass = "database-relation-missing";

  return { errorName, databaseCode, failureClass };
}
