import { describe, expect, test } from "bun:test";
import { BabyJub } from "../../src/crypto/babyjub";
import { FF } from "../../src/crypto/ff";
import { Poseidon } from "../../src/crypto/poseidon";
import { SNARK_FIELD_SIZE } from "../../src/utils";

describe("Poseidon Encryption & Decryption", () => {
  const field = new FF(SNARK_FIELD_SIZE);
  const curve = new BabyJub(field);
  const pos = new Poseidon(field, curve);

  test("Should encrypt and decrypt properly", async () => {
    const COUNT = 10;

    const generateRandomInput = async () => {
      const l = Math.floor(Math.random() * 10) + 1;
      const inputs: bigint[] = [];

      for (let i = 0; i < l; i++) {
        const r = await BabyJub.generateRandomValue();
        inputs.push(r);
      }

      return inputs;
    };

    for (let i = 0; i < COUNT; i++) {
      const privateKey = await BabyJub.generateRandomValue();
      const publicKey = curve.generatePublicKey(privateKey);

      const inputs = await generateRandomInput();

      const { cipher, authKey, nonce } = await pos.processPoseidonEncryption({
        inputs,
        publicKey,
      });

      const decrypted = pos.processPoseidonDecryption({
        privateKey,
        authKey,
        nonce,
        length: inputs.length,
        cipher,
      });

      expect(decrypted).toEqual(inputs);
    }
    // const sk =
    //   5740379625339755798800204250072470033252660053090522577595307571693826259968n;
    // const publicKey = curve.generatePublicKey(sk);

    // const cc = await pos.processPoseidonEncryption({
    //   inputs: [1n, 100n, 50n, 10n],
    //   publicKey,
    // });

    // const decrypted = pos.processPoseidonDecryption({
    //   privateKey: sk,
    //   authKey: cc.authKey,
    //   cipher: cc.cipher,
    //   nonce: cc.nonce,
    //   length: 4,
    // });
    // console.log("decrypted", decrypted);
  });
});
