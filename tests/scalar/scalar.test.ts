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

  test("decide should handle properly", () => {
    const cases = [
      {
        input: {
          oldWhole: 100n,
          oldFractional: 50n,
          amountWhole: 20n,
          amountFractional: 30n,
        },
        expected: {
          toBeSubtracted: [20n, 30n],
          toBeAdded: [0n, 0n],
        },
      },
      {
        input: {
          oldWhole: 50n,
          oldFractional: 25n,
          amountWhole: 50n,
          amountFractional: 25n,
        },
        expected: {
          toBeSubtracted: [50n, 25n],
          toBeAdded: [0n, 0n],
        },
      },
      {
        input: {
          oldWhole: 30n,
          oldFractional: 75n,
          amountWhole: 10n,
          amountFractional: 50n,
        },
        expected: {
          toBeSubtracted: [10n, 50n],
          toBeAdded: [0n, 0n],
        },
      },
      {
        input: {
          oldWhole: 15n,
          oldFractional: 50n,
          amountWhole: 15n,
          amountFractional: 25n,
        },
        expected: {
          toBeSubtracted: [15n, 25n],
          toBeAdded: [0n, 0n],
        },
      },
      {
        input: {
          oldWhole: 20n,
          oldFractional: 10n,
          amountWhole: 19n,
          amountFractional: 20n,
        },
        expected: {
          toBeSubtracted: [20n, 0n],
          toBeAdded: [0n, 80n],
        },
      },
      {
        input: {
          oldWhole: 20n,
          oldFractional: 10n,
          amountWhole: 19n,
          amountFractional: 90n,
        },
        expected: {
          toBeSubtracted: [20n, 0n],
          toBeAdded: [0n, 10n],
        },
      },
    ];

    for (const c of cases) {
      expect(
        Scalar.decide(
          c.input.oldWhole,
          c.input.oldFractional,
          c.input.amountWhole,
          c.input.amountFractional,
        ),
      ).toEqual([c.expected.toBeSubtracted, c.expected.toBeAdded]);
    }

    // insufficient balance
    const insufficientBalance = {
      oldWhole: 20n,
      oldFractional: 10n,
      amountWhole: 20n,
      amountFractional: 20n,
    };

    expect(() => {
      Scalar.decide(
        insufficientBalance.oldWhole,
        insufficientBalance.oldFractional,
        insufficientBalance.amountWhole,
        insufficientBalance.amountFractional,
      );
    }).toThrow("Insufficient balance!");
  });
});
