import type { PublicClient, WalletClient } from "wagmi";
import { EERC } from "../../src/EERC";
import { BabyJub } from "../../src/crypto/babyjub";
import { FF } from "../../src/crypto/ff";
import { ProofType } from "../../src/helpers";
import { createPublicClient, createWalletClient } from "../__mocks__/wagmi";

jest.mock("wagmi", () => ({
  createPublicClient: jest.fn(() => ({
    readContract: jest.fn(),
    getBlockNumber: jest.fn(),
    getLogs: jest.fn(),
    getTransaction: jest.fn(),
    chain: { id: 1 },
  })),
  createWalletClient: jest.fn(() => ({
    signMessage: jest.fn(),
    writeContract: jest.fn(),
    account: { address: "0xMockAddress" },
  })),
}));

jest.mock("../../src/helpers", () => ({
  logMessage: jest.fn(),
  ProofGenerator: jest.fn().mockImplementation(() => ({
    generateProof: jest.fn(),
  })),
  IndexedDBStorage: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  ProofType: {
    REGISTER: "register",
    BURN: "burn",
    TRANSFER: "transfer",
    MINT: "mint",
  },
}));

const MOCK_PROOF = {
  a: [1n, 2n],
  b: [
    [3n, 4n],
    [5n, 6n],
  ],
  c: [7n, 8n],
};

describe("EERC", () => {
  let eerc: EERC;
  let mockPublicClient: jest.Mocked<PublicClient>;
  let mockWalletClient: jest.Mocked<WalletClient>;

  const contractAddress = "0x1234567890123456789012345678901234567890";
  const registrarAddress = "0x0987654321098765432109876543210987654321";
  const decryptionKey = "testDecryptionKey";
  const tableUrl = "example.com";

  beforeEach(() => {
    mockPublicClient = createPublicClient({}) as jest.Mocked<PublicClient>;
    mockWalletClient = createWalletClient({}) as jest.Mocked<WalletClient>;

    eerc = new EERC(
      mockPublicClient,
      mockWalletClient,
      contractAddress,
      registrarAddress,
      false,
      tableUrl,
      decryptionKey,
    );

    jest.clearAllMocks();
  });

  test("constructor initializes correctly", () => {
    expect(eerc.contractAddress).toBe(
      "0x1234567890123456789012345678901234567890",
    );
    expect(eerc.registrarAddress).toBe(
      "0x0987654321098765432109876543210987654321",
    );
    expect(eerc.isConverter).toBe(false);
    expect(eerc.field).toBeInstanceOf(FF);
    expect(eerc.curve).toBeInstanceOf(BabyJub);
  });

  test("init method initializes BSGS", async () => {
    const mockInitialize = jest.fn().mockResolvedValue(undefined);
    eerc.bsgs.initialize = mockInitialize;

    await eerc.init();

    expect(mockInitialize).toHaveBeenCalled();
  });

  describe("register", () => {
    let mockGenerateProof: jest.Mock;

    beforeEach(() => {
      mockGenerateProof = jest.fn().mockResolvedValue(MOCK_PROOF);

      eerc.proofGenerator.generateProof = mockGenerateProof;
      mockWalletClient.signMessage.mockResolvedValue("0x123456");
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");
      eerc.curve.generatePublicKey = jest.fn().mockReturnValue([10n, 10n]);
    });

    test("should throw error when client, wallet, or contract address is missing", async () => {
      // Create EERC instances with missing components
      const eercNoClient = new EERC(
        undefined as unknown as PublicClient,
        mockWalletClient,
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321",
        false,
        "testDecryptionKey",
      );

      const eercNoWallet = new EERC(
        mockPublicClient,
        undefined as unknown as WalletClient,
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321",
        false,
        "testDecryptionKey",
      );

      const eercNoContractAddress = new EERC(
        mockPublicClient,
        mockWalletClient,
        "" as `0x${string}`,
        "0x0987654321098765432109876543210987654321",
        false,
        "testDecryptionKey",
      );

      await expect(eercNoClient.register()).rejects.toThrow(
        "Missing client, wallet or contract address!",
      );
      await expect(eercNoWallet.register()).rejects.toThrow(
        "Missing client, wallet or contract address!",
      );
      await expect(eercNoContractAddress.register()).rejects.toThrow(
        "Missing client, wallet or contract address!",
      );
    });

    test("when user is not registered, it should register the user and set decryption key and public key", async () => {
      mockPublicClient.readContract.mockResolvedValue({
        publicKey: { x: 0n, y: 0n },
      });

      const result = await eerc.register();

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "getUser",
          args: [expect.any(String)],
        }),
      );

      expect(mockGenerateProof).toHaveBeenCalledWith(
        ProofType.REGISTER,
        expect.objectContaining({
          sk: expect.any(String),
          pk: expect.arrayContaining([expect.any(String), expect.any(String)]),
        }),
      );

      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("transactionHash", "0xabcdef");

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "register",
          args: [expect.any(Object)],
        }),
      );

      expect(eerc.publicKey[0].toString()).toEqual("10");
      expect(eerc.publicKey[1].toString()).toEqual("10");
    });

    test("when user is already registered, it should return existing key and not change decryptionKey and publicKey", async () => {
      mockPublicClient.readContract.mockResolvedValue({
        publicKey: { x: 10n, y: 10n },
      });

      const result = await eerc.register();

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "getUser",
          args: [expect.any(String)],
        }),
      );

      expect(mockGenerateProof).not.toHaveBeenCalled();
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("transactionHash", "");
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
      expect(eerc.publicKey[0].toString()).toEqual("10");
      expect(eerc.publicKey[1].toString()).toEqual("10");
    });
  });

  describe("private mint", () => {
    beforeEach(() => {
      eerc.curve.encryptAmount = jest.fn().mockReturnValue({
        whole: {
          cipher: { c1: [1n, 2n], c2: [3n, 4n] },
          random: 5n,
          originalValue: 100n,
        },
        fractional: {
          cipher: { c1: [6n, 7n], c2: [8n, 9n] },
          random: 10n,
          originalValue: 50n,
        },
      });
    });
    test("if eerc is a converter, it should throw an error", async () => {
      eerc.isConverter = true;

      await expect(eerc.privateMint(100n, [0n, 0n])).rejects.toThrow(
        "Not allowed for converter!",
      );
    });

    test("should mint private tokens successfully", async () => {
      const mockGenerateProof = jest.fn().mockResolvedValue(MOCK_PROOF);
      eerc.proofGenerator.generateProof = mockGenerateProof;
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");

      const result = await eerc.privateMint(100n, [0n, 0n]);

      expect(mockGenerateProof).toHaveBeenCalledWith(
        ProofType.MINT,
        expect.any(Object),
      );
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "privateMint",
          args: [expect.any(String), expect.any(Object)],
        }),
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });
  });

  describe("private burn", () => {
    const encryptedBalance = Array.from({ length: 8 }, () => 0n);
    const decryptedBalance = Array.from({ length: 2 }, () => 10n);
    const auditorPublicKey = [1n, 2n];
    const totalAmount = 100n;

    test("if eerc is a converter, it should throw an error", async () => {
      eerc.isConverter = true;

      await expect(
        eerc.privateBurn(
          totalAmount,
          encryptedBalance,
          decryptedBalance,
          auditorPublicKey,
        ),
      ).rejects.toThrow("Not allowed for converter!");
    });

    test("should burn private tokens successfully", async () => {
      const mockGenerateProof = jest.fn().mockResolvedValue(MOCK_PROOF);
      eerc.generateTransferProof = mockGenerateProof;
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");

      const result = await eerc.privateBurn(
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
      );

      expect(eerc.generateTransferProof).toHaveBeenCalledWith(
        eerc.BURN_USER.address,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
      );
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "privateBurn",
          args: [expect.any(Object)],
        }),
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });
  });

  describe("transfer", () => {
    const encryptedBalance = Array.from({ length: 8 }, () => 0n);
    const decryptedBalance = Array.from({ length: 2 }, () => 10n);
    const auditorPublicKey = [1n, 2n];
    const totalAmount = 100n;
    const TO = "0x1234567890123456789012345678901234567890";

    test("should transfer successfully", async () => {
      const mockGenerateProof = jest.fn().mockResolvedValue(MOCK_PROOF);
      eerc.generateTransferProof = mockGenerateProof;
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");

      const result = await eerc.transfer(
        TO,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
      );

      expect(eerc.generateTransferProof).toHaveBeenCalledWith(
        TO,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
      );
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "transfer",
          args: [TO, expect.any(Object), expect.any(BigInt)],
        }),
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });

    test("should transfer tokens successfully", async () => {
      eerc.tokenId = jest.fn().mockReturnValue(1n);
      eerc.transfer = jest
        .fn()
        .mockReturnValue({ transactionHash: "0xabcdef" });
      const tokenAddress = "0x1234567890123456789012345678901234567890";

      const result = await eerc.transferToken(
        TO,
        totalAmount,
        auditorPublicKey,
        tokenAddress,
        encryptedBalance,
        decryptedBalance,
      );

      expect(eerc.transfer).toHaveBeenCalledWith(
        TO,
        totalAmount,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        1n,
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });
  });

  describe("deposit", () => {
    const tokenAddress = "0x1234567890123456789012345678901234567890";
    const amount = 100n;

    beforeEach(() => {
      // need to set eerc as converter to test deposit
      eerc.isConverter = true;
    });

    test("if eerc is stand alone, it should throw an error", async () => {
      eerc.isConverter = false;
      await expect(eerc.deposit(amount, tokenAddress)).rejects.toThrow(
        "Not allowed for stand alone!",
      );
    });

    test("if user approve less than amount, it should throw an error", async () => {
      eerc.fetchUserApprove = jest.fn().mockResolvedValue(50n);
      await expect(eerc.deposit(amount, tokenAddress)).rejects.toThrow(
        "Insufficient approval amount!",
      );
    });

    test("should deposit successfully", async () => {
      eerc.fetchUserApprove = jest.fn().mockResolvedValue(100n);
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");

      const result = await eerc.deposit(amount, tokenAddress);

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "deposit",
          args: [amount, tokenAddress],
        }),
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });
  });

  describe("withdraw", () => {
    const tokenAddress = "0x1234567890123456789012345678901234567890";
    const amount = 100n;
    const encryptedBalance = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];
    const decryptedBalance = [100n, 0n]; // Representing 100.00

    beforeEach(() => {
      // need to set eerc as converter to test withdraw
      eerc.isConverter = true;
    });

    test("if eerc is stand alone, it should throw an error", async () => {
      eerc.isConverter = false;
      await expect(
        eerc.withdraw(amount, encryptedBalance, decryptedBalance, tokenAddress),
      ).rejects.toThrow("Not allowed for stand alone!");
    });

    test("if amount is 0 or less, it should throw an error", async () => {
      await expect(
        eerc.withdraw(0n, encryptedBalance, decryptedBalance, tokenAddress),
      ).rejects.toThrow("Invalid amount!");

      await expect(
        eerc.withdraw(-1n, encryptedBalance, decryptedBalance, tokenAddress),
      ).rejects.toThrow("Invalid amount!");
    });

    test("if encrypted balance is empty, it should throw an error", async () => {
      await expect(
        eerc.withdraw(100n, [], decryptedBalance, tokenAddress),
      ).rejects.toThrow("Invalid balance!");
    });

    test("if decrypted balance is not 2 length, it should throw an error", async () => {
      await expect(
        eerc.withdraw(100n, encryptedBalance, [100n], tokenAddress),
      ).rejects.toThrow("Invalid balance!");
    });

    test("should withdraw properly", async () => {
      const mockGenerateProof = jest.fn().mockResolvedValue(MOCK_PROOF);
      eerc.proofGenerator.generateProof = mockGenerateProof;
      mockWalletClient.writeContract.mockResolvedValue("0xabcdef");

      const result = await eerc.withdraw(
        amount,
        encryptedBalance,
        decryptedBalance,
        tokenAddress,
      );

      expect(eerc.proofGenerator.generateProof).toHaveBeenCalledWith(
        ProofType.BURN,
        expect.any(Object),
      );

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "withdraw",
          args: [expect.any(String), expect.any(Object)],
        }),
      );

      expect(result).toHaveProperty("transactionHash", "0xabcdef");
    });
  });

  describe("fetchers", () => {
    describe("fetchPublicKey", () => {
      test("if to is burn address should return burn user public key", async () => {
        const to = eerc.BURN_USER.address;
        const result = await eerc.fetchPublicKey(to);
        expect(result).toEqual(eerc.BURN_USER.publicKey);

        expect(mockPublicClient.readContract).not.toHaveBeenCalled();
      });

      test("if to is not burn address should return user public key", async () => {
        const to = "0x1234567890123456789012345678901234567890";
        mockPublicClient.readContract.mockResolvedValue({
          publicKey: { x: 10n, y: 10n },
        });

        const result = await eerc.fetchPublicKey(to);

        expect(mockPublicClient.readContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "getUser",
            args: [to],
          }),
        );

        expect(result).toEqual([10n, 10n]);
      });

      test("if public key is not defined  should throw an error", async () => {
        const to = "0x1234567890123456789012345678901234567890";
        mockPublicClient.readContract.mockResolvedValue({
          publicKey: undefined,
        });

        await expect(eerc.fetchPublicKey(to)).rejects.toThrow(
          "User not registered!",
        );
      });

      test("if public key is with zeros should throw an error", async () => {
        const to = "0x1234567890123456789012345678901234567890";
        mockPublicClient.readContract.mockResolvedValue({
          publicKey: { x: 0n, y: 0n },
        });

        await expect(eerc.fetchPublicKey(to)).rejects.toThrow(
          "User not registered!",
        );
      });

      test("should work properly", async () => {
        const to = "0x1234567890123456789012345678901234567890";
        mockPublicClient.readContract.mockResolvedValue({
          publicKey: { x: 10n, y: 10n },
        });

        const result = await eerc.fetchPublicKey(to);

        expect(mockPublicClient.readContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "getUser",
            args: [to],
          }),
        );

        expect(result).toEqual([10n, 10n]);
      });
    });

    describe("fetchUserApprove", () => {
      test("should return user approve amount", async () => {
        mockPublicClient.readContract.mockResolvedValue(100n);
        const result = await eerc.fetchUserApprove(
          mockWalletClient.account.address,
          eerc.contractAddress,
        );
        expect(result).toEqual(expect.any(BigInt));

        expect(mockPublicClient.readContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "allowance",
            args: [mockWalletClient.account.address, eerc.contractAddress],
          }),
        );
      });
    });

    describe("tokenId", () => {
      test("should return token id", async () => {
        const tokenAddress = "0x1234567890123456789012345678901234567890";
        mockPublicClient.readContract.mockResolvedValue(1n);
        const result = await eerc.tokenId(tokenAddress);
        expect(result).toEqual(1n);

        expect(mockPublicClient.readContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "tokenIds",
            args: [tokenAddress],
          }),
        );
      });
    });
  });
});
