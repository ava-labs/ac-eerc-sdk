import { useCallback, useEffect, useState } from "react";
import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { EERC } from "../EERC";
import { useEncryptedBalance } from "./useEncryptedBalance";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  isConverter: boolean,
  decryptionKey?: string,
) {
  const [eerc, setEERC] = useState<EERC>();
  const [isInitialized, setIsInitialized] = useState(false);

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (client && wallet && contractAddress) {
      setEERC(
        new EERC(
          client,
          wallet,
          contractAddress as `0x${string}`,
          isConverter,
          decryptionKey,
        ),
      );
      setIsInitialized(true);
    }

    return () => {
      setEERC(undefined);
      setIsInitialized(false);
    };
  }, [client, wallet, contractAddress, decryptionKey, isConverter]);

  // expose register function to the user
  const register = useCallback(
    (wasmPath: string, zkeyPath: string) => {
      if (!eerc) return;
      return eerc.register(wasmPath, zkeyPath);
    },
    [eerc],
  );

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

  return {
    isInitialized,
    isRegistered,

    // functions
    register,
  };
}
