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
      const l = 1;
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
  });
});
