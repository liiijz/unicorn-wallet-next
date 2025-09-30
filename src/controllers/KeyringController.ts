import { HDKeyringOptions } from './../types/HDKeyring';
import type { IKeyring } from "@/types/Keyring";
import { WalletService } from "@/services/WalletService";
import { HDKeyring } from "@/types/HDKeyring";
import { walletEventBus } from "@/events/WalletEvents";

export class KeyringController {
  private keyrings: IKeyring[] = [];
  private password?: string;

  private walletService: WalletService;
  constructor() {
    this.walletService = new WalletService();
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
    const opts:HDKeyringOptions = {
      mnemonic,
      numberOfAccounts: 1,
    };
    const hdKeyring = new HDKeyring(opts);
    this.keyrings.push(hdKeyring);

    // 3. 发布事件：钱包已创建
    walletEventBus.emit('keyring:created', {
      keyrings: this.getKeyrings(),
    });

    return mnemonic;
  }

  /**
   * 导入钱包（从助记词）
   */
  importFromMnemonic(mnemonic: string): void {
    const opts:HDKeyringOptions = {
      mnemonic,
      numberOfAccounts: 1,
    };
    const hdKeyring = new HDKeyring(opts);
    this.keyrings.push(hdKeyring);

    // 发布事件：钱包已导入
    walletEventBus.emit('keyring:imported', {
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
    console.log("keyrings:", keyrings);
    keyrings.forEach((kr: any) => {
      const keyring: IKeyring = new HDKeyring();
      keyring.deserialize(kr);
      this.keyrings.push(keyring);
    });

    // 发布事件：钱包已恢复
    walletEventBus.emit('keyring:restored', {
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
    walletEventBus.emit('keyring:accountAdded', {
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
    walletEventBus.emit('keyring:locked');
  }
}
