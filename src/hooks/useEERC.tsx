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
import type {
  CircuitURLs,
  DecryptedTransaction,
  EERCHookResult,
  IEERCState,
} from "./types";
import { useEncryptedBalance } from "./useEncryptedBalance";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  urls: {
    transferURL: string;
    multiWasmURL: string;
  },
  circuitURLs: CircuitURLs,
  decryptionKey?: string,
): EERCHookResult {
  const [eerc, setEerc] = useState<EERC | undefined>(undefined);
  const [eercState, setEercState] = useState<IEERCState>({
    isInitialized: false,
    isConverter: false,
    auditorPublicKey: [],
    name: "",
    symbol: "",
    registrarAddress: "",
    isRegistered: false,
    isAllDataFetched: false,
    owner: "",
    hasBeenAuditor: {
      isChecking: false,
      isAuditor: false,
    },
    snarkjsMode: true,
  });
  const [generatedDecryptionKey, setGeneratedDecryptionKey] =
    useState<string>();

  const updateEercState = useCallback(
    (updates: Partial<IEERCState>) =>
      setEercState((prevState) => ({ ...prevState, ...updates })),
    [],
  );

  // Function to check bytecode and set snarkjsMode
  useEffect(() => {
    const checkBytecode = async () => {
      if (!client || !contractAddress) return;

      try {
        const bytecode = await client.getBytecode({
          address: contractAddress as `0x${string}`,
        });

        if (bytecode) {
          const shouldUseSnarkJs = bytecode.includes("a509711610");

          updateEercState({ snarkjsMode: shouldUseSnarkJs });
          logMessage(
            `Contract bytecode checked. Setting snarkjsMode to: ${shouldUseSnarkJs}`,
          );
        }
      } catch (error) {
        logMessage(`Failed to check bytecode: ${error}`);
      }
    };

    checkBytecode();
  }, [client, contractAddress, updateEercState]);

  const { prove } = useProver({
    transferURL: urls.transferURL.startsWith("/")
      ? `${location.origin}/${urls.transferURL}`
      : urls.transferURL,
    multiWasmURL: urls.multiWasmURL.startsWith("/")
      ? `${location.origin}/${urls.multiWasmURL}`
      : urls.multiWasmURL,
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
      address: eercState.registrarAddress as `0x${string}`,
      abi: REGISTRAR_ABI as Abi,
    }),
    [eercState.registrarAddress],
  );

  const circuitURLsKey = useMemo(() => {
    return JSON.stringify(circuitURLs);
  }, [circuitURLs]);

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

  useEffect(() => {
    if (userData && isUserDataFetched) {
      const data = userData as Point;
      updateEercState({
        isRegistered: !(data[0] === 0n && data[1] === 0n),
      });
    }
  }, [userData, isUserDataFetched, updateEercState]);

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
        {
          ...eercContract,
          functionName: "owner",
        },
      ],
      watch: true,
      enabled: Boolean(contractAddress),
    });

  // update name and symbol data
  useEffect(() => {
    if (contractData && isContractDataFetched) {
      const [
        nameData,
        symbolData,
        registrarAddress,
        isConverterData,
        ownerData,
      ] = contractData;

      updateEercState({
        name: nameData.status === "success" ? (nameData.result as string) : "",
        symbol:
          symbolData.status === "success" ? (symbolData.result as string) : "",
        registrarAddress:
          registrarAddress.status === "success"
            ? (registrarAddress.result as string)
            : "",
        isConverter:
          isConverterData.status === "success"
            ? (isConverterData.result as boolean)
            : false,
        owner:
          ownerData.status === "success"
            ? (ownerData.result as `0x${string}`)
            : "",
      });
    }
  }, [contractData, isContractDataFetched, updateEercState]);

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
    enabled: Boolean(contractAddress) && Boolean(eerc),
    watch: true,
  });

  useEffect(() => {
    if (auditorPublicKeyData && isAuditorPublicKeyFetched) {
      updateEercState({
        auditorPublicKey: auditorPublicKeyData as bigint[],
      });
    }
  }, [auditorPublicKeyData, isAuditorPublicKeyFetched, updateEercState]);

  const { data: auditorAddress, isFetched: isAuditorAddressFetched } =
    useContractRead({
      ...eercContract,
      functionName: "auditor",
      args: [],
      enabled: Boolean(contractAddress) && Boolean(eerc),
      watch: true,
    }) as { data: `0x${string}`; isFetched: boolean };

  /**
   * check if user has been auditor
   */
  const checkIsAuditor = useCallback(async () => {
    if (!eerc) return;

    try {
      updateEercState({
        hasBeenAuditor: { isChecking: true, isAuditor: false },
      });
      const isAuditor = await eerc.hasBeenAuditor();
      updateEercState({
        hasBeenAuditor: { isChecking: false, isAuditor },
      });
    } catch (error) {
      setEercState((prevState) => ({
        ...prevState,
        hasBeenAuditor: {
          ...prevState.hasBeenAuditor,
          isChecking: false,
        },
      }));
      logMessage(`Failed to check is auditor: ${error}`);
    }
  }, [eerc, updateEercState]);

  useEffect(() => {
    if (eerc) {
      checkIsAuditor();
    }
  }, [eerc, checkIsAuditor]);

  // check is all data fetched
  useEffect(() => {
    if (
      isUserDataFetched &&
      isContractDataFetched &&
      isAuditorPublicKeyFetched &&
      isAuditorAddressFetched
    ) {
      logMessage("All data fetched");
      updateEercState({
        isAllDataFetched: true,
      });
    }

    return () => {
      updateEercState({
        isAllDataFetched: false,
      });
    };
  }, [
    isUserDataFetched,
    isContractDataFetched,
    isAuditorPublicKeyFetched,
    isAuditorAddressFetched,
    updateEercState,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to reset the key when wallet changes
  useEffect(() => {
    setGeneratedDecryptionKey("");
  }, [wallet?.account?.address]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: circuitURLsKey is a stable key for circuitURLs
  useEffect(() => {
    let mounted = true;

    const initializeEERC = async () => {
      if (
        !client ||
        !wallet?.account.address ||
        !contractAddress ||
        eercState.isConverter === undefined ||
        !eercState.registrarAddress ||
        eercState.isInitialized ||
        !circuitURLs
      )
        return;

      try {
        const correctKey = decryptionKey || generatedDecryptionKey;
        if (!correctKey) {
          logMessage("Decryption key is not set");
        }

        const _eerc = new EERC(
          client,
          wallet,
          contractAddress as `0x${string}`,
          eercState.registrarAddress as `0x${string}`,
          eercState.isConverter,
          prove,
          circuitURLs,
          correctKey,
        );

        _eerc.snarkjsMode = eercState.snarkjsMode;
        logMessage(`Using snarkjsMode: ${eercState.snarkjsMode}`);

        if (mounted) {
          setEerc(_eerc);
          updateEercState({
            isInitialized: true,
          });
        }
      } catch (error) {
        logMessage(`Failed to initialize EERC: ${error}`);
      }
    };

    initializeEERC();

    // Cleanup function to reset state only when necessary
    return () => {
      mounted = false;
      if (eercState.isInitialized) {
        updateEercState({
          isInitialized: false,
        });
        setEerc(undefined);
      }
    };
  }, [
    client,
    wallet,
    contractAddress,
    eercState.isConverter,
    eercState.registrarAddress,
    decryptionKey,
    eercState.isInitialized,
    updateEercState,
    generatedDecryptionKey,
    circuitURLsKey,
    prove,
    eercState.snarkjsMode, // Add snarkjsMode to dependencies
  ]);

  /**
   * check if the decryption key should be generated
   * @returns boolean - returns true if user is registered and decryption key is not set
   */
  const shouldGenerateDecryptionKey = useMemo(() => {
    if (!eerc) {
      return false;
    }
    return eercState.isRegistered && !eerc?.isDecryptionKeySet;
  }, [eerc, eercState.isRegistered]);

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
  const generateDecryptionKey = useCallback(async () => {
    if (!eerc) {
      throw new Error("EERC not initialized");
    }
    const key = await eerc.generateDecryptionKey();
    setGeneratedDecryptionKey(key);
    return key;
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
    if (!eerc || !eercState.auditorPublicKey.length) {
      return false;
    }

    return (
      eercState.auditorPublicKey[0] === eerc?.publicKey[0] &&
      eercState.auditorPublicKey[1] === eerc?.publicKey[1]
    );
  }, [eerc, eercState.auditorPublicKey]);

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
    isInitialized: eercState.isInitialized, // is sdk initialized
    isAllDataFetched: eercState.isAllDataFetched, // is all data fetched
    isRegistered: eercState.isRegistered, // is user registered to the contract
    isConverter: eercState.isConverter, // is contract converter
    publicKey: eerc?.publicKey ?? [], // user's public key
    auditorAddress, // auditor address
    owner: eercState.owner, // owner address
    auditorPublicKey: eercState.auditorPublicKey, // auditor's public key
    isAuditorKeySet: Boolean(
      eercState.auditorPublicKey.length > 0 &&
        eercState.auditorPublicKey[0] !== 0n &&
        eercState.auditorPublicKey[1] !== 0n,
    ),
    name: eercState.name, // EERC name, (only for stand-alone version)
    symbol: eercState.symbol, // EERC symbol, (only for stand-alone version)
    shouldGenerateDecryptionKey,
    areYouAuditor,
    hasBeenAuditor: eercState.hasBeenAuditor,

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
