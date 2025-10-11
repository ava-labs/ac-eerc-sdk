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
    console.log('[addPoints] a:', a, 'a[0]:', a[0], 'a[1]:', a[1]);
    console.log('[addPoints] b:', b, 'b[0]:', b[0], 'b[1]:', b[1]);
    console.log('[addPoints] About to compute beta = mul(a[0], b[1])');
    const beta = this.field.mul(a[0], b[1]);
    console.log('[addPoints] beta computed:', beta);
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
    console.log('[mulWithScalar] p:', p);
    console.log('[mulWithScalar] s:', s);
    console.log('[mulWithScalar] this.field.zero:', this.field.zero);
    console.log('[mulWithScalar] this.field.one:', this.field.one);
    console.log('[mulWithScalar] this.Base8:', this.Base8);

    let res = [this.field.zero, this.field.one] as Point;
    console.log('[mulWithScalar] res initialized:', res);
    let e = p;
    console.log('[mulWithScalar] e:', e);
    let rem = s;

    while (!Scalar.isZero(rem)) {
      if (Scalar.isOdd(rem)) {
        console.log('[mulWithScalar] About to call addPoints(res, e) where res=', res, 'e=', e);
        res = this.addPoints(res, e);
      }
      console.log('[mulWithScalar] About to call addPoints(e, e) where e=', e);
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

  /**
   * Encrypt a message (byte array) with a public key using ECIES-like scheme
   * @param publicKey recipient's public key
   * @param message message as Uint8Array
   * @returns encrypted message as Uint8Array
   */
  async encryptBytes(
    publicKey: Point,
    message: Uint8Array,
  ): Promise<Uint8Array> {
    console.log('[encryptBytes START] publicKey parameter:', publicKey);
    console.log('[encryptBytes START] publicKey[0]:', publicKey[0]);
    console.log('[encryptBytes START] publicKey[1]:', publicKey[1]);

    // Validate inputs to avoid mixing undefined with BigInt ops
    if (!publicKey || publicKey[0] == null || publicKey[1] == null) {
      throw new Error('Invalid public key passed to encryptBytes. Expected [bigint, bigint] but got null/undefined');
    }
    if (typeof publicKey[0] !== 'bigint' || typeof publicKey[1] !== 'bigint') {
      throw new Error('Invalid public key passed to encryptBytes. Expected [bigint, bigint]');
    }
    if (!(message instanceof Uint8Array)) {
      throw new Error('encryptBytes expects message as Uint8Array');
    }

    // CRITICAL FIX: Create defensive copy to prevent mutations
    // mulWithScalar modifies the input array reference during operations
  const publicKeyCopy: Point = [publicKey[0], publicKey[1]];
    console.log('[encryptBytes] Created defensive copy:', publicKeyCopy);

    // Generate ephemeral key pair
    const ephemeralPrivateKey = await BabyJub.generateRandomValue();
    console.log('[encryptBytes] ephemeralPrivateKey generated:', ephemeralPrivateKey);

    const ephemeralPublicKey = this.mulWithScalar(this.Base8, ephemeralPrivateKey);
    console.log('[encryptBytes] ephemeralPublicKey computed:', ephemeralPublicKey);

    console.log('[encryptBytes] About to compute sharedSecret with publicKeyCopy:', publicKeyCopy);
    console.log('[encryptBytes] publicKeyCopy[0] before sharedSecret:', publicKeyCopy[0]);
    console.log('[encryptBytes] publicKeyCopy[1] before sharedSecret:', publicKeyCopy[1]);

    // Compute shared secret: S = ephemeralPrivateKey * publicKey
  const sharedSecret = this.mulWithScalar(publicKeyCopy, ephemeralPrivateKey);

    // Use x-coordinate of shared secret as encryption key
    const keyBytes = this.bigintToBytes(sharedSecret[0]);

    // XOR message with key (repeating key as needed)
    const encrypted = new Uint8Array(message.length);
    for (let i = 0; i < message.length; i++) {
      encrypted[i] = message[i] ^ keyBytes[i % keyBytes.length];
    }

    // Return: ephemeralPublicKey (64 bytes) + encrypted message
    const ephemeralPubKeyBytes = new Uint8Array(64);
    const xBytes = this.bigintToBytes(ephemeralPublicKey[0]);
    const yBytes = this.bigintToBytes(ephemeralPublicKey[1]);
    ephemeralPubKeyBytes.set(xBytes, 32 - xBytes.length);
    ephemeralPubKeyBytes.set(yBytes, 64 - yBytes.length);

    const result = new Uint8Array(64 + encrypted.length);
    result.set(ephemeralPubKeyBytes, 0);
    result.set(encrypted, 64);

    return result;
  }

  /**
   * Decrypt a message encrypted with encryptBytes
   * @param privateKey recipient's private key
   * @param encryptedMessage encrypted message from encryptBytes
   * @returns decrypted message as Uint8Array
   */
  decryptBytes(
    privateKey: bigint,
    encryptedMessage: Uint8Array,
  ): Uint8Array {
    // Extract ephemeral public key (first 64 bytes)
    const ephemeralPubKeyBytes = encryptedMessage.slice(0, 64);
    const ephemeralPublicKey: Point = [
      this.bytesToBigint(ephemeralPubKeyBytes.slice(0, 32)),
      this.bytesToBigint(ephemeralPubKeyBytes.slice(32, 64)),
    ];

    // Extract encrypted message
    const encrypted = encryptedMessage.slice(64);

    // Compute shared secret: S = privateKey * ephemeralPublicKey
    const sharedSecret = this.mulWithScalar(ephemeralPublicKey, privateKey);

    // Use x-coordinate of shared secret as decryption key
    const keyBytes = this.bigintToBytes(sharedSecret[0]);

    // XOR encrypted message with key to decrypt
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    return decrypted;
  }

  /**
   * Convert bigint to bytes (big-endian)
   */
  private bigintToBytes(n: bigint): Uint8Array {
    const hex = n.toString(16).padStart(64, '0');
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert bytes to bigint (big-endian)
   */
  private bytesToBigint(bytes: Uint8Array): bigint {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return BigInt('0x' + hex);
  }
}
