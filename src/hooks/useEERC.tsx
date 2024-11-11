import { useCallback, useEffect, useMemo, useState } from "react";
import type { Abi } from "viem";
import {
  type PublicClient,
  type WalletClient,
  useContractRead,
  useContractReads,
} from "wagmi";
import { EERC } from "../EERC";
import type { Point } from "../crypto/types";
import { logMessage } from "../helpers";
import { ENCRYPTED_ERC_ABI } from "../utils";
import { REGISTRAR_ABI } from "../utils/Registrar.abi";
import { useProver } from "../wasm";
import type { DecryptedTransaction, EERCHookResult } from "./types";
import { useEncryptedBalance } from "./useEncryptedBalance";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  tableUrl: string,
  wasmUrl: string,
  decryptionKey?: string,
): EERCHookResult {
  const [eerc, setEERC] = useState<EERC>();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConverter, setIsConverter] = useState<boolean>(false);
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);

  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [registrarAddress, setRegistrarAddress] = useState<string>("");

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // flag for all data fetched
  const [isAllDataFetched, setIsAllDataFetched] = useState<boolean>(false);

  // use prover
  const { prove } = useProver({
    url: wasmUrl.startsWith("/") ? `${location.origin}/${wasmUrl}` : wasmUrl,
  });

  const eercContract = useMemo(
    () => ({
      address: contractAddress as `0x${string}`,
      abi: ENCRYPTED_ERC_ABI as Abi,
    }),
    [contractAddress],
  );

  const registrarContract = useMemo(
    () => ({
      address: registrarAddress as `0x${string}`,
      abi: REGISTRAR_ABI as Abi,
    }),
    [registrarAddress],
  );

  /**
   * get user data for checking is user registered
   */
  const {
    data: userData,
    isFetched: isUserDataFetched,
    refetch: refetchEercUser,
  } = useContractRead({
    ...registrarContract,
    functionName: "getUserPublicKey",
    args: [wallet?.account?.address],
    enabled: Boolean(eerc && wallet?.account?.address && registrarContract),
    watch: true,
  });

  /**
   * get contract name,symbol,registrar address and isConverter or not
   */
  const { data: contractData, isFetched: isContractDataFetched } =
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
        {
          ...eercContract,
          functionName: "registrar",
        },
        {
          ...eercContract,
          functionName: "isConverter",
        },
      ],
    });

  // update name and symbol data
  useEffect(() => {
    if (contractData && isContractDataFetched) {
      const [nameData, symbolData, registrarAddress, isConverterData] =
        contractData;

      if (nameData.status === "success") setName(nameData.result as string);
      if (symbolData.status === "success")
        setSymbol(symbolData.result as string);

      if (registrarAddress.status === "success")
        setRegistrarAddress(registrarAddress.result as string);

      if (isConverterData.status === "success")
        setIsConverter(isConverterData.result as boolean);
    }
  }, [contractData, isContractDataFetched]);

  /**
   * fetch auditor public key
   */
  const {
    data: auditorPublicKeyData,
    isFetched: isAuditorPublicKeyFetched,
    refetch: refetchAuditor,
  } = useContractRead({
    ...eercContract,
    functionName: "auditorPublicKey",
    args: [],
    enabled: Boolean(contractAddress),
    watch: true,
  });

  useEffect(() => {
    if (auditorPublicKeyData && isAuditorPublicKeyFetched) {
      setAuditorPublicKey(auditorPublicKeyData as bigint[]);
    }
  }, [auditorPublicKeyData, isAuditorPublicKeyFetched]);

  useEffect(() => {
    if (userData && isUserDataFetched) {
      const data = userData as Point;
      setIsRegistered(!(data[0] === 0n && data[1] === 0n));
    }
  }, [userData, isUserDataFetched]);

  // check is all data fetched
  useEffect(() => {
    if (
      isUserDataFetched &&
      isContractDataFetched &&
      isAuditorPublicKeyFetched
    ) {
      logMessage("All data fetched");
      setIsAllDataFetched(true);
    }

    return () => {
      setIsAllDataFetched(false);
    };
  }, [isUserDataFetched, isContractDataFetched, isAuditorPublicKeyFetched]);

  useEffect(() => {
    // Check if the required data is ready before initializing
    if (
      !!client &&
      !!wallet?.account.address &&
      !!contractAddress &&
      isConverter !== undefined &&
      registrarAddress.length > 0 &&
      !!tableUrl &&
      !!prove &&
      !isInitialized
    ) {
      const _eerc = new EERC(
        client,
        wallet,
        contractAddress as `0x${string}`,
        registrarAddress as `0x${string}`,
        isConverter as boolean,
        tableUrl,
        prove,
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
        });
    }

    // Cleanup function to reset state only when necessary
    return () => {
      if (isInitialized) {
        setEERC(undefined);
        setIsInitialized(false);
      }
    };
  }, [
    client,
    wallet,
    contractAddress,
    isConverter,
    registrarAddress,
    decryptionKey,
    tableUrl,
    prove,
    isInitialized,
  ]);

  /**
   * check if the decryption key should be generated
   * @returns boolean - returns true if user is registered and decryption key is not set
   */
  const shouldGenerateDecryptionKey = useMemo(() => {
    if (!eerc) {
      return false;
    }
    return isRegistered && !eerc?.isDecryptionKeySet;
  }, [eerc, isRegistered]);

  /**
   * register user to the EERC contract
   * @returns object - returns the key and transaction hash
   */
  const register = useCallback(() => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    return eerc.register();
  }, [eerc]);

  /**
   * generate decryption key
   * @returns string - decryption key
   */
  const generateDecryptionKey = useCallback(() => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    return eerc.generateDecryptionKey();
  }, [eerc]);

  /**
   * decrypt the encrypted data by the auditor public key
   * @returns array of decrypted transactions
   */
  const auditorDecrypt = useCallback((): Promise<DecryptedTransaction[]> => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    return eerc.auditorDecrypt();
  }, [eerc]);

  /**
   * check is the address is registered to the contract
   * @param address - address to check
   * @returns object - returns isRegistered and error
   */
  const isAddressRegistered = useCallback(
    async (address: `0x${string}`) => {
      try {
        const data = await eerc?.fetchPublicKey(address);
        if (!data) return { isRegistered: false, error: null };

        return {
          isRegistered: !(data[0] === 0n || data[1] === 0n),
          error: null,
        };
      } catch {
        throw new Error("Failed to check address registration");
      }
    },
    [eerc],
  );

  /**
   * returns the encrypted balance hook
   * @param tokenAddress - token address
   * @returns encrypted balance hook
   */
  const useEncryptedBalanceHook = (tokenAddress?: `0x${string}`) =>
    useEncryptedBalance(eerc, contractAddress, wallet, tokenAddress);

  /**
   * check is user auditor
   * @returns boolean - returns true if user is auditor
   */
  const areYouAuditor = useMemo(() => {
    if (!eerc || !auditorPublicKey.length) {
      return false;
    }

    return (
      auditorPublicKey[0] === eerc?.publicKey[0] &&
      auditorPublicKey[1] === eerc?.publicKey[1]
    );
  }, [eerc, auditorPublicKey]);

  /**
   * set contract auditor public key
   * @param address - auditor address
   * @returns object - returns transaction hash
   */
  const setContractAuditorPublicKey = useCallback(
    (address: `0x${string}`) => {
      if (!eerc) throw new Error("EERC not initialized");
      return eerc.setContractAuditorPublicKey(address);
    },
    [eerc],
  );

  return {
    isInitialized, // is sdk initialized
    isAllDataFetched, // is all data fetched
    isRegistered, // is user registered to the contract
    isConverter, // is contract converter
    publicKey: eerc?.publicKey ?? [], // user's public key
    auditorPublicKey, // auditor's public key
    isAuditorKeySet: Boolean(
      auditorPublicKey.length > 0 &&
        auditorPublicKey[0] !== 0n &&
        auditorPublicKey[1] !== 0n,
    ),
    name, // EERC name, (only for stand-alone version)
    symbol, // EERC symbol, (only for stand-alone version)
    shouldGenerateDecryptionKey,
    areYouAuditor,

    // functions
    register, // register user to the contract
    auditorDecrypt, // auditor decryption
    isAddressRegistered, // function for checking address is registered or not
    generateDecryptionKey, // generate decryption key
    setContractAuditorPublicKey, // set contract auditor public key

    // refetch
    refetchEercUser,
    refetchAuditor,

    // hooks
    useEncryptedBalance: useEncryptedBalanceHook,
    prove,
  };
}
