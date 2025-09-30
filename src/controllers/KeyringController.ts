import { HDKeyringOptions } from './../types/HDKeyring';
import type { IKeyring } from "@/types/Keyring";
import { WalletService } from "@/services/WalletService";
import { HDKeyring } from "@/types/HDKeyring";

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
    // 3. 加密并保存
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
  }

  getKeyrings(): IKeyring[] {
    return this.keyrings;
  }
}
