import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

/**
 * Portfolio API 代理端点
 *
 * @description
 * 使用 Alchemy Token Balances API 获取地址的代币信息
 */

// Alchemy API 配置
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

// Chain ID 到 Alchemy Network 的映射
const CHAIN_TO_NETWORK: Record<number, string> = {
  1: "eth-mainnet", // Ethereum Mainnet
  137: "polygon-mainnet", // Polygon Mainnet
  56: "bsc-mainnet", // BSC Mainnet
  43114: "avalanche-mainnet", // Avalanche Mainnet
  42161: "arbitrum-mainnet", // Arbitrum Mainnet
  10: "optimism-mainnet", // Optimism Mainnet
  8453: "base-mainnet", // Base Mainnet
  // 添加更多网络根据需要
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 获取参数
    const chainId = parseInt(searchParams.get("chainid") || "1");
    const address = searchParams.get("address");

    // 验证必需参数
    if (!address) {
      return NextResponse.json(
        { error: "缺少必需参数: address" },
        { status: 400 }
      );
    }

    // 验证 chainId
    const network = CHAIN_TO_NETWORK[chainId];
    if (!network) {
      return NextResponse.json(
        { error: `不支持的链 ID: ${chainId}` },
        { status: 400 }
      );
    }

    // 验证 API Key
    if (!ALCHEMY_API_KEY) {
      console.error("[Portfolio API] 未配置 Alchemy API Key");
      return NextResponse.json(
        { error: "API Key 未配置" },
        { status: 500 }
      );
    }

    // 构建 Alchemy Portfolio API 请求
    const apiUrl = `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/assets/tokens/by-address`;

    const payload = {
      addresses: [
        {
          address: address,
          networks: [network]
        }
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true
    };

    console.log(`[Portfolio API] 请求 URL: ${apiUrl}`);
    console.log(`[Portfolio API] 请求体:`, payload);

    // 调用 Alchemy API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[Portfolio API] API 请求失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: "API 请求失败", details: `${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 处理错误响应
    if (data.error) {
      console.error("[Portfolio API] Alchemy Portfolio API 错误:", data.error);
      return NextResponse.json(
        { error: "Portfolio API 错误", details: data.error },
        { status: 500 }
      );
    }

    // 直接返回 Alchemy 的原始数据，不进行任何修改
    return NextResponse.json({
      data: data.data || {
        addresses: []
      }
    });
  } catch (error) {
    console.error("[Portfolio API] 请求失败:", error);
    return NextResponse.json(
      { error: "API 请求失败", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}