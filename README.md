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


## Overview
The ac-eerc-sdk library provides tools and utilities to facilitate the interaction with the EERC protocol in the blockchain from the browser. The SDK is designed to simplify integration of the EERC into a client's dApps, enabling developers to leverage the protocol's features and capabilities easily. The SDK includes a range of functions and components that can interact with the protocol, such as registering and initializing users, minting, burning, and transferring encrypted tokens, and decrypting encrypted balances.


### Storage of Lookup Table
The [IndexedDBStorage](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/helpers/storage.ts) class is designed to efficiently manage the storage of a lookup table required for the decryption process in our protocol. This lookup table is essential for decryption, but repeatedly downloading it can be inefficient. To address this, the class encodes the lookup table using msgpack, then splits the encoded data into 2MB chunks to store it in the browser’s IndexedDB. By breaking down the data into manageable pieces, the class ensures that the entire lookup table can be stored locally. When needed, the stored chunks are retrieved, reassembled, and decoded, allowing the application to reconstruct the lookup table quickly without requiring repeated downloads. This approach not only enhances performance by reducing network overhead but also ensures that the lookup table is readily available for decryption whenever needed, providing a seamless and efficient user experience.
