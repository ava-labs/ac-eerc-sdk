# @avalabs/ac-eerc-sdk

To install dependencies:

```bash
bun install
```

To test:

```bash
bun test
```

To build:

```bash
bun run build
```


## Overview
The ac-eerc-sdk library provides tools and utilities to facilitate the interaction with the EERC protocol in the blockchain from the browser. The SDK is designed to simplify integration of the EERC into a client's dApps, enabling developers to leverage the protocol's features and capabilities easily. The SDK includes a range of functions and components that can interact with the protocol, such as registering and initializing users, minting, burning, and transferring encrypted tokens, and decrypting encrypted balances.

# Hooks
Since this SDK is designed for the ReactJS based browser application, hooks are the most crucial part of the SDK.

## `useEERC`
### Overview
The `useEERC` hooks is designed to manage interactions with the EERC protocol on the blockchain. And it also serve the `useEncryptedBalance` hooks to manage the encrypted balance of the user. [Source code](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/hooks/useEERC.tsx)

### Usage
```js
const MyComponent = ({
  client : PublicClient, 
  walletClient : WalletClient, 
  contractAddress : string, 
  decryptionKey : string
}) => {
  const {
      isInitialized,
      isRegistered,
      name,
      symbol,
      register,
      setAuditor,
      setMyselfAsAuditor,
      auditorDecrypt,
      useEncryptedBalance,
    } = useEERC(client, wallet, contractAddress);

  ....
}
```

## `useEncryptedBalance`

### Overview

The `useEncryptedBalance` hook is designed to manage encrypted balances within the EERC protocol on the blockchain. It provides an interface for interacting with encrypted tokens, handling tasks such as decryption, minting, burning, transferring, depositing, and withdrawing tokens. This hook ensures that encrypted balances are managed securely and efficiently, leveraging the cryptographic functions provided by the EERC contract. [Source code](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/hooks/useEncryptedBalance.tsx)

### Usage

```javascript
import React from 'react';
import {useEERC} from '@avalabs/ac-eerc-sdk';

const MyComponent = ({
  client : PublicClient, 
  walletClient : WalletClient, 
  contractAddress : string, 
  decryptionKey : string
}) => {
  const {
      useEncryptedBalance,
    } = useEERC(client, wallet, contractAddress);
    
  const {
    decryptedBalance,
    parsedDecryptedBalance,
    encryptedBalance,
    isDecrypting,
    auditorPublicKey,
    privateMint,
    privateBurn,
    privateTransfer,
    withdraw,
    deposit,
  } = useEncryptedBalance(tokenAddress?);

  // Example usage here...
  const handleMint = (amount) => {
    privateMint(amount);
  };

  const handleTransfer = (amount) => {
    const toAddress = '0xRecipientAddress';
    privateTransfer(toAddress, amount);
  };

  ...
```



# Components
## Storage of Lookup Table
The [IndexedDBStorage](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/helpers/storage.ts) class is designed to efficiently manage the storage of a lookup table required for the decryption process in our protocol. This lookup table is essential for decryption, but repeatedly downloading it can be inefficient. To address this, the class encodes the lookup table using msgpack, then splits the encoded data into 2MB chunks to store it in the browser’s IndexedDB. By breaking down the data into manageable pieces, the class ensures that the entire lookup table can be stored locally. When needed, the stored chunks are retrieved, reassembled, and decoded, allowing the application to reconstruct the lookup table quickly without requiring repeated downloads. This approach not only enhances performance by reducing network overhead but also ensures that the lookup table is readily available for decryption whenever needed, providing a seamless and efficient user experience.