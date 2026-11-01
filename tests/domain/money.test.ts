import { describe, expect, it } from "vitest";
import { formatCents, formatMoney, parseUnits, readUnits } from "@/domain";

describe("exact money", () => {
  it.each([
    ["0", 0n], ["1200", 1_200_000_000n], [" 1.2 ", 1_200_000n],
    ["0.000001", 1n], ["0001.000001", 1_000_001n],
    ["9007199254740993.123456", 9_007_199_254_740_993_123_456n],
  ])("parses %s without floating point", (input, expected) => {
    expect(parseUnits(input)).toBe(expected);
  });

  it.each(["", " ", "-1", "+1", "1e3", "NaN", "Infinity", "1.0000001", ".5", "1.", "1,000", "1 0", "0x10", "１"])(
    "rejects invalid decimal %j", (input) => expect(() => parseUnits(input)).toThrow(),
  );

  it.each(["-1", "1.1", "1e6", " 1 ", "", "+1", "1\n", "1\r"])("rejects invalid stored units %j", (input) => {
    expect(() => readUnits(input)).toThrow();
  });

  it("requires positive bill/invoice units but permits zero reserve", () => {
    expect(readUnits("0")).toBe(0n);
    expect(() => readUnits("0", true)).toThrow();
  });

  it.each([
    [1_200_000_000n, "down", "1,200.00"], [1_999_999n, "down", "1.99"],
    [1_999_999n, "up", "2.00"], [1n, "down", "0.00"], [1n, "up", "0.01"],
    [-1n, "up", "-0.01"], [-1n, "down", "0.00"],
    [-1_999_999n, "down", "-1.99"], [-1_999_999n, "up", "-2.00"],
    [0n, "up", "0.00"], [10_000n, "up", "0.01"],
    [9_007_199_254_740_993_123_456n, "down", "9,007,199,254,740,993.12"],
  ] as const)("formats %s %s as %s", (units, rounding, expected) => {
    expect(formatMoney(units, rounding)).toBe(expected);
  });

  it("formats signed cents exactly", () => {
    expect(formatCents(714n)).toBe("7.14");
    expect(formatCents(-123_456_789n)).toBe("-1,234,567.89");
    expect(formatCents(0n)).toBe("0.00");
  });
});
