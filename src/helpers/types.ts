export type IProof = {
  proof: string[];
  publicInputs: string[];
};

export enum ProofType {
  REGISTER = "register",
  BURN = "burn",
  TRANSFER = "transfer",
  MINT = "mint",
}
