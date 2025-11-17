import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取参数
    const chainId = parseInt(searchParams.get("chainid") || "1");
    const address = searchParams.get("address");
    
    // 返回结果
    return NextResponse.json({});
  } catch (error) {
    console.error("[Etherscan API] 请求失败:", error);
    return NextResponse.json(
      { error: "API 请求失败", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}