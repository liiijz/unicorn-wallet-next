import { EncryptionHelper } from "@/helpers/EncryptionHelper";
import { HDKeyring } from "@/types/HDKeyring";
import { IKeyring, KeyringType } from "@/types/Keyring";

export const keyringService = {
  persistVault(serialized: any[], password: string): void {
    const encrypted = EncryptionHelper.encrypt(serialized, password);
    localStorage.setItem("KeyringController", encrypted);
  },

  restoreVault(password: string): IKeyring[] | null {
    const keyrings: IKeyring[] = [];
    const encrypted = localStorage.getItem("KeyringController");
    if (!encrypted) {
      return null;
    }
    // 使用 EncryptionHelper 解密
    try {
      const decrypted = EncryptionHelper.decrypt(encrypted, password);
      const krs = JSON.parse(decrypted);
      console.log("keyrings:", krs);
      
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
   * 根据类型创建 Keyring 实例
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
