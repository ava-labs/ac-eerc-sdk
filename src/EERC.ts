import type { PublicClient, WalletClient } from "wagmi";
import { ERC34_ABI, MESSAGES } from "./utils";

export class EERC {
  private client: PublicClient;
  private wallet: WalletClient;
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
  async register() {
    if (!this.wallet || !this.client)
      throw new Error("Wallet or client not provided");

    try {
      // message to sign
      const message = MESSAGES.REGISTER(
        this.wallet.account.address,
        this.contractAddress,
      );

      const signature = await this.wallet.signTypedData({
        domain: {
          name: "AvaCloud",
          version: "1",
          chainId: this.client.chain.id,
          verifyingContract: this.contractAddress,
        },
        types: {
          User: [
            { name: "address", type: "address" },
            { name: "contractAddress", type: "address" },
            { name: "content", type: "string" },
          ],
        },
        primaryType: "User",
        message: {
          address: this.wallet.account.address,
          contractAddress: this.contractAddress,
          content: message,
        },
      });
      return signature;
    } catch (e) {
      return e;
    }
  }
}
