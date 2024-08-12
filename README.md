<br/>

<p align="center">
  <a href="https://subnets.avax.network/">
      <picture>
                <img alt="Avalanche Logo" src="https://images.ctfassets.net/gcj8jwzm6086/Gse8dqDEnJtT87RsbbEf4/1609daeb09e9db4a6617d44623028356/Avalanche_Horizontal_White.svg" width="auto" height="60">
      </picture>
</a>
</p>

<h1 align="center">EERC Sdk</h1>
<p align="center">
  This is an official Ava Labs repo for the EERC SDK.
</p>

## Getting Started 🚀

```sh
bun install        # installs dependencies
bun run build      # build
bun test           # run tests
```

## Overview 📚

This library provides tools and utilities to facilitate the interaction with the EERC protocol in the blockchain from the browser. The SDK is designed to simplify integration of the EERC into a client's dApps, enabling developers to leverage the protocol's features and capabilities easily. The SDK includes a range of functions and components that can interact with the protocol, such as registering and initializing users, minting, burning, and transferring encrypted tokens, and decrypting encrypted balances.

## Hooks 
### useEERC

`useEERC`: The `useEERC` hooks is designed to manage interactions with the EERC protocol on the blockchain. And it also serve the `useEncryptedBalance` hooks to manage the encrypted balance of the user. [Source code](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/hooks/useEERC.tsx)

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

#### API

- Parameters
  - `client`: Wagmi public client
  - `walletClient`: Wagmi wallet client for sending transactions
  - `contractAddress`: The address of the EERC contract.
  - `decryptionKey` (optional): The decryption key for decrypting the encrypted balance. If not provided, after user try to registers, this key will be generated and set automatically.

### useEncryptedBalance

`useEncryptedBalance`: The `useEncryptedBalance` is designed to manage encrypted balances within the EERC protocol on the blockchain. It provides an interface for interacting with encrypted tokens, handling tasks such as decryption, minting, burning, transferring, depositing, and withdrawing tokens. This hook ensures that encrypted balances are managed securely and efficiently, leveraging the cryptographic functions provided by the EERC contract. [Source code](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/hooks/useEncryptedBalance.tsx)

```javascript
import React from 'react';
import {useEERC} from '@avalabs/ac-eerc-sdk';

const MyComponent = ({
  client : PublicClient,
  walletClient : WalletClient,
  contractAddress : string,
  decryptionKey? : string
}) => {
  const {
      useEncryptedBalance,
    } = useEERC(client, wallet, contractAddress, decryptionKey);

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

#### API

- Parameters
  - `tokenAddress` (optional): The address of ERC20 contract for withdrawing and depositing tokens. If not provided, means that EERC is stand-alone.

- Returns
  - `decryptedBalance`: The decrypted balance of the user.
  - `parsedDecryptedBalance`: The decrypted balance of the user, parsed as a number.
  - `encryptedBalance`: The encrypted balance of the user.
  - `isDecrypting`: A boolean value that indicates whether the balance is being decrypted.
  - `auditorPublicKey`: The public key of the auditor.
  - `privateMint`: A function that mints tokens privately. (stand-alone only)
  - `privateBurn`: A function that burns tokens privately. (stand-alone only)
  - `privateTransfer`: A function that transfers tokens privately. (both stand-alone and integrated versions)
  - `withdraw`: A function that withdraws tokens from the EERC contract. (converter only)
  - `deposit`: A function that deposits tokens into the EERC contract. (converter only)

## Components 🧩

### Storage of Lookup Table

The [IndexedDBStorage](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/helpers/storage.ts) class is designed to efficiently manage the storage of a lookup table required for the decryption process in our protocol. This lookup table is essential for decryption, but repeatedly downloading it can be inefficient. To address this, the class encodes the lookup table using msgpack, then splits the encoded data into 2MB chunks to store it in the browser’s IndexedDB. By breaking down the data into manageable pieces, the class ensures that the entire lookup table can be stored locally. When needed, the stored chunks are retrieved, reassembled, and decoded, allowing the application to reconstruct the lookup table quickly without requiring repeated downloads. This approach not only enhances performance by reducing network overhead but also ensures that the lookup table is readily available for decryption whenever needed, providing a seamless and efficient user experience.

### Key Derivation
The [package](https://github.com/ava-labs/ac-eerc-sdk/blob/main/src/crypto/key.ts) implements a key derivation strategy that ensures cryptographic keys are securely derived from signatures or other input data. The methods provided in this package are designed to work within the constraints of cryptographic curves and fields, making sure that derived keys are both secure and compatible with the underlying cryptographic operations. User sign a pre-defined message with their private key, and the signature is used to derive a new key that can be used for encryption or decryption. This approach ensures that the derived key is cryptographically secure and can be used safely within the EERC protocol.An attacker who gain access to a derived key only decrypt the encrypted balance of the user, but they can't do any operation on behalf of the user.