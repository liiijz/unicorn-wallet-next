import { Network, PRESET_NETWORKS, CustomNetworkConfig } from '../types/Network';

export class NetworkController {
  private currentNetwork: Network;
  private customNetworks: Network[] = [];
  private networkChangeListeners: Set<(network: Network) => void> = new Set();

  constructor() {
    // Default to Ethereum Mainnet
    this.currentNetwork = PRESET_NETWORKS[0];
    this.loadCustomNetworks();
  }

  /**
   * Get the current active network
   */
  getCurrentNetwork(): Network {
    return this.currentNetwork;
  }

  /**
   * Get all available networks (preset + custom)
   */
  getAllNetworks(): Network[] {
    return [...PRESET_NETWORKS, ...this.customNetworks];
  }

  /**
   * Get only custom networks
   */
  getCustomNetworks(): Network[] {
    return this.customNetworks;
  }

  /**
   * Switch to a different network by ID
   */
  async switchNetwork(networkId: string): Promise<void> {
    const allNetworks = this.getAllNetworks();
    const network = allNetworks.find(n => n.id === networkId);

    if (!network) {
      throw new Error(`Network with id "${networkId}" not found`);
    }

    this.currentNetwork = network;
    this.saveCurrentNetwork();
    this.notifyNetworkChange(network);
  }

  /**
   * Add a custom network
   */
  addCustomNetwork(config: CustomNetworkConfig): Network {
    // Validate RPC URL format
    if (!this.isValidUrl(config.rpcUrl)) {
      throw new Error('Invalid RPC URL format');
    }

    // Check if chain ID already exists
    const allNetworks = this.getAllNetworks();
    if (allNetworks.some(n => n.chainId === config.chainId)) {
      throw new Error(`Network with chain ID ${config.chainId} already exists`);
    }

    const customNetwork: Network = {
      id: `custom-${Date.now()}`,
      name: config.name,
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      symbol: config.symbol,
      blockExplorerUrl: config.blockExplorerUrl,
      isCustom: true,
    };

    this.customNetworks.push(customNetwork);
    this.saveCustomNetworks();

    return customNetwork;
  }

  /**
   * Remove a custom network
   */
  removeCustomNetwork(networkId: string): void {
    const index = this.customNetworks.findIndex(n => n.id === networkId);

    if (index === -1) {
      throw new Error(`Custom network with id "${networkId}" not found`);
    }

    // If removing the current network, switch to mainnet
    if (this.currentNetwork.id === networkId) {
      this.switchNetwork(PRESET_NETWORKS[0].id);
    }

    this.customNetworks.splice(index, 1);
    this.saveCustomNetworks();
  }

  /**
   * Update a custom network configuration
   */
  updateCustomNetwork(networkId: string, config: Partial<CustomNetworkConfig>): void {
    const network = this.customNetworks.find(n => n.id === networkId);

    if (!network) {
      throw new Error(`Custom network with id "${networkId}" not found`);
    }

    if (config.rpcUrl && !this.isValidUrl(config.rpcUrl)) {
      throw new Error('Invalid RPC URL format');
    }

    Object.assign(network, config);
    this.saveCustomNetworks();

    // If updating the current network, notify listeners
    if (this.currentNetwork.id === networkId) {
      this.notifyNetworkChange(network);
    }
  }

  /**
   * Register a listener for network changes
   */
  onNetworkChange(listener: (network: Network) => void): () => void {
    this.networkChangeListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.networkChangeListeners.delete(listener);
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Notify all listeners of network change
   */
  private notifyNetworkChange(network: Network): void {
    this.networkChangeListeners.forEach(listener => {
      try {
        listener(network);
      } catch (error) {
        console.error('Error in network change listener:', error);
      }
    });
  }

  /**
   * Load custom networks from localStorage
   */
  private loadCustomNetworks(): void {
    try {
      const stored = localStorage.getItem('customNetworks');
      if (stored) {
        this.customNetworks = JSON.parse(stored);
      }

      const currentNetworkId = localStorage.getItem('currentNetworkId');
      if (currentNetworkId) {
        const allNetworks = this.getAllNetworks();
        const network = allNetworks.find(n => n.id === currentNetworkId);
        if (network) {
          this.currentNetwork = network;
        }
      }
    } catch (error) {
      console.error('Error loading custom networks:', error);
      this.customNetworks = [];
    }
  }

  /**
   * Save custom networks to localStorage
   */
  private saveCustomNetworks(): void {
    try {
      localStorage.setItem('customNetworks', JSON.stringify(this.customNetworks));
    } catch (error) {
      console.error('Error saving custom networks:', error);
    }
  }

  /**
   * Save current network to localStorage
   */
  private saveCurrentNetwork(): void {
    try {
      localStorage.setItem('currentNetworkId', this.currentNetwork.id);
    } catch (error) {
      console.error('Error saving current network:', error);
    }
  }
}

export default NetworkController;
