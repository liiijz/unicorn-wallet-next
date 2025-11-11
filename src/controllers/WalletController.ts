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
    console.log(`KeyringController: 网络切换到 ${network.name}`);

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

  // 解锁钱包
  async unlock2(password: string): Promise<boolean> {
    const store = useWalletStore.getState();
    store.setWalletStatus("unlocking");
    store.setPassword(password);

    // 订阅一次账户同步事件
    return new Promise<boolean>((resolve, reject) => {
      const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
        const keyrings = store.keyrings;

        // set({
        //   walletStatus: "unlocked",
        //   keyrings,
        //   accounts,
        //   currentAccount: accounts[0] || null,
        // });

        // 取消订阅
        walletEventBus.off("account:synced", handleAccountSynced);
        resolve(true);
      };

      walletEventBus.on("account:synced", handleAccountSynced);

      // restoreVault 会触发 keyring:restored 事件
      // AccountController 会自动响应并同步账户
      const restoredKeyrings = this.restoreVault(password);
      if (restoredKeyrings) {
        store.setKeyrings(restoredKeyrings);
      }
    });
  }

  unlock(password: string): boolean {
    const store = useWalletStore.getState();
    store.setWalletStatus("unlocking");
    store.setPassword(password);
    const restoredKeyrings = this.restoreVault(password);
    if (restoredKeyrings) {
      store.setKeyrings(restoredKeyrings);
      return true;
    }
    return false;
  }

  // 锁定钱包
  lock() {
    // 调用 keyringController.lock() 会触发 keyring:locked 事件
    // AccountController 会自动响应并清空账户
    useWalletStore.setState({
      walletStatus: "locked",
      keyrings: [],
      accounts: [],
      currentAccount: null,
    });

    // 发布事件：钱包已锁定
    walletEventBus.emit("keyring:locked");
  }

  // 创建新钱包

  async createNewWallet(password: string): Promise<string> {
    useWalletStore.setState({
      password,
      walletStatus: "creating",
    });

    // 订阅一次账户同步事件
    return new Promise<string>((resolve) => {
      // const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
      //   const keyrings = keyringController.getKeyrings();

      //   // ✅ 关键：只设置为 showing-mnemonic 状态，不设置为 unlocked
      //   set({
      //     walletStatus: "showing-mnemonic",
      //     keyrings,
      //     accounts,
      //     currentAccount: accounts[0] || null,
      //   });

      //   // 取消订阅
      //   walletEventBus.off("account:synced", handleAccountSynced);
      // };

      // walletEventBus.on("account:synced", handleAccountSynced);

      // createNew 会触发 keyring:created 事件
      // AccountController 会自动响应并同步账户
      const mnemonic = this.createNew();
      this.persistVault(password);
      resolve(mnemonic);
    });
  }

  /**
   * 创建新钱包（从助记词）
   */
  createNew(): string {
    const store = useWalletStore.getState();
    // 使用 KeyringService 创建新的 HD Keyring
    const { keyring, mnemonic } = keyringService.createNewHDKeyring(1);
    store.setKeyrings([...store.keyrings, keyring]);
    // 发布事件：钱包已创建
    walletEventBus.emit("keyring:created", {
      keyrings: store.keyrings,
    });
    return mnemonic;
  }

  /**
   * 导入钱包（从助记词）
   */
  importFromMnemonic(mnemonic: string): void {
    const store = useWalletStore.getState();
    // 使用 KeyringService 从助记词创建 HD Keyring
    const hdKeyring = keyringService.createHDKeyringFromMnemonic(mnemonic, 1);
    store.setKeyrings([...store.keyrings, hdKeyring]);

    // 发布事件：钱包已导入
    walletEventBus.emit("keyring:imported", {
      keyrings: this.getKeyrings(),
    });
  }

  /**
   * 序列化所有 keyrings（加密前）
   */
  private serializeKeyrings(): any[] {
    const { keyrings } = useWalletStore.getState();
    return keyrings.map((keyring) => ({
      ...keyring.serialize(),
    }));
  }

  persistVault(password: string): void {
    if (!password) {
      throw new Error("No password set");
    }
    const serialized = this.serializeKeyrings();
    keyringService.persistVault(serialized, password);
  }

  /**
   * 从存储恢复并解密
   */
  restoreVault(password: string): IKeyring[] | null {
    if (!password) {
      throw new Error("No password set");
    }
    const keyrings = keyringService.restoreVault(password);
    if (!keyrings) {
      return null;
    }

    // 发布事件：钱包已恢复
    walletEventBus.emit("keyring:restored", {
      keyrings: this.getKeyrings(),
    });

    return keyrings;
  }

  getKeyrings(): IKeyring[] {
    return this.keyrings;
  }

  /**
   * 添加账户到指定的 keyring
   */
  async addAccountToKeyring(keyringIndex: number = 0): Promise<string[]> {
    const keyring = this.keyrings[keyringIndex];
    if (!keyring) {
      throw new Error(`Keyring at index ${keyringIndex} not found`);
    }

    // 派生新账户
    const newAddresses = await keyring.addAddresses(1);

    // 持久化
    this.persistVault();

    // 发布事件：账户已添加
    walletEventBus.emit("keyring:accountAdded", {
      keyringIndex,
      addresses: newAddresses,
    });

    return newAddresses;
  }

  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * 获取连接到当前网络的钱包实例
   */
  getConnectedWallet(address: string): BaseWallet | null {
    if (!this.provider) {
      throw new Error("Provider 未初始化，请先切换网络");
    }

    this.provider.getNetwork().then((network) => {
      console.log("Network Info:", {
        name: network.name,
        chainId: network.chainId,
      });
    });

    // 从 keyrings 中找到对应的 HDNodeWallet
    for (const keyring of this.keyrings) {
      if (keyring instanceof HDKeyring) {
        const wallet = keyring.wallets.find((w) => w.address === address);
        if (wallet) {
          // 将钱包连接到当前 Provider
          return wallet.connect(this.provider);
        }
      }
    }

    return null;
  }

  async sendTransaction(fromAddress: string, to: string, value: string): Promise<string> {
    const wallet = this.getConnectedWallet(fromAddress);
    if (!wallet) {
      throw new Error(`钱包 ${fromAddress} 未找到`);
    }

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(value),
    });

    return tx.hash;
  }

  // 导入钱包
  async importWallet(mnemonic: string, password: string): Promise<void> {
    useWalletStore.setState({
      password,
      walletStatus: "importing",
    });

    // 订阅一次账户同步事件
    return new Promise<void>((resolve) => {
      const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
        const keyrings = useWalletStore.getState().keyrings;

        // 导入钱包直接设置为 unlocked（不需要显示助记词）
        useWalletStore.setState({
          walletStatus: "unlocked",
          accounts,
          currentAccount: accounts[0] || null,
        });

        // 取消订阅
        walletEventBus.off("account:synced", handleAccountSynced);
        resolve();
      };

      walletEventBus.on("account:synced", handleAccountSynced);

      // importFromMnemonic 会触发 keyring:imported 事件
      // AccountController 会自动响应并同步账户
      this.importFromMnemonic(mnemonic);
      this.persistVault(password);
    });
  }

  // 刷新钱包数据
  refreshWalletData() {
    const { keyringController } = get();
    const keyrings = keyringController.getKeyrings();

    // 触发 keyring:updated 事件（需要先添加这个事件）
    walletEventBus.emit("keyring:updated", {
      keyrings,
    });

    // 由于没有订阅 keyring:updated，这里需要手动获取 accounts
    const { accounts } = get();

    set({
      keyrings,
      accounts,
      currentAccount: accounts[0] || null,
    });
  }
}

export const walletController = new WalletController();
