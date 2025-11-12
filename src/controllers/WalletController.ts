import type { IKeyring } from "@/types/Keyring";
import { HDKeyring } from "@/types/HDKeyring";
import { walletEventBus } from "@/events/WalletEvents";
import { ethers, JsonRpcProvider } from "ethers";
import { BaseWallet } from "ethers";
import { Network } from "@/types/Network";
import { PRESET_NETWORKS } from "@/types/Network";
import { keyringService } from "@/services/KeyringService";
import { useWalletStore } from "@/stores";
import { Account } from "@/types/Account";

class WalletController {
  private provider: JsonRpcProvider | null = null;

  constructor() {
    // 默认连接到以太坊主网
    const { currentNetwork } = useWalletStore.getState();
    this.provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
    // 订阅网络切换事件
    this.subscribeToNetworkEvents();
  }

  subscribeToNetworkEvents() {
    walletEventBus.on("network:changed", ({ network }) => {
      this.handleNetworkChange(network);
    });
  }

  private async handleNetworkChange(network: Network): Promise<void> {
    console.log(`WalletController: 网络切换到 ${network.name}`);

    // 创建新的 Provider
    this.provider = new ethers.JsonRpcProvider(network.rpcUrl);

    // 验证网络连接
    try {
      const chainId = await this.provider.getNetwork();
      if (Number(chainId.chainId) !== network.chainId) {
        console.warn(`Chain ID 不匹配: 期望 ${network.chainId}, 实际 ${chainId.chainId}`);
      }
    } catch (error) {
      console.error("网络连接验证失败:", error);
    }

    // 发布事件：Provider 已更新
    walletEventBus.emit("keyring:providerUpdated", {
      network,
      provider: this.provider,
    });
  }

  // ========== 钱包生命周期 ==========

  /**
   * 创建新钱包
   */
  createNewWallet(password: string): string {
    useWalletStore.setState({ walletStatus: 'creating', password });

    // 创建 HD Keyring (默认创建 1 个地址)
    const { keyring, mnemonic } = keyringService.createNewHDKeyring(1);
    
    // 持久化 Keyring (同步操作)
    keyringService.persistVault([keyring], password);
    
    // 创建初始账户
    const initialAccount = this.createNewAccount(keyring, 0);
    
    // 更新 Store (追加到 accounts)
    const { accounts: existingAccounts } = useWalletStore.getState();
    const accounts = [...existingAccounts, initialAccount];
    
    useWalletStore.setState({
      keyrings: [keyring],
      accounts,
      currentAccount: initialAccount,
      walletStatus: 'showing-mnemonic',
    });
    
    walletEventBus.emit('keyring:created', { keyrings: [keyring] });
    
    return mnemonic;
  }

  /**
   * 导入钱包
   */
  importWallet(mnemonic: string, password: string): void {
    const currentState = useWalletStore.getState();
    const existingKeyrings = currentState.keyrings;
    const existingAccounts = currentState.accounts;
    
    useWalletStore.setState({ walletStatus: 'importing', password });

    // 从助记词创建 HD Keyring (默认创建 1 个地址)
    const newKeyring = keyringService.createHDKeyringFromMnemonic(mnemonic, 1);
    
    // 合并现有 keyrings 和新 keyring
    const allKeyrings = [...existingKeyrings, newKeyring];
    
    // 持久化所有 keyrings (同步操作)
    keyringService.persistVault(allKeyrings, password);
    
    // 创建初始账户并追加到现有 accounts
    const newAccount = this.createNewAccount(newKeyring, 0);
    const accounts = [...existingAccounts, newAccount];
    
    // 更新 Store
    useWalletStore.setState({
      keyrings: allKeyrings,
      accounts,
      currentAccount: existingAccounts[0] || newAccount, // 保持第一个账户为当前账户
      walletStatus: 'unlocked',
    });
    
    walletEventBus.emit('keyring:imported', { keyrings: allKeyrings });
  }

  /**
   * 解锁钱包
   */
  unlock(password: string): void {
    useWalletStore.setState({ walletStatus: 'unlocking', password });
    
    // 恢复 Keyrings (同步操作)
    const keyrings = keyringService.restoreVault(password);
    if (!keyrings) {
      useWalletStore.setState({ walletStatus: 'locked', password: null });
      throw new Error('Invalid password or vault not found');
    }
    
    // 直接使用 Store 中持久化的 accounts (不再重新生成)
    const { accounts, currentAccount } = useWalletStore.getState();
    
    // 更新 Store (恢复 keyrings,保持 accounts 不变)
    useWalletStore.setState({
      keyrings,
      currentAccount: currentAccount || accounts[0],
      walletStatus: 'unlocked',
    });
    
    walletEventBus.emit('keyring:restored', { keyrings });
  }

  /**
   * 锁定钱包
   */
  lock(): void {
    useWalletStore.setState({
      walletStatus: 'locked',
      keyrings: [],
      accounts: [],
      currentAccount: null,
      password: null,
    });
    
    walletEventBus.emit('keyring:locked');
  }

  // ========== Account 管理 ==========

  /**
   * 创建单个新账户
   */
  private createNewAccount(keyring: IKeyring, accountIndex: number): Account {
    const addresses = keyring.getAddresses();
    const address = addresses[accountIndex];
    const keyringData = keyring.serialize();
    
    // 获取当前所有账户数量，用于生成默认名称
    const { accounts } = useWalletStore.getState();
    const accountCount = accounts.length;
    
    return {
      id: `${keyring.type}-${address}`,
      address,
      name: `Account ${accountCount + 1}`,
      type: this.mapKeyringTypeToAccountType(keyring.type),
      derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${accountIndex}` : null,
      accountIndex,
      createdAt: Date.now(),
    };
  }

  /**
   * 更新账户名称
   */
  updateAccountName(address: string, name: string): void {
    const { accounts } = useWalletStore.getState();
    const account = accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
    
    if (account) {
      account.name = name;
      useWalletStore.setState({ accounts: [...accounts] });
      // 账户已通过 Zustand persist 自动持久化,无需手动保存
    }
  }

  /**
   * 根据地址获取账户
   */
  getAccountByAddress(address: string): Account | undefined {
    const { accounts } = useWalletStore.getState();
    return accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * 添加新账户
   */
  addAccount(): Account {
    const { keyrings, password, accounts: existingAccounts } = useWalletStore.getState();
    if (!password) throw new Error('No password set');
    
    const keyring = keyrings[0];
    if (!keyring) throw new Error('No keyring found');
    
    const oldAddressCount = keyring.getAddresses().length;
    
    // 派生新地址 (同步操作)
    keyring.addAddresses(1);
    
    // 持久化 Keyring (同步操作)
    keyringService.persistVault(keyrings, password);
    
    // 创建新账户并追加到 Store
    const newAccount = this.createNewAccount(keyring, oldAddressCount);
    const accounts = [...existingAccounts, newAccount];
    
    useWalletStore.setState({ keyrings: [...keyrings], accounts });
    
    // 返回新创建的账户
    return newAccount;
  }

  /**
   * 映射 KeyringType 到 AccountType
   */
  private mapKeyringTypeToAccountType(keyringType: string): 'mnemonic' | 'privateKey' | 'hardware' {
    switch (keyringType) {
      case 'HD': return 'mnemonic';
      case 'Simple': return 'privateKey';
      case 'Hardware':
      case 'Ledger':
      case 'Trezor': return 'hardware';
      default: return 'mnemonic';
    }
  }

  // ========== Transaction ==========

  /**
   * 发送交易
   */
  async sendTransaction(fromAddress: string, to: string, value: string): Promise<string> {
    const { keyrings } = useWalletStore.getState();
    const wallet = this.getConnectedWallet(keyrings, fromAddress);
    
    if (!wallet) throw new Error(`Wallet ${fromAddress} not found`);
    
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(value),
    });
    
    return tx.hash;
  }

  /**
   * 获取连接到当前网络的钱包实例
   */
  private getConnectedWallet(keyrings: IKeyring[], address: string): BaseWallet | null {
    if (!this.provider) throw new Error("Provider not initialized");
    
    for (const keyring of keyrings) {
      if (keyring instanceof HDKeyring) {
        const wallet = keyring.wallets.find((w) => w.address === address);
        if (wallet) {
          return wallet.connect(this.provider);
        }
      }
    }
    
    return null;
  }

  /**
   * 获取 Provider
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }
}

export const walletController = new WalletController();
