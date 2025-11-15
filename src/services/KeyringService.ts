import { EncryptionHelper } from "@/helpers/EncryptionHelper";
import { MnemonicHelper } from "@/helpers/MnemonicHelper";
import { HDKeyring, HDKeyringOptions } from "@/types/HDKeyring";
import { IKeyring, KeyringType } from "@/types/Keyring";

export const keyringService = {
  persistVault(keyrings: any[], password: string): void {
    // 持久化时自动调用 serialize，保证 numberOfAccounts 与实际钱包数量一致
    const serializedKeyrings = keyrings.map(kr => typeof kr.serialize === 'function' ? kr.serialize() : kr);
    const encrypted = EncryptionHelper.encrypt(serializedKeyrings, password);
    localStorage.setItem("vault", encrypted);
  },

  restoreVault(password: string): IKeyring[] | null {
    const keyrings: IKeyring[] = [];
    const encrypted = localStorage.getItem("vault");
    if (!encrypted) {
      return null;
    }
    // 使用 EncryptionHelper 解密
    try {
      const decryptedJson = EncryptionHelper.decrypt(encrypted, password);
      const krs = JSON.parse(decryptedJson);
      
      krs.forEach((kr: any) => {
        // 根据 type 创建对应的 Keyring 实例
        const keyring = this.createKeyringFromType(kr.type);
        if (keyring) {
          keyring.deserialize(kr);
          keyrings.push(keyring);
        } else {
          console.warn(`未知的 Keyring 类型: ${kr.type}`);
        }
      });
      
      return keyrings;
    } catch (error) {
      console.error("恢复 Vault 失败:", error);
      return null;
    }
  },

  /**
   * 创建新的 HD Keyring（生成助记词）
   */
  createNewHDKeyring(numberOfAccounts: number = 1): { keyring: HDKeyring; mnemonic: string } {
    // 生成助记词
    const mnemonic = MnemonicHelper.generate(128);

    // 创建 HD Keyring
    const opts: HDKeyringOptions = {
      mnemonic,
      numberOfAccounts,
    };
    const keyring = new HDKeyring(opts);

    return { keyring, mnemonic };
  },

  /**
   * 从助记词创建 HD Keyring
   */
  createHDKeyringFromMnemonic(mnemonic: string, numberOfAccounts: number = 1): HDKeyring {
    const opts: HDKeyringOptions = {
      mnemonic,
      numberOfAccounts,
    };
    return new HDKeyring(opts);
  },

  /**
   * 根据类型创建 Keyring 实例（用于反序列化）
   */
  createKeyringFromType(type: KeyringType | string): IKeyring | null {
    switch (type) {
      case KeyringType.HD:
        return new HDKeyring();
      
      case KeyringType.Simple:
        // TODO: 实现 SimpleKeyring
        // return new SimpleKeyring();
        console.warn("SimpleKeyring 尚未实现");
        return null;
      
      case KeyringType.Hardware:
      case KeyringType.Trezor:
      case KeyringType.Ledger:
        // TODO: 实现硬件钱包 Keyring
        console.warn(`${type} Keyring 尚未实现`);
        return null;
      
      default:
        console.error(`不支持的 Keyring 类型: ${type}`);
        return null;
    }
  },
};
