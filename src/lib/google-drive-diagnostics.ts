export interface GoogleDriveFailureDiagnostic {
  serviceAccountEmail: string | null;
  httpStatus: number | null;
  apiStatus: string | null;
  message: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function getSanitizedGoogleDriveFailure(error: unknown, fileId: string): GoogleDriveFailureDiagnostic {
  const root = asRecord(error);
  const apiResponse = asRecord(root?.response);
  const payload = asRecord(apiResponse?.data);
  const apiError = asRecord(payload?.error);
  const candidateStatus = apiResponse?.status ?? apiError?.code;
  const httpStatus =
    typeof candidateStatus === "number" && Number.isInteger(candidateStatus) && candidateStatus >= 100 && candidateStatus <= 599
      ? candidateStatus
      : null;
  const apiStatus = typeof apiError?.status === "string" ? apiError.status.slice(0, 64) : null;
  const providerMessage = typeof apiError?.message === "string" ? apiError.message : "Google Drive request failed.";
  const message = providerMessage
    .replaceAll(fileId, "[redacted file ID]")
    .replace(/-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----/g, "[redacted credential]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, "[redacted credential]")
    .replace(/([?&](?:access_token|token|key)=)[^&\s]*/gi, "$1[redacted]")
    .slice(0, 500);

  return {
    serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || null,
    httpStatus,
    apiStatus,
    message,
  };
}
