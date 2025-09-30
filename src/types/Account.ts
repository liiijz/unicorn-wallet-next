export interface Account {
  id: string;                    // 账户唯一标识
  address: string;               // 以太坊地址
  name: string;                  // 账户昵称
  type: 'mnemonic' | 'privateKey' | 'hardware'; // 账户类型
  derivationPath: string | null;       // HD钱包派生路径
  accountIndex?: number;         // 账户索引
  balance?: string;              // 余额（可选）
  createdAt: number;            // 创建时间
}