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

  // decide how much to subtract and add from the balance with the rules of dynamic balance
  decide(
    oldWhole: bigint,
    oldFractional: bigint,
    amountWhole: bigint,
    amountFractional: bigint,
  ): [bigint[], bigint[]] {
    const balanceTotal = Scalar.calculate(oldWhole, oldFractional);
    const amountTotal = Scalar.calculate(amountWhole, amountFractional);
    const newBalanceTotal = balanceTotal - amountTotal;
    if (newBalanceTotal < 0) throw new Error("Insufficient balance!");

    const newBalance = Scalar.recalculate(newBalanceTotal);
    const x = oldWhole - newBalance[0];
    const y = oldFractional - newBalance[1];

    const toBeSubtracted = [0n, 0n];
    const toBeAdded = [0n, 0n];

    if (x > 0n) toBeSubtracted[0] = x;
    else toBeAdded[0] = -x;

    if (y > 0n) toBeSubtracted[1] = y;
    else toBeAdded[1] = -y;

    return [toBeSubtracted, toBeAdded];
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
