export const TEST_PRIME = 17n;

export const newElementTestCases = [
  { input: 0n, expected: 0n },
  { input: 1n, expected: 1n },
  { input: 16n, expected: 16n },
  { input: 17n, expected: 0n },
  { input: 18n, expected: 1n },
  { input: 34n, expected: 0n },
  { input: -1n, expected: 16n },
  { input: -17n, expected: 0n },
  { input: -18n, expected: 16n },
  { input: 100n, expected: 15n }, // 100 mod 17 = 15
  { input: -100n, expected: 2n }, // -100 mod 17 ≡ 2 (mod 17)
];

export const newElementLargeNumberTestCases = [
  { input: 2n ** 100n, name: "large positive" },
  { input: -(2n ** 100n), name: "large negative" },
];

export const additionTestCases = [
  { a: 5n, b: 3n, expected: 8n },
  { a: 10n, b: 9n, expected: 2n },
  { a: 16n, b: 1n, expected: 0n },
  { a: 8n, b: 8n, expected: 16n },
  { a: 0n, b: 0n, expected: 0n },
  { a: 0n, b: 1n, expected: 1n },
  { a: 1n, b: 0n, expected: 1n },
  { a: 16n, b: 16n, expected: 15n },
  { a: 15n, b: 3n, expected: 1n },
  { a: 7n, b: 13n, expected: 3n },
  // Edge cases
  { a: 0n, b: 0n, expected: 0n },
  { a: 0n, b: 1n, expected: 1n },
  { a: 1n, b: 0n, expected: 1n },
  { a: TEST_PRIME - 1n, b: 1n, expected: 0n },
  { a: TEST_PRIME - 1n, b: TEST_PRIME - 1n, expected: 15n },
  { a: TEST_PRIME, b: 0n, expected: 0n },
  { a: TEST_PRIME, b: TEST_PRIME, expected: 0n },
];

export const subtractionTestCases = [
  { a: 5n, b: 3n, expected: 2n },
  { a: 3n, b: 5n, expected: 15n }, // (3 - 5 + 17) % 17 = 15
  { a: 0n, b: 1n, expected: 16n },
  { a: 1n, b: 0n, expected: 1n },
  { a: 16n, b: 1n, expected: 15n },
  { a: 0n, b: 0n, expected: 0n },
  { a: 8n, b: 8n, expected: 0n },
  { a: 15n, b: 3n, expected: 12n },
  { a: 7n, b: 13n, expected: 11n }, // (7 - 13 + 17) % 17 = 11
  { a: 16n, b: 16n, expected: 0n },
  // Edge cases
  { a: 0n, b: 0n, expected: 0n },
  { a: 1n, b: 0n, expected: 1n },
  { a: 0n, b: 1n, expected: 16n },
  { a: TEST_PRIME - 1n, b: TEST_PRIME - 1n, expected: 0n },
  { a: 0n, b: TEST_PRIME - 1n, expected: 1n },
  { a: TEST_PRIME, b: 1n, expected: 16n },
  { a: TEST_PRIME, b: TEST_PRIME, expected: 0n },
];

export const multiplicationTestCases = [
  { a: 2n, b: 3n, expected: 6n },
  { a: 5n, b: 5n, expected: 8n }, // (5 * 5) % 17 = 8
  { a: 16n, b: 2n, expected: 15n }, // (16 * 2) % 17 = 15
  { a: 0n, b: 5n, expected: 0n },
  { a: 1n, b: 16n, expected: 16n },
  { a: 8n, b: 8n, expected: 13n }, // (8 * 8) % 17 = 13
  { a: 15n, b: 3n, expected: 11n }, // (15 * 3) % 17 = 11
  { a: 7n, b: 13n, expected: 6n }, // (7 * 13) % 17 = 6
  { a: 16n, b: 16n, expected: 1n }, // (16 * 16) % 17 = 1
  { a: 9n, b: 2n, expected: 1n }, // (9 * 2) % 17 = 1
  // Edge cases
  { a: 0n, b: 0n, expected: 0n },
  { a: 1n, b: 1n, expected: 1n },
  { a: 0n, b: TEST_PRIME - 1n, expected: 0n },
  { a: 1n, b: TEST_PRIME - 1n, expected: 16n },
  { a: TEST_PRIME - 1n, b: TEST_PRIME - 1n, expected: 1n }, // 16 * 16 % 17 = 1
  { a: TEST_PRIME, b: 0n, expected: 0n },
  { a: TEST_PRIME, b: TEST_PRIME, expected: 0n },
];

export const divideTestCases = [
  { a: 1n, b: 1n, expected: 1n },
  { a: 0n, b: 1n, expected: 0n },
  { a: 8n, b: 2n, expected: 4n },
  { a: 15n, b: 3n, expected: 5n }, // (15 * 3^-1) % 17 = 5
  { a: 16n, b: 16n, expected: 1n },
  { a: 1n, b: 16n, expected: 16n }, // 1 * 16^-1 % 17 = 1
  { a: 4n, b: 4n, expected: 1n },
  { a: 0n, b: 5n, expected: 0n },
  { a: 13n, b: 7n, expected: 14n }, // (13 * 7^-1) % 17 = 14
  { a: 10n, b: 3n, expected: 9n }, // (10 * 3^-1) % 17 = 9
];

export const negateTestCases = [
  { input: 0n, expected: 0n },
  { input: 1n, expected: 16n },
  { input: 8n, expected: 9n },
  { input: 16n, expected: 1n },
  { input: 17n, expected: 0n }, // 17 % 17 = 0, negate(0) = 0
  { input: 18n, expected: 16n }, // 18 % 17 = 1, negate(1) = 16
  { input: -1n, expected: 1n }, // -1 % 17 = 16, negate(16) = 1
  { input: -17n, expected: 0n }, // -17 % 17 = 0, negate(0) = 0
];

export const normalizeTestCases = [
  { input: 0n, expected: 0n },
  { input: 1n, expected: 1n },
  { input: 16n, expected: 16n },
  { input: 17n, expected: 0n },
  { input: 18n, expected: 1n },
  { input: -1n, expected: 16n },
  { input: -17n, expected: 0n },
  { input: -18n, expected: 16n },
  { input: 100n, expected: 15n }, // 100 % 17 = 15
  { input: -100n, expected: 2n }, // -100 % 17 ≡ 2 (mod 17)
  { input: 2n ** 100n, expected: 16n }, // (2^100) % 17 = 16
  { input: -(2n ** 100n), expected: 1n }, // -(2^100) % 17 ≡ 1 (mod 17)
];
