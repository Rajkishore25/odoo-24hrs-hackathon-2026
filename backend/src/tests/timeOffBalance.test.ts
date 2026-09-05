import { describe, it, expect } from "vitest";

describe("Time Off — Balance Computation Formula", () => {
  it("should calculate remaining balance as (Allocated - Approved)", () => {
    const allocated = 18;
    const approvedRequests = [{ requestedDays: 2 }, { requestedDays: 3 }];
    const pendingRequests = [{ requestedDays: 4 }];

    const used = approvedRequests.reduce((sum, r) => sum + r.requestedDays, 0);
    const pending = pendingRequests.reduce((sum, r) => sum + r.requestedDays, 0);
    const remaining = Math.max(0, allocated - used);

    expect(used).toBe(5);
    expect(pending).toBe(4);
    expect(remaining).toBe(13);
  });

  it("should prevent remaining balance from becoming negative", () => {
    const allocated = 10;
    const used = 12; // In case of exceptional scenario
    const remaining = Math.max(0, allocated - used);

    expect(remaining).toBe(0);
  });
});
