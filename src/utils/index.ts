export const SNARK_FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// parses the object to bigint object
export function unstringifyBigInts(o: any): any {
  if (typeof o === "string") {
    if (/^[0-9]+$/.test(o) || /^0x[0-9a-fA-F]+$/.test(o)) {
      return BigInt(o);
    }
    return o;
  }

  if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  }

  if (typeof o === "object" && o !== null) {
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, unstringifyBigInts(v)]),
    );
  }

  return o;
}
