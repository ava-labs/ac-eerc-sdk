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

  // calculate the user balance in cents
  calculate(whole: bigint, fractional: bigint): bigint {
    return whole * 100n + fractional;
  },

  // recalculate the user balance in whole and fractional from cents
  recalculate(balance: bigint): [bigint, bigint] {
    const whole = balance / 100n;
    const fractional = balance % 100n;
    return [whole, fractional];
  },

  // adjust balance
  adjust(whole: bigint, fractional: bigint): bigint[] {
    const cents = this.calculate(whole, fractional);
    const adjusted = this.recalculate(cents);
    return adjusted;
  },
};
