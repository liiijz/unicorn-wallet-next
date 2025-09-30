/**
 * Account - 账户信息接口
 *
 * 代表用户的一个以太坊账户，包含地址、类型和元数据
 */
export interface Account {
  /** 账户唯一标识 */
  id: string;

  /** 以太坊地址 (checksummed) */
  address: string;

  /** 账户昵称（用户可自定义） */
  name: string;

  /** 账户类型 */
  type: AccountType;

  /** HD钱包派生路径 (仅 HD 账户) */
  derivationPath: string | null;

  /** 账户索引（在对应的 keyring 中的位置） */
  accountIndex?: number;

  /** 账户余额（可选，由外部更新） */
  balance?: string;

  /** 创建时间戳 */
  createdAt: number;
}

/**
 * AccountType - 账户类型枚举
 */
export type AccountType = 'mnemonic' | 'privateKey' | 'hardware';

/**
 * AccountMetadata - 账户元数据（用于持久化）
 */
export interface AccountMetadata {
  /** 账户地址 */
  address: string;

  /** 自定义名称 */
  name: string;

  /** 其他自定义数据 */
  customData?: Record<string, any>;
}