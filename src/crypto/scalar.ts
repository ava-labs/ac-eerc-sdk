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

  parseEERCBalance(balance: bigint | [bigint, bigint]): string {
    let whole: bigint;
    let fractional: bigint;

    if (Array.isArray(balance)) {
      // need to make sure that balance is fresh
      const fresh = Scalar.adjust(balance[0], balance[1]);
      [whole, fractional] = fresh;
    } else {
      [whole, fractional] = Scalar.recalculate(balance);
    }

    return `${whole.toString()}.${fractional.toString().padStart(2, "0")}`;
  },
};
