export const SNARK_FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export const SHA_256_MAX_DIGEST =
  115792089237316195423570985008687907853269984665640564039457584007913129639936n;
export const SUB_GROUP_ORDER =
  2736030358979909402780800718157159386076813972158567259200215660948447373041n;

export const MESSAGES = {
  REGISTER: (user: string) =>
    `eERC\nRegistering user with\n Address:${user.toLowerCase()}`,
};

// burn user is used for private burn transactions
// instead of burning tokens, they are transferred to the burn user in the standalone version
export const BURN_USER = {
  address: "0x1111111111111111111111111111111111111111",
  publicKey: [0n, 1n],
};

export const PRIVATE_TRANSFER_EVENT = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "from",
      type: "address",
    },
    {
      indexed: true,
      internalType: "address",
      name: "to",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256[7]",
      name: "auditorPCT",
      type: "uint256[7]",
    },
    {
      indexed: true,
      internalType: "address",
      name: "auditorAddress",
      type: "address",
    },
  ],
  name: "PrivateTransfer",
  type: "event",
};

export const PRIVATE_MINT_EVENT = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "user",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256[7]",
      name: "auditorPCT",
      type: "uint256[7]",
    },
    {
      indexed: true,
      internalType: "address",
      name: "auditorAddress",
      type: "address",
    },
  ],
  name: "PrivateMint",
  type: "event",
};

export const PRIVATE_BURN_EVENT = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "user",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256[7]",
      name: "auditorPCT",
      type: "uint256[7]",
    },
    {
      indexed: true,
      internalType: "address",
      name: "auditorAddress",
      type: "address",
    },
  ],
  name: "PrivateBurn",
  type: "event",
};
