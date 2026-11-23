export type TicketState = "issued" | "streaming" | "consumed";

type MemoryTicket = {
  productId: string;
  tokenHash: string;
  state: TicketState;
  expiresAt: number;
  nextByteOffset: number;
  streamStartedAt?: number;
  activeStart?: number;
  activeEnd?: number;
  activeLeaseId?: string;
};

/** Ephemeral state machine used only by the staging mock-flow deployment. */
export class InMemoryDownloadTicketStore {
  private readonly tickets = new Map<string, MemoryTicket>();

  issue(
    reference: string,
    productId: string,
    tokenHash: string,
    expiresAt: number,
    initialByteOffset = 0,
    now = Date.now(),
  ): boolean {
    const existing = this.tickets.get(reference);
    if (
      existing &&
      (existing.productId !== productId ||
        (existing.state !== "issued" && !(existing.state === "streaming" && existing.expiresAt <= now)))
    ) {
      return false;
    }
    this.tickets.set(reference, {
      productId,
      tokenHash,
      state: "issued",
      expiresAt,
      nextByteOffset: initialByteOffset,
    });
    return true;
  }

  productIdFor(tokenHash: string, now = Date.now()): string | null {
    for (const ticket of this.tickets.values()) {
      if (ticket.tokenHash === tokenHash && ticket.expiresAt > now && ticket.state !== "consumed") {
        return ticket.productId;
      }
    }
    return null;
  }

  claim(
    tokenHash: string,
    rangeStart: number,
    rangeEnd: number,
    fileSize: number,
    leaseId: string,
    now = Date.now(),
    leaseMs = 305_000,
  ): string | null {
    if (
      !Number.isSafeInteger(rangeStart) ||
      !Number.isSafeInteger(rangeEnd) ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      rangeStart < 0 ||
      rangeEnd < rangeStart ||
      rangeEnd >= fileSize
    ) {
      return null;
    }

    for (const ticket of this.tickets.values()) {
      if (ticket.tokenHash !== tokenHash || ticket.expiresAt <= now || ticket.state === "consumed") continue;
      if (ticket.state === "issued") {
        if (rangeStart !== ticket.nextByteOffset) return null;
      } else {
        const leaseExpired =
          ticket.streamStartedAt !== undefined && ticket.streamStartedAt <= now - leaseMs;
        if (
          !leaseExpired ||
          ticket.activeStart === undefined ||
          ticket.activeEnd === undefined ||
          rangeStart < ticket.activeStart ||
          rangeStart > ticket.activeEnd + 1
        ) {
          return null;
        }
      }

      ticket.state = "streaming";
      ticket.streamStartedAt = now;
      ticket.activeStart = rangeStart;
      ticket.activeEnd = rangeEnd;
      ticket.activeLeaseId = leaseId;
      return ticket.productId;
    }
    return null;
  }

  release(tokenHash: string, leaseId: string, nextByteOffset: number, now = Date.now()): boolean {
    const ticket = this.findByTokenHash(tokenHash);
    if (
      !ticket ||
      ticket.state !== "streaming" ||
      ticket.activeLeaseId !== leaseId ||
      ticket.expiresAt <= now ||
      ticket.activeStart === undefined ||
      ticket.activeEnd === undefined ||
      !Number.isSafeInteger(nextByteOffset) ||
      nextByteOffset < ticket.activeStart ||
      nextByteOffset > ticket.activeEnd + 1
    ) {
      return false;
    }
    ticket.state = "issued";
    ticket.nextByteOffset = nextByteOffset;
    this.clearActiveLease(ticket);
    return true;
  }

  consume(tokenHash: string, leaseId: string, fileSize: number): boolean {
    const ticket = this.findByTokenHash(tokenHash);
    if (!ticket || ticket.state !== "streaming" || ticket.activeLeaseId !== leaseId) return false;
    ticket.state = "consumed";
    ticket.nextByteOffset = fileSize;
    this.clearActiveLease(ticket);
    return true;
  }

  state(tokenHash: string, now = Date.now(), leaseMs = 305_000): TicketState | "expired" | null {
    const ticket = this.findByTokenHash(tokenHash);
    if (!ticket) return null;
    if (ticket.expiresAt <= now) return "expired";
    if (ticket.state === "streaming" && ticket.streamStartedAt !== undefined && ticket.streamStartedAt <= now - leaseMs) {
      return "issued";
    }
    return ticket.state;
  }

  delete(reference: string): void {
    this.tickets.delete(reference);
  }

  private findByTokenHash(tokenHash: string): MemoryTicket | undefined {
    for (const ticket of this.tickets.values()) {
      if (ticket.tokenHash === tokenHash) return ticket;
    }
    return undefined;
  }

  private clearActiveLease(ticket: MemoryTicket): void {
    ticket.streamStartedAt = undefined;
    ticket.activeStart = undefined;
    ticket.activeEnd = undefined;
    ticket.activeLeaseId = undefined;
  }
}
