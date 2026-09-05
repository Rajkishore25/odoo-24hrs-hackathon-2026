import { describe, it, expect } from "vitest";
import { ContractService } from "../services/contractService.js";

describe("Contract Intelligence — Date Overlap Detection", () => {
  it("should detect overlapping dates when contract B starts within contract A's range", () => {
    const startA = new Date("2026-01-01");
    const endA = new Date("2026-06-30");

    const startB = new Date("2026-05-01");
    const endB = new Date("2026-12-31");

    const overlaps = ContractService.checkDateOverlap(startA, endA, startB, endB);
    expect(overlaps).toBe(true);
  });

  it("should detect overlap when contract A is open-ended and contract B starts afterwards", () => {
    const startA = new Date("2026-01-01");
    const endA = null; // open-ended

    const startB = new Date("2026-07-01");
    const endB = new Date("2026-12-31");

    const overlaps = ContractService.checkDateOverlap(startA, endA, startB, endB);
    expect(overlaps).toBe(true);
  });

  it("should NOT detect overlap when contract B starts after contract A ends", () => {
    const startA = new Date("2026-01-01");
    const endA = new Date("2026-06-30");

    const startB = new Date("2026-07-01");
    const endB = new Date("2026-12-31");

    const overlaps = ContractService.checkDateOverlap(startA, endA, startB, endB);
    expect(overlaps).toBe(false);
  });

  it("should NOT detect overlap when contract B ends before contract A starts", () => {
    const startA = new Date("2026-06-01");
    const endA = new Date("2026-12-31");

    const startB = new Date("2026-01-01");
    const endB = new Date("2026-05-31");

    const overlaps = ContractService.checkDateOverlap(startA, endA, startB, endB);
    expect(overlaps).toBe(false);
  });
});
