import { Network, PRESET_NETWORKS, CustomNetworkConfig } from "../types/Network";
import { walletEventBus } from "@/events/WalletEvents";
import { useWalletStore } from "@/stores/walletStore";

 class NetworkController {
  constructor() {
    this.loadCustomNetworks();
  }

  /**
   * Get the current active network
   */
  getCurrentNetwork(): Network {
    return useWalletStore.getState().currentNetwork;
  }

  /**
   * Get all available networks (preset + custom)
   */
  getAllNetworks(): Network[] {
    const { customNetworks } = useWalletStore.getState();
    return [...PRESET_NETWORKS, ...customNetworks];
  }

  /**
   * Get only custom networks
   */
  getCustomNetworks(): Network[] {
    return useWalletStore.getState().customNetworks;
  }

  /**
   * Switch to a different network by ID
   */
  async switchNetwork(networkId: string): Promise<void> {
    const allNetworks = this.getAllNetworks();
    const network = allNetworks.find((n) => n.id === networkId);

    if (!network) {
      throw new Error(`Network with id "${networkId}" not found`);
    }

    useWalletStore.setState({ currentNetwork: network });
    this.saveCurrentNetwork();
    this.notifyNetworkChange(network);
  }

  /**
   * Add a custom network
   */
  addCustomNetwork(config: CustomNetworkConfig): Network {
    // Validate RPC URL format
    if (!this.isValidUrl(config.rpcUrl)) {
      throw new Error("Invalid RPC URL format");
    }

    // Check if chain ID already exists
    const allNetworks = this.getAllNetworks();
    if (allNetworks.some((n) => n.chainId === config.chainId)) {
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

    const { customNetworks } = useWalletStore.getState();
    const updatedNetworks = [...customNetworks, customNetwork];
    useWalletStore.setState({ customNetworks: updatedNetworks });
    this.saveCustomNetworks();

    return customNetwork;
  }

  /**
   * Remove a custom network
   */
  removeCustomNetwork(networkId: string): void {
    const { customNetworks, currentNetwork } = useWalletStore.getState();
    const index = customNetworks.findIndex((n) => n.id === networkId);

    if (index === -1) {
      throw new Error(`Custom network with id "${networkId}" not found`);
    }

    // If removing the current network, switch to mainnet
    if (currentNetwork.id === networkId) {
      this.switchNetwork(PRESET_NETWORKS[0].id);
    }

    const updatedNetworks = customNetworks.filter((n) => n.id !== networkId);
    useWalletStore.setState({ customNetworks: updatedNetworks });
    this.saveCustomNetworks();
  }

  /**
   * Update a custom network configuration
   */
  updateCustomNetwork(networkId: string, config: Partial<CustomNetworkConfig>): void {
    const { customNetworks, currentNetwork } = useWalletStore.getState();
    const network = customNetworks.find((n) => n.id === networkId);

    if (!network) {
      throw new Error(`Custom network with id "${networkId}" not found`);
    }

    if (config.rpcUrl && !this.isValidUrl(config.rpcUrl)) {
      throw new Error("Invalid RPC URL format");
    }

    const updatedNetwork = { ...network, ...config };
    const updatedNetworks = customNetworks.map((n) =>
      n.id === networkId ? updatedNetwork : n
    );
    useWalletStore.setState({ customNetworks: updatedNetworks });
    this.saveCustomNetworks();

    // If updating the current network, notify listeners and update current network
    if (currentNetwork.id === networkId) {
      useWalletStore.setState({ currentNetwork: updatedNetwork });
      this.notifyNetworkChange(updatedNetwork);
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Notify all listeners of network change
   */
  private notifyNetworkChange(network: Network): void {
    walletEventBus.emit("network:changed", { network });
  }

  /**
   * Load custom networks from localStorage
   */
  private loadCustomNetworks(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem("customNetworks");
      if (stored) {
        const customNetworks = JSON.parse(stored);
        useWalletStore.setState({ customNetworks });
      }

      const currentNetworkId = localStorage.getItem("currentNetworkId");
      if (currentNetworkId) {
        const allNetworks = this.getAllNetworks();
        const network = allNetworks.find((n) => n.id === currentNetworkId);
        if (network) {
          useWalletStore.setState({ currentNetwork: network });
        }
      }
    } catch (error) {
      console.error("Error loading custom networks:", error);
      useWalletStore.setState({ customNetworks: [] });
    }
  }

  /**
   * Save custom networks to localStorage
   */
  private saveCustomNetworks(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const { customNetworks } = useWalletStore.getState();
      localStorage.setItem("customNetworks", JSON.stringify(customNetworks));
    } catch (error) {
      console.error("Error saving custom networks:", error);
    }
  }

  /**
   * Save current network to localStorage
   */
  private saveCurrentNetwork(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const { currentNetwork } = useWalletStore.getState();
      localStorage.setItem("currentNetworkId", currentNetwork.id);
    } catch (error) {
      console.error("Error saving current network:", error);
    }
  }
}

export const networkController = new NetworkController();
