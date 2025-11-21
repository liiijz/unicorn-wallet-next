import { ethers } from "ethers";
import type { Token } from "@/types/Token";
import { networkManager } from "./NetworkManager";

class PortfolioService {
  private nativeTokens: Record<number, { name: string; symbol: string; decimals: number }> = {
    1: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    56: { name: "BNB", symbol: "BNB", decimals: 18 },
    137: { name: "Polygon", symbol: "MATIC", decimals: 18 },
    // 可以根据需要添加更多网络
  };
  /**
   * 获取地址的所有 ERC-20 Token 列表
   * @param address 钱包地址
   * @param chainId 链 ID
   * @returns Token 列表
   */
  async getTokens(address: string, chainId: number): Promise<Token[]> {
    try {
      // 调用本地 Portfolio API 路由
      const response = await fetch(`/api/portfolio?chainid=${chainId}&address=${address}`);

      const data = await response.json();

      // 处理错误响应
      if (data.error) {
        console.warn("[TokenService] Alchemy Portfolio API 错误:", data.error);
        throw new Error(data.error);
      }

      if (!data.data || !data.data.tokens) {
        console.warn("[TokenService] Alchemy Portfolio API 返回空结果");
        return [];
      }

      // 转换 Alchemy 响应为 Token 格式
      const tokens: Token[] = data.data.tokens
        .filter((token: any) => {
          // 过滤掉余额为 0 的代币
          return BigInt(token.tokenBalance) > 0n;
        })
        .map((token: any) => {
          const decimals = token.tokenMetadata?.decimals || 18;
          const balance = BigInt(token.tokenBalance).toString();
          const balanceFormatted = ethers.formatUnits(balance, decimals);
          const priceUSD = token.tokenPrices?.[0]?.value || "0";

          // 处理原生代币
          const nativeInfo = this.nativeTokens[chainId];
          const isNative = !token.tokenAddress && nativeInfo;
          const name = isNative ? nativeInfo.name : (token.tokenMetadata?.name || "Unknown Token");
          const symbol = isNative ? nativeInfo.symbol : (token.tokenMetadata?.symbol || "UNK");

          return {
            contractAddress: token.tokenAddress,
            name,
            symbol,
            decimals,
            balance,
            balanceFormatted,
            logoURI: token.tokenMetadata?.logo,
            priceUSD,
            valueUSD: (parseFloat(balanceFormatted) * parseFloat(priceUSD)).toString(),
          };
        });

      console.log("[TokenService] 获取代币列表:", tokens);

      return tokens;
    } catch (error) {
      console.error("[TokenService] Alchemy Portfolio API 请求失败:", error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();
