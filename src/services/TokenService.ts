import { ethers } from "ethers";
import type { Token, TokenListResponse } from "@/types/Token";
import { networkManager } from "./NetworkManager";

/**
 * TokenService
 * 
 * @description
 * 负责获取和管理 ERC-20 Token 数据，包括：
 * - 获取指定地址的所有 Token 余额
 * - 查询 Token 元数据（名称、符号、精度）
 * - 格式化 Token 余额
 * 
 * @architecture
 * 支持多种数据源：
 * 1. Etherscan API（推荐）- 快速、准确
 * 2. 直接 RPC 查询 - 去中心化，但需要已知 token 地址列表
 */
class TokenService {
  // ERC-20 标准 ABI（仅包含必要的方法）
  private readonly ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
  ];

  // Etherscan API 配置
  private readonly ETHERSCAN_API_KEYS: Record<number, string> = {
    1: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "", // 以太坊主网
    11155111: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "", // Sepolia 测试网
    // 可以添加更多网络的 API Key
  };

  private readonly ETHERSCAN_API_URLS: Record<number, string> = {
    1: "https://api.etherscan.io/v2/api",
    11155111: "https://api-sepolia.etherscan.io/v2/api",
    // BSC
    56: "https://api.bscscan.com/v2/api",
    97: "https://api-testnet.bscscan.com/v2/api",
    // Polygon
    137: "https://api.polygonscan.com/v2/api",
    80001: "https://api-testnet.polygonscan.com/v2/api",
  };

  /**
   * 获取地址的所有 ERC-20 Token 列表
   * @param address 钱包地址
   * @param chainId 链 ID
   * @returns Token 列表
   */
  async getTokenList(address: string, chainId: number): Promise<TokenListResponse> {
    try {
      // 优先使用 Etherscan API
      if (this.supportsEtherscanAPI(chainId)) {
        return await this.getTokenListFromEtherscan(address, chainId);
      }

      // 降级：使用预定义 token 列表查询
      return await this.getTokenListFromRPC(address, chainId);
    } catch (error) {
      console.error("[TokenService] 获取 Token 列表失败:", error);
      return {
        tokens: [],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 从 Etherscan API 获取 Token 列表
   */
  private async getTokenListFromEtherscan(address: string, chainId: number): Promise<TokenListResponse> {
    const apiKey = this.ETHERSCAN_API_KEYS[chainId];
    const apiUrl = this.ETHERSCAN_API_URLS[chainId];

    if (!apiKey) {
      console.warn(`[TokenService] 未配置 Chain ${chainId} 的 Etherscan API Key`);
      return { tokens: [], timestamp: Date.now() };
    }

    try {
      // Etherscan API V2: 获取 ERC-20 Token 余额 (需要 chainid 参数)
      const response = await fetch(
        `${apiUrl}?chainid=${chainId}&module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
      );

      const data = await response.json();

      if (data.status !== "1" || !data.result) {
        console.warn("[TokenService] Etherscan API 返回空结果");
        return { tokens: [], timestamp: Date.now() };
      }

      // 去重并获取唯一的 token 合约地址
      const tokenAddresses = Array.from(
        new Set(data.result.map((tx: any) => tx.contractAddress))
      ) as string[];

      // 查询每个 token 的当前余额
      const tokens = await Promise.all(
        tokenAddresses.map((tokenAddress) => this.getTokenBalance(address, tokenAddress))
      );

      // 过滤掉余额为 0 的 token
      const nonZeroTokens = tokens.filter((token) => token && BigInt(token.balance) > 0n);

      return {
        tokens: nonZeroTokens as Token[],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[TokenService] Etherscan API 请求失败:", error);
      throw error;
    }
  }

  /**
   * 从 RPC 获取 Token 列表（使用预定义列表）
   */
  private async getTokenListFromRPC(address: string, chainId: number): Promise<TokenListResponse> {
    // 获取预定义的热门 token 列表
    const popularTokens = this.getPopularTokens(chainId);

    // 查询每个 token 的余额
    const tokens = await Promise.all(
      popularTokens.map((tokenAddress) => this.getTokenBalance(address, tokenAddress))
    );

    // 过滤掉余额为 0 或查询失败的 token
    const nonZeroTokens = tokens.filter((token) => token && BigInt(token.balance) > 0n);

    return {
      tokens: nonZeroTokens as Token[],
      timestamp: Date.now(),
    };
  }

  /**
   * 获取单个 Token 的余额和元数据
   * @param ownerAddress 钱包地址
   * @param tokenAddress Token 合约地址
   * @returns Token 对象
   */
  async getTokenBalance(ownerAddress: string, tokenAddress: string): Promise<Token | null> {
    try {
      const provider = networkManager.getProvider();
      if (!provider) {
        throw new Error("Provider not initialized");
      }

      // 创建 Token 合约实例
      const tokenContract = new ethers.Contract(tokenAddress, this.ERC20_ABI, provider);

      // 并行查询 token 信息
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(ownerAddress),
      ]);

      // 格式化余额
      const balanceFormatted = ethers.formatUnits(balance, decimals);

      return {
        contractAddress: tokenAddress,
        name,
        symbol,
        decimals,
        balance: balance.toString(),
        balanceFormatted,
      };
    } catch (error) {
      console.error(`[TokenService] 查询 Token ${tokenAddress} 失败:`, error);
      return null;
    }
  }

  /**
   * 检查是否支持 Etherscan API
   */
  private supportsEtherscanAPI(chainId: number): boolean {
    return chainId in this.ETHERSCAN_API_URLS;
  }

  /**
   * 获取热门 Token 地址列表（用于 RPC 降级方案）
   */
  private getPopularTokens(chainId: number): string[] {
    const popularTokensByChain: Record<number, string[]> = {
      // 以太坊主网
      1: [
        "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
        "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK
      ],
      // Sepolia 测试网（示例地址，需要替换为实际的测试网 token）
      11155111: [
        // 测试网通常使用 Faucet token
      ],
      // BSC 主网
      56: [
        "0x55d398326f99059fF775485246999027B3197955", // BSC-USD
        "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      ],
    };

    return popularTokensByChain[chainId] || [];
  }

  /**
   * 转账 ERC-20 Token
   * @param tokenAddress Token 合约地址
   * @param toAddress 接收地址
   * @param amount 转账数量（格式化后的值，如 "1.5"）
   * @param fromAddress 发送地址
   * @returns 交易哈希
   */
  async transfer(
    tokenAddress: string,
    toAddress: string,
    amount: string,
    fromAddress: string
  ): Promise<string> {
    try {
      const provider = networkManager.getProvider();
      if (!provider) {
        throw new Error("Provider not initialized");
      }

      // 创建 Token 合约实例
      const tokenContract = new ethers.Contract(tokenAddress, this.ERC20_ABI, provider);

      // 获取 decimals
      const decimals = await tokenContract.decimals();

      // 转换为 wei
      const amountWei = ethers.parseUnits(amount, decimals);

      // 这里需要获取 signer（通过 TransactionController）
      // 暂时返回错误，实际实现需要集成签名逻辑
      throw new Error("Token transfer not implemented yet");
    } catch (error) {
      console.error("[TokenService] Token 转账失败:", error);
      throw error;
    }
  }
}

export const tokenService = new TokenService();
