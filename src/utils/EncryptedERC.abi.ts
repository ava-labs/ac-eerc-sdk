export const ENCRYPTED_ERC_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "registrar",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isConverter",
            type: "bool",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "uint8",
            name: "decimals",
            type: "uint8",
          },
          {
            internalType: "address",
            name: "mintVerifier",
            type: "address",
          },
          {
            internalType: "address",
            name: "withdrawVerifier",
            type: "address",
          },
          {
            internalType: "address",
            name: "transferVerifier",
            type: "address",
          },
        ],
        internalType: "struct CreateEncryptedERCParams",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidChainId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidNullifier",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidProof",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "TokenBlacklisted",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "UnknownToken",
    type: "error",
  },
  {
    inputs: [],
    name: "UserNotRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldAuditor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newAuditor",
        type: "address",
      },
    ],
    name: "AuditorChanged",
    type: "event",
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
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "dust",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
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
  },
  {
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
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintNullifier",
        type: "uint256",
      },
    ],
    name: "alreadyMinted",
    outputs: [
      {
        internalType: "bool",
        name: "isUsed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auditor",
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
    inputs: [],
    name: "auditorPublicKey",
    outputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "balanceOfStandalone",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "balances",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "blacklistedTokens",
    outputs: [
      {
        internalType: "bool",
        name: "isBlacklisted",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256[7]",
        name: "amountPCT",
        type: "uint256[7]",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "getBalanceFromTokenAddress",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isAuditorKeySet",
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
    inputs: [],
    name: "isConverter",
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
    inputs: [],
    name: "mintVerifier",
    outputs: [
      {
        internalType: "contract IMintVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
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
    inputs: [],
    name: "pendingOwner",
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
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "a",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2][2]",
                name: "b",
                type: "uint256[2][2]",
              },
              {
                internalType: "uint256[2]",
                name: "c",
                type: "uint256[2]",
              },
            ],
            internalType: "struct ProofPoints",
            name: "proofPoints",
            type: "tuple",
          },
          {
            internalType: "uint256[32]",
            name: "publicSignals",
            type: "uint256[32]",
          },
        ],
        internalType: "struct TransferProof",
        name: "proof",
        type: "tuple",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "privateBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "a",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2][2]",
                name: "b",
                type: "uint256[2][2]",
              },
              {
                internalType: "uint256[2]",
                name: "c",
                type: "uint256[2]",
              },
            ],
            internalType: "struct ProofPoints",
            name: "proofPoints",
            type: "tuple",
          },
          {
            internalType: "uint256[24]",
            name: "publicSignals",
            type: "uint256[24]",
          },
        ],
        internalType: "struct MintProof",
        name: "proof",
        type: "tuple",
      },
    ],
    name: "privateMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "registrar",
    outputs: [
      {
        internalType: "contract IRegistrar",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "setAuditorPublicKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "bool",
        name: "blacklisted",
        type: "bool",
      },
    ],
    name: "setTokenBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenAddresses",
    outputs: [
      {
        internalType: "address",
        name: "tokenAddress",
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
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "tokenIds",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tokens",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "a",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2][2]",
                name: "b",
                type: "uint256[2][2]",
              },
              {
                internalType: "uint256[2]",
                name: "c",
                type: "uint256[2]",
              },
            ],
            internalType: "struct ProofPoints",
            name: "proofPoints",
            type: "tuple",
          },
          {
            internalType: "uint256[32]",
            name: "publicSignals",
            type: "uint256[32]",
          },
        ],
        internalType: "struct TransferProof",
        name: "proof",
        type: "tuple",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "transferVerifier",
    outputs: [
      {
        internalType: "contract ITransferVerifier",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "uint256[2]",
                name: "a",
                type: "uint256[2]",
              },
              {
                internalType: "uint256[2][2]",
                name: "b",
                type: "uint256[2][2]",
              },
              {
                internalType: "uint256[2]",
                name: "c",
                type: "uint256[2]",
              },
            ],
            internalType: "struct ProofPoints",
            name: "proofPoints",
            type: "tuple",
          },
          {
            internalType: "uint256[16]",
            name: "publicSignals",
            type: "uint256[16]",
          },
        ],
        internalType: "struct WithdrawProof",
        name: "proof",
        type: "tuple",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawVerifier",
    outputs: [
      {
        internalType: "contract IWithdrawVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const LEGACY_ENCRYPTED_ERC_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "registrar",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isConverter",
            type: "bool",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "uint8",
            name: "decimals",
            type: "uint8",
          },
          {
            internalType: "address",
            name: "mintVerifier",
            type: "address",
          },
          {
            internalType: "address",
            name: "withdrawVerifier",
            type: "address",
          },
          {
            internalType: "address",
            name: "transferVerifier",
            type: "address",
          },
        ],
        internalType: "struct CreateEncryptedERCParams",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AuditorKeyNotSet",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidChainId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidNullifier",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOperation",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidProof",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "TokenBlacklisted",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "UnknownToken",
    type: "error",
  },
  {
    inputs: [],
    name: "UserNotRegistered",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldAuditor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newAuditor",
        type: "address",
      },
    ],
    name: "AuditorChanged",
    type: "event",
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
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "dust",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
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
  },
  {
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
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintNullifier",
        type: "uint256",
      },
    ],
    name: "alreadyMinted",
    outputs: [
      {
        internalType: "bool",
        name: "isUsed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auditor",
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
    inputs: [],
    name: "auditorPublicKey",
    outputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "balanceOfStandalone",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "balances",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "blacklistedTokens",
    outputs: [
      {
        internalType: "bool",
        name: "isBlacklisted",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256[7]",
        name: "amountPCT",
        type: "uint256[7]",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "getBalanceFromTokenAddress",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c1",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "x",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "y",
                type: "uint256",
              },
            ],
            internalType: "struct Point",
            name: "c2",
            type: "tuple",
          },
        ],
        internalType: "struct EGCT",
        name: "eGCT",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256[7]",
            name: "pct",
            type: "uint256[7]",
          },
          {
            internalType: "uint256",
            name: "index",
            type: "uint256",
          },
        ],
        internalType: "struct AmountPCT[]",
        name: "amountPCTs",
        type: "tuple[]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
      {
        internalType: "uint256",
        name: "transactionIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isAuditorKeySet",
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
    inputs: [],
    name: "isConverter",
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
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "isTokenBlacklisted",
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
    inputs: [],
    name: "mintVerifier",
    outputs: [
      {
        internalType: "contract IMintVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
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
    inputs: [],
    name: "pendingOwner",
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
        internalType: "uint256[8]",
        name: "proof",
        type: "uint256[8]",
      },
      {
        internalType: "uint256[32]",
        name: "input",
        type: "uint256[32]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "privateBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256[8]",
        name: "proof",
        type: "uint256[8]",
      },
      {
        internalType: "uint256[24]",
        name: "input",
        type: "uint256[24]",
      },
    ],
    name: "privateMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "registrar",
    outputs: [
      {
        internalType: "contract IRegistrar",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "setAuditorPublicKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "bool",
        name: "blacklisted",
        type: "bool",
      },
    ],
    name: "setTokenBlacklist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenAddresses",
    outputs: [
      {
        internalType: "address",
        name: "tokenAddress",
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
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "tokenIds",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tokens",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256[8]",
        name: "proof",
        type: "uint256[8]",
      },
      {
        internalType: "uint256[32]",
        name: "input",
        type: "uint256[32]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "transferVerifier",
    outputs: [
      {
        internalType: "contract ITransferVerifier",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256[8]",
        name: "proof",
        type: "uint256[8]",
      },
      {
        internalType: "uint256[16]",
        name: "input",
        type: "uint256[16]",
      },
      {
        internalType: "uint256[7]",
        name: "balancePCT",
        type: "uint256[7]",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawVerifier",
    outputs: [
      {
        internalType: "contract IWithdrawVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const LEGACY_ENCRYPTED_ERC_BYTECODE =
  "0x608060405234801561001057600080fd5b506004361061020f5760003560e01c8063767b480111610125578063a865d5b2116100ad578063ce9be9ba1161007c578063ce9be9ba1461050b578063e30c397814610537578063e5df8b8414610548578063f2fde38b14610571578063fc97a3031461058457600080fd5b8063a865d5b214610440578063aa6ca80814610453578063b7365f1f14610468578063cbf1304d1461048b57600080fd5b8063864eb164116100f4578063864eb164146103de5780638da5cb5b146103f15780638daed5281461040257806391584d491461041557806395d89b411461043857600080fd5b8063767b48011461039d57806379a5d955146103b057806379ba5097146103c357806382f09ea2146103cb57600080fd5b80632b20e397116101a85780635c8b5f44116101775780635c8b5f441461033b578063618327671461035e57806362f3d2811461036b578063715018a61461037e57806375794a3c1461038657600080fd5b80632b20e397146102e3578063313ce567146102f65780633ec045a6146103155780634f64b2be1461032857600080fd5b806313a4f0db116101e457806313a4f0db1461029557806314dda7fd146102aa5780631ff0769a146102bd5780632b0a14c1146102d057600080fd5b8062b0938d14610214578062fdd58e14610244578063034a1c181461026857806306fdde0314610280575b600080fd5b600a54610227906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b610257610252366004612e54565b6105a4565b60405161023b959493929190612ecf565b6102706106fb565b604051901515815260200161023b565b610288610717565b60405161023b9190612f79565b6102a86102a3366004612fc7565b6107a5565b005b6102576102b8366004612feb565b61091e565b6102a86102cb366004613032565b610969565b6102a86102de36600461309b565b61099c565b600954610227906001600160a01b031681565b600f546103039060ff1681565b60405160ff909116815260200161023b565b601254610227906001600160a01b031681565b610227610336366004613101565b610d5c565b610270610349366004612fc7565b60076020526000908152604090205460ff1681565b6003546102709060ff1681565b6102a86103793660046131dc565b610d86565b6102a8610fae565b61038f60025481565b60405190815260200161023b565b6102a86103ab366004613235565b610fc2565b6102a86103be36600461327e565b611308565b6102a86115d5565b6102a86103d93660046132cf565b61161e565b600b54610227906001600160a01b031681565b6000546001600160a01b0316610227565b600c54610227906001600160a01b031681565b601054601154610423919082565b6040805192835260208301919091520161023b565b6102886118c4565b61025761044e366004612fc7565b6118d1565b61045b611904565b60405161023b9190613306565b610270610476366004613101565b60136020526000908152604090205460ff1681565b6104fc610499366004612e54565b60086020908152600092835260408084208252918352918190208151608081018352815481840190815260018301546060830152815282518084019093526002820154835260038201548385015292830191909152600581015460069091015483565b60405161023b93929190613347565b610270610519366004612fc7565b6001600160a01b031660009081526007602052604090205460ff1690565b6001546001600160a01b0316610227565b610227610556366004613101565b6005602052600090815260409020546001600160a01b031681565b6102a861057f366004612fc7565b611966565b61038f610592366004612fc7565b60046020526000908152604090205481565b6105ac612d54565b600060606105b8612d98565b6001600160a01b038616600090815260086020908152604080832088845282528083206005810154600682015483516080810185528354818601908152600185015460608301528152845180860186526002850154815260038501548188015281870152600e840180548651818902810189019097528087529496919593949093600788019392909185918a9084015b828210156106b157600084815260209020604080516101208101825291600885020190829081018260078282826020028201915b81548152602001906001019080831161067c575050505050815260200160078201548152505081526020019060010190610648565b50506040805160e08101918290529396508592506007915082845b8154815260200190600101908083116106cc575050505050915095509550955095509550509295509295909350565b601054600090158015906107125750601154600114155b905090565b600d805461072490613366565b80601f016020809104026020016040519081016040528092919081815260200182805461075090613366565b801561079d5780601f106107725761010080835404028352916020019161079d565b820191906000526020600020905b81548152906001019060200180831161078057829003601f168201915b505050505081565b6107ad6119d7565b600954604051630b1fba9160e11b81526001600160a01b0383811660048301529091169063163f752290602401602060405180830381865afa1580156107f7573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061081b91906133a0565b61083857604051632163950f60e01b815260040160405180910390fd5b601254600954604051628918ff60e51b81526001600160a01b0384811660048301529283169260009216906311231fe0906024016040805180830381865afa158015610888573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108ac91906133bd565b601280546001600160a01b0319166001600160a01b03868116918217909255604080518082018252845180825260208087015192018290526010556011555192935091908416907fdbeeb2970745c839058876b084c0d772566ff6b5aaa47938c394cd171a38c24c90600090a3505050565b610926612d54565b60006060610932612d98565b6001600160a01b03851660009081526004602052604081205461095588826105a4565b939c929b5090995097509095509350505050565b6109716119d7565b6001600160a01b03919091166000908152600760205260409020805460ff1916911515919091179055565b336109a56106fb565b6109c257604051636ed668d760e01b815260040160405180910390fd5b600954604051630b1fba9160e11b81526001600160a01b0383811660048301529091169063163f752290602401602060405180830381865afa158015610a0c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a3091906133a0565b1580610aa75750600954604051630b1fba9160e11b81526001600160a01b0388811660048301529091169063163f752290602401602060405180830381865afa158015610a81573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610aa591906133a0565b155b15610ac557604051632163950f60e01b815260040160405180910390fd5b600954604051628918ff60e51b81526001600160a01b03838116600483015260009216906311231fe0906024016040805180830381865afa158015610b0e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b3291906133bd565b600954604051628918ff60e51b81526001600160a01b038a81166004830152929350600092909116906311231fe0906024016040805180830381865afa158015610b80573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ba491906133bd565b82519091508535141580610bc057506020828101519086013514155b80610bd15750805161014086013514155b80610be55750602081015161016086013514155b15610c03576040516309bde33960e01b815260040160405180910390fd5b50506010546102e0840135141580610c22575060115461030084013514155b15610c40576040516309bde33960e01b815260040160405180910390fd5b600c5460405163dcaf90cd60e01b81526001600160a01b039091169063dcaf90cd90610c72908790879060040161342a565b60006040518083038186803b158015610c8a57600080fd5b505afa158015610c9e573d6000803e3d6000fd5b50505050610caf8187878686611a04565b610cb7612d98565b60005b6007811015610d035784610ccf82601961345c565b60208110610cdf57610cdf613414565b6020020135828260078110610cf657610cf6613414565b6020020152600101610cba565b506012546040516001600160a01b039182169189811691908516907f1fe42c57a12ee7d4848276c111f82c24fe213a94a603b21da88785cd882c9ccf90610d4b90869061346f565b60405180910390a450505050505050565b60068181548110610d6c57600080fd5b6000918252602090912001546001600160a01b0316905081565b60035433906101e08401359060ff16610db257604051631cc6a69960e11b815260040160405180910390fd5b600954604051628918ff60e51b81526001600160a01b03848116600483015260009216906311231fe0906024016040805180830381865afa158015610dfb573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e1f91906133bd565b80519091508535141580610e3b57506020818101519086013514155b15610e59576040516309bde33960e01b815260040160405180910390fd5b5060105460c0850135141580610e75575060115460e085013514155b15610e93576040516309bde33960e01b815260040160405180910390fd5b600b54604051634605cb8960e01b81526001600160a01b0390911690634605cb8990610ec5908890889060040161347d565b60006040518083038186803b158015610edd57600080fd5b505afa158015610ef1573d6000803e3d6000fd5b50505050610f028282888787611bb6565b610f0a612d98565b60005b6007811015610f565785610f2282600861345c565b60108110610f3257610f32613414565b6020020135828260078110610f4957610f49613414565b6020020152600101610f0d565b506012546040516001600160a01b03918216918516907fae09dce9b789cf9600e6765940d134d8247429396faf72db0f7b33ed5ca8294c90610f9d9086908c908790613499565b60405180910390a350505050505050565b610fb66119d7565b610fc06000611d64565b565b60035460ff1615610fe657604051631cc6a69960e11b815260040160405180910390fd5b600954604080516309255bc360e31b815290516000926001600160a01b03169163492ade189160048083019260209291908290030181865afa158015611030573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061105491906134bd565b600954604051630b1fba9160e11b815233600482018190529293506000916001600160a01b03169063163f752290602401602060405180830381865afa1580156110a2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110c691906133a0565b6110e357604051632163950f60e01b815260040160405180910390fd5b600954604051628918ff60e51b81526001600160a01b03848116600483015260009216906311231fe0906024016040805180830381865afa15801561112c573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061115091906133bd565b604080518082019091526000815260016020820152815191925090873514158061118257506020828101519088013514155b806111935750805161014088013514155b806111a75750602081015161016088013514155b156111c5576040516309bde33960e01b815260040160405180910390fd5b50506010546102e08601351415806111e4575060115461030086013514155b15611202576040516309bde33960e01b815260040160405180910390fd5b600c5460405163dcaf90cd60e01b81526001600160a01b039091169063dcaf90cd90611234908990899060040161342a565b60006040518083038186803b15801561124c57600080fd5b505afa158015611260573d6000803e3d6000fd5b505050506112718284838888611a04565b611279612d98565b60005b60078110156112c5578661129182601961345c565b602081106112a1576112a1613414565b60200201358282600781106112b8576112b8613414565b602002015260010161127c565b506012546040516001600160a01b03918216918516907f047fabd75c92ead101dbbb10dd37a09c205f633da9db8ce7078c2f33e84710e590610f9d90859061346f565b6113106119d7565b60035460ff161561133457604051631cc6a69960e11b815260040160405180910390fd5b466102c08201351461135957604051633d23e4d160e11b815260040160405180910390fd5b6113616106fb565b61137e57604051636ed668d760e01b815260040160405180910390fd5b600954604051630b1fba9160e11b81526001600160a01b0385811660048301529091169063163f752290602401602060405180830381865afa1580156113c8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113ec91906133a0565b61140957604051632163950f60e01b815260040160405180910390fd5b600954604051628918ff60e51b81526001600160a01b03858116600483015260009216906311231fe0906024016040805180830381865afa158015611452573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061147691906133bd565b8051909150823514158061149257506020818101519083013514155b156114b0576040516309bde33960e01b815260040160405180910390fd5b506010546101a08201351415806114ce57506011546101c082013514155b156114ec576040516309bde33960e01b815260040160405180910390fd5b6102e08101357f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001811061153257604051632ec8265960e11b815260040160405180910390fd5b60008181526013602052604090205460ff1615611562576040516309bde33960e01b815260040160405180910390fd5b600a5460405163a18cb30560e01b81526001600160a01b039091169063a18cb3059061159490869086906004016134da565b60006040518083038186803b1580156115ac57600080fd5b505afa1580156115c0573d6000803e3d6000fd5b505050506115cf848284611d7d565b50505050565b60015433906001600160a01b031681146116125760405163118cdaa760e01b81526001600160a01b03821660048201526024015b60405180910390fd5b61161b81611d64565b50565b6116266106fb565b61164357604051636ed668d760e01b815260040160405180910390fd5b60035460ff1661166657604051631cc6a69960e11b815260040160405180910390fd5b6001600160a01b03821660009081526007602052604090205460ff16156116ab576040516375519c5160e01b81526001600160a01b0383166004820152602401611609565b600954604051630b1fba9160e11b8152336004820181905284926000928392916001600160a01b03169063163f752290602401602060405180830381865afa1580156116fb573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061171f91906133a0565b61173c57604051632163950f60e01b815260040160405180910390fd5b6040516370a0823160e01b81523060048201526000906001600160a01b038616906370a0823190602401602060405180830381865afa158015611783573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117a791906134f6565b90506117b58583308b611ebe565b6040516370a0823160e01b81523060048201526000906001600160a01b038716906370a0823190602401602060405180830381865afa1580156117fc573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061182091906134f6565b9050600061182e838361350f565b9050898114611850576040516312171d8360e31b815260040160405180910390fd5b61185c848b8b8b611f25565b909650945061186c8785886123b8565b604080518b8152602081018890529081018690526001600160a01b038516907f36af321ec8d3c75236829c5317affd40ddb308863a1236d2d277a4025cccee1e9060600160405180910390a250505050505050505050565b600e805461072490613366565b6118d9612d54565b600060606118e5612d98565b60006118f28660006105a4565b939a9299509097509550909350915050565b6060600680548060200260200160405190810160405280929190818152602001828054801561195c57602002820191906000526020600020905b81546001600160a01b0316815260019091019060200180831161193e575b5050505050905090565b61196e6119d7565b600180546001600160a01b0383166001600160a01b0319909116811790915561199f6000546001600160a01b031690565b6001600160a01b03167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e2270060405160405180910390a350565b6000546001600160a01b03163314610fc05760405163118cdaa760e01b8152336004820152602401611609565b6040805160808082018352848301358284019081526060808701359084015282528251808401909352840135825260a08401356020808401919091528101919091526000611a51826123ee565b9050600080611a61898885612442565b9150915081611a83576040516309bde33960e01b815260040160405180910390fd5b6040805160808101825260c088013581830190815260e0808a01356060840152908252825180840184526101008a013581526101208a013560208083019190915283015282518082019093529091611afc918c918b918591908b9060079083908390808284376000920191909152508891506124af9050565b5050604080516080810182526101808701358183019081526101a08801356060830152815281518083019092526101c087013582526101e08701356020808401919091528101919091529250611b549150612d989050565b60005b6007811015611ba05784611b6c82601061345c565b60208110611b7c57611b7c613414565b6020020135828260078110611b9357611b93613414565b6020020152600101611b57565b50611bad86868484612606565b50505050505050565b6000838152600560205260409020546001600160a01b031680611bec57604051638698bf3760e01b815260040160405180910390fd5b6040805160808082018352858301358284019081526060808801359084015282528251808401909352850135825260a08501356020808401919091528101919091526000611c39826123ee565b9050600080611c498a8985612442565b9150915081611c6b576040516309bde33960e01b815260040160405180910390fd5b600073fb4d2b7a0862e22efeb3e969830093c3288505ec6304068d3a60405180604001604052808b600060108110611ca557611ca5613414565b602002013581526020018b600160108110611cc257611cc2613414565b602090810291909101359091526040516001600160e01b031960e085901b168152825160048201529101516024820152604481018d9052606401608060405180830381865af4158015611d19573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d3d9190613553565b9050611d4c8b8a838a866124af565b5050505050611d5c86868361278f565b505050505050565b600180546001600160a01b031916905561161b8161287c565b6040805160808082018352838301358284019081526060808601359084015282528251808401909352830135825260a08301356020808401919091528101919091526000611dc9612d98565b611dd1612d98565b60005b6007811015611e555785611de982600661345c565b60188110611df957611df9613414565b6020020135838260078110611e1057611e10613414565b602002015285611e2182600f61345c565b60188110611e3157611e31613414565b6020020135828260078110611e4857611e48613414565b6020020152600101611dd4565b50611e6287848685612606565b60008681526013602052604090819020805460ff1916600117905560125490516001600160a01b03918216918916907f0d78494055b7f1585d1e50d778838efd294162edeaf41569996739183722254b90610f9d90859061346f565b6040516001600160a01b0384811660248301528381166044830152606482018390526115cf9186918216906323b872dd906084015b604051602081830303815290604052915060e01b6020820180516001600160e01b0383818316178352505050506128cc565b6000806000846001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa158015611f68573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611f8c9190613594565b600f5460009450909150869060ff9081169083161115611fe457600f54600090611fb99060ff16846135b7565b611fc490600a6136af565b9050611fd081896136d4565b9150611fdc81896136e8565b945050612028565b600f5460ff908116908316101561202857600f5460009061200990849060ff166135b7565b61201490600a6136af565b905061202081896136fc565b915060009450505b6001600160a01b0386166000908152600460205260408120549003612050576120508661293d565b6001600160a01b03861660009081526004602052604081205493508190036120795750506123af565b600954604051628918ff60e51b81526001600160a01b038a8116600483015260009216906311231fe0906024016040805180830381865afa1580156120c2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906120e691906133bd565b9050600073fb4d2b7a0862e22efeb3e969830093c3288505ec6304068d3a60405180604001604052808560006002811061212257612122613414565b602002015181526020018560016002811061213f5761213f613414565b602090810291909101519091526040516001600160e01b031960e085901b16815282516004820152910151602482015260448101869052606401608060405180830381865af4158015612196573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906121ba9190613553565b6001600160a01b038b16600090815260086020908152604080832089845290915290208054919250901580156121f257506001810154155b1561221f578151805182556020908101516001830155808301518051600284015501516003820155612335565b8151604051637bb10bcb60e01b815273fb4d2b7a0862e22efeb3e969830093c3288505ec91637bb10bcb91612258918591600401613713565b6040805180830381865af4158015612274573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612298919061373c565b805182556020908101516001830155820151604051637bb10bcb60e01b815273fb4d2b7a0862e22efeb3e969830093c3288505ec91637bb10bcb916122e4916002860191600401613713565b6040805180830381865af4158015612300573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612324919061373c565b805160028301556020015160038201555b604080518082019091528881526006820154602080830191909152600e83018054600181018255600091825291902082516008909202019061237a9082906007612db6565b506020919091015160079091015560068101805490600061239a83613758565b91905055506123a98b876129cd565b50505050505b94509492505050565b6040516001600160a01b038381166024830152604482018390526123e991859182169063a9059cbb90606401611ef3565b505050565b80518051602091820151828401518051908401516040805195860194909452928401919091526060830152608082015260009060a00160408051601f19818403018152919052805160209091012092915050565b6001600160a01b03831660009081526008602090815260408083208584528252808320600581015482518085018790528084019190915282518082038401815260609091018352805190840120845260040190915290206001810154905460ff909116905b935093915050565b6001600160a01b038516600090815260086020908152604080832087845290915290819020845191516327d3c56d60e11b8152909173fb4d2b7a0862e22efeb3e969830093c3288505ec91634fa78ada9161250f91859190600401613713565b6040805180830381865af415801561252b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061254f919061373c565b8051825560209081015160018301558401516040516327d3c56d60e11b815273fb4d2b7a0862e22efeb3e969830093c3288505ec91634fa78ada9161259b916002860191600401613713565b6040805180830381865af41580156125b7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906125db919061373c565b805160028301556020015160038201556125f6868684612ac3565b611bad6007808301908590612db6565b6001600160a01b03841660009081526008602090815260408083208684529091529020805415801561263a57506001810154155b1561266757825180518255602090810151600183015580840151805160028401550151600382015561277d565b8251604051637bb10bcb60e01b815273fb4d2b7a0862e22efeb3e969830093c3288505ec91637bb10bcb916126a0918591600401613713565b6040805180830381865af41580156126bc573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906126e0919061373c565b805182556020908101516001830155830151604051637bb10bcb60e01b815273fb4d2b7a0862e22efeb3e969830093c3288505ec91637bb10bcb9161272c916002860191600401613713565b6040805180830381865af4158015612748573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061276c919061373c565b805160028301556020015160038201555b612788858584612c0e565b5050505050565b6000816001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa1580156127cf573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906127f39190613594565b600f5460ff918216925084916000911683111561283857600f5461281a9060ff168461350f565b61282590600a613771565b905061283181866136fc565b9150612870565b600f5460ff1683101561287057600f5461285690849060ff1661350f565b61286190600a613771565b905061286d81866136d4565b91505b83611bad8188856123b8565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b600080602060008451602086016000885af1806128ef576040513d6000823e3d81fd5b50506000513d91508115612907578060011415612914565b6001600160a01b0384163b155b156115cf57604051635274afe760e01b81526001600160a01b0385166004820152602401611609565b600280546001600160a01b03831660008181526004602090815260408083208590558483526005909152812080546001600160a01b03199081168417909155600680546001810182559083527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f01805490911690921790915582549192906129c483613758565b91905055505050565b6001600160a01b0382166000908152600860209081526040808320848452825280832060058101548251608081018452825481850190815260018401546060830152815283518085019094526002830154845260038301548486015293840192909252929091612a3c906123ee565b604080516020810183905290810184905290915060600160408051808303601f190181528282528051602091820120838301835260068701805485526001838601818152600084815260048b0190955294842095518655935194909301805460ff1916941515949094179093558154929350612ab783613758565b91905055505050505050565b6001600160a01b03831660009081526008602090815260408083208584529091529020600e8101545b8015612bec576000612aff60018361350f565b90508383600e018281548110612b1757612b17613414565b90600052602060002090600802016007015411612bd957600e83018054612b409060019061350f565b81548110612b5057612b50613414565b906000526020600020906008020183600e018281548110612b7357612b73613414565b60009182526020909120600890910201612b8f81836007612df4565b50600791820154910155600e8301805480612bac57612bac61377d565b60008281526020812060001990920191600883020190612bcc8282612e1f565b6007820160009055505090555b5080612be481613793565b915050612aec565b50600581018054906000612bff83613758565b91905055506115cf84846129cd565b6001600160a01b0383166000908152600860209081526040808320858452825280832060058101548251608081018452825481850190815260018401546060830152815283518085019094526002830154845260038301548486015293840192909252929091612c7d906123ee565b604080516020810183905290810184905290915060600160408051808303601f190181528282528051602091820120838301835260068701805485526001838601818152600084815260048b018652868120975188559051968201805460ff1916971515979097179096558451808601909552898552905484840152600e88018054918201815585529190932082519394509192600890910290910190612d279082906007612db6565b5060209190910151600790910155600683018054906000612d4783613758565b9190505550505050505050565b60408051608081018252600091810182815260608201929092529081908152602001612d93604051806040016040528060008152602001600081525090565b905290565b6040518060e001604052806007906020820280368337509192915050565b8260078101928215612de4579160200282015b82811115612de4578251825591602001919060010190612dc9565b50612df0929150612e2a565b5090565b8260078101928215612de4579182015b82811115612de4578254825591600101919060010190612e04565b5061161b9060078101905b5b80821115612df05760008155600101612e2b565b6001600160a01b038116811461161b57600080fd5b60008060408385031215612e6757600080fd5b8235612e7281612e3f565b946020939093013593505050565b612e9582825180518252602090810151910152565b602090810151805160408401520151606090910152565b8060005b60078110156115cf578151845260209384019390910190600101612eb0565b60006101c08201612ee08389612e80565b608083018790526101c060a084015285519081905260208601906101e084019060005b81811015612f5457835180518460005b6007811015612f32578251825260209283019290910190600101612f13565b50505060209081015160e0850152939093019261010090920191600101612f03565b50508092505050612f6860c0830185612eac565b826101a08301529695505050505050565b602081526000825180602084015260005b81811015612fa75760208186018101516040868401015201612f8a565b506000604082850101526040601f19601f83011684010191505092915050565b600060208284031215612fd957600080fd5b8135612fe481612e3f565b9392505050565b60008060408385031215612ffe57600080fd5b823561300981612e3f565b9150602083013561301981612e3f565b809150509250929050565b801515811461161b57600080fd5b6000806040838503121561304557600080fd5b823561305081612e3f565b9150602083013561301981613024565b80610100810183101561307257600080fd5b92915050565b80610400810183101561307257600080fd5b8060e0810183101561307257600080fd5b600080600080600061062086880312156130b457600080fd5b85356130bf81612e3f565b9450602086013593506130d58760408801613060565b92506130e5876101408801613078565b91506130f587610540880161308a565b90509295509295909350565b60006020828403121561311357600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b6040805190810167ffffffffffffffff811182821017156131535761315361311a565b60405290565b604051601f8201601f1916810167ffffffffffffffff811182821017156131825761318261311a565b604052919050565b600082601f83011261319b57600080fd5b6131a560e0613159565b8060e08401858111156131b757600080fd5b845b818110156131d15780358452602093840193016131b9565b509095945050505050565b60008060008061040085870312156131f357600080fd5b843593506132048660208701613060565b925061032085018681111561321857600080fd5b61012086019250613229878261318a565b91505092959194509250565b60008060006105e0848603121561324b57600080fd5b6132558585613060565b9250613265856101008601613078565b915061327585610500860161308a565b90509250925092565b6000806000610420848603121561329457600080fd5b833561329f81612e3f565b92506132ae8560208601613060565b915084610420850111156132c157600080fd5b610120840190509250925092565b600080600061012084860312156132e557600080fd5b8335925060208401356132f781612e3f565b9150613275856040860161318a565b602080825282518282018190526000918401906040840190835b818110156131d15783516001600160a01b0316835260209384019390920191600101613320565b60c081016133558286612e80565b608082019390935260a00152919050565b600181811c9082168061337a57607f821691505b60208210810361339a57634e487b7160e01b600052602260045260246000fd5b50919050565b6000602082840312156133b257600080fd5b8151612fe481613024565b6000604082840312156133cf57600080fd5b82601f8301126133de57600080fd5b6133e86040613159565b8060408401858111156133fa57600080fd5b845b818110156131d15780518452602093840193016133fc565b634e487b7160e01b600052603260045260246000fd5b6105008101610100848337610400836101008401379392505050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561307257613072613446565b60e081016130728284612eac565b6103008101610100848337610200836101008401379392505050565b8381526020810183905261012081016134b56040830184612eac565b949350505050565b6000602082840312156134cf57600080fd5b8151612fe481612e3f565b6104008101610100848337610300836101008401379392505050565b60006020828403121561350857600080fd5b5051919050565b8181038181111561307257613072613446565b60006040828403121561353457600080fd5b61353c613130565b825181526020928301519281019290925250919050565b6000608082840312801561356657600080fd5b5061356f613130565b6135798484613522565b81526135888460408501613522565b60208201529392505050565b6000602082840312156135a657600080fd5b815160ff81168114612fe457600080fd5b60ff828116828216039081111561307257613072613446565b6001815b60018411156124a7578085048111156135ef576135ef613446565b60018416156135fd57908102905b60019390931c9280026135d4565b60008261361a57506001613072565b8161362757506000613072565b816001811461363d576002811461364757613663565b6001915050613072565b60ff84111561365857613658613446565b50506001821b613072565b5060208310610133831016604e8410600b8410161715613686575081810a613072565b61369360001984846135d0565b80600019048211156136a7576136a7613446565b029392505050565b6000612fe460ff84168361360b565b634e487b7160e01b600052601260045260246000fd5b6000826136e3576136e36136be565b500490565b6000826136f7576136f76136be565b500690565b808202811582820484141761307257613072613446565b825481526001830154602082015260808101612fe4604083018480518252602090810151910152565b60006040828403121561374e57600080fd5b612fe48383613522565b60006001820161376a5761376a613446565b5060010190565b6000612fe4838361360b565b634e487b7160e01b600052603160045260246000fd5b6000816137a2576137a2613446565b50600019019056fea2646970667358221220bdd2fd8d961801736188f2b89ec04075b775ca7f63e979722eb64424e07eb1ce64736f6c634300081b0033";
