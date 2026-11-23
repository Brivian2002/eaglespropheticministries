import { describe, expect, it } from "vitest";
import { parseByteRange } from "./byte-range";

describe("parseByteRange", () => {
  it("accepts and clamps an explicit byte range", () => {
    expect(parseByteRange("bytes=5-15", 10)).toEqual({ kind: "range", start: 5, end: 9 });
  });

  it("supports open-ended and suffix ranges", () => {
    expect(parseByteRange("bytes=4-", 10)).toEqual({ kind: "range", start: 4, end: 9 });
    expect(parseByteRange("bytes=-3", 10)).toEqual({ kind: "range", start: 7, end: 9 });
    expect(parseByteRange("bytes=-20", 10)).toEqual({ kind: "range", start: 0, end: 9 });
  });

  it("distinguishes full downloads from ranges", () => {
    expect(parseByteRange(null, 10)).toEqual({ kind: "none" });
    expect(parseByteRange("", 10)).toEqual({ kind: "none" });
  });

  it("rejects multiple, malformed, and unsatisfiable ranges", () => {
    expect(parseByteRange("bytes=1-2,4-5", 10)).toEqual({ kind: "invalid" });
    expect(parseByteRange("items=1-2", 10)).toEqual({ kind: "invalid" });
    expect(parseByteRange("bytes=10-", 10)).toEqual({ kind: "invalid" });
    expect(parseByteRange("bytes=8-2", 10)).toEqual({ kind: "invalid" });
    expect(parseByteRange("bytes=-0", 10)).toEqual({ kind: "invalid" });
  });
});
