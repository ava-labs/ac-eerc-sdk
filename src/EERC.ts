import type { PublicClient } from "wagmi";
import { ERC34_ABI } from "./utils";

export class EERC {
  private client: PublicClient;
  public contractAddress: `0x${string}`;
  public abi = ERC34_ABI;

  constructor(client: PublicClient, contractAddress: `0x${string}`) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  async fetchContractData() {
    const d = await this.client.readContract({
      address: this.contractAddress,
      abi: this.abi,
      functionName: "auditorPublicKey",
      args: [0],
    });
    return d;
  }
}
