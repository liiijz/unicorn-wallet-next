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
  private currentNetwork: Network | null = null;

  constructor() {
    // 默认连接到以太坊主网
    this.provider = new ethers.JsonRpcProvider(PRESET_NETWORKS[0].rpcUrl);
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

    this.currentNetwork = network;

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
  async createNewWallet(password: string): Promise<string> {
    useWalletStore.setState({ walletStatus: 'creating', password });

    // 创建 HD Keyring
    const { keyring, mnemonic } = keyringService.createNewHDKeyring(1);
    
    // 持久化
    await keyringService.persistVault([keyring], password);
    
    // 生成 accounts
    const accounts = this.generateAccountsFromKeyrings([keyring]);
    
    // 更新 Store
    useWalletStore.setState({
      keyrings: [keyring],
      accounts,
      currentAccount: accounts[0],
      walletStatus: 'showing-mnemonic',
    });
    
    // 持久化账户元数据
    this.persistAccountMetadata(accounts);
    
    walletEventBus.emit('keyring:created', { keyrings: [keyring] });
    
    return mnemonic;
  }

  /**
   * 导入钱包
   */
  async importWallet(mnemonic: string, password: string): Promise<void> {
    const currentState = useWalletStore.getState();
    const existingKeyrings = currentState.keyrings;
    
    useWalletStore.setState({ walletStatus: 'importing', password });

    // 从助记词创建 HD Keyring
    const newKeyring = keyringService.createHDKeyringFromMnemonic(mnemonic, 1);
    
    // 合并现有 keyrings 和新 keyring
    const allKeyrings = [...existingKeyrings, newKeyring];
    
    // 持久化所有 keyrings
    await keyringService.persistVault(allKeyrings, password);
    
    // 重新生成所有 accounts
    const accounts = this.generateAccountsFromKeyrings(allKeyrings);
    
    // 更新 Store
    useWalletStore.setState({
      keyrings: allKeyrings,
      accounts,
      currentAccount: accounts[0], // 保持第一个账户为当前账户
      walletStatus: 'unlocked',
    });
    
    this.persistAccountMetadata(accounts);
    
    walletEventBus.emit('keyring:imported', { keyrings: allKeyrings });
  }

  /**
   * 解锁钱包
   */
  async unlock(password: string): Promise<void> {
    useWalletStore.setState({ walletStatus: 'unlocking', password });
    
    // 恢复 Keyrings
    const keyrings = keyringService.restoreVault(password);
    if (!keyrings) {
      useWalletStore.setState({ walletStatus: 'locked', password: null });
      throw new Error('Invalid password or vault not found');
    }
    
    // 生成 accounts
    const accounts = this.generateAccountsFromKeyrings(keyrings);
    
    // 恢复用户自定义的账户名称
    this.restoreAccountMetadata(accounts);
    
    // 更新 Store
    useWalletStore.setState({
      keyrings,
      accounts,
      currentAccount: accounts[0],
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
   * 从 Keyrings 生成 Account 列表
   */
  private generateAccountsFromKeyrings(keyrings: IKeyring[]): Account[] {
    const accounts: Account[] = [];
    let accountCount = 0;
    
    keyrings.forEach((keyring) => {
      const addresses = keyring.getAddresses();
      const keyringData = keyring.serialize();
      
      addresses.forEach((address, index) => {
        accounts.push({
          id: `${keyring.type}-${address}`,
          address,
          name: `Account ${accountCount + 1}`,
          type: this.mapKeyringTypeToAccountType(keyring.type),
          derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${index}` : null,
          accountIndex: index,
          createdAt: Date.now(),
        });
        accountCount++;
      });
    });
    
    return accounts;
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
      this.persistAccountMetadata(accounts);
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
  async addAccount(): Promise<void> {
    const { keyrings, password } = useWalletStore.getState();
    if (!password) throw new Error('No password set');
    
    const keyring = keyrings[0];
    if (!keyring) throw new Error('No keyring found');
    
    // 派生新地址 (如果是 HD Keyring)
    if ('deriveAddresses' in keyring) {
      await (keyring as any).deriveAddresses(1);
    }
    
    // 持久化 Keyring
    await keyringService.persistVault(keyrings, password);
    
    // 重新生成 accounts
    const accounts = this.generateAccountsFromKeyrings(keyrings);
    
    useWalletStore.setState({ keyrings: [...keyrings], accounts });
    this.persistAccountMetadata(accounts);
  }

  /**
   * 持久化账户元数据 (只存用户自定义的名称)
   */
  private persistAccountMetadata(accounts: Account[]): void {
    const metadata = accounts.map(acc => ({
      address: acc.address,
      name: acc.name,
    }));
    localStorage.setItem('account-metadata', JSON.stringify(metadata));
  }

  /**
   * 恢复账户元数据 (合并用户自定义的名称)
   */
  private restoreAccountMetadata(accounts: Account[]): void {
    const dataString = localStorage.getItem('account-metadata');
    if (!dataString) return;
    
    try {
      const metadata = JSON.parse(dataString);
      accounts.forEach(account => {
        const saved = metadata.find((m: any) => 
          m.address.toLowerCase() === account.address.toLowerCase()
        );
        if (saved) {
          account.name = saved.name;
        }
      });
    } catch (error) {
      console.error('Failed to restore account metadata:', error);
    }
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
