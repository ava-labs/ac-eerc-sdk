import { Scalar } from "../../src/crypto/scalar";
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

  test("calculate should handle properly", () => {
    const whole = 1n;
    const fractional = 50n;
    expect(Scalar.calculate(whole, fractional)).toBe(150n);

    const zero = 0n;
    expect(Scalar.calculate(zero, zero)).toBe(0n);
  });

  test("adjust should handle properly", () => {
    const cases = [
      {
        whole: 10n,
        fractional: 50n,
        expected: [10n, 50n],
      },
      {
        whole: 0n,
        fractional: 0n,
        expected: [0n, 0n],
      },
      {
        whole: 1n,
        fractional: 160n,
        expected: [2n, 60n],
      },
      {
        whole: 10n,
        fractional: 10000n,
        expected: [110n, 0n],
      }, //  10000 cents = 100 dollars
    ];

    for (const { whole, fractional, expected } of cases) {
      expect(Scalar.adjust(whole, fractional)).toEqual(expected);
    }
  });
});
