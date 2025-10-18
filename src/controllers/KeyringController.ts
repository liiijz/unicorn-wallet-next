import { HDKeyringOptions } from "./../types/HDKeyring";
import type { IKeyring } from "@/types/Keyring";
import { WalletService } from "@/services/WalletService";
import { HDKeyring } from "@/types/HDKeyring";
import { walletEventBus } from "@/events/WalletEvents";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { BaseWallet } from "ethers";
import { Network } from "@/types/Network";
import { PRESET_NETWORKS } from "@/types/Network";

export class KeyringController {
  private keyrings: IKeyring[] = [];
  private password?: string;
  private provider: JsonRpcProvider | null = null;
  private currentNetwork: Network | null = null;

  private walletService: WalletService;
  constructor() {
    this.walletService = new WalletService();

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

  setPassword(password: string): void {
    this.password = password;
  }

  /**
   * 创建新钱包（从助记词）
   */
  createNew(): string {
    // 1. 生成助记词
    const mnemonic = this.walletService.generateMnemonic();

    // 2. 创建 HD Keyring
    const opts: HDKeyringOptions = {
      mnemonic,
      numberOfAccounts: 1,
    };
    const hdKeyring = new HDKeyring(opts);
    this.keyrings.push(hdKeyring);

    // 3. 发布事件：钱包已创建
    walletEventBus.emit("keyring:created", {
      keyrings: this.getKeyrings(),
    });

    return mnemonic;
  }

  /**
   * 导入钱包（从助记词）
   */
  importFromMnemonic(mnemonic: string): void {
    const opts: HDKeyringOptions = {
      mnemonic,
      numberOfAccounts: 1,
    };
    const hdKeyring = new HDKeyring(opts);
    this.keyrings.push(hdKeyring);

    // 发布事件：钱包已导入
    walletEventBus.emit("keyring:imported", {
      keyrings: this.getKeyrings(),
    });
  }

  /**
   * 序列化所有 keyrings（加密前）
   */
  private serializeKeyrings(): any[] {
    return this.keyrings.map((keyring) => ({
      ...keyring.serialize(),
    }));
  }

  persistVault(): void {
    if (!this.password) {
      throw new Error("No password set");
    }
    const serialized = this.serializeKeyrings();
    const encrypted = this.walletService.encryptVault(JSON.stringify(serialized), this.password);
    localStorage.setItem("KeyringController", JSON.stringify({ vault: encrypted }));
  }

  /**
   * 从存储恢复并解密
   */
  restoreVault(): void {
    if (!this.password) {
      throw new Error("No password set");
    }
    // 从 localStorage 读取
    const dataString = localStorage.getItem("KeyringController");
    if (!dataString) {
      throw new Error("No vault found");
    }

    // 清空 keyrings
    this.keyrings = [];

    // 解密并恢复 keyrings
    const data = JSON.parse(dataString);
    const decrypted = this.walletService.decryptVault(data.vault, this.password);
    const keyrings = JSON.parse(decrypted);
    keyrings.forEach((kr: any) => {
      const keyring: IKeyring = new HDKeyring();
      keyring.deserialize(kr);
      this.keyrings.push(keyring);
    });

    // 发布事件：钱包已恢复
    walletEventBus.emit("keyring:restored", {
      keyrings: this.getKeyrings(),
    });
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
    const newAddresses = await keyring.addAccounts(1);

    // 持久化
    this.persistVault();

    // 发布事件：账户已添加
    walletEventBus.emit("keyring:accountAdded", {
      keyringIndex,
      addresses: newAddresses,
    });

    return newAddresses;
  }

  /**
   * 锁定钱包
   */
  lock(): void {
    this.keyrings = [];
    this.password = undefined;

    // 发布事件：钱包已锁定
    walletEventBus.emit("keyring:locked");
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
}
