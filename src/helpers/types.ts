export type IWasmProof = {
  a: string[];
  b: string[][];
  c: string[];
};

export type IProof = IWasmProof & {
  inputs: string[];
};

export enum ProofType {
  REGISTER = "register",
  BURN = "burn",
  TRANSFER = "transfer",
  MINT = "mint",
}
