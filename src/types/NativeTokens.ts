/**
 * 原生代币配置
 */
export const NATIVE_TOKEN_CONFIGS: Record<number, { name: string; symbol: string; decimals: number }> = {
  1: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  56: { name: "BNB", symbol: "BNB", decimals: 18 },
  137: { name: "Polygon", symbol: "MATIC", decimals: 18 },
  // 可以根据需要添加更多网络
};