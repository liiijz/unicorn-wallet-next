// types/keyring.ts

/**
 * Keyring 基础接口
 */
export interface IKeyring {
  /** Keyring 类型 (如: 'HD', 'Simple', 'Hardware') */
  type: KeyringType;

  addAccounts(count: number): Promise<string[]>;

  getAccounts(): string[];

  signTransaction(address: string, transaction: TransactionRequest): Promise<string>;

  signMessage(address: string, message: string | Uint8Array): Promise<string>;

  serialize(): any;

  deserialize(data: any): Promise<void>;
}

// ========== 类型定义 ==========

/**
 * Keyring 类型枚举
 */
export enum KeyringType {
  HD = "HD", // HD 钱包
  Simple = "Simple", // 导入的私钥
  Hardware = "Hardware", // 硬件钱包
  Trezor = "Trezor", // Trezor 硬件钱包
  Ledger = "Ledger", // Ledger 硬件钱包
}

/**
 * 账户详细信息
 */
export interface AccountDetail {
  /** 账户地址 */
  address: string;

  /** 公钥 */
  publicKey: string;

  /** 账户索引（HD 钱包专用） */
  index?: number;

  /** 派生路径（HD 钱包专用） */
  path?: string;

  /** 账户名称（可选） */
  name?: string;
}

/**
 * 交易请求对象
 */
export interface TransactionRequest {
  to?: string;
  from?: string;
  nonce?: number;
  gasLimit?: bigint | string;
  gasPrice?: bigint | string;
  data?: string;
  value?: bigint | string;
  chainId?: number;
  type?: number;
  maxPriorityFeePerGas?: bigint | string;
  maxFeePerGas?: bigint | string;
}

/**
 * EIP-712 类型化数据
 */
export interface TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
  };
  message: Record<string, any>;
}

/**
 * Keyring 序列化数据
 */
export interface KeyringData {
  /** Keyring ID */
  id: string;

  /** Keyring 类型 */
  type: KeyringType | string;

  /** 账户数量 */
  numberOfAccounts: number;

  /** 特定 Keyring 的数据 */
  [key: string]: any;
}

/**
 * HD Keyring 特定数据
 */
export interface HDKeyringData extends KeyringData {
  type: KeyringType.HD;

  /** 助记词（加密存储） */
  mnemonic: string;

  /** HD 派生路径 */
  hdPath?: string;
}

/**
 * Simple Keyring 特定数据
 */
export interface SimpleKeyringData extends KeyringData {
  type: KeyringType.Simple;

  /** 私钥列表（加密存储） */
  privateKeys: string[];
}

/**
 * Hardware Keyring 特定数据
 */
export interface HardwareKeyringData extends KeyringData {
  type: KeyringType.Hardware;

  /** 设备 ID */
  deviceId: string;

  /** 设备型号 */
  model: string;

  /** 账户路径列表 */
  accountPaths: string[];
}
