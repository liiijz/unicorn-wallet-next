export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl?: string;
  isCustom?: boolean;
}

export const PRESET_NETWORKS: Network[] = [
  {
    id: 'mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    symbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isCustom: false,
  },
  {
    id: 'goerli',
    name: 'Goerli Testnet',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'GoerliETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    isCustom: false,
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'SepoliaETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isCustom: false,
  },
  {
    id: "bsc",
    name: "BNB Smart Chain",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    symbol: "BNB",
    blockExplorerUrl: "https://bscscan.com",
    isCustom: false,
  },
  {
    id: "bsc-testnet",
    name: "BNB Smart Chain Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    symbol: "tBNB",
    blockExplorerUrl: "https://testnet.bscscan.com",
    isCustom: false,
  },
  {
    id: "localhost",
    name: "Localhost",
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    symbol: 'ETH',
    isCustom: false,
  },
];

export interface CustomNetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl?: string;
}
