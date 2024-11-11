import { useCallback, useEffect, useMemo, useState } from "react";
import type { WalletClient } from "viem";
import { useContractRead } from "wagmi";
import type { EERC } from "../EERC";
import type { AmountPCT, EGCT, Point } from "../crypto/types";
import { ENCRYPTED_ERC_ABI } from "../utils";
import type { UseEncryptedBalanceHookResult } from "./types";

export function useEncryptedBalance(
  eerc: EERC | undefined,
  contractAddress: string,
  wallet: WalletClient,
  tokenAddress?: `0x${string}`,
): UseEncryptedBalanceHookResult {
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);
  const [decryptedBalance, setDecryptedBalance] = useState<bigint>(0n);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  const [parsedDecryptedBalance, setParsedDecryptedBalance] =
    useState<string>("");
  const [decimals, setDecimals] = useState<bigint>(0n);

  const eercContract = useMemo(
    () => ({
      address: contractAddress as `0x${string}`,
      abi: ENCRYPTED_ERC_ABI,
    }),
    [contractAddress],
  );

  // get encrypted balance of the user
  const { data: contractBalance, refetch: refetchBalance } = useContractRead({
    ...eercContract,
    functionName: tokenAddress ? "balanceOfFromAddress" : "balanceOf",
    args: [wallet?.account?.address, tokenAddress || 0n],
    enabled: !!wallet?.account?.address,
    watch: true,
  });

  // fetch decimals
  const { data: decimalsData } = useContractRead({
    ...eercContract,
    functionName: "decimals",
    enabled: !!contractAddress,
  });

  useEffect(() => {
    if (!decimalsData) return;
    setDecimals(decimalsData as bigint);
  }, [decimalsData]);

  // fetch auditor public key
  const { data: auditorData } = useContractRead({
    ...eercContract,
    functionName: "auditorPublicKey",
    args: [],
    watch: true,
  });

  useEffect(() => {
    if (!auditorData) return;
    setAuditorPublicKey(auditorData as bigint[]);
  }, [auditorData]);

  useEffect(() => {
    if (!contractBalance || !eerc) return;
    const contractBalance_ = contractBalance as bigint[];
    const elGamalCipherText = contractBalance_[0] as unknown as EGCT;

    const totalBalance = eerc.calculateTotalBalance(
      elGamalCipherText,
      contractBalance_[2] as unknown as AmountPCT[],
      contractBalance_[3] as unknown as bigint[],
    );

    setDecryptedBalance(totalBalance);
    setParsedDecryptedBalance(totalBalance.toString());
    setEncryptedBalance([
      elGamalCipherText.c1.X,
      elGamalCipherText.c1.Y,
      elGamalCipherText.c2.X,
      elGamalCipherText.c2.Y,
    ]);
  }, [contractBalance, eerc]);

  // mints amount of encrypted tokens to the user
  const privateMint = useCallback(
    (recipient: `0x${string}`, amount: bigint) => {
      if (!eerc || !auditorPublicKey) throw new Error("EERC not initialized");
      return eerc.privateMint(recipient, amount, auditorPublicKey as Point);
    },
    [eerc, auditorPublicKey],
  );

  // burns amount of encrypted tokens from the user
  const privateBurn = useCallback(
    (amount: bigint) => {
      if (!eerc || !auditorPublicKey || !encryptedBalance.length)
        throw new Error("EERC not initialized");

      return eerc.privateBurn(
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey as Point,
      );
    },
    [eerc, auditorPublicKey, encryptedBalance, decryptedBalance],
  );

  // transfers amount of encrypted tokens to the user
  const privateTransfer = useCallback(
    (to: string, amount: bigint) => {
      if (!eerc || !auditorPublicKey || !encryptedBalance.length)
        throw new Error("EERC not initialized");

      return eerc.transfer(
        to,
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        tokenAddress,
      );
    },
    [eerc, auditorPublicKey, encryptedBalance, decryptedBalance, tokenAddress],
  );

  const deposit = useCallback(
    (amount: bigint) => {
      if (!eerc || !tokenAddress) throw new Error("EERC not initialized");
      return eerc.deposit(amount, tokenAddress);
    },
    [eerc, tokenAddress],
  );

  const withdraw = useCallback(
    (amount: bigint) => {
      if (!eerc || !tokenAddress) throw new Error("EERC not initialized");

      return eerc.withdraw(
        amount,
        encryptedBalance,
        [decryptedBalance, decryptedBalance],
        tokenAddress,
      );
    },
    [eerc, encryptedBalance, decryptedBalance, tokenAddress],
  );

  return {
    decryptedBalance, // decrypted balance of the user
    parsedDecryptedBalance, // parsed decrypted balance of the user
    encryptedBalance, // encrypted balance of the user
    auditorPublicKey, // auditor's public key
    decimals, // decimals of the token

    // functions
    privateMint,
    privateBurn,
    privateTransfer,
    withdraw,
    deposit,

    // refetch
    refetchBalance,
  };
}
