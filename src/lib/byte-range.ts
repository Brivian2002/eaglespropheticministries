export type ByteRangeResult =
  | { kind: "none" }
  | { kind: "range"; start: number; end: number }
  | { kind: "invalid" };

/** Parse one HTTP byte range against a known file size; multiple ranges fail closed. */
export function parseByteRange(header: string | null, size: number): ByteRangeResult {
  if (!header) return { kind: "none" };
  if (!Number.isSafeInteger(size) || size <= 0) return { kind: "invalid" };

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return { kind: "invalid" };

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return { kind: "invalid" };

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { kind: "invalid" };
    return { kind: "range", start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(rawStart);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return { kind: "invalid" };
  const requestedEnd = rawEnd ? Number(rawEnd) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return { kind: "invalid" };

  return { kind: "range", start, end: Math.min(requestedEnd, size - 1) };
}
