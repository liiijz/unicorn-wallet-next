import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

interface MarketResponse {
  code: number;
  message: string;
  data: MarketData[];
}

// Market Data Types
interface MarketData {
  symbol: string;
  name: string;
  code: string;
  icon?: string;
  price: number;
  change24h: number;
  changeRate: number;
  volume: number;
  priceHistory: number[];
}
const MarketStats = () => {
  const [selectedMarketTab, setSelectedMarketTab] = useState("hot");
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  // 格式化价格显示
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // 准备图表数据
  const prepareChartData = (priceHistory: number[]) => {
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const data = priceHistory.map((price, index) => ({ index, price }));
    return { data, yDomain: [min, max] };
  };

  // 初始加载市场数据
  useEffect(() => {
    fetchMarketData("hot");
    // 每60秒刷新市场数据
    const interval = setInterval(() => fetchMarketData(selectedMarketTab), 60000);
    return () => clearInterval(interval);
  }, []);

  // 处理市场标签切换
  const handleMarketTabChange = (tab: string) => {
    setSelectedMarketTab(tab);

    const sortByMap: Record<string, string> = {
      "24 hrs": "24hrs",
      Hot: "hot",
      Profit: "profit",
      Rising: "rising",
      Loss: "loss",
      "Top Gain": "topGain",
    };
    fetchMarketData(sortByMap[tab] || tab.toLowerCase());
  };

  // 获取市场数据
  const fetchMarketData = async (sortBy: string = "hot") => {
    setIsLoadingMarket(true);
    try {
      const response = await fetch(`/api/market?sortBy=${sortBy}`);
      const result: MarketResponse = await response.json();

      if (result.code === 200 && result.data) {
        setMarketData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setIsLoadingMarket(false);
    }
  };

  return (
    <>
      <h3 className="text-white text-lg font-medium mb-4">Market Statistics</h3>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["24 hrs", "Hot", "Profit", "Rising", "Loss", "Top Gain"].map((tab) => (
          <button key={tab} onClick={() => handleMarketTabChange(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedMarketTab === tab.toLowerCase() || (tab === "Hot" && selectedMarketTab === "hot") ? "bg-gray-800 text-white" : "bg-transparent text-gray-400 hover:bg-gray-800/50"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Market Items - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoadingMarket ? (
          <div className="col-span-2 flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
        ) : marketData.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-400">No market data available</div>
        ) : (
          marketData.map((item) => {
            const isPositive = item.changeRate >= 0;
            const chartColor = isPositive ? "#10B981" : "#EF4444";
            const { data, yDomain } = prepareChartData(item.priceHistory);

            return (
              <div key={item.code} className="flex items-center justify-between gap-2">
                {/* 图标和名称 */}
                <div className="flex items-center gap-2 min-w-0" style={{ width: '140px' }}>
                  {item.icon ? (
                    <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
                      <img src={item.icon} alt={item.code} className="w-8 h-8 object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-xs">{item.code.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm truncate" title={item.name}>{item.name}</div>
                    <div className="text-gray-400 text-xs truncate">{item.code.toUpperCase()}</div>
                  </div>
                </div>

                {/* K线图 */}
                <div className="flex-shrink-0" style={{ width: '80px' }}>
                  <ResponsiveContainer width={80} height={32}>
                    <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                      <YAxis domain={yDomain} hide />
                      <Line type="monotone" dataKey="price" stroke={chartColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 价格和涨跌幅 */}
                <div className="text-right flex-shrink-0" style={{ width: '100px' }}>
                  <div className="text-white font-medium text-sm truncate">{formatPrice(item.price)}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    <svg className={`w-3 h-3 flex-shrink-0 ${!isPositive && "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="truncate">{Math.abs(item.changeRate).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default MarketStats;
