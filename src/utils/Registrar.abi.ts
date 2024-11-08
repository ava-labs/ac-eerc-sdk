export const REGISTRAR_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_registrationVerifier",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "X",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "Y",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct Point",
        name: "publicKey",
        type: "tuple",
      },
    ],
    name: "Register",
    type: "event",
  },
  {
    inputs: [],
    name: "BURN_USER",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserPublicKey",
    outputs: [
      {
        internalType: "uint256[2]",
        name: "publicKey",
        type: "uint256[2]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "isUserRegistered",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[8]",
        name: "proof",
        type: "uint256[8]",
      },
      {
        internalType: "uint256[2]",
        name: "input",
        type: "uint256[2]",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "registrationVerifier",
    outputs: [
      {
        internalType: "contract IRegistrationVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "userPublicKeys",
    outputs: [
      {
        internalType: "uint256",
        name: "X",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "Y",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
