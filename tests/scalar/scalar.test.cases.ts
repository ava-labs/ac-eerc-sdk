export const shiftRightTestCases = [
  { input: 8n, shift: 1, expected: 4n },
  { input: 8n, shift: 3, expected: 1n },
  { input: 7n, shift: 1, expected: 3n },
  { input: -8n, shift: 1, expected: -4n },
  { input: 1n, shift: 1, expected: 0n },
  { input: 0n, shift: 1, expected: 0n },
  { input: 1000n, shift: 3, expected: 125n },
];
