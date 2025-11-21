import { ethers } from "ethers";
import type { Token, TokenList } from "@/types/Token";
import { networkManager } from "./NetworkManager";

class PortfolioService {
  /**
   * 获取地址的所有 ERC-20 Token 列表
   * @param address 钱包地址
   * @param chainId 链 ID
   * @returns Token 列表
   */
  async getTokenBalances(address: string, chainId: number): Promise<TokenList> {
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
        return { tokens: [], timestamp: Date.now() };
      }

      // 转换 Alchemy 响应为 Token 格式
      const tokens: Token[] = data.data.tokens
        // .filter((token: any) => {
        //   // 过滤掉原生代币（tokenAddress 为 null）或余额为 0 的代币
        //   return token.tokenAddress !== null && BigInt(token.tokenBalance) > 0n;
        // })
        .map((token: any) => {
          const decimals = token.tokenMetadata?.decimals || 18;
          const balance = BigInt(token.tokenBalance).toString();
          const balanceFormatted = ethers.formatUnits(balance, decimals);
          const priceUSD = token.tokenPrices?.[0]?.value || "0";

          return {
            contractAddress: token.tokenAddress,
            name: token.tokenMetadata?.name || "Unknown Token",
            symbol: token.tokenMetadata?.symbol || "UNK",
            decimals,
            balance,
            balanceFormatted,
            logoURI: token.tokenMetadata?.logo,
            priceUSD,
            valueUSD: (parseFloat(balanceFormatted) * parseFloat(priceUSD)).toString(),
          };
        });

      return {
        tokens,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[TokenService] Alchemy Portfolio API 请求失败:", error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();
