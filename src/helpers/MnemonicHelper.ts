import * as bip39 from "bip39";

/**
 * 助记词管理工具
 * 职责：生成、验证助记词（纯工具函数）
 */
export class MnemonicHelper {
  /**
   * 生成 BIP39 助记词
   * @param strength - 强度（128 = 12个单词，256 = 24个单词）
   * @returns 生成的助记词
   *
   * @example
   * const mnemonic = MnemonicHelper.generate(128);
   * // "abandon ability able about above absent..."
   */
  static generate(strength: number = 128): string {
    return bip39.generateMnemonic(strength);
  }

  /**
   * 验证助记词是否有效
   * @param mnemonic - 要验证的助记词
   * @returns 是否有效
   *
   * @example
   * MnemonicHelper.validate("abandon ability able...") // true
   * MnemonicHelper.validate("invalid words here") // false
   */
  static validate(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * 将助记词转换为种子
   * @param mnemonic - 助记词
   * @param passphrase - 可选的密码短语（默认为空）
   * @returns 种子 Buffer
   *
   * @example
   * const seed = MnemonicHelper.toSeed("abandon ability...");
   */
  static toSeed(mnemonic: string, passphrase: string = ""): Buffer {
    return bip39.mnemonicToSeedSync(mnemonic, passphrase);
  }
}
