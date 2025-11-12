import CryptoJS from "crypto-js";

/**
 * 加密数据结构（MetaMask 兼容格式）
 */
export interface EncryptedVault {
  data: string; // AES 加密后的数据
  iv: string; // 初始化向量 (hex)
  keyMetadata: {
    algorithm: "PBKDF2";
    params: {
      iterations: number;
    };
  };
  salt: string; // 盐值 (hex)
}

/**
 * 加密/解密工具
 * 职责：使用 AES-256-CBC + PBKDF2 进行加密解密（纯工具函数）
 *
 * 安全性说明：
 * - 算法：AES-256-CBC（与 MetaMask 一致）
 * - KDF：PBKDF2，100,000 次迭代（抗字典攻击）
 * - 格式：MetaMask 兼容格式
 */
export class EncryptionHelper {
  private static readonly PBKDF_ITERATIONS = 100000;
  private static readonly KEY_SIZE = 8; // 256 bits / 32 bytes

  /**
   * 加密数据
   * @param data - 要加密的数据（任意类型，会转为 JSON）
   * @param password - 加密密码
   * @returns 加密后的字符串
   *
   * @example
   * const encrypted = EncryptionHelper.encrypt({ key: 'value' }, 'password123');
   */
  static encrypt(data: any, password: string): string {
    // 1. 生成随机盐和 IV
    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // 2. 使用 PBKDF2 从密码生成密钥
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: EncryptionHelper.KEY_SIZE,
      iterations: EncryptionHelper.PBKDF_ITERATIONS,
    });

    // 3. 使用 AES-256-CBC 加密
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 4. 返回 MetaMask 兼容格式
    const vault: EncryptedVault = {
      data: encrypted.toString(),
      iv: iv.toString(),
      keyMetadata: {
        algorithm: "PBKDF2",
        params: {
          iterations: EncryptionHelper.PBKDF_ITERATIONS,
        },
      },
      salt: salt.toString(),
    };

    return JSON.stringify(vault);
  }

  /**
   * 解密数据
   * @param encryptedData - 加密后的数据字符串
   * @param password - 解密密码
   * @returns 解密后的原始数据（字符串）
   * @throws 密码错误时抛出异常
   *
   * @example
   * const encrypted = EncryptionHelper.encrypt({ key: 'value' }, 'password123');
   * const decrypted = EncryptionHelper.decrypt(encrypted, 'password123');
   * // decrypted = '{"key":"value"}'
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      // 1. 解析加密数据
      const vault: EncryptedVault = JSON.parse(encryptedData);

      // 2. 从 hex 字符串恢复盐和 IV
      const salt = CryptoJS.enc.Hex.parse(vault.salt);
      const iv = CryptoJS.enc.Hex.parse(vault.iv);

      // 3. 使用 PBKDF2 从密码生成密钥（使用原来的迭代次数）
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: EncryptionHelper.KEY_SIZE,
        iterations: vault.keyMetadata.params.iterations,
      });

      // 4. 使用 AES-256-CBC 解密
      const decrypted = CryptoJS.AES.decrypt(vault.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 5. 转换为 UTF-8 字符串
      const result = decrypted.toString(CryptoJS.enc.Utf8);

      if (!result) {
        throw new Error("Decryption failed: password may be incorrect");
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("password may be incorrect")) {
        throw error;
      }
      throw new Error("Decryption failed: invalid encrypted data or wrong password");
    }
  }
}
