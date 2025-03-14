import { poseidon3, poseidon5 } from "poseidon-lite";
import { type Log, decodeFunctionData, isAddress } from "viem";
import { type PublicClient, type WalletClient, erc20ABI } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import { Poseidon } from "./crypto/poseidon";
import type { AmountPCT, EGCT, Point } from "./crypto/types";
import { type IProof, logMessage } from "./helpers";
import type {
  DecryptedTransaction,
  IProveFunction,
  OperationResult,
} from "./hooks/types";
import {
  BURN_USER,
  ENCRYPTED_ERC_ABI,
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

  public registrarAddress: `0x${string}`;
  public registrarAbi = REGISTRAR_ABI;

  private decryptionKey: string;
  public publicKey: bigint[] = [];

  // prove function
  public proveFunc: (
    data: string,
    proofType: "REGISTER" | "MINT" | "WITHDRAW" | "TRANSFER",
  ) => Promise<IProof>;

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
    registrarAddress: `0x${string}`,
    isConverter: boolean,
    proveFunc: IProveFunction,
    decryptionKey?: string,
  ) {
    this.client = client;
    this.wallet = wallet;
    this.contractAddress = contractAddress;
    this.registrarAddress = registrarAddress;
    this.isConverter = isConverter;
    this.proveFunc = proveFunc;

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
    try {
      return await this.wallet.writeContract({
        abi: this.encryptedErcAbi,
        address: this.contractAddress,
        functionName: "setAuditorPublicKey",
        args: [address],
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
    if (!this.wallet || !this.client) {
      this.throwError("Missing wallet or client!");
    }

    try {
      const message = MESSAGES.REGISTER(this.wallet.account.address);

      // deriving the decryption key from the user signature
      const signature = await this.wallet.signMessage({ message });
      const key = getPrivateKeyFromSignature(signature);

      this.decryptionKey = key;

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
    if (!this.wallet || !this.client || !this.contractAddress)
      throw new Error("Missing client, wallet or contract address!");

    try {
      logMessage("Registering user to the contract");

      // message to sign
      const key = await this.generateDecryptionKey();
      const formatted = formatKeyForCurve(key);
      const publicKey = this.curve.generatePublicKey(formatted);

      // get chain id
      const chainId = await this.client.getChainId();
      // get full address
      const fullAddress = BigInt(this.wallet.account.address);
      // construct registration hash
      const registrationHash = poseidon3([chainId, formatted, fullAddress]);

      const input = {
        privateInputs: [String(formatted)],
        publicInputs: [
          ...publicKey.map(String),
          fullAddress.toString(),
          chainId.toString(),
          registrationHash.toString(),
        ],
      };

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

      // generate proof for the transaction
      const { proof } = await this.proveFunc(JSON.stringify(input), "REGISTER");

      logMessage("Sending transaction");
      const transactionHash = await this.wallet.writeContract({
        abi: this.registrarAbi,
        address: this.registrarAddress,
        functionName: "register",
        args: [proof, input.publicInputs],
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

    const publicInputs = [
      ...receiverPublicKey,
      ...encryptedAmount.c1,
      ...encryptedAmount.c2,
      ...receiverCiphertext,
      ...receiverAuthKey,
      receiverPoseidonNonce,
      ...auditorPublicKey,
      ...auditorCiphertext,
      ...auditorAuthKey,
      auditorPoseidonNonce,
      chainId,
      nullifier,
    ].map(String);

    const privateInputs = [
      encryptedAmountRandom,
      receiverEncryptionRandom,
      auditorEncryptionRandom,
      mintAmount,
    ].map(String);

    const { proof } = await this.proveFunc(
      JSON.stringify({ privateInputs, publicInputs }),
      "MINT",
    );

    // write the transaction to the contract
    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress,
      functionName: "privateMint",
      args: [recipient, proof, publicInputs],
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
    this.validateAmount(amount, decryptedBalance);
    logMessage("Burning encrypted tokens");

    const { proof, senderBalancePCT, publicInputs } =
      await this.generateTransferProof(
        BURN_USER.address,
        amount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
      );

    logMessage("Sending transaction");

    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress,
      functionName: "privateBurn",
      args: [proof, publicInputs, senderBalancePCT],
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

    let tokenId = 0n;
    if (tokenAddress) {
      tokenId = await this.fetchTokenId(tokenAddress);
    }

    logMessage("Transferring encrypted tokens");
    const {
      proof,
      publicInputs,
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
      abi: this.encryptedErcAbi,
      address: this.contractAddress,
      functionName: "transfer",
      args: [to, tokenId, proof, publicInputs, senderBalancePCT],
    });

    return { transactionHash, receiverEncryptedAmount, senderEncryptedAmount };
  }

  // function to deposit tokens to the contract
  async deposit(amount: bigint, tokenAddress: string) {
    if (!this.isConverter) throw new Error("Not allowed for stand alone!");

    logMessage("Depositing tokens to the contract");
    // check if the user has enough approve amount
    const approveAmount = await this.fetchUserApprove(
      this.wallet.account.address,
      tokenAddress,
    );

    if (approveAmount < amount) {
      throw new Error("Insufficient approval amount!");
    }

    // user creates new balance pct for the deposit amount
    const { cipher, nonce, authKey } =
      await this.poseidon.processPoseidonEncryption({
        inputs: [amount],
        publicKey: this.publicKey as Point,
      });

    logMessage("Sending transaction");
    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "deposit",
      args: [amount, tokenAddress, [...cipher, ...authKey, nonce]],
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

      const publicInputs = [
        ...this.publicKey,
        ...encryptedBalance,
        ...auditorPublicKey,
        ...auditorCipherText,
        ...auditorAuthKey,
        auditorPoseidonNonce,
        amount,
      ].map(String);

      const privateInputs = [
        privateKey,
        decryptedBalance,
        auditorEncryptionRandom,
      ].map(String);

      const userBalancePCT = [
        ...senderCipherText,
        ...senderAuthKey,
        senderPoseidonNonce,
      ].map(String);

      const { proof } = await this.proveFunc(
        JSON.stringify({ privateInputs, publicInputs }),
        "WITHDRAW",
      );

      const transactionHash = await this.wallet.writeContract({
        abi: this.encryptedErcAbi,
        address: this.contractAddress as `0x${string}`,
        functionName: "withdraw",
        args: [amount, tokenId, proof, publicInputs, userBalancePCT],
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
  ): Promise<
    IProof & {
      publicInputs: string[];
      senderBalancePCT: string[];
      receiverEncryptedAmount: string[];
      senderEncryptedAmount: string[];
    }
  > {
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

      const publicInputs = [
        ...this.publicKey,
        ...encryptedBalance,
        ...encryptedAmountSender.c1,
        ...encryptedAmountSender.c2,
        ...receiverPublicKey,
        ...encryptedAmountReceiver.c1,
        ...encryptedAmountReceiver.c2,
        ...receiverCipherText,
        ...receiverAuthKey,
        receiverPoseidonNonce,
        ...auditorPublicKey,
        ...auditorCipherText,
        ...auditorAuthKey,
        auditorPoseidonNonce,
      ].map(String);

      const privateInputs = [
        privateKey,
        decryptedBalance,
        encryptedAmountReceiverRandom,
        receiverEncryptionRandom,
        auditorEncryptionRandom,
        amount,
      ].map(String);

      const { proof } = await this.proveFunc(
        JSON.stringify({ privateInputs, publicInputs }),
        "TRANSFER",
      );

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
        publicInputs,
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
      abi: erc20ABI,
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
      (log) =>
        log.args.oldAuditor.toLowerCase() ===
          this.wallet.account.address.toLowerCase() ||
        log.args.newAuditor.toLowerCase() ===
          this.wallet.account.address.toLowerCase(),
    );

    let currentStart = null;

    for (const log of filteredLogs) {
      const { oldAuditor, newAuditor } = log.args;

      if (
        newAuditor.toLowerCase() === this.wallet.account.address.toLowerCase()
      ) {
        currentStart = log.blockNumber;
      } else if (
        oldAuditor.toLowerCase() ===
          this.wallet.account.address.toLowerCase() &&
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
            auditorAddress: this.wallet.account.address,
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
}
