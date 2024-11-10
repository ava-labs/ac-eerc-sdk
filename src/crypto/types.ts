export type Point = [bigint, bigint];
export type ElGamalCipherText = {
  c1: Point;
  c2: Point;
};

// Poseidon
export type PoseidonEncryptionResult = {
  cipher: bigint[];
  nonce: bigint;
  encryptionRandom: bigint;
  authKey: Point;
  encryptionKey: Point;
};

export type AmountPCT = {
  index: bigint;
  pct: bigint[];
};

export type EGCT = {
  c1: { X: bigint; Y: bigint };
  c2: { X: bigint; Y: bigint };
};
