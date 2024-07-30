import { useCallback, useEffect, useState } from "react";
import { type WalletClient, useContractRead } from "wagmi";
import type { EERC } from "../EERC";
import { Scalar } from "../crypto/scalar";
import type { Point } from "../crypto/types";
import type { EncryptedBalance } from "./types";

export function useEncryptedBalance(
  eerc: EERC | undefined,
  contractAddress: string,
  wallet: WalletClient,
  tokenAddress?: `0x${string}`,
) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);
  const [decryptedBalance, setDecryptedBalance] = useState<bigint[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  const [parsedDecryptedBalance, setParsedDecryptedBalance] = useState<
    bigint[]
  >([]);

  const { data: contractBalance } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: tokenAddress ? "balanceOfFromAddress" : "balanceOf",
    args: [wallet?.account.address, tokenAddress || 0n],
    enabled: !!wallet?.account.address,
    watch: true,
  });

  // auditor public key
  useContractRead({
    abi: eerc?.abi,
    address: contractAddress as `0x${string}`,
    functionName: "getAuditorPublicKey",
    args: [],
    onSuccess: (publicKey) => setAuditorPublicKey(publicKey as bigint[]),
    watch: false,
  });

  useEffect(() => {
    // parses the encrypted balance
    const parseContractBalance = (b: EncryptedBalance) =>
      b.flatMap((point) => [point.c1.x, point.c1.y, point.c2.x, point.c2.y]);

    if (!contractBalance) return;

    // if contract balance is equal to encrypted balance no need to decrypt
    const parsedBalance = parseContractBalance(
      contractBalance as EncryptedBalance,
    );

    // if encrypted balance is not empty
    if (encryptedBalance.length) {
      // if the encrypted balance is the same as the contract balance no need to decrypt
      if (parsedBalance.every((v, i) => v === encryptedBalance[i])) return;
    }

    setIsDecrypting(true);
    const bb = contractBalance as EncryptedBalance;

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
    setEncryptedBalance(parsedBalance);
    setIsDecrypting(false);
  }, [contractBalance, eerc, encryptedBalance]);

  const privateMint = useCallback(
    (amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (!eerc || !auditorPublicKey) return;
      return eerc.privateMint(
        amount,
        wasmPath,
        zkeyPath,
        auditorPublicKey as Point,
      );
    },
    [eerc, auditorPublicKey],
  );

  const privateBurn = useCallback(
    (amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (
        !eerc ||
        !auditorPublicKey ||
        !encryptedBalance.length ||
        !decryptedBalance.length
      )
        return;

      return eerc.privateBurn(
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey as Point,
        wasmPath,
        zkeyPath,
      );
    },
    [eerc, auditorPublicKey, encryptedBalance, decryptedBalance],
  );

  const transfer = useCallback(
    (to: string, amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (
        !eerc ||
        !auditorPublicKey ||
        !encryptedBalance.length ||
        !decryptedBalance.length
      )
        return;

      if (tokenAddress) {
        return eerc.transferToken(
          to,
          amount,
          auditorPublicKey as Point,
          wasmPath,
          zkeyPath,
          tokenAddress,
        );
      }

      return eerc.transfer(
        to,
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey as Point,
        wasmPath,
        zkeyPath,
      );
    },
    [eerc, auditorPublicKey, encryptedBalance, decryptedBalance, tokenAddress],
  );

  const deposit = useCallback(
    (amount: bigint) => {
      if (!eerc || !tokenAddress) return;
      return eerc.deposit(amount, tokenAddress);
    },
    [eerc, tokenAddress],
  );

  // need to change withdraw parameters
  const withdraw = useCallback(
    (amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (!eerc || !tokenAddress) return;

      return eerc.withdraw(amount, wasmPath, zkeyPath, tokenAddress);
    },
    [eerc, encryptedBalance, decryptedBalance, tokenAddress],
  );

  return {
    decryptedBalance,
    parsedDecryptedBalance,
    encryptedBalance,
    isDecrypting,
    auditorPublicKey,

    // functions
    privateMint,
    privateBurn,
    transfer,
  };
}
