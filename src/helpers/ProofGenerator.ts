import { logMessage } from "./logger";
import type { IProof, ProofType } from "./types";

export class ProofGenerator {
  // currently only supports fetching from public folder in the root
  getPaths(type: ProofType) {
    return {
      wasm: `/${type}.wasm`,
      zkey: `/${type}.zkey`,
    };
  }

  // generates register proof using wasm & zkey files
  async generateProof(type: ProofType, input: object) {
    const { wasm, zkey } = this.getPaths(type);

    logMessage(`Generating proof for ${type}...`);
    // const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);
    // logMessage(`Proof generated for ${type}`);
    // const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    // return this.convertCallData(calldata);
    return {} as IProof;
  }
}
