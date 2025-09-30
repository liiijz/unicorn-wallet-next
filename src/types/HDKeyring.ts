import { IKeyring, KeyringType, TransactionRequest } from "./Keyring";
import { HDNodeWallet, Mnemonic } from "ethers";


const HD_PATH = "m/44'/60'/0'/0";

export type HDKeyringOptions = {
  mnemonic: string;
  numberOfAccounts: number;
  hdPath?: string;
};

/**
 * 🗂️🗝️💍 HDKeyring
 *
 * @description
 * HD 密钥环，用于管理 HD 密钥
 */
export class HDKeyring implements IKeyring {
  type: KeyringType = KeyringType.HD;
  wallets: HDNodeWallet[] = []; // 派生出的子钱包列表
  private mnemonic: string | null = null;
  private root: HDNodeWallet | null = null; // HD 派生根节点
  private hdPath = HD_PATH; // 以太坊标准路径

  constructor(opts?: HDKeyringOptions) {
    if (opts) {
      this.deserialize(opts);
    }
  }
  signTransaction(address: string, transaction: TransactionRequest): Promise<string> {
    throw new Error("Method not implemented.");
  }
  signMessage(address: string, message: string | Uint8Array): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async addAccounts(count: number): Promise<string[]> {
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error("Count must be a positive integer");
    }
    if (!this.root) {
      throw new Error("Root wallet not initialized");
    }
    const MAX_ACCOUNTS = 1000;
    const startIndex = this.wallets.length;
    const newAddresses: string[] = [];
    if (this.wallets.length + count > MAX_ACCOUNTS) {
      throw new Error(`Cannot exceed ${MAX_ACCOUNTS} accounts`);
    }
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const hdWallet = this.root.deriveChild(index);
      this.wallets.push(hdWallet);
      newAddresses.push(hdWallet.address);
    }

    return newAddresses;
  }

  /**
   * 反序列化（从加密存储恢复）
   */
  async deserialize(opts: HDKeyringOptions): Promise<void> {
    // 重置状态
    this.wallets = [];
    this.root = null;
    this.mnemonic = null;
    this.hdPath = opts.hdPath || HD_PATH;

    if (!opts.mnemonic) {
      throw new Error("Mnemonic is required");
    }

    this.initFromMnemonic(opts.mnemonic);
    this.addAccounts(opts.numberOfAccounts);
  }

  /**
   * 从助记词初始化根节点
   */
  private initFromMnemonic(mnemonic: string): void {
    this.mnemonic = mnemonic;
    const mnemonicObj = Mnemonic.fromPhrase(mnemonic);
    const masterWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m");
    this.root = masterWallet.derivePath(this.hdPath);
  }

  getAccounts(): string[] {
    return this.wallets.map((wallet) => wallet.address);
  }

  /**
   * 序列化（用于加密存储）
   */
  serialize() {
    return {
      type: this.type,
      mnemonic: this.mnemonic,
      numberOfAccounts: this.wallets.length,
      hdPath: this.hdPath,
    };
  }
}
