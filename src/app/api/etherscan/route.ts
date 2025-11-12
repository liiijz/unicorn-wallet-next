import { NextRequest, NextResponse } from "next/server";

/**
 * Etherscan API 代理端点
 * 
 * @description
 * 将 Etherscan API 请求移到后端，避免在前端暴露 API Key
 * 支持多个链的 API 请求
 */

// Etherscan API 配置
const ETHERSCAN_API_KEYS: Record<number, string> = {
  1: process.env.ETHERSCAN_API_KEY || "", // 以太坊主网
  11155111: process.env.ETHERSCAN_API_KEY || "", // Sepolia 测试网
  56: process.env.BSCSCAN_API_KEY || "", // BSC 主网
  97: process.env.BSCSCAN_API_KEY || "", // BSC 测试网
  137: process.env.POLYGONSCAN_API_KEY || "", // Polygon 主网
  80001: process.env.POLYGONSCAN_API_KEY || "", // Polygon 测试网
};

const ETHERSCAN_API_URLS: Record<number, string> = {
  1: "https://api.etherscan.io/v2/api",
  11155111: "https://api-sepolia.etherscan.io/v2/api",
  56: "https://api.bscscan.com/v2/api",
  97: "https://api-testnet.bscscan.com/v2/api",
  137: "https://api.polygonscan.com/v2/api",
  80001: "https://api-testnet.polygonscan.com/v2/api",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取参数
    const chainId = parseInt(searchParams.get("chainid") || "1");
    const address = searchParams.get("address");
    // 自动补全参数
    const module = searchParams.get("module") || "account";
    const action = searchParams.get("action") || "tokentx";
    const startblock = searchParams.get("startblock") || "0";
    const endblock = searchParams.get("endblock") || "99999999";
    const sort = searchParams.get("sort") || "asc";

    // 验证必需参数
    if (!address) {
      return NextResponse.json(
        { error: "缺少必需参数: address" },
        { status: 400 }
      );
    }

    // 验证 chainId
    if (!ETHERSCAN_API_URLS[chainId]) {
      return NextResponse.json(
        { error: `不支持的链 ID: ${chainId}` },
        { status: 400 }
      );
    }

    // 获取 API Key
    const apiKey = ETHERSCAN_API_KEYS[chainId];
    if (!apiKey) {
      console.error(`[Etherscan API] 未配置 Chain ${chainId} 的 API Key`);
      return NextResponse.json(
        { error: "API Key 未配置" },
        { status: 500 }
      );
    }

    // 构建 Etherscan API URL
    const apiUrl = ETHERSCAN_API_URLS[chainId];
    const etherscanUrl = `${apiUrl}?chainid=${chainId}&module=${module}&action=${action}&address=${address}&startblock=${startblock}&endblock=${endblock}&sort=${sort}&apikey=${apiKey}`;

    console.log(`[Etherscan API] 请求 URL: ${etherscanUrl}`);

    // 调用 Etherscan API
    const response = await fetch(etherscanUrl);
    const data = await response.json();

    // 返回结果
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Etherscan API] 请求失败:", error);
    return NextResponse.json(
      { error: "API 请求失败", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
