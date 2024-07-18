import { groth16 } from "snarkjs";
import type { IProof } from "./types";

export class ProofGenerator {
  // generates register proof using wasm & zkey files
  async generateRegisterProof(
    input: object,
    wasmPath: string,
    zkeyPath: string,
  ) {
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmPath,
      zkeyPath,
    );
    const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    return this.convertCallData(calldata);
  }

  // generates mint proof using wasm & zkey files
  async generateMintProof(input: object, wasmPath: string, zkeyPath: string) {
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmPath,
      zkeyPath,
    );

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
