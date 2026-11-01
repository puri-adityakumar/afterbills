import { describe, expect, it } from "vitest";
import { addDays, createWindow, isValidDate, todayInTimezone, validateWindow } from "@/domain";

describe("calendar dates with an injected clock", () => {
  it.each(["2026-11-01", "2024-02-29", "2000-02-29", "0001-01-01", "0099-12-31", "9999-12-31"])(
    "accepts %s", (input) => expect(isValidDate(input)).toBe(true),
  );
  it.each(["2026-02-29", "1900-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00",
    "0000-01-01", "10000-01-01", "26-01-01", "2026-1-01", "2026-01-01T00:00:00Z", " 2026-01-01", "2026-01-01\n", ""])(
    "rejects %j", (input) => expect(isValidDate(input)).toBe(false),
  );
  it.each([
    ["2024-02-28", 1, "2024-02-29"], ["2024-02-28", 2, "2024-03-01"],
    ["2026-01-01", -1, "2025-12-31"], ["0099-12-31", 1, "0100-01-01"],
    ["2026-11-01", 14, "2026-11-15"], ["2026-03-08", 1, "2026-03-09"],
  ] as const)("adds calendar dates %s + %s", (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
  it("rejects invalid or out-of-range arithmetic", () => {
    for (const days of [0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => addDays("2026-11-01", days)).toThrow();
    }
    expect(() => addDays("2026-02-30", 1)).toThrow();
    expect(() => addDays("0001-01-01", -1)).toThrow();
    expect(() => addDays("9999-12-31", 1)).toThrow();
  });
  it("derives local dates on both sides of UTC midnight", () => {
    const now = new Date("2026-11-01T00:30:00Z");
    expect(todayInTimezone("Asia/Kolkata", now)).toBe("2026-11-01");
    expect(todayInTimezone("America/Los_Angeles", now)).toBe("2026-10-31");
    expect(todayInTimezone("Pacific/Kiritimati", new Date("2026-11-01T12:00:00Z"))).toBe("2026-11-02");
  });
  it.each([
    ["2026-03-08T06:59:00Z", "2026-03-08"],
    ["2026-03-08T07:01:00Z", "2026-03-08"],
    ["2026-11-01T05:30:00Z", "2026-11-01"],
    ["2026-11-01T06:30:00Z", "2026-11-01"],
  ])("survives DST at %s", (timestamp, expected) => {
    const window = createWindow("America/New_York", new Date(timestamp));
    expect(window.startDate).toBe(expected);
    expect(window.endDateExclusive).toBe(addDays(expected, 14));
    expect(window.dayCount).toBe(14);
    expect(() => validateWindow(window)).not.toThrow();
  });
  it("rolls a live window only when the caller supplies a new local date", () => {
    expect(createWindow("Asia/Kolkata", new Date("2026-11-01T18:29:59Z")).startDate).toBe("2026-11-01");
    expect(createWindow("Asia/Kolkata", new Date("2026-11-01T18:30:00Z")).startDate).toBe("2026-11-02");
  });
  it("rejects missing/invalid timezone and injected dates", () => {
    for (const timezone of ["", "Wrong/Timezone", "+05:30"]) {
      expect(() => createWindow(timezone, new Date("2026-11-01T00:00:00Z"))).toThrow();
    }
    expect(() => todayInTimezone("UTC", new Date("invalid"))).toThrow();
    expect(() => todayInTimezone("UTC", new Date("0000-01-01T00:00:00Z"))).toThrow();
  });
});
