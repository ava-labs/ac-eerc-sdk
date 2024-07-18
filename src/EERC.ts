import type { PublicClient, WalletClient } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
import type { Point } from "./crypto/types";
import { ProofGenerator } from "./helpers";
import type { IProof } from "./helpers/types";
import { ERC34_ABI, MESSAGES, SNARK_FIELD_SIZE } from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;
  public curve: BabyJub;
  public field: FF;
  public proofGenerator: ProofGenerator;

  public contractAddress: `0x${string}`;
  public abi = ERC34_ABI;

  constructor(
    client: PublicClient,
    wallet: WalletClient,
    contractAddress: `0x${string}`,
  ) {
    this.client = client;
    this.wallet = wallet;
    this.contractAddress = contractAddress;

    this.field = new FF(SNARK_FIELD_SIZE);
    this.curve = new BabyJub(this.field);
    this.proofGenerator = new ProofGenerator();
  }

  // function to check if a user is registered to the contract
  async isRegistered(): Promise<boolean> {
    const addr = this.wallet.account.address;
    if (!this.wallet || !this.client || !this.contractAddress || !addr)
      return Promise.resolve(false);

    // check if user is registered
    const [publicKey, _] = (await this.client.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "getUser",
      args: [addr],
    })) as [{ x: bigint; y: bigint }, string];

    if (publicKey.x === this.field.zero || publicKey.y === this.field.zero)
      return false;

    return true;
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

      // returns proof for the transaction
      return { key, error: "", proof, transactionHash };
    } catch (e) {
      throw new Error(e as string);
    }
  }
}
