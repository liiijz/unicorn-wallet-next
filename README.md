# Unicorn Wallet

  

<div align="center">

  

![Unicorn Wallet](public/images/ic-unicorn.png)

  

**A Modern, Secure Ethereum Wallet Built with Next.js**

  

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

[![Ethers.js](https://img.shields.io/badge/Ethers.js-6.15.0-purple)](https://docs.ethers.org/)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

  

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Security](#security) • [Contributing](#contributing)

  

</div>

  

---

  

## 📖 Overview

  

Unicorn Wallet is a **non-custodial Ethereum wallet** that provides a secure and intuitive interface for managing your digital assets. Built with modern web technologies, it supports multiple networks and offers a seamless user experience.

  

### Why Unicorn Wallet?

  

- 🔐 **Security First**: BIP39 mnemonic generation, AES-256-CBC encryption, PBKDF2 key derivation

- 🌐 **Multi-Network**: Ethereum, Sepolia, Goerli, BSC, and custom network support

- 🎨 **Modern UI**: Beautiful, responsive design with dark mode

- 🌍 **i18n Ready**: Multi-language support (English, Chinese)

- ⚡ **Fast & Lightweight**: Built with Next.js 15 and React 19

- 🔓 **Non-Custodial**: Your keys, your crypto - we never store your private keys

  

---

  

## ✨ Features

  

### Core Wallet Features

- ✅ Create new HD wallet with BIP39 mnemonic (12 words)

- ✅ Import existing wallet from mnemonic phrase

- ✅ Multi-account support (HD derivation path: m/44'/60'/0'/0/n)

- ✅ Secure local storage with encrypted vault

- ✅ Lock/Unlock wallet functionality

- ✅ Send ETH/BNB transactions

- ✅ Real-time balance updates

- ✅ Transaction history tracking

  

### Network Support

- 🌐 Ethereum Mainnet

- 🧪 Sepolia Testnet

- 🧪 Goerli Testnet

- 💎 BNB Smart Chain (BSC)

- 🧪 BSC Testnet

- 🏠 Localhost (for development)

- ➕ Custom network configuration

  

### User Experience

- 🎨 Beautiful gradient UI with glassmorphism effects

- 📱 Responsive design (mobile & desktop)

- 🌙 Dark mode by default

- 🌍 Language switcher (EN/中文)

- 📊 Market data visualization with Recharts

- 🔔 Toast notifications for actions

- 👤 Avatar generation for accounts

- 📋 Copy addresses with one click

  

### Security Features

- 🔐 Client-side encryption (AES-256-CBC)

- 🔑 PBKDF2 key derivation (100,000 iterations)

- 🛡️ No password requirement for import (optional)

- 🔒 Auto-lock on refresh (vault encrypted in localStorage)

- ✅ Signature verification for transactions

- 🚫 No server-side key storage

  

---

  

## 🚀 Installation

  

### Prerequisites

  

- **Node.js** 20.x or higher

- **npm** or **yarn** package manager

  

### Quick Start

  

1. **Clone the repository**

   ```bash

   git clone https://github.com/yourusername/unicorn-wallet-next.git

   cd unicorn-wallet-next

   ```

  

2. **Install dependencies**

   ```bash

   npm install

   ```

  

3. **Run development server**

   ```bash

   npm run dev

   ```

  

4. **Open your browser**

   ```

   http://localhost:3000

   ```

  

### Build for Production

  

```bash

# Build the application

npm run build

  

# Start production server

npm start

```

  

---

  

## 📱 Usage

  

### Creating a New Wallet

  

1. Click **"Create New Wallet"** on the welcome screen

2. Enter a password (min. 8 characters) to encrypt your wallet

3. **Save your 12-word mnemonic phrase** securely

4. Confirm and access your wallet

  

### Importing an Existing Wallet

  

1. Click **"Import Wallet"** on the welcome screen

2. Enter your 12-word mnemonic phrase

3. (Optional) Set a password for encryption

4. Access your wallet

  

### Sending Transactions

  

1. Click the **Send** button on the wallet home

2. Enter recipient address

3. Enter amount to send

4. Review transaction details and gas fees

5. Confirm and wait for transaction confirmation

  

### Adding Custom Networks

  

1. Click the network selector dropdown

2. Select **"Add Network"**

3. Enter network details (Name, Chain ID, RPC URL, Symbol)

4. Save and switch to the new network

  

---

  

## 🏗️ Architecture

  

### Tech Stack

  

```

Frontend:

├── Next.js 15.5.4         # React framework with App Router

├── React 19.1.0           # UI library

├── TypeScript 5           # Type safety

├── Tailwind CSS 4         # Styling

└── Zustand 5.0.8          # State management

  

Blockchain:

├── ethers.js 6.15.0       # Ethereum library

├── bip39 3.1.0            # Mnemonic generation

└── crypto-js 4.2.0        # Encryption

  

UI/UX:

├── react-icons 5.5.0      # Icons

├── recharts 3.2.1         # Charts

├── i18next 25.5.2         # Internationalization

└── mitt 3.0.1             # Event bus

```

  

### Project Structure

  

```

unicorn-wallet-next/

├── src/

│   ├── app/                    # Next.js App Router

│   │   ├── layout.tsx          # Root layout

│   │   └── page.tsx            # Main page (routing logic)

│   │

│   ├── components/             # React components

│   │   ├── Welcome.tsx         # Welcome screen

│   │   ├── Unlock.tsx          # Unlock wallet screen

│   │   ├── WalletHome.tsx      # Main wallet interface

│   │   ├── SendModal.tsx       # Send transaction modal

│   │   ├── WalletAssets.tsx    # Asset display component

│   │   ├── Notification.tsx    # Toast notifications

│   │   └── LanguageSwitcher.tsx

│   │

│   ├── controllers/            # Business logic controllers

│   │   ├── KeyringController.ts    # Keyring management

│   │   ├── AccountController.ts    # Account management

│   │   └── NetworkController.ts    # Network management

│   │

│   ├── services/               # Services

│   │   └── WalletService.ts    # Wallet encryption/decryption

│   │

│   ├── stores/                 # Zustand stores

│   │   ├── walletStore.ts      # Wallet state

│   │   └── uiStore.ts          # UI state

│   │

│   ├── hooks/                  # Custom React hooks

│   │   └── wallet/

│   │       ├── useWalletAuth.ts     # Wallet authentication

│   │       └── useWalletAccounts.ts # Account management

│   │

│   ├── types/                  # TypeScript types

│   │   ├── Wallet.ts

│   │   ├── Account.ts

│   │   ├── Network.ts

│   │   ├── Keyring.ts

│   │   └── HDKeyring.ts

│   │

│   ├── events/                 # Event bus

│   │   └── WalletEvents.ts     # Wallet event definitions

│   │

│   └── i18n/                   # Internationalization

│       └── config.ts

│

├── public/                     # Static assets

│   ├── unicorn.png

│   └── logo.svg

│

├── docs/                       # Documentation

│   ├── API_SECURITY_STRATEGY.md

│   └── GO_WEB3_LIBRARIES.md

│

└── package.json

```

  

### Key Components

  

#### Controllers Layer

- **KeyringController**: Manages HD keyrings, account derivation, and transaction signing

- **AccountController**: Handles account CRUD operations and persistence

- **NetworkController**: Manages network switching and RPC connections

  

#### Service Layer

- **WalletService**: Handles encryption/decryption using AES-256-CBC and PBKDF2

  

#### State Management

- **walletStore**: Global wallet state (isInitialized, isUnlocked, accounts)

- **uiStore**: UI state (loading, modals)

  

#### Event System

- **WalletEvents**: Event-driven architecture using `mitt` for component communication

  

---

  

## 🔐 Security

  

### Encryption Details

  

```typescript

Algorithm: AES-256-CBC

Key Derivation: PBKDF2

Iterations: 100,000 (MetaMask compatible)

Salt: 16 bytes (random)

IV: 16 bytes (random)

```

  

### Security Best Practices

  

✅ **Do's**

- ✅ Save your mnemonic phrase securely offline

- ✅ Use a strong password for wallet encryption

- ✅ Verify recipient addresses before sending

- ✅ Keep your browser and dependencies updated

- ✅ Only use trusted RPC endpoints

  

❌ **Don'ts**

- ❌ Never share your mnemonic phrase or private keys

- ❌ Don't store mnemonic in screenshots or cloud storage

- ❌ Don't use the wallet on public/shared computers

- ❌ Don't trust browser extensions requesting your mnemonic

- ❌ Don't send transactions to unverified addresses

  

### Security Audit

  

We use **Gitleaks** to scan for secrets in the codebase:

  

```bash

gitleaks detect --source . --verbose

```

  

**Last Scan:** ✅ No sensitive information found

  

---

  

## 🧪 Development

  

### Running Tests

  

```bash

# Run test file

npm run test

  

# TypeScript type checking

npx tsc --noEmit

```

  

### Environment Variables

  

Create a `.env.local` file (optional):

  

```env

# Analytics (optional)

NEXT_PUBLIC_VERCEL_ANALYTICS=true

  

# Custom RPC endpoints (optional)

NEXT_PUBLIC_ETH_RPC_URL=https://eth.llamarpc.com

```

  

### Code Style

  

- **TypeScript** for type safety

- **ESLint** for linting

- **Prettier** for code formatting

- **Conventional Commits** for commit messages

  

### Debug Mode

  

```typescript

// Enable console logs in development

if (process.env.NODE_ENV !== 'production') {

  console.log('Debug info');

}

```

  

---

  

## 📚 API Reference

  

### KeyringController

  

```typescript

class KeyringController {

  createNew(): string;                          // Create new wallet, returns mnemonic

  importFromMnemonic(mnemonic: string): void;   // Import wallet

  setPassword(password: string): void;          // Set encryption password

  persistVault(): void;                         // Save encrypted vault

  restoreVault(): void;                         // Restore from encrypted vault

  lock(): void;                                 // Lock wallet

  addAccountToKeyring(): Promise<string[]>;     // Add new account

  sendTransaction(from, to, value): Promise<string>; // Send transaction

}

```

  

### AccountController

  

```typescript

class AccountController {

  createAccount(address: string, name?: string): Account;

  getAccountByAddress(address: string): Account | undefined;

  getAllAccounts(): Account[];

  updateAccountName(address: string, newName: string): void;

  saveAccounts(): void;

  loadAccounts(): void;

}

```

  

### NetworkController

  

```typescript

class NetworkController {

  switchNetwork(network: Network): void;

  getCurrentNetwork(): Network;

  addCustomNetwork(config: CustomNetworkConfig): void;

  getCustomNetworks(): Network[];

}

```

  

---

  

## 🌍 Internationalization

  

### Supported Languages

  

- 🇺🇸 English (en-US)

- 🇨🇳 中文 (zh-CN)

  

### Adding New Languages

  

1. Create translation file in `public/locales/{lang}/translation.json`

2. Add language to `src/i18n/config.ts`

3. Update LanguageSwitcher component

  

---

  

## 🤝 Contributing

  

We welcome contributions! Please follow these steps:

  

1. **Fork the repository**

2. **Create a feature branch**

   ```bash

   git checkout -b feature/amazing-feature

   ```

3. **Commit your changes**

   ```bash

   git commit -m 'feat: add amazing feature'

   ```

4. **Push to the branch**

   ```bash

   git push origin feature/amazing-feature

   ```

5. **Open a Pull Request**

  

### Commit Convention

  

We follow [Conventional Commits](https://www.conventionalcommits.org/):

  

```

feat: add new feature

fix: bug fix

docs: documentation updates

refactor: code refactoring

style: formatting changes

test: adding tests

chore: maintenance tasks

```

  

---

  

## 📝 Roadmap

  

- [ ] Token support (ERC-20)

- [ ] NFT gallery (ERC-721/1155)

- [ ] Hardware wallet integration

- [ ] WalletConnect support

- [ ] ENS name resolution

- [ ] Gas price estimation

- [ ] Multi-signature wallets

- [ ] Mobile app (React Native)

- [ ] Browser extension

  

---

  

## 📄 License

  

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

  

---

  

## 🙏 Acknowledgments

  

- [ethers.js](https://docs.ethers.org/) - Ethereum library

- [Next.js](https://nextjs.org/) - React framework

- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

- [MetaMask](https://metamask.io/) - Inspiration for encryption scheme

- [Vercel](https://vercel.com/) - Hosting platform

  

---

  

## 📧 Contact

  

- **GitHub**: [@yourusername](https://github.com/yourusername)

- **Issues**: [GitHub Issues](https://github.com/yourusername/unicorn-wallet-next/issues)

- **Discussions**: [GitHub Discussions](https://github.com/yourusername/unicorn-wallet-next/discussions)

  

---

  

<div align="center">

  

**⭐ Star this repo if you find it helpful!**

  

Made with ❤️ by 0xJAMES

  

</div>