import { useCallback, useEffect, useState } from "react";
import { useAsync } from "react-use";
import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { EERC } from "../EERC";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
) {
  const [eerc, setEERC] = useState<EERC | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (client && wallet && contractAddress) {
      setEERC(new EERC(client, wallet, contractAddress as `0x${string}`));
      setIsInitialized(true);
    }

    return () => {
      setEERC(null);
      setIsInitialized(false);
    };
  }, [client, wallet, contractAddress]);

  useAsync(async () => {
    if (!eerc || !isInitialized || !wallet.account.address || !isInitialized)
      return;
    const registered = await eerc.isRegistered();
    setIsRegistered(registered);
  }, [eerc, isInitialized, wallet.account.address]);

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

  return { isRegistered, register };
}
