import { groth16 } from "snarkjs";
import type { IProof, ProofType } from "./types";

export class ProofGenerator {
  BASE_URL = "http://localhost:3000";

  getPaths(type: ProofType) {
    return {
      wasm: `${this.BASE_URL}/${type}.wasm`,
      zkey: `${this.BASE_URL}/${type}.zkey`,
    };
  }

  // generates register proof using wasm & zkey files
  async generateProof(type: ProofType, input: object) {
    const { wasm, zkey } = this.getPaths(type);

    const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);
    const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    return this.convertCallData(calldata);
  }

  // converts snarkjs generated calldata to a solidity input object
  private convertCallData(calldata: string): IProof {
    const argv = calldata.replace(/["[\]\s]/g, "").split(",");

    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    const input = argv.slice(8, argv.length);

    return { a, b, c, input };
  }
}
