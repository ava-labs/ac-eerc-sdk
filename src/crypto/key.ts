import createBlakeHash from "blake-hash";
import { sha256 } from "js-sha256";
import { SHA_256_MAX_DIGEST, SNARK_FIELD_SIZE } from "../utils";
import { BabyJub } from "./babyjub";
import { Scalar } from "./scalar";

// formats private key for the curve
export const formatKeyForCurve = (key: string): bigint => {
  let hash = createBlakeHash("blake512")
    .update(Buffer.from(key, "hex"))
    .digest();
  hash = hash.slice(0, 32);

  const pruneBuffer = (buff: Buffer) => {
    buff[0] &= 0xf8;
    buff[31] &= 0x7f;
    buff[31] |= 0x40;
    return buff;
  };

  const leBufferToBigInt = (buff: Buffer) =>
    BigInt(`0x${Buffer.from(buff).reverse().toString("hex")}`);

  hash = pruneBuffer(hash);
  hash = leBufferToBigInt(hash);

  return Scalar.shiftRight(hash, 3) % BabyJub.subOrder();
};

export const getPrivateKeyFromSignature = (signature: string): string => {
  const fixed = signature.replace(/^0x/, "");
  const r = fixed.slice(0, 64);
  return grindKey(r);
};

const grindKey = (seed: string): string => {
  const limit = SNARK_FIELD_SIZE;
  const maxAllowedValue = SHA_256_MAX_DIGEST - (SHA_256_MAX_DIGEST % limit);

  let i = 0;
  let key = hashKeyWithIndex(seed, i);
  i++;

  // make sure that key is in the max allowed range
  while (key >= maxAllowedValue) {
    key = hashKeyWithIndex(seed, i);
    i++;
  }

  return (key % limit).toString(16);
};

const removeHexPrefix = (hex: string) => hex.replace(/^0x/, "");

const numberToHex = (num: number) => num.toString(16);

const sanitizeBytes = (str: string, byteSize = 8) =>
  padLeft(str, calculateByteLength(str.length, byteSize), "0");

const padLeft = (str: string, length: number, padding = "0") =>
  padString(str, length, true, padding);

const padString = (
  str: string,
  length: number,
  toLeft: boolean,
  padding = "0",
) => {
  const diff = length - str.length;
  let result = str;
  if (diff > 0) {
    const pad = padding.repeat(diff);
    result = toLeft ? pad + str : str + pad;
  }
  return result;
};

const calculateByteLength = (length: number, byteSize = 8) => {
  const remainder = length % byteSize;
  return remainder
    ? ((length - remainder) / byteSize) * byteSize + byteSize
    : length;
};

const hashKeyWithIndex = (key: string, index: number) => {
  const input = removeHexPrefix(key) + sanitizeBytes(numberToHex(index), 2);
  const buff = Buffer.from(removeHexPrefix(input), "hex");
  return BigInt(`0x${sha256.update(buff).hex()}`);
};
