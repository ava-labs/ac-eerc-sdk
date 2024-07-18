import { useCallback, useEffect, useState } from "react";
import { useAsync } from "react-use";
import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { EERC } from "../EERC";
import { Scalar } from "../crypto/scalar";
import type { EncryptedBalance } from "./types";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  decryptionKey?: string,
) {
  const [eerc, setEERC] = useState<EERC | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);
  const [decryptedBalance, setDecryptedBalance] = useState<bigint[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);

  useEffect(() => {
    if (client && wallet && contractAddress) {
      setEERC(
        new EERC(
          client,
          wallet,
          contractAddress as `0x${string}`,
          decryptionKey,
        ),
      );
      setIsInitialized(true);
    }

    return () => {
      setEERC(null);
      setIsInitialized(false);
    };
  }, [client, wallet, contractAddress, decryptionKey]);

  // expose register function to the user
  const register = useCallback(
    (wasmPath: string, zkeyPath: string) => {
      if (!eerc || !wallet || !client || !contractAddress || !isInitialized)
        return {
          key: "",
          error: "Missing client, wallet or contract address!",
          proof: null,
        };

      return eerc.register(wasmPath, zkeyPath);
    },
    [eerc, wallet, client, contractAddress, isInitialized],
  );

  useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: "getUser",
    args: [wallet.account.address],
    enabled: !!eerc && !!wallet.account.address,
    watch: true,
    onSuccess: ([publicKey, _]: [{ x: bigint; y: bigint }, string]) => {
      if (publicKey.x === eerc?.field.zero || publicKey.y === eerc?.field.zero)
        setIsRegistered(false);
      else setIsRegistered(true);
    },
  });

  useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: "balanceOf",
    args: [wallet.account.address],
    enabled: !!eerc && !!wallet.account.address && isRegistered,
    watch: true,
    onSuccess: (balance: EncryptedBalance) => {
      const decBalance = eerc?.decryptContractBalance(balance);
      if (!decBalance) {
        setDecryptedBalance([]);
        setEncryptedBalance([]);
        return;
      }
      const parsedDecryptedBalance = Scalar.adjust(
        decBalance[0],
        decBalance[1],
      );
      setDecryptedBalance(parsedDecryptedBalance);
      setEncryptedBalance([
        balance[0].c1.x,
        balance[0].c1.y,
        balance[0].c2.x,
        balance[0].c2.y,
        balance[1].c1.x,
        balance[1].c1.y,
        balance[1].c2.x,
      ]);
    },
  });

  return { isRegistered, register, decryptedBalance, encryptedBalance };
}
