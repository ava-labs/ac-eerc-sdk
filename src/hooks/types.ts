export type EncryptedBalance = [ContractCipher, ContractCipher];

export type ContractCipher = {
  c1: PPoint;
  c2: PPoint;
};

export type PPoint = {
  x: bigint;
  y: bigint;
};

export enum TransactionType {
  MINT = "privateMint",
  BURN = "privateBurn",
  TRANSFER = "transfer",
  REGISTER = "register",
}

export type DecryptedTransaction = {
  type: TransactionType;
  amount: bigint;
  sender: `0x${string}`;
  receiver: `0x${string}` | null;
  transactionHash: `0x${string}`;
};
