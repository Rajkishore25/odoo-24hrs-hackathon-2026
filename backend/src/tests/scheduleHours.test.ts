import { describe, it, expect } from "vitest";
import { ScheduleService } from "../services/scheduleService.js";

describe("Working Schedule — Expected Hours Computation", () => {
  const standardSchedule = {
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60, // 9 hours gross - 1 hour break = 8 hours net
    workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
  };

  it("should calculate correct scheduled days and hours for a 1-week period (Mon-Sun)", () => {
    // 2026-01-05 is Monday, 2026-01-11 is Sunday (5 working days: Mon, Tue, Wed, Thu, Fri)
    const result = ScheduleService.calculateExpectedHoursForSchedule(
      standardSchedule,
      "2026-01-05",
      "2026-01-11"
    );

    expect(result.scheduledDays).toBe(5);
    expect(result.expectedHours).toBe(40); // 5 days * 8 hrs/day
  });

  it("should calculate 0 scheduled days for a weekend period", () => {
    // 2026-01-10 is Saturday, 2026-01-11 is Sunday
    const result = ScheduleService.calculateExpectedHoursForSchedule(
      standardSchedule,
      "2026-01-10",
      "2026-01-11"
    );

    expect(result.scheduledDays).toBe(0);
    expect(result.expectedHours).toBe(0);
  });

  it("should handle half-hour breaks and custom schedules accurately", () => {
    const customSchedule = {
      startTime: "08:30",
      endTime: "17:00", // 8.5 gross hours
      breakMinutes: 30,  // 0.5 hour break = 8.0 net hours
      workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"], // 6-day work week
    };

    // 2026-01-05 (Mon) to 2026-01-11 (Sun) -> 6 working days
    const result = ScheduleService.calculateExpectedHoursForSchedule(
      customSchedule,
      "2026-01-05",
      "2026-01-11"
    );

    expect(result.scheduledDays).toBe(6);
    expect(result.expectedHours).toBe(48); // 6 * 8 = 48 hours
  });
});
