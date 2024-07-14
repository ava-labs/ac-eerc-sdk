export const Scalar = {
  isZero(s: bigint): boolean {
    return s === 0n;
  },

  isOdd(s: bigint): boolean {
    return (s & 1n) === 1n;
  },

  shiftRight(s: bigint, n: number): bigint {
    return s >> BigInt(n);
  },
};
