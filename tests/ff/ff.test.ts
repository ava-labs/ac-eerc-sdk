import { FF } from "../../src/crypto/ff";
import {
  TEST_PRIME,
  additionTestCases,
  divideTestCases,
  multiplicationTestCases,
  negateTestCases,
  newElementLargeNumberTestCases,
  newElementTestCases,
  normalizeTestCases,
  subtractionTestCases,
} from "./ff.test.cases";

describe("Finite Field", () => {
  // small prime for testing purposes
  const prime = TEST_PRIME;
  let field: FF;

  beforeEach(() => {
    field = new FF(prime);
  });

  test("should initialize correctly", () => {
    expect(field.p).toBe(prime);
    expect(field.one).toBe(1n);
    expect(field.zero).toBe(0n);
  });

  test("newElement handles numbers correctly", () => {
    for (const { input, expected } of newElementTestCases) {
      expect(field.newElement(input)).toBe(expected);
    }

    for (const { input } of newElementLargeNumberTestCases) {
      const result = field.newElement(input);
      expect(result).toBeGreaterThanOrEqual(0n);
      expect(result).toBeLessThan(prime);
    }
  });

  test("addition handles numbers correctly", () => {
    for (const { a, b, expected } of additionTestCases) {
      expect(field.add(a, b)).toBe(expected);
    }
  });

  test("subtraction handles numbers correctly", () => {
    for (const { a, b, expected } of subtractionTestCases) {
      expect(field.sub(a, b)).toBe(expected);
    }
  });

  test("multiplication handles numbers correctly", () => {
    for (const { a, b, expected } of multiplicationTestCases) {
      expect(field.mul(a, b)).toBe(expected);
    }
  });

  test("division handles numbers correctly", () => {
    for (const { a, b, expected } of divideTestCases) {
      expect(field.div(a, b)).toBe(expected);
    }
  });

  test("negate handles numbers correctly", () => {
    for (const { input, expected } of negateTestCases) {
      expect(field.negate(input)).toBe(expected);
    }
  });

  test("normalize handles numbers correctly", () => {
    for (const { input, expected } of normalizeTestCases) {
      expect(field.normalize(input)).toBe(expected);
    }
  });

  describe("modInverse", () => {
    test("Inverse of 1 is 1", () => {
      expect(field.modInverse(1n)).toBe(1n);
    });

    test("Inverse of 0 throws error", () => {
      expect(() => field.modInverse(0n)).toThrow("Division by zero");
    });
  });
});
