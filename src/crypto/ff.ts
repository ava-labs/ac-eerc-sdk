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
  newElement(value: bigint): bigint {
    if (value < this.zero) {
      return ((value % this.p) + this.p) % this.p;
    }
    return value % this.p;
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
    return (a * b) % this.p;
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

  // returns the modular inverse of an element in the field
  private modInverse(a: bigint): bigint {
    let [old_r, r] = [a, this.p];
    let [old_s, s] = [this.one, this.zero];
    let [old_t, t] = [this.zero, this.one];

    while (r !== 0n) {
      const q = old_r / r;
      [old_r, r] = [r, old_r - q * r];
      [old_s, s] = [s, old_s - q * s];
      [old_t, t] = [t, old_t - q * t];
    }

    if (old_r !== this.one) throw new Error("No inverse exists");

    return (old_s + this.p) % this.p;
  }

  // ElGamal Encryption
  elGamalEncrypt() {}
}
