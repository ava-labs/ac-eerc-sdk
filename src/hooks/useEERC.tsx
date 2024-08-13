import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { DecryptedTransaction, EERCHookResult } from "./types";
import { useEncryptedBalance } from "./useEncryptedBalance";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  decryptionKey?: string,
): EERCHookResult {
  const eercContract = useMemo(
    () => ({
      address: contractAddress as `0x${string}`,
      abi: ERC34_ABI,
    }),
    [contractAddress],
  );

  const [eerc, setEERC] = useState<EERC>();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConverter, setIsConverter] = useState<boolean>(false);
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);

  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // flag for all data fetched
  const [isAllDataFetched, setIsAllDataFetched] = useState<boolean>(false);

  // get converter and auditor public key
  const {
    data: converterAndAuditorData,
    isFetched: isConverterAndAuditorKeyFetched,
  } = useContractReads({
    contracts: [
      {
        ...eercContract,
        functionName: "isConverter",
      },
      {
        ...eercContract,
        functionName: "getAuditorPublicKey",
      },
    ],
    enabled: Boolean(contractAddress),
    watch: true,
  });

  // get user data for checking is user registered
  const { data: userData, isFetched: isUserDataFetched } = useContractRead({
    ...eercContract,
    functionName: "getUser",
    args: [wallet?.account.address],
    enabled: Boolean(eerc && wallet.account.address),
    watch: true,
  });

  // get name and symbol of the EERC
  const { data: nameAndSymbolData, isFetched: isNameAndSymbolFetched } =
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
      enabled: Boolean(contractAddress),
    });

  // update converter and auditor public key data
  useEffect(() => {
    if (converterAndAuditorData && isConverterAndAuditorKeyFetched) {
      const [_isConverter, _auditorPublicKey] = converterAndAuditorData;
      if (_isConverter.status === "success") {
        setIsConverter(_isConverter.result as boolean);
      }
      if (_auditorPublicKey.status === "success") {
        setAuditorPublicKey(_auditorPublicKey.result as bigint[]);
      }
    }
  }, [converterAndAuditorData, isConverterAndAuditorKeyFetched]);

  // update name and symbol data
  useEffect(() => {
    if (nameAndSymbolData && isNameAndSymbolFetched && !isConverter) {
      const [nameData, symbolData] = nameAndSymbolData;
      if (nameData.status === "success") setName(nameData.result as string);
      if (symbolData.status === "success")
        setSymbol(symbolData.result as string);
    }
  }, [nameAndSymbolData, isNameAndSymbolFetched, isConverter]);

  // update user registration status
  useEffect(() => {
    if (userData && isUserDataFetched) {
      const publicKey = userData as { x: bigint; y: bigint };
      setIsRegistered(
        !(publicKey.x === eerc?.field.zero || publicKey.y === eerc?.field.zero),
      );
    }
  }, [userData, isUserDataFetched, eerc?.field.zero]);

  // check is all data fetched
  useEffect(() => {
    if (
      isConverterAndAuditorKeyFetched &&
      isUserDataFetched &&
      isNameAndSymbolFetched &&
      eerc &&
      wallet.account.address
    ) {
      setIsAllDataFetched(true);
    }

    return () => {
      setIsAllDataFetched(false);
    };
  }, [
    isConverterAndAuditorKeyFetched,
    isUserDataFetched,
    isNameAndSymbolFetched,
    eerc,
    wallet.account.address,
  ]);

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

  // sets auditor public key
  const setAuditor = useCallback(
    async (publicKey: Point): Promise<`0x${string}`> => {
      try {
        if (!eerc) {
          throw new Error("EERC not initialized");
        }
        logMessage(`Setting auditor public key: ${publicKey}`);
        const transactionHash = await wallet?.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ERC34_ABI,
          functionName: "setAuditorPublicKey",
          args: [publicKey],
        });

        return transactionHash;
      } catch (error) {
        throw new Error(error as string);
      }
    },
    [eerc, wallet, contractAddress],
  );

  // sets auditor public key as user's public key
  const setMyselfAsAuditor = useCallback(async () => {
    if (!eerc?.publicKey)
      throw new Error("EERC not initialized or public key not available");
    return setAuditor(eerc?.publicKey as Point);
  }, [eerc?.publicKey, setAuditor]);

  // registers the user to the EERC contract
  const register = useCallback(() => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    return eerc.register();
  }, [eerc]);

  // decrypt the encrypted data by the auditor public key
  const auditorDecrypt = useCallback((): Promise<DecryptedTransaction[]> => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    return eerc.auditorDecrypt();
  }, [eerc]);

  // check is the address is registered to the contract
  const isAddressRegistered = useCallback(
    async (address: `0x${string}`) => {
      try {
        const publicKey = (await client.readContract({
          ...eercContract,
          functionName: "getUser",
          args: [address],
        })) as { x: bigint; y: bigint };

        return {
          isRegistered: !(publicKey.x === 0n || publicKey.y === 0n),
          error: null,
        };
      } catch {
        return {
          isRegistered: false,
          error: "Failed to check address registration",
        };
      }
    },
    [client, eercContract],
  );

  // returns the encrypted balance hook
  const useEncryptedBalanceHook = (tokenAddress?: `0x${string}`) =>
    useEncryptedBalance(eerc, contractAddress, wallet, tokenAddress);

  return {
    isInitialized, // is sdk initialized
    isAllDataFetched, // is all data fetched
    isRegistered, // is user registered to the contract
    isConverter, // is contract converter
    publicKey: eerc?.publicKey ?? [], // user's public key
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
