import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsync } from "react-use";
import type { WalletClient } from "viem";
import { useContractRead } from "wagmi";
import type { EERC } from "../EERC";
import { Scalar } from "../crypto/scalar";
import type { Point } from "../crypto/types";
import { ERC34_ABI } from "../utils";
import type { EncryptedBalance, UseEncryptedBalanceHookResult } from "./types";

export function useEncryptedBalance(
  eerc: EERC | undefined,
  contractAddress: string,
  wallet: WalletClient,
  tokenAddress?: `0x${string}`,
): UseEncryptedBalanceHookResult {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);
  const [decryptedBalance, setDecryptedBalance] = useState<bigint[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  const [parsedDecryptedBalance, setParsedDecryptedBalance] = useState<
    string[]
  >([]);

  const eercContract = useMemo(
    () => ({
      address: contractAddress as `0x${string}`,
      abi: ERC34_ABI,
    }),
    [contractAddress],
  );

  // get encrypted balance of the user
  const { data: contractBalance } = useContractRead({
    ...eercContract,
    functionName: tokenAddress ? "balanceOfFromAddress" : "balanceOf",
    args: [wallet?.account?.address, tokenAddress || 0n],
    enabled: !!wallet?.account?.address,
    watch: true,
  });

  // fetch auditor public key
  const { data: auditorData } = useContractRead({
    ...eercContract,
    functionName: "getAuditorPublicKey",
    args: [],
    watch: true,
  });

  useEffect(() => {
    if (!auditorData) return;
    setAuditorPublicKey(auditorData as bigint[]);
  }, [auditorData]);

  useEffect(() => {
    // parses the encrypted balance
    const parseContractBalance = (b: EncryptedBalance) =>
      b.flatMap((point) => [point.c1.x, point.c1.y, point.c2.x, point.c2.y]);

    if (!contractBalance) return;

    // if contract balance that we fetched is equal to encrypted balance no need to decrypt
    const parsedBalance = parseContractBalance(
      contractBalance as EncryptedBalance,
    );

    if (parsedBalance.every((v) => v === 0n)) return;

    // if encrypted balance is not empty
    if (encryptedBalance) {
      // if the encrypted balance is the same as the contract balance no need to decrypt
      if (parsedBalance.every((v, i) => v === encryptedBalance[i])) return;
    }

    setEncryptedBalance(parsedBalance);
  }, [contractBalance, encryptedBalance]);

  // if encrypted balance is changed or not decrypted yet
  useAsync(async () => {
    if (!encryptedBalance.length || !eerc) return;

    setIsDecrypting(true);

    try {
      // decrypt the encrypted balance
      const decBalance = await eerc.decryptContractBalance(encryptedBalance);
      if (!decBalance) {
        setDecryptedBalance([]);
        setParsedDecryptedBalance([]);
        return;
      }

      // adjust the decrypted balance
      const parsedDecryptedBalance = Scalar.adjust(
        decBalance[0],
        decBalance[1],
      );

      setDecryptedBalance(decBalance);
      setParsedDecryptedBalance([
        parsedDecryptedBalance[0].toString(),
        parsedDecryptedBalance[1].toString().padStart(2, "0"),
      ]);
      setIsDecrypting(false);
    } catch {
      throw new Error("Failed to decrypt balance");
    }
  }, [encryptedBalance, eerc]);

  // mints amount of encrypted tokens to the user
  const privateMint = useCallback(
    (amount: bigint) => {
      if (!eerc || !auditorPublicKey) throw new Error("EERC not initialized");
      return eerc.privateMint(amount, auditorPublicKey as Point);
    },
    [eerc, auditorPublicKey],
  );

  // burns amount of encrypted tokens from the user
  const privateBurn = useCallback(
    (amount: bigint) => {
      if (
        !eerc ||
        !auditorPublicKey ||
        !encryptedBalance.length ||
        !decryptedBalance.length
      )
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
      if (
        !eerc ||
        !auditorPublicKey ||
        !encryptedBalance.length ||
        !decryptedBalance.length
      )
        throw new Error("EERC not initialized");

      return tokenAddress
        ? eerc.transferToken(
            to,
            amount,
            auditorPublicKey,
            tokenAddress,
            encryptedBalance,
            decryptedBalance,
          )
        : eerc.transfer(
            to,
            amount,
            encryptedBalance,
            decryptedBalance,
            auditorPublicKey,
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
        decryptedBalance,
        tokenAddress,
      );
    },
    [eerc, encryptedBalance, decryptedBalance, tokenAddress],
  );

  return {
    decryptedBalance, // decrypted balance of the user
    parsedDecryptedBalance, // parsed decrypted balance of the user
    encryptedBalance, // encrypted balance of the user
    isDecrypting: isDecrypting || !decryptedBalance.length, // is decrypting the balance
    auditorPublicKey, // auditor's public key

    // functions
    privateMint,
    privateBurn,
    privateTransfer,
    withdraw,
    deposit,
  };
}
