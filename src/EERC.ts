import { type PublicClient, type WalletClient, useContractRead } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import type { ElGamalCipherText } from "./crypto/types";
import { ProofGenerator } from "./helpers";
import type { IProof } from "./helpers/types";
import type { EncryptedBalance } from "./hooks/types";
import { ERC34_ABI, MESSAGES, SNARK_FIELD_SIZE } from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;
  public curve: BabyJub;
  public field: FF;
  public proofGenerator: ProofGenerator;

  public contractAddress: `0x${string}`;
  public abi = ERC34_ABI;

  private decryptionKey: string;

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
    this.proofGenerator = new ProofGenerator();
    this.decryptionKey = decryptionKey || "";
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

      // returns proof for the transaction
      return { key, error: "", proof, transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }

  decryptContractBalance(cipher: EncryptedBalance) {
    if (!this.decryptionKey) {
      console.error("Missing decryption key!");
      return;
    }

    const privateKey = this.field.newElement(this.decryptionKey);
    const wholeCipher = cipher[0];
    const fractionalCipher = cipher[1];

    // decrypts the balance using the decryption key
    const whole = this.curve.elGamalDecryption(privateKey, {
      c1: [wholeCipher.c1.x, wholeCipher.c1.y],
      c2: [wholeCipher.c2.x, wholeCipher.c2.y],
    });
    const fractional = this.curve.elGamalDecryption(privateKey, {
      c1: [fractionalCipher.c1.x, fractionalCipher.c1.y],
      c2: [fractionalCipher.c2.x, fractionalCipher.c2.y],
    });
  }
}
