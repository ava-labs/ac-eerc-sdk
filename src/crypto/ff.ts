export class FF {
  public p: bigint;
  public one: bigint;
  public zero: bigint;

  constructor(prime: bigint) {
    this.p = prime;
    this.one = 1n;
    this.zero = 0n;
  }

  // returns a new element in the field
  newElement(value: bigint | string): bigint {
    const vv = typeof value === "string" ? BigInt(value) : value;
    if (vv < this.zero) {
      return ((vv % this.p) + this.p) % this.p;
    }
    return vv % this.p;
  }

  // adds two elements in the field
  add(a: bigint, b: bigint): bigint {
    return (a + b) % this.p;
  }

  // subtracts two elements in the field
  sub(a: bigint, b: bigint): bigint {
    return (a - b + this.p) % this.p;
  }

  // multiplies two elements in the field
  mul(a: bigint, b: bigint): bigint {
    const result = (a * b) % this.p;
    if (result < this.zero) {
      return ((result % this.p) + this.p) % this.p;
    }
    return result;
  }

  // divides two elements in the field
  div(a: bigint, b: bigint): bigint {
    return this.mul(a, this.modInverse(b));
  }

  // negates an element in the field
  negate(value: bigint): bigint {
    const vv = this.newElement(value);
    if (vv === this.zero) return this.zero;
    return this.p - vv;
  }

  square(a: bigint): bigint {
    return this.mul(a, a);
  }

  normalize(value: bigint): bigint {
    if (value < this.zero) {
      let na = -value;
      na = na % this.p;
      return na === this.zero ? this.zero : this.p - na;
    }

    return value >= this.p ? value % this.p : value;
  }

  eq(a: bigint, b: bigint): boolean {
    return a === b;
  }

  isInField(value: bigint): boolean {
    return value >= this.zero && value < this.p;
  }

  modInverse(a: bigint): bigint {
    if (a === 0n) {
      throw new Error("Division by zero");
    }

    let t = 0n;
    let r = this.p;
    let newT = 1n;
    let newR = this.normalize(a);

    while (newR !== 0n) {
      const quotient = r / newR;
      [t, newT] = [newT, t - quotient * newT];
      [r, newR] = [newR, r - quotient * newR];
    }

    if (r > 1n) {
      throw new Error(`${a} has no multiplicative inverse modulo ${this.p}`);
    }

    if (t < 0n) {
      t += this.p;
    }

    return this.normalize(t);
  }
}
