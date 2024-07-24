# @avalabs/ac-eerc-sdk

To install dependencies:

```bash
bun install
```

## Usage

```js
  const { data: walletClient } = dappService.useWalletClient();
  const { publicClient } = dappService.usePublicClient();
  const {
    // both
    isRegistered,
    register,

    // only for converter version
    deposit,
    withdraw,
    getEncryptedBalance,
    transfer,

    // only for standalone version
    balanceOf,
    transferToken,
    privateMint,
    privateBurn,
  } = useEERC(publicClient, walletClient, contractAddress as `0x${string}`, false, decryptionKey);
```
