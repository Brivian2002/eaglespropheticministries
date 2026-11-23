import { describe, expect, it } from "vitest";
import { InMemoryDownloadTicketStore } from "./download-ticket-memory-store";

const now = 1_000_000;
const expiresAt = now + 60 * 60 * 1000;
const fileSize = 1000;

function issuedStore() {
  const store = new InMemoryDownloadTicketStore();
  expect(store.issue("staging-mock-test", "android", "ticket-hash", expiresAt, 0, now)).toBe(true);
  return store;
}

describe("InMemoryDownloadTicketStore lease rules", () => {
  it("rejects concurrent claims and stale lease owners cannot release a replacement lease", () => {
    const store = issuedStore();
    expect(store.claim("ticket-hash", 0, 99, fileSize, "lease-a", now)).toBe("android");
    expect(store.claim("ticket-hash", 0, 99, fileSize, "lease-b", now + 1)).toBeNull();

    expect(store.release("ticket-hash", "lease-a", 50, now + 2)).toBe(true);
    expect(store.claim("ticket-hash", 50, 149, fileSize, "lease-b", now + 3)).toBe("android");
    expect(store.claim("ticket-hash", 50, 149, fileSize, "lease-c", now + 4)).toBeNull();
    expect(store.release("ticket-hash", "lease-a", 51, now + 5)).toBe(false);
  });

  it("allows exact sequential resume, rejects overlap/gaps, then consumes and blocks replay", () => {
    const store = issuedStore();
    expect(store.claim("ticket-hash", 0, 99, fileSize, "lease-a", now)).toBe("android");
    expect(store.release("ticket-hash", "lease-a", 50, now + 1)).toBe(true);

    expect(store.claim("ticket-hash", 49, 149, fileSize, "overlap", now + 2)).toBeNull();
    expect(store.claim("ticket-hash", 51, 149, fileSize, "gap", now + 2)).toBeNull();
    expect(store.claim("ticket-hash", 50, 149, fileSize, "lease-b", now + 2)).toBe("android");
    expect(store.release("ticket-hash", "lease-b", 150, now + 3)).toBe(true);

    expect(store.claim("ticket-hash", 149, 999, fileSize, "overlap-final", now + 4)).toBeNull();
    expect(store.claim("ticket-hash", 150, 999, fileSize, "lease-c", now + 4)).toBe("android");
    expect(store.consume("ticket-hash", "lease-c", fileSize)).toBe(true);
    expect(store.state("ticket-hash", now + 5)).toBe("consumed");
    expect(store.productIdFor("ticket-hash", now + 5)).toBeNull();
    expect(store.claim("ticket-hash", 150, 999, fileSize, "replay", now + 6)).toBeNull();
  });

  it("permits a bounded resume only after the previous stream lease expires", () => {
    const store = issuedStore();
    const leaseMs = 305_000;
    expect(store.claim("ticket-hash", 0, 99, fileSize, "lease-old", now, leaseMs)).toBe("android");
    expect(store.claim("ticket-hash", 0, 99, fileSize, "too-soon", now + leaseMs - 1, leaseMs)).toBeNull();
    expect(store.claim("ticket-hash", 80, 199, fileSize, "resumed", now + leaseMs, leaseMs)).toBe("android");
    expect(store.state("ticket-hash", now + leaseMs)).toBe("streaming");
  });
});
