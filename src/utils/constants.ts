export const SNARK_FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const SHA_256_MAX_DIGEST =
  115792089237316195423570985008687907853269984665640564039457584007913129639936n;

export const MESSAGES = {
  REGISTER: (user: string, chainId: number) =>
    `AvaCloud\nRegistering user with\n Address:${user.toLowerCase()}\nChain ID: ${chainId.toString()}`,
};

// burn user is used for private burn transactions
// instead of burning tokens, they are transferred to the burn user in the standalone version
export const BURN_USER = {
  address: "0x1111111111111111111111111111111111111111",
  publicKey: [0n, 1n],
};
