import { SNARK_FIELD_SIZE } from "../../utils";
import { BabyJub } from "../babyjub";
import { FF } from "../ff";
import { formatKeyForCurve } from "../key";
import type { Point, PoseidonEncryptionResult } from "../types";
import { C_RAW, M_RAW } from "./poseidon_constants";

export class Poseidon {
  public field: FF;
  public curve: BabyJub;
  public two128: bigint;
  public N_ROUNDS_F = 8;
  public N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63];

  constructor(field: FF, curve: BabyJub) {
    this.field = field;
    this.curve = curve;
    this.two128 = this.field.newElement(
      "340282366920938463463374607431768211456",
    );
  }

  /**
   * function to perform poseidon decryption on the pct
   * @param pct pct array
   * @returns decrypted
   */
  static decryptAmountPCT(key: string, pct: string[]) {
    const privateKey = formatKeyForCurve(key);
    const pctInBig = pct.map((e) => BigInt(e));

    const cipher = pctInBig.slice(0, 4) as bigint[];
    const authKey = pctInBig.slice(4, 6) as Point;
    const nonce = pctInBig[6] as bigint;
    const length = 1;

    const field = new FF(SNARK_FIELD_SIZE);
    const curve = new BabyJub(field);
    const poseidon = new Poseidon(field, curve);

    const [amount] = poseidon.processPoseidonDecryption({
      privateKey,
      authKey,
      cipher,
      nonce,
      length,
    });

    return amount;
  }

  /**
   * process poseidon encryption with the given inputs and public key
   * @param params parameters (inputs : bigint[], publicKey : Point)
   * @returns {cipher : bigint[], nonce : bigint, encryptionRandom : bigint, authKey : Point, encryptionKey : Point}
   */
  async processPoseidonEncryption(params: {
    inputs: bigint[];
    publicKey: Point;
  }): Promise<PoseidonEncryptionResult> {
    const { inputs, publicKey } = params;
    const poseidonNonce = (await BabyJub.generateRandomValue()) % this.two128;
    const encryptionRandom =
      (await BabyJub.generateRandomValue()) % BigInt(2 ** 253);
    const encryptionKey = this.curve.mulWithScalar(publicKey, encryptionRandom);
    const cipher = this.poseidonEncrypt(inputs, encryptionKey, poseidonNonce);

    const poseidonAuthKey = this.curve.mulWithScalar(
      this.curve.Base8,
      encryptionRandom,
    );

    return {
      cipher,
      nonce: poseidonNonce,
      encryptionRandom,
      authKey: poseidonAuthKey,
      encryptionKey,
    };
  }

  /**
   * process poseidon decryption with the given parameters
   * @param params parameters (privateKey : bigint, authKey : Point, cipher : bigint[], nonce : bigint, length : number)
   * @returns decrypted message
   */
  processPoseidonDecryption(params: {
    privateKey: bigint;
    authKey: Point;
    cipher: bigint[];
    nonce: bigint;
    length: number;
  }): bigint[] {
    const { privateKey, authKey, cipher, length, nonce } = params;
    const sharedKey = this.curve.mulWithScalar(authKey, privateKey);
    const decrypted = this.poseidonDecrypt(cipher, sharedKey, nonce, length);
    return decrypted;
  }

  /**
   * poseidon permutation
   */
  private poseidonPerm(ss: bigint[]): bigint[] {
    if (ss.length > this.N_ROUNDS_P.length)
      throw new Error("Invalid poseidon state");

    const t = ss.length;
    const nRoundsF = this.N_ROUNDS_F;
    const nRoundsP = this.N_ROUNDS_P[t - 2];

    let state = ss.map((e) => this.field.newElement(e));
    for (let r = 0; r < nRoundsF + nRoundsP; r++) {
      state = state.map((a, i) =>
        this.field.add(a, BigInt(C_RAW[t - 2][r * t + i])),
      );

      if (r < nRoundsF / 2 || r >= nRoundsF / 2 + nRoundsP) {
        state = state.map((e) => this.pow5(e));
      } else {
        state[0] = this.pow5(state[0]);
      }

      state = state.map((_, i) =>
        state.reduce(
          (acc, a, j) =>
            this.field.add(acc, this.field.mul(BigInt(M_RAW[t - 2][i][j]), a)),
          this.field.zero,
        ),
      );
    }
    return state.map((e) => this.field.normalize(e));
  }

  /**
   * poseidon encryption
   */
  private poseidonEncrypt(
    inputs: bigint[],
    key: Point,
    nonce: bigint,
  ): bigint[] {
    const msg = inputs.map((input) => this.field.newElement(input));

    // the nonce must be less than 2 ** 256
    if (nonce >= this.two128) throw new Error("Invalid nonce");

    // pad the message if needed
    while (msg.length % 3 > 0) msg.push(this.field.zero);

    const cipherLength = msg.length;

    // initial state
    // S = (0, kS[0], kS[1], N + l ∗ 2^128).
    let state = [
      this.field.zero,
      this.field.newElement(key[0]),
      this.field.newElement(key[1]),
      this.field.add(
        this.field.newElement(nonce),
        this.field.mul(
          this.field.newElement(String(inputs.length)),
          this.two128,
        ),
      ),
    ];

    const ciphertext: bigint[] = [];

    for (let i = 0; i < cipherLength / 3; i++) {
      state = this.poseidonPerm(state);

      state[1] = this.field.add(state[1], msg[i * 3]);
      state[2] = this.field.add(state[2], msg[i * 3 + 1]);
      state[3] = this.field.add(state[3], msg[i * 3 + 2]);

      // ciphertext.push(state[1], state[2], state[3]);
      ciphertext.push(state[1]);
      ciphertext.push(state[2]);
      ciphertext.push(state[3]);
    }

    state = this.poseidonPerm(state);

    ciphertext.push(state[1]);

    return ciphertext;
  }

  /**
   * poseidon decryption
   */
  private poseidonDecrypt(
    cipher: bigint[],
    sharedKey: Point,
    nonce: bigint,
    length: number,
  ): bigint[] {
    // initial state
    let state = [
      this.field.zero,
      this.field.newElement(sharedKey[0]),
      this.field.newElement(sharedKey[1]),
      this.field.add(
        this.field.newElement(nonce),
        this.field.mul(this.field.newElement(length.toString()), this.two128),
      ),
    ];

    const msg: bigint[] = [];
    const count = Math.floor(cipher.length / 3);

    for (let i = 0; i < count; i++) {
      state = this.poseidonPerm(state);

      msg.push(this.field.sub(cipher[i * 3], state[1]));
      msg.push(this.field.sub(cipher[i * 3 + 1], state[2]));
      msg.push(this.field.sub(cipher[i * 3 + 2], state[3]));

      state[1] = cipher[i * 3];
      state[2] = cipher[i * 3 + 1];
      state[3] = cipher[i * 3 + 2];
    }

    const checkEqual = (a: bigint, b: bigint, field: FF, error: string) => {
      if (!field.eq(a, b)) {
        throw new Error(error);
      }
    };

    if (length % 3) {
      if (length % 3 === 2) {
        checkEqual(
          msg[msg.length - 1],
          this.field.zero,
          this.field,
          "The last element of the message must be 0",
        );
      } else if (length % 3 === 1) {
        checkEqual(
          msg[msg.length - 1],
          this.field.zero,
          this.field,
          "The last element of the message must be 0",
        );
        checkEqual(
          msg[msg.length - 2],
          this.field.zero,
          this.field,
          "The second to last element of the message must be 0",
        );
      }
    }

    state = this.poseidonPerm(state);

    checkEqual(
      cipher[cipher.length - 1],
      state[1],
      this.field,
      "Invalid ciphertext",
    );

    return msg.slice(0, length);
  }

  private pow5(a: bigint): bigint {
    return this.field.mul(a, this.field.square(this.field.square(a)));
  }
}
