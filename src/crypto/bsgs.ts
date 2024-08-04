import xxhash from "xxhash-wasm";
import type { BabyJub } from "./babyjub";
import type { Point } from "./types";

export class BSGS {
  private table: Record<string, number> | null = null;
  private tableSize = 250_000n;
  private hash: ((input: Uint8Array, seed?: bigint) => string) | null = null;
  private referencePoint: Point | null = null;

  constructor(
    private tableUrl: string,
    private curve: BabyJub,
  ) {}

  async initialize(): Promise<void> {
    try {
      const response = await fetch(this.tableUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.table = await response.json();

      const { h64Raw } = await xxhash();
      this.hash = (input: Uint8Array, seed?: bigint) =>
        h64Raw(input, seed).toString(16);

      this.referencePoint = this.curve.mulWithScalar(
        this.curve.Base8,
        this.tableSize,
      );
    } catch (error) {
      console.error("Failed to initialize BSGS:", error);
      this.clear();
      throw error;
    }
  }

  async find(point: Point): Promise<bigint> {
    if (!this.isInitialized()) throw new Error("BSGS is not initialized");
    if (!this.referencePoint) throw new Error("Reference point is not set");

    let key = await this.hashPoint(point);
    let value = this.table?.[key];

    if (value !== undefined) return BigInt(value);

    // for the practical implementation we will do max 2000 iterations
    // which covers (250_000 * 4_000) = 1_000_000_000
    // which is 1_000_000_000 dollars in the user's wallet
    // takes around 67 ms to find 250_000_000
    //              120ms to find 500_000_000
    //              180ms to find 750_000_000
    //              200ms to find 1_000_000_000
    // 1_099_511_627_775n / 250_000n = 4_398_046n
    const maxIterations = 4_000;
    let iteration = 0;
    let pp = point;

    while (iteration < maxIterations) {
      pp = this.curve.subPoints(pp, this.referencePoint);
      key = await this.hashPoint(pp);
      value = this.table?.[key];

      if (value !== undefined) {
        return BigInt(value) + BigInt(iteration + 1) * this.tableSize;
      }

      iteration++;
      console.log("Iteration: ", iteration);
    }

    throw new Error("Scalar not found");
  }

  private async hashPoint(point: Point): Promise<string> {
    if (!this.hash) throw new Error("BSGS is not initialized");

    const x = point[0].toString(16).padStart(64, "0");
    const y = point[1] % 2n === 0n ? "0" : "1";
    const h = this.hash(new Uint8Array(Buffer.from(x + y, "hex")));

    return h;
  }

  isInitialized(): boolean {
    return (
      this.table !== null && this.hash !== null && this.referencePoint !== null
    );
  }

  clear(): void {
    this.table = null;
    this.hash = null;
  }
}
