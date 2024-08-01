export type IProof = {
  a: string[];
  b: string[][];
  c: string[];
  input: string[];
};

export enum ProofType {
  REGISTER = "register",
  BURN = "burn",
  TRANSFER = "transfer",
  MINT = "mint",
}
