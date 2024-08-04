import { isAddress } from "ethers";
import type { Log } from "viem";
import { type PublicClient, type WalletClient, erc20ABI } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { BSGS } from "./crypto/bsgs";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import { Poseidon } from "./crypto/poseidon";
import { Scalar } from "./crypto/scalar";
import type { Point } from "./crypto/types";
import { ProofGenerator } from "./helpers";
import { ProofType } from "./helpers/types";
import type { EncryptedBalance } from "./hooks/types";
import {
  ERC34_ABI,
  LOOKUP_TABLE_URL,
  MESSAGES,
  SNARK_FIELD_SIZE,
} from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;

  public curve: BabyJub;
  public field: FF;
  public poseidon: Poseidon;
  public bsgs: BSGS;

  public proofGenerator: ProofGenerator;

  // contract field
  public contractAddress: `0x${string}`;
  public isConverter: boolean;
  public abi = ERC34_ABI;

  // burn user is used for private burn transactions
  // instead of burning tokens, they are transferred to the burn user
  public BURN_USER = {
    address: "0x1111111111111111111111111111111111111111",
    publicKey: [0n, 1n],
  };

  // user field
  private decryptionKey: string;
  public publicKey: bigint[] = [];

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
    isConverter: boolean,
    decryptionKey?: string,
  ) {
    this.client = client;
    this.wallet = wallet;
    this.contractAddress = contractAddress;
    this.isConverter = isConverter;

    this.field = new FF(SNARK_FIELD_SIZE);
    this.curve = new BabyJub(this.field);
    this.poseidon = new Poseidon(this.field, this.curve);
    this.proofGenerator = new ProofGenerator();
    this.decryptionKey = decryptionKey || "";
    this.bsgs = new BSGS(LOOKUP_TABLE_URL, this.curve);

    if (this.decryptionKey) {
      const formatted = formatKeyForCurve(this.decryptionKey);
      this.publicKey = this.curve.generatePublicKey(formatted);
    }
  }

  async init() {
    await this.bsgs.initialize();
  }

  // function to register a new user to the contract
  async register(): Promise<{
    key: string;
    error: string;
    transactionHash: string;
  }> {
    if (!this.wallet || !this.client || !this.contractAddress)
      throw new Error("Missing client, wallet or contract address!");

    try {
      // message to sign
      const message = MESSAGES.REGISTER(
        this.wallet.account.address,
        this.contractAddress,
      );

      const signature = await this.wallet.signMessage({ message });
      const key = getPrivateKeyFromSignature(signature);
      const formatted = formatKeyForCurve(key);
      const publicKey = this.curve.generatePublicKey(formatted);

      const input = {
        sk: String(formatted),
        pk: publicKey.map(String),
      };

      // proof generated for the transaction
      const proof = await this.proofGenerator.generateProof(
        ProofType.REGISTER,
        input,
      );

      const check = async () => {
        const data = (await this.client.readContract({
          address: this.contractAddress,
          abi: this.abi,
          functionName: "getUser",
          args: [this.wallet.account.address],
        })) as { x: bigint; y: bigint };

        if (data.x !== 0n || data.y !== 0n) return true;
        return false;
      };

      const isRegistered = await check();
      if (isRegistered) {
        this.decryptionKey = key;
        this.publicKey = publicKey;
        return {
          key,
          error: "User already registered!",
          transactionHash: "",
        };
      }

      const transactionHash = await this.wallet.writeContract({
        abi: this.abi,
        address: this.contractAddress,
        functionName: "register",
        args: [{ a: proof.a, b: proof.b, c: proof.c, inputs: proof.input }],
      });

      this.decryptionKey = key;
      this.publicKey = publicKey;

      // returns proof for the transaction
      return { key, error: "", transactionHash };
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
    totalMintAmount: bigint,
    auditorPublicKey: Point,
  ): Promise<{ transactionHash: string }> {
    if (this.isConverter) throw new Error("Not allowed for converter!");
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    const privateKey = formatKeyForCurve(this.decryptionKey);

    // encrypt the total mint amount
    const { whole: wholeEncrypted, fractional: fractionalEncrypted } =
      await this.curve.encryptAmount(totalMintAmount, this.publicKey as Point);

    const { cipher, nonce, encryptionKey, encryptionRandom, authKey } =
      await this.poseidon.processPoseidonEncryption({
        inputs: [
          wholeEncrypted.originalValue,
          fractionalEncrypted.originalValue,
        ],
        publicKey: auditorPublicKey as Point,
      });

    const input = {
      sk: privateKey.toString(),
      pk: this.publicKey.map(String),
      MintAmountWhole: wholeEncrypted.originalValue.toString(),
      MintAmountFraction: fractionalEncrypted.originalValue.toString(),
      MintAmountWholeC1: wholeEncrypted.cipher.c1.map(String),
      MintAmountWholeC2: wholeEncrypted.cipher.c2.map(String),
      MintAmountFractionC1: fractionalEncrypted.cipher.c1.map(String),
      MintAmountFractionC2: fractionalEncrypted.cipher.c2.map(String),
      auditorPubKey: auditorPublicKey.map(String),
      auditorSharedKey: authKey.map(String),
      auditorCiphertextNonce: nonce.toString(),
      auditCiphertext: cipher.map(String),
      auditorEncKey: encryptionKey.map(String),
      auditorEncKeyRandom: encryptionRandom.toString(),
    };

    const proof = await this.proofGenerator.generateProof(
      ProofType.MINT,
      input,
    );

    // write the transaction to the contract
    const transactionHash = await this.wallet.writeContract({
      abi: this.abi,
      address: this.contractAddress,
      functionName: "privateMint",
      args: [
        this.wallet.account.address,
        {
          a: proof.a,
          b: proof.b,
          c: proof.c,
          inputs: proof.input,
        },
      ],
    });

    return { transactionHash };
  }

  // function for burning encrypted tokens privately
  // private burn is equals to private transfer to the burn user (ONLY FOR STANDALONE VERSION)
  async privateBurn(
    totalAmount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint[],
    auditorPublicKey: bigint[],
  ) {
    if (this.isConverter) throw new Error("Not allowed for converter!");
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    const proof = await this.generateTransferProof(
      this.BURN_USER.address,
      totalAmount,
      encryptedBalance,
      decryptedBalance,
      auditorPublicKey,
    );

    const transactionHash = await this.wallet.writeContract({
      abi: this.abi,
      address: this.contractAddress,
      functionName: "privateBurn",
      args: [{ a: proof.a, b: proof.b, c: proof.c, inputs: proof.input }],
    });

    return { transactionHash };
  }

  async transfer(
    to: string,
    totalAmount: bigint,
    encryptedBalance: bigint[],
    decryptedBalance: bigint[],
    auditorPublicKey: bigint[],
    tokenId = 0n,
  ) {
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    const proof = await this.generateTransferProof(
      to,
      totalAmount,
      encryptedBalance,
      decryptedBalance,
      auditorPublicKey,
    );

    const transactionHash = await this.wallet.writeContract({
      abi: this.abi,
      address: this.contractAddress,
      functionName: "transfer",
      args: [
        to,
        { a: proof.a, b: proof.b, c: proof.c, inputs: proof.input },
        tokenId,
      ],
    });

    return { transactionHash };
  }

  async transferToken(
    to: string,
    totalAmount: bigint,
    auditorPublicKey: bigint[],
    tokenAddress: string,
    encryptedBalance: bigint[],
    decryptedBalance: bigint[],
  ) {
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    try {
      const tokenId = await this.tokenId(tokenAddress as string);

      const transactionHash = await this.transfer(
        to,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        tokenId,
      );

      return { transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // function to deposit tokens to the contract
  async deposit(amount: bigint, tokenAddress: string) {
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    // check if the user has enough approve amount
    const approveAmount = await this.fetchUserApprove(
      this.wallet.account.address,
      tokenAddress,
    );

    if (approveAmount < amount) {
      throw new Error("Insufficient approval amount!");
    }

    const transactionHash = await this.wallet.writeContract({
      abi: this.abi,
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
  ): Promise<{ transactionHash: string }> {
    if (
      !this.wallet ||
      !this.client ||
      !this.contractAddress ||
      !this.decryptionKey
    )
      throw new Error(
        "Missing client, wallet, contract address or decryption key!",
      );

    try {
      const tokenId = await this.tokenId(tokenAddress);

      const privateKey = formatKeyForCurve(this.decryptionKey);
      const [withdrawWhole, withdrawFractional] = Scalar.recalculate(amount);
      const senderTotalBalance = Scalar.calculate(
        decryptedBalance[0],
        decryptedBalance[1],
      );

      if (amount > senderTotalBalance) throw new Error("Insufficient balance!");

      const [toBeSubtracted, toBeAdded] = Scalar.decide(
        decryptedBalance[0],
        decryptedBalance[1],
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
        obd: decryptedBalance[0].toString(),
        obf: decryptedBalance[1].toString(),
        old_balance_tot: senderTotalBalance.toString(),
        new_balance_dec: newWhole.toString(),
        new_balance_float: newFractional.toString(),
        ad: withdrawWhole.toString(),
        af: withdrawFractional.toString(),
        a1_dec: toBeSubtracted[0].toString(),
        a1_float: toBeSubtracted[1].toString(),
        a2_dec: toBeAdded[0].toString(),
        a2_float: toBeAdded[1].toString(),
        sender_sk: privateKey.toString(),
        sender_pk: this.publicKey.map(String),
        obd_c1: [encryptedBalance[0], encryptedBalance[1]].map(String),
        obd_c2: [encryptedBalance[2], encryptedBalance[3]].map(String),

        obf_c1: [encryptedBalance[4], encryptedBalance[5]].map(String),
        obf_c2: [encryptedBalance[6], encryptedBalance[7]].map(String),

        a1_dec_c1: toBeSubtractedEncrypted.cipher[0].c1.map(String),
        a1_dec_c2: toBeSubtractedEncrypted.cipher[0].c2.map(String),
        a1_float_c1: toBeSubtractedEncrypted.cipher[1].c1.map(String),
        a1_float_c2: toBeSubtractedEncrypted.cipher[1].c2.map(String),

        a2_dec_c1: toBeAddedEncrypted.cipher[0].c1.map(String),
        a2_dec_c2: toBeAddedEncrypted.cipher[0].c2.map(String),
        a2_float_c1: toBeAddedEncrypted.cipher[1].c1.map(String),
        a2_float_c2: toBeAddedEncrypted.cipher[1].c2.map(String),
      };

      const proof = await this.proofGenerator.generateProof(
        ProofType.BURN,
        input,
      );

      const transactionHash = await this.wallet.writeContract({
        abi: this.abi,
        address: this.contractAddress,
        functionName: "withdraw",
        args: [
          this.wallet.account.address,
          {
            a: proof.a,
            b: proof.b,
            c: proof.c,
            inputs: proof.input,
          },
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
    decryptedBalance: bigint[],
    auditorPublicKey: bigint[],
  ) {
    try {
      if (!isAddress(to)) throw new Error("Invalid receiver address!");
      const privateKey = formatKeyForCurve(this.decryptionKey);

      const receiverPublicKey = await this.fetchPublicKey(to);
      const [transferWhole, transferFractional] = Scalar.recalculate(amount);

      const senderTotalBalance = Scalar.calculate(
        decryptedBalance[0],
        decryptedBalance[1],
      );

      if (amount > senderTotalBalance) throw new Error("Insufficient balance!");
      const [toBeSubtracted, toBeAdded] = Scalar.decide(
        decryptedBalance[0],
        decryptedBalance[1],
        transferWhole,
        transferFractional,
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

      // encrypts for receiver
      const { whole: wholeReceiver, fractional: fractionalReceiver } =
        await this.curve.encryptAmount(amount, receiverPublicKey);

      const { cipher, nonce, encryptionKey, encryptionRandom, authKey } =
        await this.poseidon.processPoseidonEncryption({
          inputs: [transferWhole, transferFractional],
          publicKey: auditorPublicKey as Point,
        });

      const input = {
        obd: decryptedBalance[0].toString(),
        obf: decryptedBalance[1].toString(),
        old_balance_tot: senderTotalBalance.toString(),
        new_balance_dec: newWhole.toString(),
        new_balance_float: newFractional.toString(),
        ad: transferWhole.toString(),
        af: transferFractional.toString(),
        a1_dec: toBeSubtracted[0].toString(),
        a1_float: toBeSubtracted[1].toString(),
        a2_dec: toBeAdded[0].toString(),
        a2_float: toBeAdded[1].toString(),
        sender_sk: privateKey.toString(),
        sender_pk: this.publicKey.map(String),
        obd_c1: [encryptedBalance[0], encryptedBalance[1]].map(String),
        obd_c2: [encryptedBalance[2], encryptedBalance[3]].map(String),
        obf_c1: [encryptedBalance[4], encryptedBalance[5]].map(String),
        obf_c2: [encryptedBalance[6], encryptedBalance[7]].map(String),

        a1_dec_c1: toBeSubtractedEncrypted.cipher[0].c1.map(String),
        a1_dec_c2: toBeSubtractedEncrypted.cipher[0].c2.map(String),
        a1_float_c1: toBeSubtractedEncrypted.cipher[1].c1.map(String),
        a1_float_c2: toBeSubtractedEncrypted.cipher[1].c2.map(String),

        a2_dec_c1: toBeAddedEncrypted.cipher[0].c1.map(String),
        a2_dec_c2: toBeAddedEncrypted.cipher[0].c2.map(String),
        a2_float_c1: toBeAddedEncrypted.cipher[1].c1.map(String),
        a2_float_c2: toBeAddedEncrypted.cipher[1].c2.map(String),

        receiver_pk: receiverPublicKey.map(String),
        recv_elgamal_random: [
          wholeReceiver.random,
          fractionalReceiver.random,
        ].map(String),
        receiver_amount_dec_c1: wholeReceiver.cipher.c1.map(String),
        receiver_amount_dec_c2: wholeReceiver.cipher.c2.map(String),
        receiver_amount_float_c1: fractionalReceiver.cipher.c1.map(String),
        receiver_amount_float_c2: fractionalReceiver.cipher.c2.map(String),
        auditorSharedKey: authKey.map(String),
        auditorEncKeyRandom: encryptionRandom.toString(),
        auditorPubKey: auditorPublicKey.map(String),
        auditorCiphertextNonce: nonce.toString(),
        auditCiphertext: cipher.map(String),
        auditorEncKey: encryptionKey.map(String),
      };

      const proof = await this.proofGenerator.generateProof(
        ProofType.TRANSFER,
        input,
      );

      return proof;
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // fetches the user public key from the contract
  async fetchPublicKey(to: string): Promise<Point> {
    if (!this.wallet || !this.client || !this.contractAddress)
      throw new Error("Missing client, wallet or contract address!");

    if (to === this.BURN_USER.address) {
      return this.BURN_USER.publicKey as Point;
    }

    const data = await this.client.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getUser",
      args: [to],
    });
    const pk = data as { x: bigint; y: bigint };

    if (!pk) throw new Error("User not registered!");

    if (pk.x === this.field.zero || pk.y === this.field.zero)
      throw new Error("User not registered!");

    return [pk.x, pk.y];
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

  async fetchUserBalance(userAddress: string, tokenAddress: string) {
    const data = await this.client.readContract({
      abi: this.abi,
      address: this.contractAddress as `0x${string}`,
      functionName: "balanceOfFromAddress",
      args: [userAddress as `0x${string}`, tokenAddress as `0x${string}`],
    });

    return data as EncryptedBalance;
  }

  async tokenId(tokenAddress: string) {
    const data = await this.client.readContract({
      abi: this.abi,
      address: this.contractAddress as `0x${string}`,
      functionName: "tokenIds",
      args: [tokenAddress as `0x${string}`],
    });

    return data as bigint;
  }

  // decrypts user balance from the contract
  async decryptContractBalance(cipher: bigint[]): Promise<[bigint, bigint]> {
    if (!this.decryptionKey) {
      console.error("Missing decryption key!");
      return [0n, 0n];
    }

    const privateKey = formatKeyForCurve(this.decryptionKey);

    // decrypts the balance using the decryption key
    const wholePoint = this.curve.elGamalDecryption(privateKey, {
      c1: [cipher[0], cipher[1]],
      c2: [cipher[2], cipher[3]],
    });
    const fractionalPoint = this.curve.elGamalDecryption(privateKey, {
      c1: [cipher[4], cipher[5]],
      c2: [cipher[6], cipher[7]],
    });

    // doing bsgs
    const [whole, fractional] = await Promise.all([
      this.bsgs.find(wholePoint),
      this.bsgs.find(fractionalPoint),
    ]);

    return [whole, fractional];
  }

  // decrypts the PCT of the transactions
  // only the auditor can decrypt the pct and get the details of the transaction
  async auditorDecrypt() {
    if (!this.decryptionKey) throw new Error("Missing decryption key!");
    const privateKey = formatKeyForCurve(this.decryptionKey);

    type NamedEvents = Log & {
      eventName: string;
      args: { auditorPCT: bigint[] };
    };

    const result = [];

    try {
      const currentBlock = await this.client.getBlockNumber();
      const events = ERC34_ABI.filter((element) => element.type === "event");

      const logs = (await this.client.getLogs({
        address: this.contractAddress,
        fromBlock: currentBlock - 50n,
        toBlock: currentBlock,
        events,
      })) as NamedEvents[];

      for (const log of logs) {
        const name = log?.eventName;
        if (!name) continue;
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

        const amount = Scalar.calculate(whole, fractional);
        result.push({ hash: log.transactionHash, amount });
      }

      return result;
    } catch (e) {
      throw new Error(e as string);
    }
  }
}
