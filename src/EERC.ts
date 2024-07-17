import type { PublicClient, WalletClient } from "wagmi";
import { BabyJub } from "./crypto/babyjub";
import { FF } from "./crypto/ff";
import { formatKeyForCurve, getPrivateKeyFromSignature } from "./crypto/key";
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

  async fetchContractData() {
    // ! Auditor public key fetching is going to change after the contract is updated
    const [auditorX, auditorY] = await Promise.all([
      this.client.readContract({
        address: this.contractAddress,
        abi: this.abi,
        functionName: "auditorPublicKey",
        args: [0],
      }),
      this.client.readContract({
        address: this.contractAddress,
        abi: this.abi,
        functionName: "auditorPublicKey",
        args: [1],
      }),
    ]);

    const auditorPublicKey = [auditorX, auditorY];

    return { auditorPublicKey };
  }

  // function to register a new user to the contract
  async register(
    wasmPath: string,
    zkeyPath: string,
  ): Promise<{ key: string; error: string; proof: IProof | null }> {
    if (!this.wallet || !this.client)
      throw new Error("Wallet or client not provided");

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

      const proof = await this.proofGenerator.generateRegisterProof(
        input,
        wasmPath,
        zkeyPath,
      );

      // returns proof for the transaction
      return { key, error: "", proof };
    } catch (e) {
      return { key: "", error: "error on registration", proof: null };
    }
  }
}
