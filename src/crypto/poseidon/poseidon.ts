import { unstringifyBigInts } from "../../utils";
import { BabyJub } from "../babyjub";
import type { FF } from "../ff";
import type { Point } from "../types";
import { POSEIDON_CONSTANTS } from "./poseidon_constants";

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

  private pow5(a: bigint): bigint {
    return this.field.mul(a, this.field.square(this.field.square(a)));
  }

  async processPoseidonEncryption(params: {
    inputs: bigint[];
    publicKey: Point;
  }) {
    const { inputs, publicKey } = params;
    const poseidonNonce = await BabyJub.generateRandomValue();
    const encryptionRandom = await BabyJub.generateRandomValue();
    const poseidonEncryptionKey = this.curve.mulWithScalar(
      publicKey,
      encryptionRandom,
    );
  }

  private poseidonEncrypt(inputs: bigint[], key: Point, nonce: bigint) {
    const msg = inputs.map((input) => this.field.newElement(input));

    // the nonce must be less than 2 ** 256
    if (nonce >= this.two128) throw new Error("Invalid nonce");

    // pad the message if needed
    while (msg.length % 3 < 0) msg.push(this.field.zero);

    const cipherLength = msg.length;

    // initial state
    let state = [
      this.field.zero,
      this.field.newElement(key[0]),
      this.field.newElement(key[1]),
      this.field.add(
        this.field.newElement(nonce),
        this.field.mul(
          this.field.newElement(msg.length.toString()),
          this.two128,
        ),
      ),
    ];

    const ciphertext = [];
  }
}
