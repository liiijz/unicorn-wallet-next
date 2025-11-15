import { NextRequest, NextResponse } from 'next/server';

/**
 * Market API - 使用 CoinGecko 获取加密货币市场数据
 * 包含缓存机制，减少 API 调用
 */

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface MarketData {
  symbol: string;
  name: string;
  code: string;
  icon: string;
  price: number;
  change24h: number;
  changeRate: number;
  volume: number;
  priceHistory: number[];
}

interface CacheEntry {
  data: MarketData[];
  timestamp: number;
}

// 内存缓存
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60秒缓存时间

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'hot';
    
    // 检查缓存
    const cacheKey = `market_${sortBy}`;
    const cachedEntry = cache.get(cacheKey);
    const now = Date.now();
    
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL) {
      console.log(`[Market API] 使用缓存数据 (${sortBy})`);
      return NextResponse.json({
        code: 200,
        message: 'success',
        data: cachedEntry.data,
        cached: true,
      });
    }
    
    // CoinGecko API 参数映射
    const sortMapping: Record<string, string> = {
      'hot': 'market_cap_desc',
      '24hrs': 'volume_desc',
      'profit': 'price_change_percentage_24h_desc',
      'rising': 'price_change_percentage_24h_desc',
      'loss': 'price_change_percentage_24h_asc',
      'topGain': 'price_change_percentage_24h_desc',
    };
    
    const order = sortMapping[sortBy] || 'market_cap_desc';
    
    // 调用 CoinGecko API
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=${order}&per_page=10&page=1&sparkline=true&price_change_percentage=24h`;
    
    console.log(`[Market API] 请求 CoinGecko: ${coingeckoUrl}`);
    
    // 调用 CoinGecko API
    const response = await fetch(coingeckoUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json() as CoinGeckoMarketData[];
    
    // 转换为我们的数据格式
    const marketData: MarketData[] = data.map(coin => ({
      symbol: coin.symbol,
      name: coin.name,
      code: coin.symbol,
      icon: coin.image,
      price: coin.current_price,
      change24h: coin.current_price * (coin.price_change_percentage_24h / 100),
      changeRate: coin.price_change_percentage_24h,
      volume: coin.total_volume,
      priceHistory: coin.sparkline_in_7d?.price?.slice(-24) || [], // 最近24小时数据
    }));
    
    // 更新缓存
    cache.set(cacheKey, {
      data: marketData,
      timestamp: now,
    });
    
    console.log(`[Market API] 成功获取 ${marketData.length} 条市场数据并缓存`);
    
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: marketData,
      cached: false,
    });
  } catch (error) {
    console.error('[Market API] 请求失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to fetch market data',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "POST API ready." });
}