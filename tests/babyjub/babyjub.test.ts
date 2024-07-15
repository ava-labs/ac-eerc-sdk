import { describe, expect, test } from "bun:test";
import { BabyJub } from "../../src/crypto/babyjub";
import type { ElGamalCipherText, Point } from "../../src/crypto/types";
import { SNARK_FIELD_SIZE } from "../../src/utils";

describe("BabyJub", () => {
  const curve = new BabyJub();

  describe("addPoints", () => {
    test("Adding point to itself", () => {
      const result = curve.addPoints(curve.Generator, curve.Generator);
      expect(curve.inCurve(result)).toBe(true);
      expect(result).not.toEqual(curve.Generator);
    });

    test("Adding point to identity element", () => {
      const identity: Point = [curve.field.zero, curve.field.one];
      const result = curve.addPoints(curve.Generator, identity);
      expect(result).toEqual(curve.Generator);
    });

    test("Adding identity to itself", () => {
      const identity: Point = [curve.field.zero, curve.field.one];
      const result = curve.addPoints(identity, identity);
      expect(result).toEqual(identity);
    });

    test("Commutativity: P + Q = Q + P", () => {
      const P = curve.Generator;
      const Q = curve.mulWithScalar(P, 2n);
      const result1 = curve.addPoints(P, Q);
      const result2 = curve.addPoints(Q, P);
      expect(result1).toEqual(result2);
    });

    test("Associativity: (P + Q) + R = P + (Q + R)", () => {
      const P = curve.Generator;
      const Q = curve.mulWithScalar(P, 2n);
      const R = curve.mulWithScalar(P, 3n);
      const result1 = curve.addPoints(curve.addPoints(P, Q), R);
      const result2 = curve.addPoints(P, curve.addPoints(Q, R));
      expect(result1).toEqual(result2);
    });

    test("Adding inverse points", () => {
      const P = curve.Generator;
      const negP: Point = [curve.field.negate(P[0]), P[1]];
      const result = curve.addPoints(P, negP);
      expect(result).toEqual([curve.field.zero, curve.field.one]);
    });

    test("Adding points with same x-coordinate", () => {
      const P = curve.Generator;
      const Q: Point = [P[0], curve.field.negate(P[1])];
      const result = curve.addPoints(P, Q);
      expect(curve.inCurve(result)).toBe(true);
    });
  });

  describe("subPoints", () => {
    test("Subtracting a point from itself results in identity", () => {
      const P = curve.Generator;
      const result = curve.subPoints(P, P);
      expect(result).toEqual([curve.field.zero, curve.field.one]);
    });

    test("Subtracting identity from a point returns the point", () => {
      const P = curve.Generator;
      const identity: Point = [curve.field.zero, curve.field.one];
      const result = curve.subPoints(P, identity);
      expect(result).toEqual(P);
    });

    test("Subtracting and then adding the same point", () => {
      const P = curve.Generator;
      const Q = curve.mulWithScalar(P, 5n);
      const diff = curve.subPoints(Q, P);
      const result = curve.addPoints(P, diff);
      expect(result).toEqual(Q);
    });

    test("Double subtraction: (P - Q) - Q = P - 2Q", () => {
      const P = curve.Generator;
      const Q = curve.mulWithScalar(P, 2n);
      const result1 = curve.subPoints(curve.subPoints(P, Q), Q);
      const result2 = curve.subPoints(P, curve.mulWithScalar(Q, 2n));
      expect(result1).toEqual(result2);
    });
  });

  describe("mulWithScalar", () => {
    test("Multiplying by 0 returns the identity point", () => {
      const result = curve.mulWithScalar(curve.Generator, 0n);
      expect(result).toEqual([curve.field.zero, curve.field.one]);
    });

    test("Multiplying by 1 returns the same point", () => {
      const result = curve.mulWithScalar(curve.Generator, 1n);
      expect(result).toEqual(curve.Generator);
    });

    test("Multiplying by 2 is equivalent to point addition with itself", () => {
      const doublePoint = curve.addPoints(curve.Generator, curve.Generator);
      const result = curve.mulWithScalar(curve.Generator, 2n);
      expect(result).toEqual(doublePoint);
    });

    test("Scalar multiplication is distributive over point addition", () => {
      const P = curve.Generator;
      const Q = curve.mulWithScalar(P, 2n);
      const scalar = 5n;
      const left = curve.mulWithScalar(curve.addPoints(P, Q), scalar);
      const right = curve.addPoints(
        curve.mulWithScalar(P, scalar),
        curve.mulWithScalar(Q, scalar),
      );
      expect(left).toEqual(right);
    });

    test("Large scalar multiplication", () => {
      const largeScalar = 2n ** 100n;
      const result = curve.mulWithScalar(curve.Generator, largeScalar);
      expect(curve.inCurve(result)).toBe(true);
    });

    test("Scalar multiplication result always on the curve", () => {
      for (let i = 1n; i <= 20n; i++) {
        const result = curve.mulWithScalar(curve.Generator, i);
        expect(curve.inCurve(result)).toBe(true);
      }
    });

    test("Repeated addition equals scalar multiplication", () => {
      const scalar = 7n;
      let repeated = curve.Generator;
      for (let i = 1n; i < scalar; i++) {
        repeated = curve.addPoints(repeated, curve.Generator);
      }
      const multiplied = curve.mulWithScalar(curve.Generator, scalar);
      expect(repeated).toEqual(multiplied);
    });
  });

  describe("generatePublicKey", () => {
    test("should generate correct public key", () => {
      const secretKey = 123456789n;
      const publicKey = curve.generatePublicKey(secretKey);
      expect(curve.inCurve(publicKey)).toBe(true);
      expect(publicKey).toEqual(curve.mulWithScalar(curve.Base8, secretKey));
    });

    test("should throw error for invalid secret key", () => {
      expect(() => curve.generatePublicKey(SNARK_FIELD_SIZE)).toThrowError(
        "Secret key is not in the field",
      );
    });

    test("should generate correct public key for edge case secret keys", () => {
      const edgeCases = [1n, SNARK_FIELD_SIZE - 1n];
      for (const sk of edgeCases) {
        const pk = curve.generatePublicKey(sk);
        expect(curve.inCurve(pk)).toBe(true);
        expect(pk).toEqual(curve.mulWithScalar(curve.Base8, sk));
      }
    });
  });

  describe("el-gamal encryption and decryption", () => {
    const COUNT = 10;
    test("should encrypt & decrypt properly with random messages and random secret keys", async () => {
      for (let idx = 0; idx < COUNT; idx++) {
        const sk = await BabyJub.generateRandomValue();
        const pk = curve.generatePublicKey(sk);
        const message = await BabyJub.generateRandomValue();
        const { cipher } = await curve.elGamalEncryptionWithScalar(pk, message);
        const decrypted = curve.elGamalDecryption(sk, cipher);
        expect(decrypted).toEqual(curve.mulWithScalar(curve.Base8, message));
      }
    });

    test("should produce different cipher texts for the same message and key", async () => {
      const sk = await BabyJub.generateRandomValue();
      const pk = curve.generatePublicKey(sk);
      const message = 12345n;
      const { cipher: cipher1 } = await curve.elGamalEncryptionWithScalar(
        pk,
        message,
      );
      const { cipher: cipher2 } = await curve.elGamalEncryptionWithScalar(
        pk,
        message,
      );
      expect(cipher1).not.toEqual(cipher2);
    });

    test("homomorphic property", async () => {
      const sk = await BabyJub.generateRandomValue();
      const pk = curve.generatePublicKey(sk);
      const m1 = 1234n;
      const m2 = 5678n;
      const { cipher: c1 } = await curve.elGamalEncryptionWithScalar(pk, m1);
      const { cipher: c2 } = await curve.elGamalEncryptionWithScalar(pk, m2);

      const sumCipher: ElGamalCipherText = {
        c1: curve.addPoints(c1.c1, c2.c1),
        c2: curve.addPoints(c1.c2, c2.c2),
      };

      const decryptedSum = curve.elGamalDecryption(sk, sumCipher);
      const expectedSum = curve.mulWithScalar(
        curve.Base8,
        (m1 + m2) % SNARK_FIELD_SIZE,
      );
      expect(decryptedSum).toEqual(expectedSum);
    });
  });
});
