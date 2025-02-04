import type { PublicClient, WalletClient } from "wagmi";
import type { DecryptedTransaction, EERCHookResult } from "./hooks";

export { EERC } from "./EERC";
export { useEERC } from "./hooks";
export { Poseidon } from "./crypto";

export type { PublicClient as CompatiblePublicClient };
export type { WalletClient as CompatibleWalletClient };
export type { DecryptedTransaction, EERCHookResult };
