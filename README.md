# @avalabs/ac-eerc-sdk

To install dependencies:

```bash
bun install
```

## Usage

```js
  const { publicClient } = dappService.usePublicClient();
  const { data: walletClient } = dappService.useWalletClient();
  const {
    isRegistered,
    isInitialized,
    isConverter,
    register,
    useEncryptedBalance,
    setAuditor,
    isAuditorKeySet,

    publicKey,
    auditorDecrypt,
  } = useEERC(publicClient, walletClient, contractAddress, decryptionKey);
  const { parsedDecryptedBalance, isDecrypting, privateMint, privateBurn, privateTransfer } = useEncryptedBalance();
  // or for the converter version
  const { parsedDecryptedBalance, isDecrypting, privateMint, privateBurn, privateTransfer } = useEncryptedBalance(tokenAddress);
```
