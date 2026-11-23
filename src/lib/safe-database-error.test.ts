import { describe, expect, it } from "vitest";
import { getSafeDatabaseErrorSummary } from "./safe-database-error";

describe("getSafeDatabaseErrorSummary", () => {
  it("classifies database permission errors without returning the raw message", () => {
    const error = Object.assign(
      new Error("permission denied for schema public; postgres://user:super-secret@db.example/private"),
      { code: "42501" },
    );
    const summary = getSafeDatabaseErrorSummary(error);
    expect(summary).toEqual({ errorName: "Error", databaseCode: "42501", failureClass: "permission-denied" });
    expect(JSON.stringify(summary)).not.toContain("super-secret");
    expect(JSON.stringify(summary)).not.toContain("db.example");
  });

  it("identifies missing or invalid database configuration", () => {
    expect(getSafeDatabaseErrorSummary(new Error("A PostgreSQL DATABASE_URL is required."))).toEqual({
      errorName: "Error",
      databaseCode: "unavailable",
      failureClass: "database-url-missing-or-invalid",
    });
  });
});
