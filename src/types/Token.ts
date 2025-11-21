/**
 * ERC-20 Token 类型定义
 */
export interface Token {
  /** Token 合约地址 */
  contractAddress: string;
  
  /** Token 名称（如 "Tether USD"） */
  name: string;
  
  /** Token 符号（如 "USDT"） */
  symbol: string;
  
  /** Token 精度（小数位数） */
  decimals: number;
  
  /** 用户持有的余额（原始值，未格式化） */
  balance: string;
  
  /** 格式化后的余额（带小数点） */
  balanceFormatted: string;
  
  /** Token 图标 URL（可选） */
  logoURI?: string;
  
  /** Token 当前价格（USD，可选） */
  priceUSD?: string;
  
  /** Token 总价值（USD，可选） */
  valueUSD?: string;
}

/**
 * Portfolio 响应（包含原生代币和 tokens）
 */
export interface Portfolio {
  /** 原生代币余额 */
  balance: string;
  
  /** 原生代币USD价值 */
  balanceUSD: string;
  
  /** 代币资产列表 */
  tokens: Token[];
  
  /** 总价值(USD) */
  totalValue: string;
}
