export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl?: string;
  isCustom?: boolean;
  alchemyNetwork?: string;
}

export const PRESET_NETWORKS: Network[] = [
  {
    id: "mainnet",
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    symbol: "ETH",
    blockExplorerUrl: "https://etherscan.io",
    alchemyNetwork: "eth-mainnet",
    isCustom: false,
  },
  {
    id: "sepolia",
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    symbol: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    alchemyNetwork: "eth-sepolia",
    isCustom: false,
  },
  {
    id: "bsc",
    name: "BNB Smart Chain",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    symbol: "BNB",
    blockExplorerUrl: "https://bscscan.com",
    alchemyNetwork: "bnb-mainnet",
    isCustom: false,
  },
  {
    id: "bsc-testnet",
    name: "BNB Smart Chain Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    symbol: "tBNB",
    blockExplorerUrl: "https://testnet.bscscan.com",
    alchemyNetwork: "bnb-testnet",
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
