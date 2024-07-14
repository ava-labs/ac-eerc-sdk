import { describe, expect, test } from "bun:test";
import { Scalar } from "../../../src/crypto/scalar";
import { shiftRightTestCases } from "./scalar.test.cases";

describe("Scalar", () => {
  test("shiftRight should handle properly", () => {
    for (const { input, shift, expected } of shiftRightTestCases) {
      expect(Scalar.shiftRight(input, shift)).toBe(expected);
    }
  });

  test("isZero should handle properly", () => {
    const zero = 0n;
    expect(Scalar.isZero(zero)).toBe(true);

    const nonZero = 1n;
    expect(Scalar.isZero(nonZero)).toBe(false);
  });

  test("isOdd should handle properly", () => {
    const even = 2n;
    expect(Scalar.isOdd(even)).toBe(false);

    const odd = 3n;
    expect(Scalar.isOdd(odd)).toBe(true);
  });
});
