import { isAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { EERC } from "../EERC";
import { Scalar } from "../crypto/scalar";
import type { Point } from "../crypto/types";
import type { EncryptedBalance } from "./types";
import { useEncryptedBalanceWithTokenId } from "./useEncryptedBalance";
import { useEncryptedBalanceWithAddress } from "./useEncryptedBalanceWithTokenId";

export function useEERC(
  client: PublicClient,
  wallet: WalletClient,
  contractAddress: string,
  isConverter: boolean,
  decryptionKey?: string,
) {
  const [eerc, setEERC] = useState<EERC | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // isRegistered to the contract
  const [isRegistered, setIsRegistered] = useState(false);
  const [parsedDecryptedBalance, setParsedDecryptedBalance] = useState<
    bigint[]
  >([]);
  const [decryptedBalance, setDecryptedBalance] = useState<bigint[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  const [auditorPublicKey, setAuditorPublicKey] = useState<bigint[]>([]);

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
      setEERC(null);
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

  const privateMint = useCallback(
    (totalMintAmount: bigint, wasmPath: string, zkeyPath: string) => {
      if (!eerc || !auditorPublicKey) return;
      return eerc.privateMint(
        totalMintAmount,
        wasmPath,
        zkeyPath,
        auditorPublicKey as Point,
      );
    },
    [eerc, auditorPublicKey],
  );

  const privateBurn = useCallback(
    (amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (!eerc) return;
      return eerc.privateBurn(
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        wasmPath,
        zkeyPath,
      );
    },
    [eerc, encryptedBalance, decryptedBalance, auditorPublicKey],
  );

  const transfer = useCallback(
    (to: string, amount: bigint, wasmPath: string, zkeyPath: string) => {
      if (!eerc) return;
      return eerc.transfer(
        to,
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        wasmPath,
        zkeyPath,
      );
    },
    [eerc, encryptedBalance, decryptedBalance, auditorPublicKey],
  );

  const transferToken = useCallback(
    (
      to: string,
      amount: bigint,
      wasmPath: string,
      zkeyPath: string,
      tokenAddress: string,
    ) => {
      if (!eerc) return;
      return eerc.transferToken(
        to,
        amount,
        auditorPublicKey,
        wasmPath,
        zkeyPath,
        tokenAddress,
      );
    },
    [eerc, auditorPublicKey],
  );

  const deposit = useCallback(
    (amount: bigint, tokenAddress: string) => {
      if (!eerc) return;
      return eerc?.deposit(amount, tokenAddress);
    },
    [eerc],
  );

  const withdraw = useCallback(
    (
      amount: bigint,
      tokenAddress: string,
      wasmPath: string,
      zkeyPath: string,
    ) => {
      if (!eerc) return;
      return eerc?.withdraw(
        amount,
        auditorPublicKey,
        wasmPath,
        zkeyPath,
        tokenAddress,
      );
    },
    [eerc, auditorPublicKey],
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

  // user encrypted balance (for standalone version)
  useContractRead({
    address: contractAddress as `0x${string}`,
    abi: eerc?.abi,
    functionName: "balanceOf",
    args: [wallet?.account.address, 0n], // second parameter is the token id and for the standalone version it is 0
    enabled: !!eerc && !!wallet.account.address && isRegistered && !isConverter,
    watch: true,
    onSuccess: (balance: EncryptedBalance) => {
      // if previous balance is equal to the new balance then return
      if (encryptedBalance.length && balance[0].c1.x === encryptedBalance[0]) {
        console.log("No change in the encrypted balance");
        return;
      }

      // TODO: If encrypted balance is saved in somewhere in the local storage
      // TODO: then we can compare the encrypted balance with the saved one and
      // TODO: instead of decrypting the whole balance we can only decrypt the difference
      const decBalance = eerc?.decryptContractBalance(balance);
      if (!decBalance) {
        setDecryptedBalance([]);
        setEncryptedBalance([]);
        return;
      }
      setDecryptedBalance(decBalance);
      const parsedDecryptedBalance = Scalar.adjust(
        decBalance[0],
        decBalance[1],
      );
      setParsedDecryptedBalance(parsedDecryptedBalance);
      setEncryptedBalance([
        balance[0].c1.x,
        balance[0].c1.y,
        balance[0].c2.x,
        balance[0].c2.y,
        balance[1].c1.x,
        balance[1].c1.y,
        balance[1].c2.x,
        balance[1].c2.y,
      ]);
    },
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

  const balanceOf = useCallback(() => {
    return useEncryptedBalanceWithTokenId(
      eerc,
      contractAddress,
      wallet,
      true,
      0n,
    );
  }, [eerc, contractAddress, wallet]);

  const getEncryptedBalance = useCallback(
    (tokenAddress: string) => {
      return useEncryptedBalanceWithAddress(
        eerc,
        contractAddress,
        wallet,
        true,
        tokenAddress,
      );
    },
    [eerc, contractAddress, wallet],
  );

  return {
    isInitialized,
    isRegistered,
    decryptedBalance: parsedDecryptedBalance,
    encryptedBalance,

    // hooks
    balanceOf,
    getEncryptedBalance,

    // functions
    register,
    privateMint,
    privateBurn,
    transfer,
    transferToken,
    deposit,
    withdraw,
  };
}
