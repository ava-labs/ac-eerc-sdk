// __mocks__/wagmi.ts
export const createPublicClient = jest.fn();
export const createWalletClient = jest.fn();

export const PublicClient = jest.fn().mockImplementation(() => ({
  // Add any methods you need to mock here
  readContract: jest.fn(),
  getBlockNumber: jest.fn(),
  getLogs: jest.fn(),
  getTransaction: jest.fn(),
}));

export const WalletClient = jest.fn().mockImplementation(() => ({
  // Add any methods you need to mock here
  signMessage: jest.fn(),
  writeContract: jest.fn(),
}));
