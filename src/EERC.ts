import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { BSGS } from "./crypto/bsgs";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import { Poseidon } from "./crypto/poseidon";
import type { Point } from "./crypto/types";
import { ProofGenerator } from "./helpers";
import type { IProof } from "./helpers/types";
import type { EncryptedBalance } from "./hooks/types";
import { ERC34_ABI, MESSAGES, SNARK_FIELD_SIZE } from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;

  public curve: BabyJub;
  public field: FF;
  public poseidon: Poseidon;

  public proofGenerator: ProofGenerator;

  public contractAddress: `0x${string}`;
  public abi = ERC34_ABI;

  // user field
  private decryptionKey: string;
  private publicKey: bigint[] = [];

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
    decryptionKey?: string,
  ) {
    this.client = client;
    this.wallet = wallet;
    this.contractAddress = contractAddress;

    this.field = new FF(SNARK_FIELD_SIZE);
    this.curve = new BabyJub(this.field);
    this.poseidon = new Poseidon(this.field, this.curve);
    this.proofGenerator = new ProofGenerator();
    this.decryptionKey = decryptionKey || "";

    if (this.decryptionKey) {
      const formatted = formatKeyForCurve(this.decryptionKey);
      this.publicKey = this.curve.generatePublicKey(formatted);
    }
  }

  // function to register a new user to the contract
  async register(
    wasmPath: string,
    zkeyPath: string,
  ): Promise<{
    key: string;
    error: string;
    proof: IProof | null;
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
      const proof = await this.proofGenerator.generateRegisterProof(
        input,
        wasmPath,
        zkeyPath,
      );

      const transactionHash = await this.wallet.writeContract({
        abi: this.abi,
        address: this.contractAddress,
        functionName: "register",
        args: [{ a: proof.a, b: proof.b, c: proof.c, inputs: proof.input }],
      });

      this.decryptionKey = key;
      this.publicKey = publicKey;

      // returns proof for the transaction
      return { key, error: "", proof, transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  // function to mint tokens for a user
  // totalMintAmount is a bigint with last 2 decimal places as fractional and
  // others as whole number e.g.
  //      11000 = 110.00
  //        400 = 4.00
  //         50 = 0.50
  async mint(
    totalMintAmount: bigint,
    wasmPath: string,
    zkeyPath: string,
    auditorPublicKey: Point,
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

    const now = Date.now();
    const proof = await this.proofGenerator.generateMintProof(
      input,
      wasmPath,
      zkeyPath,
    );
    console.log("Proof generation time: ", Date.now() - now, "in ms");

    // write the transaction to the contract
    // ! the auditor public key mismatch
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

  // decrypts user balance from the contract
  decryptContractBalance(cipher: EncryptedBalance): [bigint, bigint] {
    if (!this.decryptionKey) {
      console.error("Missing decryption key!");
      return [0n, 0n];
    }

    const privateKey = formatKeyForCurve(this.decryptionKey);
    const wholeCipher = cipher[0];
    const fractionalCipher = cipher[1];

    // decrypts the balance using the decryption key
    const wholePoint = this.curve.elGamalDecryption(privateKey, {
      c1: [wholeCipher.c1.x, wholeCipher.c1.y],
      c2: [wholeCipher.c2.x, wholeCipher.c2.y],
    });
    const fractionalPoint = this.curve.elGamalDecryption(privateKey, {
      c1: [fractionalCipher.c1.x, fractionalCipher.c1.y],
      c2: [fractionalCipher.c2.x, fractionalCipher.c2.y],
    });

    // doing bsgs
    const whole = BSGS.do(wholePoint, this.curve);
    const fractional = BSGS.do(fractionalPoint, this.curve);

    return [whole, fractional];
  }
}
