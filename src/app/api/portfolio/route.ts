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
const CHAIN_ID_TO_ALCHEMY_NETWORK: Record<number, string> = {
  1: "eth-mainnet",
  11155111: "eth-sepolia",
  17000: "eth-holesky",
  137: "polygon-mainnet",
  80002: "polygon-amoy",
  1101: "polygonzkevm-mainnet",
  2442: "polygonzkevm-cardona",
  56: "bnb-mainnet",
  97: "bnb-testnet",
  204: "opbnb-mainnet",
  5611: "opbnb-testnet",
  43114: "avax-mainnet",
  43113: "avax-fuji",
  42161: "arb-mainnet",
  42170: "arbnova-mainnet",
  421614: "arb-sepolia",
  10: "opt-mainnet",
  11155420: "opt-sepolia",
  8453: "base-mainnet",
  84532: "base-sepolia",
  324: "zksync-mainnet",
  300: "zksync-sepolia",
  534352: "scroll-mainnet",
  534351: "scroll-sepolia",
  59144: "linea-mainnet",
  59141: "linea-sepolia",
  5000: "mantle-mainnet",
  5003: "mantle-sepolia",
  169: "manta-mainnet",
  3441006: "manta-sepolia",
  7777777: "zora-mainnet",
  999999999: "zora-sepolia",
  252: "frax-mainnet",
  2522: "frax-sepolia",
  480: "worldchain-mainnet",
  4801: "worldchain-sepolia",
  100: "gnosis-mainnet",
  10200: "gnosis-chiado",
  1284: "moonbeam-mainnet",
  1287: "moonbase-alpha",
  592: "astar-mainnet",
  250: "fantom-mainnet",
  4002: "fantom-testnet",
  25: "cronos-mainnet",
  42220: "celo-mainnet",
  44787: "celo-alfajores",
  666666666: "degen-mainnet",
  13473: "ink-mainnet",
  763373: "ink-sepolia",
  7560: "shape-mainnet",
  360: "shape-sepolia",
  33139: "apechain-mainnet",
  80094: "berachain-mainnet",
  80084: "berachain-bartio",
  81457: "blast-mainnet",
  168587773: "blast-sepolia",
  1088: "metis-mainnet",
  7000: "zetachain-mainnet",
  7001: "zetachain-testnet",
  1329: "sei-mainnet",
  713715: "sei-testnet",
  690: "redstone-mainnet",
  17001: "redstone-holesky",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 获取参数
    const chainId = parseInt(searchParams.get("chainid") || "1");
    const address = searchParams.get("address");

    // 验证必需参数
    if (!address) {
      return NextResponse.json({ error: "缺少必需参数: address" }, { status: 400 });
    }

    // 验证 chainId
    const network = CHAIN_ID_TO_ALCHEMY_NETWORK[chainId];
    if (!network) {
      return NextResponse.json({ error: `不支持的链 ID: ${chainId}` }, { status: 400 });
    }

    // 验证 API Key
    if (!ALCHEMY_API_KEY) {
      console.error("[Portfolio API] 未配置 Alchemy API Key");
      return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });
    }

    // 构建 Alchemy Portfolio API 请求
    const apiUrl = `https://api.g.alchemy.com/data/v1/${ALCHEMY_API_KEY}/assets/tokens/by-address`;

    const payload = {
      addresses: [
        {
          address: address,
          networks: [network],
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };

    console.log(`[Portfolio API] 请求 URL: ${apiUrl}`);
    console.log(`[Portfolio API] 请求体:`, payload);

    // 调用 Alchemy API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Portfolio API] API 请求失败: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "API 请求失败", details: `${response.status} ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();

    // 处理错误响应
    if (data.error) {
      console.error("[Portfolio API] Alchemy Portfolio API 错误:", data.error);
      return NextResponse.json({ error: "Portfolio API 错误", details: data.error }, { status: 500 });
    }

    // 直接返回 Alchemy 的原始数据，不进行任何修改
    return NextResponse.json({
      data: data.data || {
        addresses: [],
      },
    });
  } catch (error) {
    console.error("[Portfolio API] 请求失败:", error);
    return NextResponse.json({ error: "API 请求失败", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
