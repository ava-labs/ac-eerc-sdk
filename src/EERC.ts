import { type Log, decodeFunctionData, isAddress } from "viem";
import { type PublicClient, type WalletClient, erc20ABI } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { BSGS } from "./crypto/bsgs";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import { Poseidon } from "./crypto/poseidon";
import { Scalar } from "./crypto/scalar";
import type { AmountPCT, EGCT, Point } from "./crypto/types";
import { type IProof, logMessage } from "./helpers";
import type {
  DecryptedTransaction,
  IProveFunction,
  OperationResult,
} from "./hooks/types";
import {
  ENCRYPTED_ERC_ABI,
  MESSAGES,
  REGISTRAR_ABI,
  SNARK_FIELD_SIZE,
} from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;

  // crypto
  public curve: BabyJub;
  public field: FF;
  public poseidon: Poseidon;
  public bsgs: BSGS;

  // contract field
  public contractAddress: `0x${string}`;
  public isConverter: boolean;
  public encryptedErcAbi = ENCRYPTED_ERC_ABI;

  public registrarAddress: `0x${string}`;
  public registrarAbi = REGISTRAR_ABI;

  // user field
  private decryptionKey: string;
  public publicKey: bigint[] = [];

  // prove func
  public proveFunc: (
    data: string,
    proofType: "REGISTER" | "MINT" | "WITHDRAW" | "TRANSFER",
  ) => Promise<IProof>;

  // burn user is used for private burn transactions
  // instead of burning tokens, they are transferred to the burn user
  public BURN_USER = {
    address: "0x1111111111111111111111111111111111111111",
    publicKey: [0n, 1n],
  };

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
    registrarAddress: `0x${string}`,
    isConverter: boolean,
    lookupTableUrl: string,
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
    this.bsgs = new BSGS(lookupTableUrl, this.curve);

    if (this.decryptionKey) {
      const formatted = formatKeyForCurve(this.decryptionKey);
      this.publicKey = this.curve.generatePublicKey(formatted);
    }
  }

  async init() {
    try {
      await this.bsgs.initialize();
      logMessage("EERC initialized successfully!");
    } catch (e) {
      throw new Error(e as string);
    }
  }

  public async setContractAuditorPublicKey(address: `0x${string}`) {
    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress,
      functionName: "setAuditorPublicKey",
      args: [address],
    });

    return { transactionHash };
  }

  public get isDecryptionKeySet() {
    return !!this.decryptionKey;
  }

  public async generateDecryptionKey() {
    if (!this.wallet || !this.client) {
      throw new Error("Missing wallet or client!");
    }

    try {
      const message = MESSAGES.REGISTER(
        this.wallet.account.address,
        this.client.chain.id,
      );

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

  // function to register a new user to the contract
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

      const input = {
        privateInputs: [String(formatted)],
        publicInputs: publicKey.map(String),
      };

      const check = async () => {
        const publicKey = await this.fetchPublicKey(
          this.wallet.account.address,
        );

        if (publicKey[0] !== 0n && publicKey[1] !== 0n) return true;
        return false;
      };

      const isRegistered = await check();

      if (isRegistered) {
        // if user already registered return the key
        this.decryptionKey = key;
        this.publicKey = publicKey;
        return {
          key,
          transactionHash: "",
        };
      }

      // generate proof for the transaction
      const { proof, publicInputs } = await this.proveFunc(
        JSON.stringify(input),
        "REGISTER",
      );

      logMessage("Sending transaction");
      const transactionHash = await this.wallet.writeContract({
        abi: this.registrarAbi,
        address: this.registrarAddress,
        functionName: "register",
        args: [proof, publicInputs],
      });

      this.decryptionKey = key;
      this.publicKey = publicKey;

      // returns proof for the transaction
      return { key, transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // function to mint private tokens for a user (ONLY FOR STANDALONE VERSION)
  // totalMintAmount is a bigint with last 2 decimal places as fractional and
  // others as whole number e.g.
  //      11000 = 110.00
  //        400 = 4.00
  //         50 = 0.50
  async privateMint(
    recipient: `0x${string}`,
    mintAmount: bigint,
    auditorPublicKey: Point,
  ): Promise<OperationResult> {
    if (this.isConverter) throw new Error("Not allowed for converter!");
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

  // function for burning encrypted tokens privately
  // private burn is equals to private transfer to the burn user (ONLY FOR STANDALONE VERSION)
  async privateBurn(
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
  ) {
    if (this.isConverter) throw new Error("Not allowed for converter!");
    logMessage("Burning encrypted tokens");

    const { proof, senderBalancePCT, publicInputs } =
      await this.generateTransferProof(
        this.BURN_USER.address,
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

  async transfer(
    to: string,
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
    tokenId = 0n,
  ): Promise<OperationResult> {
    logMessage("Transferring encrypted tokens");
    const { proof, publicInputs, senderBalancePCT } =
      await this.generateTransferProof(
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

    return { transactionHash };
  }

  async transferToken(
    to: string,
    totalAmount: bigint,
    auditorPublicKey: bigint[],
    tokenAddress: string,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
  ): Promise<OperationResult> {
    try {
      const tokenId = await this.tokenId(tokenAddress as string);

      const result = await this.transfer(
        to,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        tokenId,
      );

      return result;
    } catch (e) {
      throw new Error(e as string);
    }
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

    logMessage("Sending transaction");
    const transactionHash = await this.wallet.writeContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "deposit",
      args: [amount, tokenAddress],
    });

    return { transactionHash };
  }

  // function to deposit tokens to the contract
  async withdraw(
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint[],
    tokenAddress: string,
  ): Promise<OperationResult> {
    // only work if eerc is converter
    if (!this.isConverter) throw new Error("Not allowed for stand alone!");

    if (amount <= 0n) throw new Error("Invalid amount!");
    if (!encryptedBalance.length || decryptedBalance.length !== 2)
      throw new Error("Invalid balance!");

    try {
      logMessage("Withdrawing tokens from the contract");
      const tokenId = await this.tokenId(tokenAddress);

      const privateKey = formatKeyForCurve(this.decryptionKey);
      const [withdrawWhole, withdrawFractional] = Scalar.recalculate(amount);
      const senderTotalBalance = Scalar.calculate(
        decryptedBalance[0] as bigint,
        decryptedBalance[1] as bigint,
      );

      if (amount > senderTotalBalance) throw new Error("Insufficient balance!");

      const [toBeSubtracted, toBeAdded] = Scalar.decide(
        decryptedBalance?.[0] as bigint,
        decryptedBalance?.[1] as bigint,
        withdrawWhole,
        withdrawFractional,
      );

      const senderNewBalance = senderTotalBalance - amount;
      const [newWhole, newFractional] = Scalar.recalculate(senderNewBalance);

      const toBeSubtractedEncrypted = await this.curve.encryptArray(
        toBeSubtracted,
        this.publicKey as Point,
      );
      const toBeAddedEncrypted = await this.curve.encryptArray(
        toBeAdded,
        this.publicKey as Point,
      );

      const input = {
        obd: decryptedBalance[0]?.toString(),
        obf: decryptedBalance[1]?.toString(),
        old_balance_tot: senderTotalBalance.toString(),
        new_balance_dec: newWhole.toString(),
        new_balance_float: newFractional.toString(),
        ad: withdrawWhole.toString(),
        af: withdrawFractional.toString(),
        a1_dec: (toBeSubtracted[0] as bigint).toString(),
        a1_float: (toBeSubtracted[1] as bigint).toString(),
        a2_dec: (toBeAdded[0] as bigint).toString(),
        a2_float: (toBeAdded[1] as bigint).toString(),
        sender_sk: privateKey.toString(),
        sender_pk: this.publicKey.map(String),
        obd_c1: [encryptedBalance[0], encryptedBalance[1]].map(String),
        obd_c2: [encryptedBalance[2], encryptedBalance[3]].map(String),

        obf_c1: [encryptedBalance[4], encryptedBalance[5]].map(String),
        obf_c2: [encryptedBalance[6], encryptedBalance[7]].map(String),

        a1_dec_c1: toBeSubtractedEncrypted.cipher[0]?.c1.map(String),
        a1_dec_c2: toBeSubtractedEncrypted.cipher[0]?.c2.map(String),
        a1_float_c1: toBeSubtractedEncrypted.cipher[1]?.c1.map(String),
        a1_float_c2: toBeSubtractedEncrypted.cipher[1]?.c2.map(String),

        a2_dec_c1: toBeAddedEncrypted.cipher[0]?.c1.map(String),
        a2_dec_c2: toBeAddedEncrypted.cipher[0]?.c2.map(String),
        a2_float_c1: toBeAddedEncrypted.cipher[1]?.c1.map(String),
        a2_float_c2: toBeAddedEncrypted.cipher[1]?.c2.map(String),
      };

      const proof = await this.proveFunc(JSON.stringify(input), "WITHDRAW");
      console.log(proof);

      logMessage("Sending transaction");
      const transactionHash = await this.wallet.writeContract({
        abi: this.encryptedErcAbi,
        address: this.contractAddress,
        functionName: "withdraw",
        args: [
          this.wallet.account.address,
          // {
          //   a: proof.a,
          //   b: proof.b,
          //   c: proof.c,
          //   inputs: proof.inputs,
          // },
          tokenId,
        ],
      });

      return { transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // generating transfer proof for private burn and transfer
  async generateTransferProof(
    to: string,
    amount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint,
    auditorPublicKey: bigint[],
  ): Promise<IProof & { senderBalancePCT: string[] }> {
    try {
      if (!isAddress(to)) throw new Error("Invalid receiver address!");
      const privateKey = formatKeyForCurve(this.decryptionKey);
      const receiverPublicKey = await this.fetchPublicKey(to);
      const senderNewBalance = decryptedBalance - amount;
      if (senderNewBalance < 0n) throw new Error("Insufficient balance!");

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

      return {
        proof,
        publicInputs,
        senderBalancePCT: [
          ...senderCipherText,
          ...senderAuthKey,
          senderPoseidonNonce,
        ].map(String),
      };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // fetches the user public key from the contract
  async fetchPublicKey(to: string): Promise<Point> {
    if (to === this.BURN_USER.address) {
      return this.BURN_USER.publicKey as Point;
    }

    const publicKey = (await this.client.readContract({
      address: this.registrarAddress as `0x${string}`,
      abi: this.registrarAbi,
      functionName: "getUserPublicKey",
      args: [to],
    })) as Point;

    return publicKey as Point;
  }

  // fetches users approval from erc20 token
  async fetchUserApprove(userAddress: string, tokenAddress: string) {
    const data = await this.client.readContract({
      abi: erc20ABI,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [userAddress as `0x${string}`, this.contractAddress],
    });

    return data;
  }

  // returns the token id from token address
  async tokenId(tokenAddress: string) {
    const data = await this.client.readContract({
      abi: this.encryptedErcAbi,
      address: this.contractAddress as `0x${string}`,
      functionName: "tokenIds",
      args: [tokenAddress as `0x${string}`],
    });

    return data as bigint;
  }

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
        c1: [eGCT.c1.X, eGCT.c1.Y],
        c2: [eGCT.c2.X, eGCT.c2.Y],
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

  decryptPCT(pct: bigint[]) {
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

  // decrypts the PCT of the transactions
  // only the auditor can decrypt the pct and get the details of the transaction
  async auditorDecrypt(): Promise<DecryptedTransaction[]> {
    if (!this.decryptionKey) throw new Error("Missing decryption key!");
    const privateKey = formatKeyForCurve(this.decryptionKey);

    const currentAuditor = await this.client.readContract({
      address: this.contractAddress,
      abi: this.encryptedErcAbi,
      functionName: "auditor",
      args: [],
    });

    if (
      (currentAuditor as `0x${string}`).toLowerCase() !==
      this.wallet.account.address.toLowerCase()
    ) {
      throw new Error("Only the auditor can decrypt the transactions");
    }

    const auditorChangeEvent = {
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
      args: { auditorPCT: bigint[] };
    };

    const result: DecryptedTransaction[] = [];

    try {
      const currentBlock = await this.client.getBlockNumber();

      const startBlockNumber = (
        await this.client.getLogs({
          address: this.contractAddress,
          event: { ...auditorChangeEvent, type: "event" },
          fromBlock: "earliest",
          toBlock: "latest",
          args: {
            newAuditor: this.wallet.account.address,
          },
        })
      )[0].blockNumber;

      logMessage("Fetching logs...");
      const events = ENCRYPTED_ERC_ABI.filter(
        (element) => element.type === "event",
      );

      // get last 50 blocks logs
      const logs = (await this.client.getLogs({
        address: this.contractAddress,
        fromBlock: startBlockNumber,
        toBlock: currentBlock,
        events,
      })) as NamedEvents[];

      logMessage(`Fetched ${logs.length} logs from the contract`);

      for (const log of logs) {
        if (!log.transactionHash) return [];
        const tx = await this.client.getTransaction({
          hash: log.transactionHash,
        });

        const pct = log?.args?.auditorPCT as bigint[];
        if (!pct || pct?.length !== 7) continue;

        const cipher = pct.slice(0, 4) as bigint[];
        const authKey = pct.slice(-3, -1) as Point;
        const nonce = pct[pct.length - 1] as bigint;
        const length = 2; // decrypted length

        const [whole, fractional] = this.poseidon.processPoseidonDecryption({
          privateKey,
          authKey,
          cipher,
          nonce,
          length,
        });

        const decoded = decodeFunctionData({
          abi: ENCRYPTED_ERC_ABI,
          data: tx.input as `0x${string}`,
        });

        const amount = Scalar.calculate(whole as bigint, fractional as bigint);

        result.push({
          transactionHash: log.transactionHash,
          amount: Scalar.parseEERCBalance(amount),
          sender: tx.from,
          type:
            decoded?.functionName === "privateMint"
              ? "Mint"
              : decoded?.functionName === "privateBurn"
                ? "Burn"
                : "Transfer",
          receiver:
            decoded?.functionName === "transfer"
              ? (decoded?.args?.[0] as `0x${string}`) ?? null
              : decoded?.functionName === "privateMint"
                ? (decoded?.args?.[0] as `0x${string}`) ?? null
                : null,
        });
      }

      logMessage(`Transactions decrypted: ${result.length}`);

      // reverse the array to get the latest transactions first
      return result.reverse();
    } catch (e) {
      throw new Error(e as string);
    }
  }
}
