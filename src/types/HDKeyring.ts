import type { IKeyring } from "./Keyring";
import { HDNodeWallet, Mnemonic } from "ethers";
import { ulid } from "ulid";

/**
 * 🗂️🗝️💍 HDKeyring
 *
 * @description
 * HD 密钥环，用于管理 HD 密钥
 */
export class HDKeyring implements IKeyring {
  type: string = "HD";
  id: string;
  wallets: HDNodeWallet[] = []; // 派生出的子钱包列表
  private mnemonic: string = "";
  private root: HDNodeWallet | null = null; // HD 派生根节点
  private readonly hdPath = "m/44'/60'/0'/0"; // 以太坊标准路径

  constructor(mnemonic?: string, id?: string) {
    this.id = id || this.generateId();
    if (mnemonic) {
      this._initFromMnemonic(mnemonic);
    }
  }
  addAccounts(count: number): void {
    if (!this.root) {
      throw new Error("Root wallet not initialized");
    }
    for (let i = 0; i < count; i++) {
      const hdWallet = this.root.deriveChild(i);
      this.wallets.push(hdWallet);
    }
  }

  /**
   * 反序列化（从加密存储恢复）
   */
  deserialize(data: { id?: string; type?: string; mnemonic: string; numberOfAccounts?: number; hdPath?: string }): void {
    // 重置状态
    this.wallets = [];
    this.root = null;
    this.mnemonic = "";

    // 恢复基本属性
    if (data.id) {
      this.id = data.id;
    }
    if (data.type) {
      this.type = data.type;
    }

    // 从助记词初始化
    if (data.mnemonic) {
      this._initFromMnemonic(data.mnemonic);
    }

    // 恢复账户
    if (data.numberOfAccounts && data.numberOfAccounts > 0) {
      for (let i = 0; i < data.numberOfAccounts; i++) {
        this.addAccount(i);
      }
    }
  }

  private generateId(): string {
    return ulid();
  }

  /**
   * 从助记词初始化根节点
   */
  private _initFromMnemonic(mnemonic: string): void {
    this.mnemonic = mnemonic;
    const mnemonicObj = Mnemonic.fromPhrase(mnemonic);
    const masterWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m");
    this.root = masterWallet.derivePath(this.hdPath);
  }

  /**
   * 添加账户
   */
  addAccount(index: number):  void {
    if (!this.root) {
      throw new Error("Root wallet not initialized");
    }
    const hdWallet = this.root.deriveChild(index);
    this.wallets.push(hdWallet);
  }

  getAccounts(): any[] {
    return this.wallets;
  }

  /**
   * 序列化（用于加密存储）
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      mnemonic: this.mnemonic,
      numberOfAccounts: this.wallets.length,
      hdPath: this.hdPath,
    };
  }
}
