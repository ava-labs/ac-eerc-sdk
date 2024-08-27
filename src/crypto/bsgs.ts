import xxhash from "xxhash-wasm";
import { IndexedDBStorage, logMessage } from "../helpers";
import type { BabyJub } from "./babyjub";
import type { Point } from "./types";

export class BSGS {
  private table: Record<string, number> | null = null;
  private tableSize = 500_000n;
  private hash: ((input: Uint8Array, seed?: bigint) => string) | null = null;
  private referencePoint: Point | null = null;

  constructor(
    private tableUrl: string,
    private curve: BabyJub,
    private storage = new IndexedDBStorage(),
  ) {}

  // initialize BSGS
  async initialize(): Promise<void> {
    try {
      // get table from indexed db
      const tableFromDB = await this.storage.getTable();

      // if table exists in indexed db, use it
      if (tableFromDB) {
        this.table = tableFromDB;
        logMessage("Recovered table from IndexedDB");
      } else {
        // if not found, fetch from the server
        const response = await fetch(this.tableUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        logMessage("Fetched table from the server");
        this.table = await response.json();
        // save table to indexed db
        this.storage.saveTable(this.table as Record<string, number>);
        logMessage("Saved table to IndexedDB");
      }

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
    // need to pad the key to 16 characters
    key = key.padStart(16, "0");
    let value = this.table?.[key];

    if (value !== undefined) return BigInt(value);

    // for the practical implementation we will do max 20_000 iterations
    // which covers (500_000 * 20_000) = 10_000_000_000
    // which is equivalent to 10.000.000.000 tokens as the
    // upper limit for the integer part of the balance.
    // takes around 130ms to find 250_000_000
    //              311ms to find 500_000_000
    //              376ms to find 750_000_000
    //              570ms to find 1_000_000_000
    //              960ms to find 2_000_000_000
    //              1287ms to find 5_000_000_000
    const maxIterations = 20_000;

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
