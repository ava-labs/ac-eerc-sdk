export const shiftRightTestCases = [
  { input: 8n, shift: 1, expected: 4n },
  { input: 8n, shift: 3, expected: 1n },
  { input: 7n, shift: 1, expected: 3n },
  { input: -8n, shift: 1, expected: -4n },
  { input: 1n, shift: 1, expected: 0n },
  { input: 0n, shift: 1, expected: 0n },
  { input: 1000n, shift: 3, expected: 125n },
];

export const decideCases = [
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
