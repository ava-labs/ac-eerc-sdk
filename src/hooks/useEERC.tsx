import { useCallback, useEffect, useState } from "react";
import {
  type PublicClient,
  type WalletClient,
  useContractRead,
  useContractReads,
} from "wagmi";
import { EERC } from "../EERC";
import type { Point } from "../crypto/types";
import { logMessage } from "../helpers";
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

  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");

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

  // get auditor public key
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

  // fetches the name and symbol of the EERC
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
      if (!results || !results.length) return;
      setName(results[0]?.result as string);
      setSymbol(results[1]?.result as string);
    },
  });

  // sets auditor public key
  const setAuditor = async (publicKey: Point): Promise<`0x${string}`> => {
    try {
      if (!eerc) return Promise.reject("EERC not initialized");
      logMessage(`Setting auditor public key: ${publicKey}`);
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

  // sets auditor public key as user's public key
  const setMyselfAsAuditor = async () => {
    try {
      return setAuditor(eerc?.publicKey as Point);
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
          logMessage(`Failed to initialize EERC: ${error}`);
          setEERC(undefined);
          setIsInitialized(false);
        });
    }

    return () => {
      setEERC(undefined);
      setIsInitialized(false);
    };
  }, [client, wallet, contractAddress, decryptionKey, isConverter]);

  // registers the user to the EERC contract
  const register = useCallback(() => {
    if (!eerc) return Promise.reject("EERC not initialized");
    return eerc.register();
  }, [eerc]);

  // decrypt the encrypted data by the auditor public key
  const auditorDecrypt = useCallback(() => {
    if (!eerc) return Promise.reject("EERC not initialized");
    return eerc.auditorDecrypt();
  }, [eerc]);

  // check is the address is registered to the contract
  const isAddressRegistered = async (
    address: `0x${string}`,
  ): Promise<boolean> => {
    try {
      const publicKey = await client.readContract({
        ...eercContract,
        functionName: "getUser",
        args: [address],
      });

      if (!publicKey) return false;
      return true;
    } catch (error) {
      throw new Error(error as string);
    }
  };

  // returns the encrypted balance hook
  const useEncryptedBalanceHook = (tokenAddress?: `0x${string}`) =>
    useEncryptedBalance(eerc, contractAddress, wallet, tokenAddress);

  return {
    isInitialized, // is sdk initialized
    isRegistered, // is user registered to the contract
    isConverter, // is contract converter
    publicKey: eerc?.publicKey, // user's public key
    auditorPublicKey, // auditor's public key
    isAuditorKeySet: Boolean(
      auditorPublicKey.length &&
        auditorPublicKey[0] !== 0n &&
        auditorPublicKey[1] !== 0n,
    ), // is auditor's public key set if not need to set before interacting with the contract
    name, // EERC name, (only for stand-alone version)
    symbol, // EERC symbol, (only for stand-alone version)

    // functions
    register, // register user to the contract
    setAuditor, // set auditor public key
    setMyselfAsAuditor, // set user's public key as auditor's public key
    auditorDecrypt, // auditor decryption
    isAddressRegistered, // function for checking address is registered or not

    // hooks
    useEncryptedBalance: useEncryptedBalanceHook,
  };
}
