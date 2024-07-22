import React, { useEffect, useState } from "react";
import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import type { EERC } from "../EERC";
import { Scalar } from "../crypto/scalar";
import type { EncryptedBalance } from "./types";

// This is a separate hook that can be used independently
export function useEncryptedBalanceWithAddress(
  eerc: EERC | null,
  contractAddress: string,
  wallet: WalletClient,
  isEnabled: boolean,
  tokenAddress: string,
) {
  const [decryptedBalance, setDecryptedBalance] = useState<bigint[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  const [parsedDecryptedBalance, setParsedDecryptedBalance] = useState<
    bigint[]
  >([]);

  const { data: balance } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: "balanceOfFromAddress",
    args: [wallet?.account.address, tokenAddress],
    enabled: isEnabled,
    watch: true,
  });

  useEffect(() => {
    if (!balance) return;
    const bb = balance as EncryptedBalance;

    // TODO: If encrypted balance is saved in somewhere in the local storage
    // TODO: then we can compare the encrypted balance with the saved one and
    // TODO: instead of decrypting the whole balance we can only decrypt the difference
    const decBalance = eerc?.decryptContractBalance(bb);
    if (!decBalance) {
      setDecryptedBalance([]);
      setEncryptedBalance([]);
      setParsedDecryptedBalance([]);
      return;
    }
    setDecryptedBalance(decBalance);

    const parsedDecryptedBalance = Scalar.adjust(decBalance[0], decBalance[1]);
    setParsedDecryptedBalance(parsedDecryptedBalance);
    setEncryptedBalance([
      bb[0].c1.x,
      bb[0].c1.y,
      bb[0].c2.x,
      bb[0].c2.y,
      bb[1].c1.x,
      bb[1].c1.y,
      bb[1].c2.x,
      bb[1].c2.y,
    ]);
  }, [balance, eerc]);

  return {
    decryptedBalance,
    parsedDecryptedBalance,
    encryptedBalance,
  };
}
