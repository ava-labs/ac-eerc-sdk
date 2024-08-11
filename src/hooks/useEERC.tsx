import { useCallback, useEffect, useState } from "react";
import {
  type PublicClient,
  type WalletClient,
  useContractRead,
  useContractReads,
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

  const [name, setName] = useState<string>();
  const [symbol, setSymbol] = useState<string>();

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);

  const eercContract = {
    address: contractAddress as `0x${string}`,
    abi: ERC34_ABI,
  };

  // check if the contract is converter or not
  useContractRead({
    ...eercContract,
    functionName: "isConverter",
    enabled: !!contractAddress,
    args: [],
    onSuccess: (_isConverter: boolean) => setIsConverter(_isConverter),
  });

  // auditor public key
  useContractRead({
    ...eercContract,
    functionName: "getAuditorPublicKey",
    args: [],
    onSuccess: (publicKey) => setAuditorPublicKey(publicKey as bigint[]),
    watch: true,
  });

  // check if the user is registered or not
  useContractRead({
    ...eercContract,
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

  // fetches the name and symbol of the encrypted tokens
  useContractReads({
    contracts: [
      {
        ...eercContract,
        functionName: "name",
        args: [],
      },
      {
        ...eercContract,
        functionName: "symbol",
        args: [],
      },
    ],
    enabled: !isConverter && !!contractAddress,
    onSuccess: (results: { result: string; status: string }[]) => {
      setName(results[0].result);
      setSymbol(results[1].result);
    },
  });

  // sets auditor public key
  const setAuditor = async (publicKey: Point) => {
    try {
      const transactionHash = await wallet?.writeContract({
        ...eercContract,
        functionName: "setAuditorPublicKey",
        args: [publicKey],
      });

      return transactionHash;
    } catch (error) {
      throw new Error(error as string);
    }
  };

  const setMyselfAsAuditor = async () => {
    try {
      if (!eerc || !eerc.publicKey) return;
      // const transactionHash = await wallet?.writeContract({
      //   ...eercContract,
      //   functionName: "setAuditorPublicKey",
      //   args: [eerc.publicKey],
      // });

      // return transactionHash;

      return setAuditor(eerc.publicKey as Point);
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

  const register = useCallback(() => {
    if (!eerc) return;
    return eerc.register();
  }, [eerc]);

  const auditorDecrypt = useCallback(() => {
    if (!eerc) return;
    return eerc.auditorDecrypt();
  }, [eerc]);

  // check is the address is registered to the contract
  const isAddressRegistered = async (address: `0x${string}`) => {
    try {
      const result = await client.readContract({
        ...eercContract,
        functionName: "getUser",
        args: [address],
      });

      return false;
    } catch (error) {
      throw new Error(error as string);
    }
  };

  // returns the encrypted balance hook
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
    name,
    symbol,

    // functions
    register,
    setAuditor,
    setMyselfAsAuditor,
    auditorDecrypt,
    isAddressRegistered,

    // hooks
    useEncryptedBalance: useEncryptedBalanceHook,
  };
}
