import { EncryptionHelper } from "@/helpers/EncryptionHelper";
import { HDKeyring } from "@/types/HDKeyring";
import { IKeyring } from "@/types/Keyring";

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
        const keyring = new HDKeyring();
        keyring.deserialize(kr);
        keyrings.push(keyring);
      });
      return keyrings;
    } catch (error) {
      return null;
    }
  },
};
