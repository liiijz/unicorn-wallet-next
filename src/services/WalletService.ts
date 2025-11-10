import { Wallet } from "@/types/Wallet";
import * as bip39 from "bip39";
import CryptoJS from "crypto-js";

/**
 * 加密助记词数据结构
 */
interface EncryptedMnemonicData {
  vault: string; // 加密后的助记词数据
  salt: string; // 盐值，用于加密key的生成
  iv: string; // 初始化向量，用于AES加密
}

/**
 * 钱包服务类，负责生成和管理钱包助记词
 */
export class WalletService {
  private static readonly PBKDF_ITERATIONS = 100000;
  /**
   * 创建助记词
   * @returns {string} mnemonic phrase - 生成的12个单词的助记词
   */
  generateMnemonic(): string {
    // 使用bip39库生成128位强度的助记词（12个单词）
    const mnemonic = bip39.generateMnemonic(128);
    return mnemonic;
  }
  
  /**
   * 加密整个 vault（包含多个 keyrings）
   */
  encryptVault(vaultJson: string, password: string): string {
    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 8,
      iterations: WalletService.PBKDF_ITERATIONS, // 与 MetaMask 一致
    });

    const encrypted = CryptoJS.AES.encrypt(vaultJson, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 返回 MetaMask 格式的加密对象
    return JSON.stringify({
      data: encrypted.toString(),
      iv: iv.toString(),
      keyMetadata: {
        algorithm: "PBKDF2",
        params: { iterations: WalletService.PBKDF_ITERATIONS },
      },
      salt: salt.toString(),
    });
  }

  decryptVault(encryptedVault: string, password: string): string {
    try {
      const vault = JSON.parse(encryptedVault);
      const salt = CryptoJS.enc.Hex.parse(vault.salt);
      const iv = CryptoJS.enc.Hex.parse(vault.iv);

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 8,
        iterations: vault.keyMetadata.params.iterations,
      });

      const decrypted = CryptoJS.AES.decrypt(vault.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 尝试转换为 UTF-8 字符串，如果失败说明密码错误
      let decryptedStr: string;
      try {
        decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        throw new Error('密码错误');
      }
      
      // 验证解密结果
      if (!decryptedStr || decryptedStr.length === 0) {
        throw new Error('密码错误');
      }

      return decryptedStr;
    } catch (error: any) {
      // 如果是我们自己抛出的密码错误，直接抛出
      if (error.message === '密码错误') {
        throw error;
      }
      // 其他任何错误都视为密码错误
      throw new Error('密码错误');
    }
  }
}
