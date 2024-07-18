import { sha256 } from "js-sha256";
import type { BabyJub } from "./babyjub";
import { LOOKUP_TABLE } from "./data/lookupTable";
import type { Point } from "./types";

interface LookupTable {
  [key: string]: number;
}

export const BSGS = {
  // in here we will implement the mini BSGS algorithm
  do(pp: Point, curve: BabyJub): bigint {
    // our map size is +- 50_000

    const table = LOOKUP_TABLE as LookupTable;
    const REFERENCE_SCALAR = 49_999n;
    const REFERENCE_POINT = curve.mulWithScalar(curve.Base8, REFERENCE_SCALAR);

    const key = sha256(pp.toString()).toString().substring(0, 11);
    if (key in table) return BigInt(table[key]);

    // we will implement the mini bsgs algorithm here
    let iteration = 0;
    let downfall = pp;
    let uprise = pp;
    // this is the max value that we find 1099511627775
    // so max iterations is 1099511627775 / 50_000 = 21990232
    const maxIterations = 21990232;
    while (iteration < maxIterations) {
      // we will go down with the downfall
      downfall = curve.subPoints(downfall, REFERENCE_POINT);
      // we will go up with the uprise
      uprise = curve.addPoints(uprise, REFERENCE_POINT);

      const downfallKey = sha256(downfall.toString())
        .toString()
        .substring(0, 11);
      const upriseKey = sha256(uprise.toString()).toString().substring(0, 11);

      if (downfallKey in table) {
        const value =
          BigInt(table[downfallKey]) + BigInt(iteration) * REFERENCE_SCALAR;
        return value;
      }

      if (upriseKey in table) {
        const value =
          BigInt(table[upriseKey]) - BigInt(iteration) * REFERENCE_SCALAR;
        return value;
      }

      iteration++;
    }

    return 0n;
  },
};
