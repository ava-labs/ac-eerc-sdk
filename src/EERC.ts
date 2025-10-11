import { poseidon3, poseidon5 } from "poseidon-lite";
import * as snarkjs from "snarkjs";
import { type Log, type PublicClient, type WalletClient, decodeFunctionData, isAddress, erc20Abi, keccak256, concat } from "viem";
import { BabyJub } from "./crypto/babyjub";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import { Poseidon } from "./crypto/poseidon";
import type { AmountPCT, EGCT, Point } from "./crypto/types";
import { type IProof, logMessage } from "./helpers";
import type {
  CircuitURLs,
  DecryptedTransaction,
  EERCOperation,
  EERCOperationGnark,
  IProveFunction,
  OperationResult,
  eERC_Proof,
} from "./hooks/types";
import {
  BURN_USER,
  ENCRYPTED_ERC_ABI,
  LEGACY_ENCRYPTED_ERC_ABI,
  LEGACY_REGISTRAR_ABI,
  MESSAGES,
  PRIVATE_BURN_EVENT,
  PRIVATE_MINT_EVENT,
  PRIVATE_TRANSFER_EVENT,
  REGISTRAR_ABI,
  SNARK_FIELD_SIZE,
} from "./utils";

export class EERC {
  private client: PublicClient;
  public wallet: WalletClient;

  public curve: BabyJub;
  public field: FF;
  public poseidon: Poseidon;

  public contractAddress: `0x${string}`;
  public isConverter: boolean;
  public encryptedErcAbi = ENCRYPTED_ERC_ABI;
  public legacyEncryptedErcAbi = LEGACY_ENCRYPTED_ERC_ABI;

  public registrarAddress: `0x${string}`;
  public registrarAbi = REGISTRAR_ABI;
  public legacyRegistrarAbi = LEGACY_REGISTRAR_ABI;

  private decryptionKey: string;
  public publicKey: Point | null = null;

  public circuitURLs: CircuitURLs;

  public proveFunc: (
    data: string,
    proofType: EERCOperationGnark,
  ) => Promise<IProof>;

  public snarkjsMode: boolean;

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
    registrarAddress: `0x${string}`,
    isConverter: boolean,
    proveFunc: IProveFunction,
    circuitURLs: CircuitURLs,
    decryptionKey?: string,
  ) {
    this.client = client;
    this.wallet = wallet;
    this.contractAddress = contractAddress;
    this.registrarAddress = registrarAddress;
    this.isConverter = isConverter;
    this.circuitURLs = circuitURLs;
    this.proveFunc = proveFunc;
    this.snarkjsMode = true;

    this.field = new FF(SNARK_FIELD_SIZE);
    this.curve = new BabyJub(this.field);
    this.poseidon = new Poseidon(this.field, this.curve);
    this.decryptionKey = decryptionKey || "";

    if (this.decryptionKey) {
      const formatted = formatKeyForCurve(this.decryptionKey);
      this.publicKey = this.curve.generatePublicKey(formatted);
    }
  }

  /**
   * throws an error with EERCError class
   * @param message error message
   */
  private throwError(message: string) {
    throw new Error(message);
  }

  /**
   * checks that provided address is a valid address
   * @param address address to validate
   */
  private validateAddress(address: string) {
    if (!isAddress(address)) throw new Error("Invalid address!");
  }

  /**
   * checks that amount is greater than 0 and if sender balance is provided, checks that amount is less than sender balance
   * @param amount amount
   * @param senderBalance sender balance - optional
   */
  private validateAmount(amount: bigint, senderBalance?: bigint) {
    if (amount <= 0n) throw new Error("Invalid amount!");
    if (senderBalance && amount > senderBalance)
      throw new Error("Insufficient balance!");
  }

  /**
   * function to set the auditor public key
   * @param address auditor address
   * @returns transaction hash
   */
  public async setContractAuditorPublicKey(address: `0x${string}`) {
    if (!this.wallet.account) throw new Error("Wallet account not found");
    try {
      return await this.wallet.writeContract({
        abi: this.encryptedErcAbi,
        address: this.contractAddress,
        functionName: "setAuditorPublicKey",
        args: [address],
        account: this.wallet.account!,
        chain: this.wallet.chain,
      });
    } catch (e) {
      throw new Error("Failed to set auditor public key!", { cause: e });
    }
  }

  /**
   * getter to check if the decryption key is set or not
   */
  public get isDecryptionKeySet() {
    return !!this.decryptionKey;
  }

  /**
   * function to generate the decryption key
   */
  public async generateDecryptionKey() {
    if (!this.wallet || !this.client || !this.wallet.account) {
      this.throwError("Missing wallet, client or account!");
    }
    try {
      const message = MESSAGES.REGISTER(this.wallet.account!.address);

      // deriving the decryption key from the user signature
      const signature = await this.wallet.signMessage({ message, account: this.wallet.account! });
      const key = getPrivateKeyFromSignature(signature);

  this.decryptionKey = key;

  const formatted = formatKeyForCurve(this.decryptionKey);
  this.publicKey = this.curve.generatePublicKey(formatted);

      return key;
    } catch (error) {
      console.error("Failed to generate decryption key", error);
      throw new Error("Failed to generate decryption key!");
    }
  }

  /**
   * function to register a new user to the contract
   */
  async register(): Promise<{
    key: string;
    transactionHash: string;
  }> {
    if (!this.wallet || !this.client || !this.contractAddress || !this.wallet.account)
      throw new Error("Missing client, wallet, account or contract address!");
    
    try {
      logMessage("Registering user to the contract");

      // message to sign
      const key = await this.generateDecryptionKey();
      const formatted = formatKeyForCurve(key);
      const publicKey = this.curve.generatePublicKey(formatted);

      {
        const contractPublicKey = await this.fetchPublicKey(
          this.wallet.account.address,
        );

        // if user already registered return the key
        if (contractPublicKey[0] !== 0n && contractPublicKey[1] !== 0n) {
          this.decryptionKey = key as string;
          this.publicKey = publicKey;
          return {
            key,
            transactionHash: "",
          };
        }
      }

      // get chain id
      const chainId = await this.client.getChainId();
      // get full address
      const fullAddress = BigInt(this.wallet.account.address);
      // construct registration hash
      const registrationHash = poseidon3([chainId, formatted, fullAddress]);

      const input = {
        SenderPrivateKey: formatted,
        SenderPublicKey: publicKey,
        SenderAddress: fullAddress,
        ChainID: chainId,
        RegistrationHash: registrationHash,
      };

      // generate proof for the transaction
      const proof = await this.generateProof(input, "REGISTER");

      logMessage("Sending transaction");
      const transactionHash = await this.wallet.writeContract({
        abi: this.snarkjsMode ? this.registrarAbi : this.legacyRegistrarAbi,
        address: this.registrarAddress,
        functionName: "register",
        args: this.snarkjsMode
          ? [proof]
          : [(proof as IProof).proof, (proof as IProof).publicInputs],
        account: this.wallet.account!,
        chain: this.wallet.chain,
      });

  this.decryptionKey = key;
  this.publicKey = publicKey;

      // returns proof for the transaction
      return { key, transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  /**
   * function to mint private tokens for a user (ONLY FOR STANDALONE VERSION)
   * @param recipient recipient address
   * @param mintAmount mint amount
   * @param auditorPublicKey auditor public key
   * @returns transaction hash
   */
  async privateMint(
    recipient: `0x${string}`,
    mintAmount: bigint,
    auditorPublicKey: Point,
  ): Promise<OperationResult> {
    if (this.isConverter) throw new Error("Not allowed for converter!");
    if (!this.wallet.account) throw new Error("Wallet account not found");
    this.validateAddress(recipient);
    this.validateAmount(mintAmount);
    logMessage("Minting encrypted tokens");

    // fetch the receiver public key
    const receiverPublicKey = await this.fetchPublicKey(recipient);

    // 1. encrypt the total mint amount
    const { cipher: encryptedAmount, random: encryptedAmountRandom } =
      await this.curve.encryptMessage(receiverPublicKey, mintAmount);

    // 2. create pct for the receiver with the mint amount
    const {
      cipher: receiverCiphertext,
      nonce: receiverPoseidonNonce,
      authKey: receiverAuthKey,
      encryptionRandom: receiverEncryptionRandom,
    } = await this.poseidon.processPoseidonEncryption({
      inputs: [mintAmount],
      publicKey: receiverPublicKey as Point,
    });

    // 3. create pct for the auditor with the mint amount
    const {
      cipher: auditorCiphertext,
      nonce: auditorPoseidonNonce,
      authKey: auditorAuthKey,
      encryptionRandom: auditorEncryptionRandom,
    } = await this.poseidon.processPoseidonEncryption({
      inputs: [mintAmount],
      publicKey: auditorPublicKey as Point,
    });

    // 4. creates nullifier for auditor ciphertext
    const chainId = await this.client.getChainId();
    const nullifier = poseidon5([chainId, ...auditorCiphertext].map(String));

    const input = {
      ValueToMint: mintAmount,
      ChainID: chainId,
      NullifierHash: nullifier,
      ReceiverPublicKey: receiverPublicKey,
      ReceiverVTTC1: encryptedAmount.c1,
      ReceiverVTTC2: encryptedAmount.c2,
      ReceiverVTTRandom: encryptedAmountRandom,
      ReceiverPCT: receiverCiphertext,
      ReceiverPCTAuthKey: receiverAuthKey,
      ReceiverPCTNonce: receiverPoseidonNonce,
      ReceiverPCTRandom: receiverEncryptionRandom,
      AuditorPublicKey: auditorPublicKey,
      AuditorPCT: auditorCiphertext,
      AuditorPCTAuthKey: auditorAuthKey,
      AuditorPCTNonce: auditorPoseidonNonce,
      AuditorPCTRandom: auditorEncryptionRandom,
    };

    const proof = await this.generateProof(input, "MINT");

    // write the transaction to the contract
    const transactionHash = await this.wallet.writeContract({
      abi: this.snarkjsMode ? this.encryptedErcAbi : this.legacyEncryptedErcAbi,
      address: this.contractAddress,
      functionName: "privateMint",
      args: this.snarkjsMode
        ? [recipient, proof]
        : [recipient, (proof as IProof).proof, (proof as IProof).publicInputs],
      account: this.wallet.account!,
      chain: this.wallet.chain,
    });

    return { transactionHash };
  }

  /**
   * function for burning encrypted tokens privately (ONLY FOR STANDALONE VERSION)
   * @param amount burn amount
   * @param encryptedBalance encrypted balance
   * @param decryptedBalance decrypted balance
   * @param auditorPublicKey auditor public key
   * @returns transaction hash
   *
   * @dev private burn is equals to private transfer to the burn user in the standalone version
   */
  async privateBurn(
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
  ) {
    if (this.isConverter) throw new Error("Not allowed for converter!");
    if (!this.wallet.account) throw new Error("Wallet account not found");
    this.validateAmount(amount, decryptedBalance);
    logMessage("Burning encrypted tokens");

    const privateKey = formatKeyForCurve(this.decryptionKey);

    // encrypt the amount with the user public key
    const { cipher: encryptedAmount } = await this.curve.encryptMessage(
      this.publicKey as Point,
      amount,
    );

    // create pct for the auditor
    const {
      cipher: auditorCiphertext,
      nonce: auditorPoseidonNonce,
      authKey: auditorAuthKey,
      encryptionRandom: auditorEncryptionRandom,
    } = await this.poseidon.processPoseidonEncryption({
      inputs: [amount],
      publicKey: auditorPublicKey as Point,
    });

    const senderNewBalance = decryptedBalance - amount;
    const {
      cipher: userCiphertext,
      nonce: userPoseidonNonce,
      authKey: userAuthKey,
    } = await this.poseidon.processPoseidonEncryption({
      inputs: [senderNewBalance],
      publicKey: this.publicKey as Point,
    });

    // prepare circuit inputs
    const input = {
      ValueToBurn: amount,
      SenderPrivateKey: privateKey,
      SenderPublicKey: this.publicKey,
      SenderBalance: decryptedBalance,
      SenderBalanceC1: encryptedBalance.slice(0, 2),
      SenderBalanceC2: encryptedBalance.slice(2, 4),
      SenderVTBC1: encryptedAmount.c1,
      SenderVTBC2: encryptedAmount.c2,
      AuditorPublicKey: auditorPublicKey,
      AuditorPCT: auditorCiphertext,
      AuditorPCTAuthKey: auditorAuthKey,
      AuditorPCTNonce: auditorPoseidonNonce,
      AuditorPCTRandom: auditorEncryptionRandom,
    };

    const proof = await this.generateProof(input, "BURN");

    logMessage("Sending transaction");

    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress,
      functionName: "privateBurn",
      args: [proof, [...userCiphertext, ...userAuthKey, userPoseidonNonce]],
      account: this.wallet.account!,
      chain: this.wallet.chain,
    });

    return { transactionHash };
  }

  /**
   * function to transfer encrypted tokens privately
   * @param to recipient address
   * @param amount transfer amount
   * @param encryptedBalance encrypted balance
   * @param decryptedBalance decrypted balance
   * @param auditorPublicKey auditor public key
   * @param tokenAddress token address
   * @returns transaction hash
   */
  async transfer(
    to: string,
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
    tokenAddress?: string,
  ): Promise<{
    transactionHash: `0x${string}`;
    receiverEncryptedAmount: string[];
    senderEncryptedAmount: string[];
  }> {
    this.validateAddress(to);
    this.validateAmount(amount, decryptedBalance);
    if (!this.wallet.account) throw new Error("Wallet account not found");

    let tokenId = 0n;
    if (tokenAddress) {
      tokenId = await this.fetchTokenId(tokenAddress);
    }

    logMessage("Transferring encrypted tokens");
    const {
      proof,
      senderBalancePCT,
      receiverEncryptedAmount,
      senderEncryptedAmount,
    } = await this.generateTransferProof(
      to,
      amount,
      encryptedBalance,
      decryptedBalance,
      auditorPublicKey,
    );

    logMessage("Sending transaction");

    const transactionHash = await this.wallet.writeContract({
      abi: this.snarkjsMode ? this.encryptedErcAbi : this.legacyEncryptedErcAbi,
      address: this.contractAddress,
      functionName: "transfer",
      args: this.snarkjsMode
        ? [to, tokenId, proof, senderBalancePCT]
        : [
            to,
            tokenId,
            (proof as IProof).proof,
            (proof as IProof).publicInputs,
            senderBalancePCT,
          ],
      account: this.wallet.account!,
      chain: this.wallet.chain,
    });

    return {
      transactionHash,
      receiverEncryptedAmount,
      senderEncryptedAmount,
    };
  }

  // function to deposit tokens to the contract
  async deposit(amount: bigint, tokenAddress: string, eERCDecimals: bigint) {
    if (!this.isConverter) throw new Error("Not allowed for stand alone!");
    if (!this.wallet.account) throw new Error("Wallet account not found");

    logMessage("Depositing tokens to the contract");
    // check if the user has enough approve amount
    const approveAmount = await this.fetchUserApprove(
      this.wallet.account.address,
      tokenAddress,
    );

    if (approveAmount < amount) {
      throw new Error("Insufficient approval amount!");
    }

    // need to convert erc20 decimals -> eERC decimals (2)
    const decimals = await this.client.readContract({
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "decimals",
    });

    const parsedAmount = this.convertTokenDecimals(
      amount,
      Number(decimals),
      Number(eERCDecimals),
    );

    // user creates new balance pct for the deposit amount
    const { cipher, nonce, authKey } =
      await this.poseidon.processPoseidonEncryption({
        inputs: [BigInt(parsedAmount)],
        publicKey: this.publicKey as Point,
      });

    logMessage("Sending transaction");
    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "deposit",
      args: [amount, tokenAddress, [...cipher, ...authKey, nonce]],
      account: this.wallet.account!,
      chain: this.wallet.chain,
    });

    return { transactionHash };
  }


  // function to deposit tokens to the contract
  async withdraw(
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
    tokenAddress: string,
  ): Promise<OperationResult> {
    // only work if eerc is converter
    if (!this.isConverter) throw new Error("Not allowed for stand alone!");
    if (!this.wallet.account) throw new Error("Wallet account not found");
    this.validateAmount(amount, decryptedBalance);

    try {
      const tokenId = await this.fetchTokenId(tokenAddress);

      const newBalance = decryptedBalance - amount;
      const privateKey = formatKeyForCurve(this.decryptionKey);

      // 2. create pct for the user with the new balance
      const {
        cipher: senderCipherText,
        nonce: senderPoseidonNonce,
        authKey: senderAuthKey,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [newBalance],
        publicKey: this.publicKey as Point,
      });

      // 3. create pct for the auditor with the withdraw amount
      const {
        cipher: auditorCipherText,
        nonce: auditorPoseidonNonce,
        authKey: auditorAuthKey,
        encryptionRandom: auditorEncryptionRandom,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [amount],
        publicKey: auditorPublicKey as Point,
      });

      const input = {
        ValueToWithdraw: amount,
        SenderPrivateKey: privateKey,
        SenderPublicKey: this.publicKey,
        SenderBalance: decryptedBalance,
        SenderBalanceC1: encryptedBalance.slice(0, 2),
        SenderBalanceC2: encryptedBalance.slice(2, 4),
        AuditorPublicKey: auditorPublicKey,
        AuditorPCT: auditorCipherText,
        AuditorPCTAuthKey: auditorAuthKey,
        AuditorPCTNonce: auditorPoseidonNonce,
        AuditorPCTRandom: auditorEncryptionRandom,
      };

      // generate proof
      const proof = await this.generateProof(input, "WITHDRAW");

      const userBalancePCT = [
        ...senderCipherText,
        ...senderAuthKey,
        senderPoseidonNonce,
      ].map(String);

      const transactionHash = await this.wallet.writeContract({
        abi: this.snarkjsMode
          ? this.encryptedErcAbi
          : this.legacyEncryptedErcAbi,
        address: this.contractAddress as `0x${string}`,
        functionName: "withdraw",
        args: this.snarkjsMode
          ? [tokenId, proof, userBalancePCT]
          : [
              tokenId,
              (proof as IProof).proof,
              (proof as IProof).publicInputs,
              userBalancePCT,
            ],
        account: this.wallet.account!,
        chain: this.wallet.chain,
      });

      return { transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  /**
   * function to generate transfer proof for private burn and transfer
   * @param to recipient address
   * @param amount transfer amount
   * @param encryptedBalance encrypted balance
   * @param decryptedBalance decrypted balance
   * @param auditorPublicKey auditor public key
   * @returns proof and sender balance pct
   */
  private async generateTransferProof(
    to: string,
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
  ): Promise<{
    proof: eERC_Proof | IProof;
    senderBalancePCT: string[];
    receiverEncryptedAmount: string[];
    senderEncryptedAmount: string[];
  }> {
    try {
      this.validateAddress(to);
      this.validateAmount(amount, decryptedBalance);

      const senderNewBalance = decryptedBalance - amount;
      const privateKey = formatKeyForCurve(this.decryptionKey);
      const receiverPublicKey = await this.fetchPublicKey(to);
      if (receiverPublicKey[0] === 0n && receiverPublicKey[1] === 0n)
        throw new Error("Receiver is not registered!");

      // 1. encrypt the transfer amount for sender
      const { cipher: encryptedAmountSender } = await this.curve.encryptMessage(
        this.publicKey as Point,
        amount,
      );

      // 2. encrypt the transfer amount for receiver
      const {
        cipher: encryptedAmountReceiver,
        random: encryptedAmountReceiverRandom,
      } = await this.curve.encryptMessage(receiverPublicKey as Point, amount);

      // 3. creates a pct for receiver with the transfer amount
      const {
        cipher: receiverCipherText,
        nonce: receiverPoseidonNonce,
        authKey: receiverAuthKey,
        encryptionRandom: receiverEncryptionRandom,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [amount],
        publicKey: receiverPublicKey as Point,
      });

      // 4. creates a pct for auditor with the transfer amount
      const {
        cipher: auditorCipherText,
        nonce: auditorPoseidonNonce,
        authKey: auditorAuthKey,
        encryptionRandom: auditorEncryptionRandom,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [amount],
        publicKey: auditorPublicKey as Point,
      });

      // 5. create pct for the sender with the new balance
      const {
        cipher: senderCipherText,
        nonce: senderPoseidonNonce,
        authKey: senderAuthKey,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [senderNewBalance],
        publicKey: this.publicKey as Point,
      });

      const input = {
        ValueToTransfer: amount,
        SenderPrivateKey: privateKey,
        SenderPublicKey: this.publicKey,
        SenderBalance: decryptedBalance,
        SenderBalanceC1: encryptedBalance.slice(0, 2),
        SenderBalanceC2: encryptedBalance.slice(2, 4),
        SenderVTTC1: encryptedAmountSender.c1,
        SenderVTTC2: encryptedAmountSender.c2,
        ReceiverPublicKey: receiverPublicKey,
        ReceiverVTTC1: encryptedAmountReceiver.c1,
        ReceiverVTTC2: encryptedAmountReceiver.c2,
        ReceiverVTTRandom: encryptedAmountReceiverRandom,
        ReceiverPCT: receiverCipherText,
        ReceiverPCTAuthKey: receiverAuthKey,
        ReceiverPCTNonce: receiverPoseidonNonce,
        ReceiverPCTRandom: receiverEncryptionRandom,

        AuditorPublicKey: auditorPublicKey,
        AuditorPCT: auditorCipherText,
        AuditorPCTAuthKey: auditorAuthKey,
        AuditorPCTNonce: auditorPoseidonNonce,
        AuditorPCTRandom: auditorEncryptionRandom,
      };

      const proof = await this.generateProof(input, "TRANSFER");

      // and also encrypts the amount of the transfer with sender public key for transaction history
      const {
        cipher: senderAmountCiphertext,
        nonce: senderAmountPoseidonNonce,
        authKey: senderAmountAuthKey,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [amount],
        publicKey: this.publicKey as Point,
      });

      return {
        proof,
        senderBalancePCT: [
          ...senderCipherText,
          ...senderAuthKey,
          senderPoseidonNonce,
        ].map(String),
        receiverEncryptedAmount: [
          ...receiverCipherText,
          ...receiverAuthKey,
          receiverPoseidonNonce,
        ].map(String),
        senderEncryptedAmount: [
          ...senderAmountCiphertext,
          ...senderAmountAuthKey,
          senderAmountPoseidonNonce,
        ].map(String),
      };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  /**
   * function to fetch user public key from registrar contract
   * @param to user address
   * @returns user public key
   */
  async fetchPublicKey(to: string): Promise<Point> {
    if (to === BURN_USER.address) {
      return BURN_USER.publicKey as Point;
    }

    const publicKey = (await this.client.readContract({
      address: this.registrarAddress as `0x${string}`,
      abi: this.registrarAbi,
      functionName: "getUserPublicKey",
      args: [to],
    })) as Point;

    return publicKey as Point;
  }

  /**
   * function to fetch user approval from erc20 token
   * @param userAddress user address
   * @param tokenAddress token address
   * @returns user approval
   */
  async fetchUserApprove(userAddress: string, tokenAddress: string) {
    const data = await this.client.readContract({
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [userAddress as `0x${string}`, this.contractAddress],
    });

    return data;
  }

  /**
   * function to fetch token id from token address
   * @param tokenAddress token address
   * @returns token id
   */
  async fetchTokenId(tokenAddress: string) {
    const data = await this.client.readContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "tokenIds",
      args: [tokenAddress as `0x${string}`],
    });

    return data as bigint;
  }

  /**
   * function to check if a nonce has been used for signature-based withdrawals
   * @param signer address of the signer
   * @param nonce nonce to check
   * @returns true if nonce has been used, false otherwise
   */
  async fetchNonceUsed(signer: string, nonce: bigint): Promise<boolean> {
    const data = await this.client.readContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "usedNonces",
      args: [signer as `0x${string}`, nonce],
    });

    return data as boolean;
  }

  /**
   * function to get EIP-712 domain for signature generation
   * @returns EIP-712 domain separator data
   */
  async getEIP712Domain() {
    const chainId = await this.client.getChainId();

    return {
      name: "EncryptedERC",
      version: "1",
      chainId,
      verifyingContract: this.contractAddress,
    };
  }

  /**
   * function to generate EIP-712 signature for stealth withdrawal authorization
   * @param userIndex encrypted index of the user
   * @param recipient address to receive withdrawn tokens
   * @param nonce unique nonce for this signature
   * @param deadline timestamp after which signature expires
   * @returns signature bytes
   */
  async generateWithdrawSignature(
    userIndex: bigint,
    recipient: string,
    nonce: bigint,
    deadline: bigint,
  ): Promise<`0x${string}`> {
    if (!this.wallet || !this.wallet.account) throw new Error("Missing wallet or account!");

    try {
      // Get EIP-712 domain
      const domain = await this.getEIP712Domain();

      // Define types for WithdrawAuthorization
      const types = {
        WithdrawAuthorization: [
          { name: "index", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      // Build message
      const message = {
        index: userIndex,
        recipient: recipient as `0x${string}`,
        nonce,
        deadline,
      };

      // Sign using EIP-712
      const signature = await this.wallet.signTypedData({
        account: this.wallet.account!,
        domain,
        types,
        primaryType: "WithdrawAuthorization",
        message,
      });

      return signature;
    } catch (e) {
      throw new Error(`Failed to generate signature: ${e}`);
    }
  }


  /**
   * Generate encrypted proof messages for metadata-based withdrawal
   * Creates dual encryption: one for user, one for auditor
   * @param amount withdrawal amount
   * @param recipient address receiving withdrawn tokens
   * @param nonce unique nonce
   * @param deadline signature expiration
   * @returns userProof and auditorProof as hex strings
   */
  private async generateEncryptedProof(
    amount: bigint,
    recipient: string,
    nonce: bigint,
    deadline: bigint,
  ): Promise<{ userProof: `0x${string}`; auditorProof: `0x${string}` }> {
    if (!this.wallet.account) throw new Error("Missing wallet account!");

    // Derive a fresh public key from the stored decryption key to avoid any runtime mutations
    if (!this.decryptionKey) {
      throw new Error("Missing decryption key; call generateDecryptionKey() first.");
    }
    const formattedSk = formatKeyForCurve(this.decryptionKey);
    const localPublicKey = this.curve.generatePublicKey(formattedSk);
    if (
      typeof localPublicKey[0] !== "bigint" ||
      typeof localPublicKey[1] !== "bigint"
    ) {
      throw new Error("Derived public key is invalid");
    }
  console.log('[SDK generateEncryptedProof] using derived user publicKey:', localPublicKey);

    // Create proof message
    const proofMessage = {
      owner: this.wallet.account.address,
      amount: amount.toString(),
      recipient,
      nonce: nonce.toString(),
      deadline: deadline.toString(),
      timestamp: Date.now(),
    };

    const messageBytes = new TextEncoder().encode(
      JSON.stringify(proofMessage),
    );

  console.log('[SDK] About to call encryptBytes with publicKey:', this.publicKey);

    // Encrypt with user's own public key
  console.log('[SDK generateEncryptedProof] calling encryptBytes for user with key:', localPublicKey);
  const userEncrypted = await this.curve.encryptBytes(localPublicKey, messageBytes);

    // Get auditor public key (Point struct)
    const auditorPubKeyStruct = await this.client.readContract({
      address: this.contractAddress,
      abi: this.encryptedErcAbi,
      functionName: "auditorPublicKey",
    });

    // Extract x and y from Point struct (viem returns as array)
    let auditorPubKey: bigint[];
    if (Array.isArray(auditorPubKeyStruct) && auditorPubKeyStruct.length === 2) {
      auditorPubKey = [BigInt(auditorPubKeyStruct[0]), BigInt(auditorPubKeyStruct[1])];
    } else if (auditorPubKeyStruct && typeof auditorPubKeyStruct === 'object') {
      const struct = auditorPubKeyStruct as { x?: bigint; y?: bigint };
      if (struct.x !== undefined && struct.y !== undefined) {
        auditorPubKey = [BigInt(struct.x), BigInt(struct.y)];
      } else {
        throw new Error('Invalid auditor public key structure from contract');
      }
    } else {
      throw new Error('Could not extract auditor public key from contract response');
    }

    if (auditorPubKey[0] === 0n && auditorPubKey[1] === 0n) {
      throw new Error('Auditor public key not set on contract');
    }

    // Encrypt with auditor's public key
    console.log('[SDK generateEncryptedProof] using auditor publicKey:', auditorPubKey);
    console.log('[SDK generateEncryptedProof] calling encryptBytes for auditor with key:', auditorPubKey);
    const auditorEncrypted = await this.curve.encryptBytes(
      auditorPubKey as Point,
      messageBytes,
    );

    // Convert to hex strings
    const userProof = `0x${Buffer.from(userEncrypted).toString("hex")}` as `0x${string}`;
    const auditorProof =
      `0x${Buffer.from(auditorEncrypted).toString("hex")}` as `0x${string}`;

    return { userProof, auditorProof };
  }

  /**
   * Generate EIP-712 signature for metadata-based withdrawal
   * @param userProof encrypted proof for user
   * @param auditorProof encrypted proof for auditor
   * @param recipient address receiving tokens
   * @param nonce unique nonce
   * @param deadline signature expiration
   * @returns EIP-712 signature
   */
  async generateEncryptedProofSignature(
    userProof: `0x${string}`,
    auditorProof: `0x${string}`,
    recipient: string,
    nonce: bigint,
    deadline: bigint,
  ): Promise<`0x${string}`> {
    if (!this.wallet || !this.wallet.account) throw new Error("Missing wallet or account!");

    try {
      // Get EIP-712 domain
      const domain = await this.getEIP712Domain();

      // Hash the proofs (matching Solidity logic: keccak256(abi.encodePacked(userProof, auditorProof)))
      const proofHash = keccak256(concat([userProof, auditorProof]));

      // Define types for WithdrawMetadataAuthorization
      const types = {
        WithdrawMetadataAuthorization: [
          { name: "proofHash", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      // Build message
      const message = {
        proofHash,
        recipient: recipient as `0x${string}`,
        nonce,
        deadline,
      };

      // Sign using EIP-712
      const signature = await this.wallet.signTypedData({
        account: this.wallet.account!,
        domain,
        types,
        primaryType: "WithdrawMetadataAuthorization",
        message,
      });

      return signature;
    } catch (e) {
      throw new Error(`Failed to generate signature: ${e}`);
    }
  }

  /**
   * Withdraw via encrypted metadata proof with signature (maximum privacy stealth withdrawal)
   * Main wallet signs off-chain, stealth wallet submits on-chain
   * User maintains own withdrawal history via encrypted metadata
   * @param recipient address to receive withdrawn tokens
   * @param amount withdrawal amount
   * @param encryptedBalance encrypted balance
   * @param decryptedBalance decrypted balance
   * @param auditorPublicKey auditor public key
   * @param tokenAddress token address
   * @param signature EIP-712 signature from main wallet
   * @param nonce nonce used in signature
   * @param deadline deadline used in signature
   * @returns transaction hash
   */
  async withdrawWithEncryptedProof(
    recipient: string,
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
    tokenAddress: string,
    signature: `0x${string}`,
    nonce: bigint,
    deadline: bigint,
  ): Promise<OperationResult> {
    // only work if eerc is converter
    if (!this.isConverter) throw new Error("Not allowed for stand alone!");
    if (!this.wallet.account) throw new Error("Wallet account not found");

    this.validateAddress(recipient);

    // Ensure all values are BigInt to avoid mixing types
    const amountBigInt = BigInt(amount);
    const decryptedBalanceBigInt = BigInt(decryptedBalance);
    const nonceBigInt = BigInt(nonce);
    const deadlineBigInt = BigInt(deadline);
    const encryptedBalanceBigInt = encryptedBalance.map(v => BigInt(v));
    const auditorPublicKeyBigInt = auditorPublicKey.map(v => BigInt(v));

    this.validateAmount(amountBigInt, decryptedBalanceBigInt);

    try {
      const tokenId = await this.fetchTokenId(tokenAddress);

      const newBalance = decryptedBalanceBigInt - amountBigInt;
      const privateKey = formatKeyForCurve(this.decryptionKey);

      // 1. Generate encrypted proofs for both user and auditor
      const { userProof, auditorProof } = await this.generateEncryptedProof(
        amountBigInt,
        recipient,
        nonceBigInt,
        deadlineBigInt,
      );

      // 2. create pct for the user with the new balance
      const {
        cipher: senderCipherText,
        nonce: senderPoseidonNonce,
        authKey: senderAuthKey,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [newBalance],
        publicKey: this.publicKey as Point,
      });

      // 3. create pct for the auditor with the withdraw amount
      const {
        cipher: auditorCipherText,
        nonce: auditorPoseidonNonce,
        authKey: auditorAuthKey,
        encryptionRandom: auditorEncryptionRandom,
      } = await this.poseidon.processPoseidonEncryption({
        inputs: [amountBigInt],
        publicKey: auditorPublicKeyBigInt as Point,
      });

      const input = {
        ValueToWithdraw: amountBigInt,
        SenderPrivateKey: privateKey,
        SenderPublicKey: this.publicKey,
        SenderBalance: decryptedBalanceBigInt,
        SenderBalanceC1: encryptedBalanceBigInt.slice(0, 2),
        SenderBalanceC2: encryptedBalanceBigInt.slice(2, 4),
        AuditorPublicKey: auditorPublicKeyBigInt,
        AuditorPCT: auditorCipherText,
        AuditorPCTAuthKey: auditorAuthKey,
        AuditorPCTNonce: auditorPoseidonNonce,
        AuditorPCTRandom: auditorEncryptionRandom,
      };

      // generate proof using existing WITHDRAW circuit
      const proof = await this.generateProof(input, "WITHDRAW");

      const userBalancePCT = [
        ...senderCipherText,
        ...senderAuthKey,
        senderPoseidonNonce,
      ].map(String);

      logMessage("Sending withdrawWithEncryptedProof transaction");

      const transactionHash = await this.wallet.writeContract({
        abi: this.snarkjsMode
          ? this.encryptedErcAbi
          : this.legacyEncryptedErcAbi,
        address: this.contractAddress as `0x${string}`,
        functionName: "withdrawWithEncryptedProof",
        args: this.snarkjsMode
          ? [
              userProof,
              auditorProof,
              recipient as `0x${string}`,
              tokenId,
              proof,
              userBalancePCT,
              signature,
              nonceBigInt,
              deadlineBigInt,
            ]
          : [
              userProof,
              auditorProof,
              recipient as `0x${string}`,
              tokenId,
              (proof as IProof).proof,
              (proof as IProof).publicInputs,
              userBalancePCT,
              signature,
              nonceBigInt,
              deadlineBigInt,
            ],
        account: this.wallet.account!,
        chain: this.wallet.chain,
      });

      return { transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  /**
   * Get user's withdrawal history from encrypted metadata
   * User can decrypt their own withdrawal records
   * @returns array of decrypted withdrawal records
   */
  async getMyWithdrawalHistory(): Promise<
    Array<{
      owner: string;
      amount: string;
      recipient: string;
      nonce: string;
      deadline: string;
      timestamp: number;
    }>
  > {
    if (!this.wallet.account) throw new Error("Missing wallet account!");

    try {
      const privateKey = formatKeyForCurve(this.decryptionKey);

      // Get PrivateMessage events where user is recipient
      const logs = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: "event",
          name: "PrivateMessage",
          inputs: [
            { type: "address", name: "from", indexed: true },
            { type: "address", name: "to", indexed: true },
            { type: "string", name: "messageType", indexed: false },
            { type: "bytes", name: "encryptedMsg", indexed: false },
          ],
        },
        args: {
          to: this.wallet.account.address,
        },
        fromBlock: "earliest",
        toBlock: "latest",
      });

      const withdrawals = [];

      for (const log of logs) {
        const { args } = log;
        if (args && args.messageType === "WITHDRAW_SELF" && args.encryptedMsg) {
          try {
            // Decrypt the message
            const encryptedBuf = Buffer.from(
              (args.encryptedMsg as string).slice(2),
              "hex",
            );
            const encryptedBytes = new Uint8Array(
              encryptedBuf.buffer,
              encryptedBuf.byteOffset,
              encryptedBuf.byteLength,
            );
            const decrypted = this.curve.decryptBytes(
              privateKey,
              encryptedBytes,
            );
            const decoded = new TextDecoder().decode(decrypted);
            const withdrawal = JSON.parse(decoded);
            withdrawals.push(withdrawal);
          } catch (e) {
            // Skip messages we can't decrypt
            continue;
          }
        }
      }

      return withdrawals;
    } catch (e) {
      throw new Error(`Failed to fetch withdrawal history: ${e}`);
    }
  }

  /**
   * function to calculate the total balance of the user by adding amount pcts with balance pct
   * at the end it decrypts the balance pct and compares it with the expected point make sure that balance is correct and
   * pcts are synced with el gamal cipher text
   * @param eGCT el gamal cipher text from contract
   * @param amountPCTs amount pct array
   * @param balancePCT balance pct array
   * @returns total balance
   */
  calculateTotalBalance(
    eGCT: EGCT,
    amountPCTs: AmountPCT[],
    balancePCT: bigint[],
  ) {
    const privateKey = formatKeyForCurve(this.decryptionKey);

    let totalBalance = 0n;

    if (balancePCT.some((e) => e !== 0n)) {
      const decryptedBalancePCT = this.decryptPCT(balancePCT);
      totalBalance += decryptedBalancePCT;
    }

    for (let i = 0; i < amountPCTs.length; i++) {
      const amountPCT = amountPCTs[i];
      const decryptedPCT = this.decryptPCT(amountPCT.pct);
      totalBalance += decryptedPCT;
    }

    if (totalBalance !== 0n) {
      const decryptedEGCT = this.curve.elGamalDecryption(privateKey, {
        c1: [eGCT.c1.x, eGCT.c1.y],
        c2: [eGCT.c2.x, eGCT.c2.y],
      });
      const expectedPoint = this.curve.mulWithScalar(
        this.curve.Base8,
        totalBalance,
      );

      if (
        decryptedEGCT[0] !== expectedPoint[0] ||
        decryptedEGCT[1] !== expectedPoint[1]
      ) {
        return -1n;
      }
    }

    return totalBalance;
  }

  /**
   * function to perform poseidon decryption on the pct
   * @param pct pct array
   * @returns decrypted
   */
  public decryptPCT(pct: bigint[]) {
    const privateKey = formatKeyForCurve(this.decryptionKey);

    const cipher = pct.slice(0, 4) as bigint[];
    const authKey = pct.slice(4, 6) as Point;
    const nonce = pct[6] as bigint;
    const length = 1;

    const [amount] = this.poseidon.processPoseidonDecryption({
      privateKey,
      authKey,
      cipher,
      nonce,
      length,
    });

    return amount;
  }

  /**
   * @dev function checks if user has been auditor before from contract event logs
   */
  async hasBeenAuditor(): Promise<boolean> {
    if (!this.wallet.account) return false;
    const auditorChangedEvent = {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "oldAuditor",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newAuditor",
          type: "address",
        },
      ],
      name: "AuditorChanged",
    };

    type NamedEvents = Log & {
      eventName: string;
      args: {
        oldAuditor: `0x${string}`;
        newAuditor: `0x${string}`;
      };
    };

    const currentBlock = await this.client.getBlockNumber();
    const BOUND = 1000n;

    // Fetch logs where the user was the oldAuditor
    const logs = (await this.client.getLogs({
      address: this.contractAddress,
      event: { ...auditorChangedEvent, type: "event" },
      fromBlock: currentBlock > BOUND ? currentBlock - BOUND : 0n,
      toBlock: currentBlock,
    })) as NamedEvents[];

    // filter that only has oldAuditor and newAuditor is the user address
    const filteredLogs = logs.filter(
      (
        log) =>
        log.args.oldAuditor.toLowerCase() ===
          this.wallet.account?.address.toLowerCase() ||
        log.args.newAuditor.toLowerCase() ===
          this.wallet.account?.address.toLowerCase(),
    );

    let currentStart = null;

    for (const log of filteredLogs) {
      const { oldAuditor, newAuditor } = log.args;

      if (
        newAuditor.toLowerCase() === this.wallet.account?.address.toLowerCase()
      ) {
        currentStart = log.blockNumber;
      } else if (
        oldAuditor.toLowerCase() ===
          this.wallet.account?.address.toLowerCase() &&
        currentStart !== null
      ) {
        return true;
      }
    }

    if (currentStart !== null) {
      return true;
    }

    return false;
  }

  /**
   * function to decrypt the transactions of the auditor
   * @returns decrypted transactions
   *
   * @TODO: hasBeenAuditor?
   */
  async auditorDecrypt(): Promise<DecryptedTransaction[]> {
    if (!this.decryptionKey) throw new Error("Missing decryption key!");
    if (!this.wallet.account) throw new Error("Missing wallet account!");
    const account = this.wallet.account;
    const isAuditor = await this.hasBeenAuditor();
    if (!isAuditor) {
      throw new Error("User is not an auditor");
    }

    type NamedEvents = Log & {
      eventName: string;
      args: { auditorPCT: bigint[] };
    };

    const result: (DecryptedTransaction & { blockNumber: bigint })[] = [];

    try {
      const currentBlock = await this.client.getBlockNumber();
      const BOUND = 1000n;

      logMessage("Fetching logs...");

      const logs: NamedEvents[] = [];
      for (const event of [
        PRIVATE_BURN_EVENT,
        PRIVATE_MINT_EVENT,
        PRIVATE_TRANSFER_EVENT,
      ]) {
        const fetchedLogs = (await this.client.getLogs({
          address: this.contractAddress,
          fromBlock: currentBlock > BOUND ? currentBlock - BOUND : 0n,
          toBlock: currentBlock,
          event: {
            ...event,
            type: "event",
          },
          args: {
            auditorAddress: account.address,
          },
        })) as NamedEvents[];

        logs.push(...fetchedLogs);
      }

      logMessage(`Fetched ${logs.length} logs from the contract`);

      for (const log of logs) {
        if (!log.transactionHash) continue;

        const tx = await this.client.getTransaction({
          hash: log.transactionHash,
        });

        const auditorPCT = log?.args?.auditorPCT as bigint[];
        if (!auditorPCT || auditorPCT?.length !== 7) continue;

        const decryptedAmount = this.decryptPCT(auditorPCT);
        const decodedInputs = decodeFunctionData({
          abi: this.encryptedErcAbi,
          data: tx.input,
        });

        result.push({
          transactionHash: log.transactionHash,
          amount: decryptedAmount.toString(),
          sender: tx.from,
          type: log.eventName.replace("Private", ""),
          receiver:
            decodedInputs?.functionName === "privateBurn"
              ? tx.to
              : (decodedInputs?.args?.[0] as `0x${string}`),
          blockNumber: tx.blockNumber,
        });
      }

      logMessage(`Transactions decrypted: ${result.length}`);

      // reverse the array to get the latest transactions first
      return result.sort(
        (a, b) => Number(b.blockNumber) - Number(a.blockNumber),
      ) as DecryptedTransaction[];
    } catch (e) {
      throw new Error(e as string);
    }
  }

  private convertTokenDecimals(
    amount: bigint,
    fromDecimals: number,
    toDecimals: number,
  ): bigint {
    try {
      if (fromDecimals === toDecimals) {
        return amount;
      }

      // decimal difference
      const diff = fromDecimals - toDecimals;

      let convertedAmount = 0n;
      if (diff > 0) {
        const scalingFactor = 10n ** BigInt(diff);
        convertedAmount = amount / scalingFactor;
      } else {
        const scalingFactor = 10n ** BigInt(Math.abs(diff));
        convertedAmount = amount * BigInt(scalingFactor);
      }

      return convertedAmount;
    } catch (e) {
      throw new Error(e as string);
    }
  }

  private async generateProof(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    input: any,
    operation: EERCOperation,
  ): Promise<eERC_Proof | IProof> {
    logMessage("Generating proof function");

    if (operation === "BURN" && !this.snarkjsMode) {
      throw new Error(
        "BURN operation is only available in snarkjsMode because of security reasons",
      );
    }

    if (this.snarkjsMode) {
      return this.generateSnarkjsProof(input, operation);
    }

    const extractedInputs = this.extractSnarkJsInputsToGnark(
      input,
      operation as EERCOperationGnark,
    );
    const proof = await this.proveFunc(
      JSON.stringify(extractedInputs),
      operation as EERCOperationGnark,
    );

    if (extractedInputs) {
      proof.publicInputs = extractedInputs.publicInputs;
    }

    return proof;
  }

  private async generateSnarkjsProof(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    input: any,
    operation: EERCOperation,
  ): Promise<eERC_Proof> {
    let wasm: string;
    let zkey: string;

    switch (operation) {
      case "REGISTER":
        wasm = this.circuitURLs.register.wasm;
        zkey = this.circuitURLs.register.zkey;
        break;
      case "MINT":
        wasm = this.circuitURLs.mint.wasm;
        zkey = this.circuitURLs.mint.zkey;
        break;
      case "WITHDRAW":
        wasm = this.circuitURLs.withdraw.wasm;
        zkey = this.circuitURLs.withdraw.zkey;
        break;
      case "TRANSFER":
        wasm = this.circuitURLs.transfer.wasm;
        zkey = this.circuitURLs.transfer.zkey;
        break;
      case "BURN":
        wasm = this.circuitURLs.burn.wasm;
        zkey = this.circuitURLs.burn.zkey;
        break;
      default:
        throw new Error("Invalid operation");
    }

    if (!wasm || !zkey) {
      throw new Error(
        `Missing ${!wasm ? "WASM" : "ZKey"} URL for ${operation} operation`,
      );
    }

    let wasmPath = "";
    let zkeyPath = "";

    // Check for Node.js environment
    const isBrowser =
      typeof window !== "undefined" && typeof window.document !== "undefined";
    const isNode = !isBrowser;

    if (isNode) {
      // Check if file exists locally
      const fs = await import("node:fs");
      if (fs.existsSync(wasm) && fs.existsSync(zkey)) {
        wasmPath = wasm;
        zkeyPath = zkey;
      }
    }

    if (!wasmPath || !zkeyPath) {
      const absoluteWasmURL = wasm.startsWith("/")
        ? new URL(wasm, import.meta.url)
        : new URL(wasm);

      const absoluteZkeyURL = zkey.startsWith("/")
        ? new URL(zkey, import.meta.url)
        : new URL(zkey);

      wasmPath = absoluteWasmURL.toString();
      zkeyPath = absoluteZkeyURL.toString();
    }

    // Convert all BigInts to strings for snarkjs
    const convertBigIntsToStrings = (obj: any): any => {
      if (typeof obj === 'bigint') {
        return obj.toString();
      } else if (Array.isArray(obj)) {
        return obj.map(convertBigIntsToStrings);
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = convertBigIntsToStrings(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const stringInput = convertBigIntsToStrings(input);

    const now = performance.now();
    const { proof: snarkProof, publicSignals } =
      await snarkjs.groth16.fullProve(stringInput, wasmPath, zkeyPath);

    const rawCalldata = JSON.parse(
      `[${await snarkjs.groth16.exportSolidityCallData(snarkProof, publicSignals)}]`,
    );

    const end = performance.now();
    logMessage(`Proof generation took ${(end - now).toFixed(2)}ms`);

    return {
      proofPoints: {
        a: rawCalldata[0],
        b: rawCalldata[1],
        c: rawCalldata[2],
      },
      publicSignals: rawCalldata[3],
    };
  }

  private extractSnarkJsInputsToGnark(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    input: any,
    operation: EERCOperationGnark,
  ) {
    switch (operation) {
      case "REGISTER":
        return {
          privateInputs: [String(input.SenderPrivateKey)],
          publicInputs: [
            ...input.SenderPublicKey.map(String),
            input.SenderAddress.toString(),
            input.ChainID.toString(),
            input.RegistrationHash.toString(),
          ],
        };
      case "MINT":
        return {
          privateInputs: [
            input.ReceiverVTTRandom,
            input.ReceiverPCTRandom,
            input.AuditorPCTRandom,
            input.ValueToMint,
          ].map(String),
          publicInputs: [
            ...input.ReceiverPublicKey.map(String),
            ...input.ReceiverVTTC1.map(String),
            ...input.ReceiverVTTC2.map(String),
            ...input.ReceiverPCT.map(String),
            ...input.ReceiverPCTAuthKey.map(String),
            input.ReceiverPCTNonce.toString(),
            ...input.AuditorPublicKey.map(String),
            ...input.AuditorPCT.map(String),
            ...input.AuditorPCTAuthKey.map(String),
            input.AuditorPCTNonce.toString(),
            input.ChainID.toString(),
            input.NullifierHash.toString(),
          ],
        };
      case "WITHDRAW":
        return {
          privateInputs: [
            String(input.SenderPrivateKey),
            String(input.SenderBalance),
            String(input.AuditorPCTRandom),
          ],
          publicInputs: [
            ...input.SenderPublicKey.map(String),
            ...input.SenderBalanceC1.map(String),
            ...input.SenderBalanceC2.map(String),
            ...input.AuditorPublicKey.map(String),
            ...input.AuditorPCT.map(String),
            ...input.AuditorPCTAuthKey.map(String),
            String(input.AuditorPCTNonce),
            String(input.ValueToWithdraw),
          ],
        };
      case "TRANSFER":
        return {
          privateInputs: [
            String(input.SenderPrivateKey),
            String(input.SenderBalance),
            String(input.ReceiverVTTRandom),
            String(input.ReceiverPCTRandom),
            String(input.AuditorPCTRandom),
            String(input.ValueToTransfer),
          ],
          publicInputs: [
            ...input.SenderPublicKey.map(String),
            ...input.SenderBalanceC1.map(String),
            ...input.SenderBalanceC2.map(String),
            ...input.SenderVTTC1.map(String),
            ...input.SenderVTTC2.map(String),
            ...input.ReceiverPublicKey.map(String),
            ...input.ReceiverVTTC1.map(String),
            ...input.ReceiverVTTC2.map(String),
            ...input.ReceiverPCT.map(String),
            ...input.ReceiverPCTAuthKey.map(String),
            String(input.ReceiverPCTNonce),
            ...input.AuditorPublicKey.map(String),
            ...input.AuditorPCT.map(String),
            ...input.AuditorPCTAuthKey.map(String),
            String(input.AuditorPCTNonce),
          ],
        };
    }
  }
}
