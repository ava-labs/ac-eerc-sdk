import type { Point } from "../crypto/types";
import type { useEncryptedBalance } from "./useEncryptedBalance";

export type EncryptedBalance = [ContractCipher, ContractCipher];

export type ContractCipher = {
  c1: PPoint;
  c2: PPoint;
};

export type PPoint = {
  x: bigint;
  y: bigint;
};

export type OperationResult = {
  transactionHash: `0x${string}`;
};

export type DecryptedTransaction = {
  type: string;
  amount: string;
  sender: `0x${string}`;
  receiver: `0x${string}` | null;
  transactionHash: `0x${string}`;
};

export type EERCHookResult = {
  isInitialized: boolean;
  isAllDataFetched: boolean;
  isRegistered: boolean;
  isConverter: boolean;
  publicKey: bigint[];
  auditorPublicKey: bigint[];
  isAuditorKeySet: boolean;
  name: string;
  symbol: string;
  shouldGenerateDecryptionKey: boolean;
  generateDecryptionKey: () => Promise<string>;
  register: () => Promise<{ key: string; transactionHash: string }>;
  setAuditor: (publicKey: Point) => Promise<`0x${string}`>;
  setMyselfAsAuditor: () => Promise<`0x${string}`>;
  auditorDecrypt: () => Promise<DecryptedTransaction[]>;
  isAddressRegistered: (
    address: `0x${string}`,
  ) => Promise<{ isRegistered: boolean; error: string | null }>;
  useEncryptedBalance: (
    tokenAddress?: `0x${string}`,
  ) => ReturnType<typeof useEncryptedBalance>;
};

export type UseEncryptedBalanceHookResult = {
  decryptedBalance: bigint[];
  parsedDecryptedBalance: string;
  encryptedBalance: bigint[];
  auditorPublicKey: bigint[];
  privateMint: (amount: bigint) => Promise<OperationResult>;
  privateBurn: (amount: bigint) => Promise<OperationResult>;
  privateTransfer: (to: string, amount: bigint) => Promise<OperationResult>;
  withdraw: (amount: bigint) => Promise<OperationResult>;
  deposit: (amount: bigint) => Promise<OperationResult>;
};
