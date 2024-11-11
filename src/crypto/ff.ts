export class FF {
  public p: bigint;
  public one: bigint;
  public zero: bigint;

  constructor(prime: bigint) {
    this.p = prime;
    this.one = 1n;
    this.zero = 0n;
  }

  /**
   * returns a new element in the field
   * @param value bigint | string
   * @returns bigint
   */
  newElement(value: bigint | string): bigint {
    const vv = typeof value === "string" ? BigInt(value) : value;
    if (vv < this.zero) {
      return ((vv % this.p) + this.p) % this.p;
    }
    return vv % this.p;
  }

  /**
   * adds two elements in the field
   * @param a bigint
   * @param b bigint
   * @returns bigint
   */
  add(a: bigint, b: bigint): bigint {
    return (a + b) % this.p;
  }

  /**
   * subtracts two elements in the field
   * @param a bigint
   * @param b bigint
   * @returns bigint
   */
  sub(a: bigint, b: bigint): bigint {
    return (a - b + this.p) % this.p;
  }

  /**
   * multiplies two elements in the field
   * @param a bigint
   * @param b bigint
   * @returns bigint
   */
  mul(a: bigint, b: bigint): bigint {
    const result = (a * b) % this.p;
    if (result < this.zero) {
      return ((result % this.p) + this.p) % this.p;
    }
    return result;
  }

  /**
   * divides two elements in the field
   * @param a bigint
   * @param b bigint
   * @returns bigint
   */
  div(a: bigint, b: bigint): bigint {
    return this.mul(a, this.modInverse(b));
  }

  /**
   * negates an element in the field
   * @param value bigint
   * @returns bigint
   */
  negate(value: bigint): bigint {
    const vv = this.newElement(value);
    if (vv === this.zero) return this.zero;
    return this.p - vv;
  }

  /**
   * squares an element in the field
   * @param a bigint
   * @returns bigint
   */
  square(a: bigint): bigint {
    return this.mul(a, a);
  }

  /**
   * normalizes an element in the field
   * @param value bigint
   * @returns bigint
   */
  normalize(value: bigint): bigint {
    if (value < this.zero) {
      let na = -value;
      na = na % this.p;
      return na === this.zero ? this.zero : this.p - na;
    }

    return value >= this.p ? value % this.p : value;
  }

  /**
   * checks if two elements are equal
   * @param a bigint
   * @param b bigint
   * @returns boolean
   */
  eq(a: bigint, b: bigint): boolean {
    return a === b;
  }

  /**
   * checks if an element is in the field
   * @param value bigint
   * @returns boolean
   */
  isInField(value: bigint): boolean {
    return value >= this.zero && value < this.p;
  }

  /**
   * calculates the modular inverse of an element in the field
   * @param a bigint
   * @returns bigint
   */
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
