import { useCallback, useEffect, useState } from "react";
import {
  type PublicClient,
  type WalletClient,
  useContractRead,
  useContractWrite,
} from "wagmi";
import { EERC } from "../EERC";
import type { Point } from "../crypto/types";
import { ERC34_ABI } from "../utils";
import { useEncryptedBalance } from "./useEncryptedBalance";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  decryptionKey?: string,
) {
  const [eerc, setEERC] = useState<EERC>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConverter, setIsConverter] = useState<boolean>();
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);

  // check if the contract is converter or not
  useContractRead({
    address: contractAddress as `0x${string}`,
    abi: ERC34_ABI,
    functionName: "isConverter",
    enabled: !!contractAddress,
    args: [],
    onSuccess: (_isConverter: boolean) => setIsConverter(_isConverter),
  });

  // auditor public key
  useContractRead({
    abi: eerc?.abi,
    address: contractAddress as `0x${string}`,
    functionName: "getAuditorPublicKey",
    args: [],
    onSuccess: (publicKey) => setAuditorPublicKey(publicKey as bigint[]),
    watch: true,
  });

  // check if the user is registered or not
  useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: "getUser",
    args: [wallet?.account.address],
    enabled: !!eerc && !!wallet.account.address,
    watch: true,
    onSuccess: (publicKey: { x: bigint; y: bigint }) => {
      if (publicKey.x === eerc?.field.zero || publicKey.y === eerc?.field.zero)
        setIsRegistered(false);
      else setIsRegistered(true);
    },
  });

  const setAuditor = async (publicKey: Point) => {
    try {
      const transactionHash = await wallet?.writeContract({
        abi: ERC34_ABI,
        address: contractAddress as `0x${string}`,
        functionName: "setAuditorPublicKey",
        args: [publicKey],
      });

      return transactionHash;
    } catch (error) {
      throw new Error(error as string);
    }
  };

  useEffect(() => {
    if (client && wallet && contractAddress && isConverter !== undefined) {
      const _eerc = new EERC(
        client,
        wallet,
        contractAddress as `0x${string}`,
        isConverter as boolean,
        decryptionKey,
      );

      _eerc
        .init()
        .then(() => {
          setEERC(_eerc);
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error("Failed to initialize EERC:", error);
          setEERC(undefined);
          setIsInitialized(false);
        });
    }

    return () => {
      setEERC(undefined);
      setIsInitialized(false);
    };
  }, [client, wallet, contractAddress, decryptionKey, isConverter]);

  // expose register function to the user
  const register = useCallback(() => {
    if (!eerc) return;
    return eerc.register();
  }, [eerc]);

  // expose register function to the user
  const auditorDecrypt = useCallback(() => {
    if (!eerc) return;
    return eerc.auditorDecrypt();
  }, [eerc]);

  const useEncryptedBalanceHook = (tokenAddress?: `0x${string}`) =>
    useEncryptedBalance(eerc, contractAddress, wallet, tokenAddress);

  return {
    isInitialized,
    isRegistered,
    isConverter,
    publicKey: eerc?.publicKey,
    auditorPublicKey,
    isAuditorKeySet:
      auditorPublicKey.length &&
      auditorPublicKey[0] !== 0n &&
      auditorPublicKey[1] !== 0n,

    // functions
    register,
    setAuditor,
    auditorDecrypt,

    // hooks
    useEncryptedBalance: useEncryptedBalanceHook,
  };
}
