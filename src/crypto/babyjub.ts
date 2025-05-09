import { SUB_GROUP_ORDER } from "../utils";
import type { FF } from "./ff";
import { Scalar } from "./scalar";
import type { ElGamalCipherText, Point } from "./types";

export class BabyJub {
  public A = 168700n;
  public D = 168696n;

  /**
   * base8 point
   */
  public Base8: Point = [
    5299619240641551281634865583518297030282874472190772894086521144482721001553n,
    16950150798460657717958625567821834550301663161624707787222815936182638968203n,
  ];

  constructor(public field: FF) {
    this.field = field;
  }

  /**
   * returns the order of the curve
   */
  static order() {
    return 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
  }

  /**
   * generates and returns a random scalar in the field
   */
  static async generateRandomValue(): Promise<bigint> {
    const lowerBound = SUB_GROUP_ORDER / 2n;

    let rand: bigint;
    do {
      const randBytes = await BabyJub.getRandomBytes(32);
      rand = BigInt(`0x${Buffer.from(randBytes).toString("hex")}`);
    } while (rand < lowerBound);

    return rand % SUB_GROUP_ORDER;
  }

  /**
   * adds two points on the curve
   * @param a point a
   * @param b point b
   * @returns point
   */
  addPoints(a: Point, b: Point): Point {
    const beta = this.field.mul(a[0], b[1]);
    const gamma = this.field.mul(a[1], b[0]);
    const delta = this.field.mul(
      this.field.sub(a[1], this.field.mul(this.A, a[0])),
      this.field.add(b[0], b[1]),
    );
    const tau = this.field.mul(beta, gamma);
    const dtau = this.field.mul(this.D, tau);

    const x = this.field.div(
      this.field.add(beta, gamma),
      this.field.add(this.field.one, dtau),
    );

    const y = this.field.div(
      this.field.add(
        delta,
        this.field.sub(this.field.mul(this.A, beta), gamma),
      ),
      this.field.sub(this.field.one, dtau),
    );
    return [x, y] as Point;
  }

  /**
   * subtracts two points on the curve
   * @param p1 point a
   * @param p2 point b
   * @returns point
   */
  subPoints(p1: Point, p2: Point): Point {
    const negatedP2: Point = [this.field.negate(p2[0]), p2[1]];
    return this.addPoints(p1, negatedP2);
  }

  /**
   * multiplies a point by a scalar
   * @param p point
   * @param s scalar
   * @returns point
   */
  mulWithScalar(p: Point, s: bigint): Point {
    let res = [this.field.zero, this.field.one] as Point;
    let e = p;
    let rem = s;
    while (!Scalar.isZero(rem)) {
      if (Scalar.isOdd(rem)) {
        res = this.addPoints(res, e);
      }
      e = this.addPoints(e, e);
      rem = Scalar.shiftRight(rem, 1);
    }
    return res;
  }

  /**
   * implements the equation of the curve
   * y^2 = x^3 + A*x^2 + x
   * returns true if the point is on the curve
   * @param p point
   * @returns boolean
   */
  inCurve(p: Point): boolean {
    const x2 = this.field.mul(p[0], p[0]);
    const y2 = this.field.mul(p[1], p[1]);
    return this.field.eq(
      this.field.add(this.field.mul(this.A, x2), y2),
      this.field.add(
        this.field.one,
        this.field.mul(this.D, this.field.mul(x2, y2)),
      ),
    );
  }

  /**
   * generates public key from secret key
   * @param secretKey secret key
   * @returns point
   */
  generatePublicKey(secretKey: bigint): Point {
    if (!this.field.isInField(secretKey)) {
      throw new Error("Secret key is not in the field");
    }
    return this.mulWithScalar(this.Base8, secretKey);
  }

  /**
   * encrypts a message point with a public key
   * @param publicKey public key
   * @param message message point
   * @returns ciphertext and random
   */
  async encryptMessage(
    publicKey: Point,
    message: bigint,
  ): Promise<{ cipher: ElGamalCipherText; random: bigint }> {
    return this.elGamalEncryptionWithScalar(publicKey, message);
  }

  /**
   * encrypts a scalar message with a public key,before encryption it multiplies the message with base8
   * to get the corresponding point on the curve
   * @param publicKey public key
   * @param message message bigint
   * @returns ciphertext and random
   */
  async elGamalEncryptionWithScalar(
    publicKey: Point,
    message: bigint,
  ): Promise<{ cipher: ElGamalCipherText; random: bigint }> {
    const mm = this.mulWithScalar(this.Base8, message);
    return this.elGamalEncryption(publicKey, mm);
  }

  /**
   * el-gamal encryption with point message
   * @param publicKey public key
   * @param message message point
   * @returns ciphertext and random
   */
  async elGamalEncryption(
    publicKey: Point,
    message: Point,
  ): Promise<{ cipher: ElGamalCipherText; random: bigint }> {
    const random = await BabyJub.generateRandomValue();
    const c1 = this.mulWithScalar(this.Base8, random);
    const pky = this.mulWithScalar(publicKey, random);
    const c2 = this.addPoints(message, pky);
    return { cipher: { c1, c2 } as ElGamalCipherText, random: random };
  }

  /**
   * el-gamal decryption
   * @param privateKey private key
   * @param cipher ciphertext
   * @returns message
   */
  elGamalDecryption(privateKey: bigint, cipher: ElGamalCipherText): Point {
    const c1x = this.mulWithScalar(cipher.c1, privateKey);
    const c1xInverse = [this.field.mul(c1x[0], -1n), c1x[1]] as Point;
    return this.addPoints(cipher.c2, c1xInverse);
  }

  /**
   * generates random bytes depending on the environment
   * @param bytes number of bytes
   * @returns random bytes
   */
  private static async getRandomBytes(bytes: number): Promise<Uint8Array> {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.getRandomValues
    ) {
      return window.crypto.getRandomValues(new Uint8Array(bytes));
    }
    try {
      const { randomBytes } = await import("node:crypto");
      return new Uint8Array(randomBytes(bytes).buffer);
    } catch (_) {
      throw new Error("Unable to find a secure random number generator");
    }
  }
}
