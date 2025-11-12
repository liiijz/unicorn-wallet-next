"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Account } from "@/types/Account";
import PixelAvatar from "./PixelAvatar";
import SendModal from "./SendModal";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { GiReceiveMoney } from "react-icons/gi";
import { IoIosSend } from "react-icons/io";
import { MdShoppingCart } from "react-icons/md";
import { useNotification } from "./Notification";
import { WalletAssets } from "./WalletAssets";
import { walletEventBus } from "@/events/WalletEvents";
import { Network } from "@/types/Network";
import { useWalletStore } from "@/stores/walletStore";
import { networkController } from "@/controllers/NetworkController";
import { walletController } from "@/controllers";
import ImportWalletModal from "./ImportWalletModal";

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

interface MarketResponse {
  code: number;
  message: string;
  data: MarketData[];
}

/**
 * WalletHome 组件 - 主钱包界面
 *
 * 当用户已解锁钱包后显示的主界面
 */
export default function WalletHome() {
  const { currentAccount, setCurrentAccount, accounts } = useWalletStore();
  const allAccounts = accounts;
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [showImportWalletModal, setShowImportWalletModal] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(networkController.getCurrentNetwork());
  const [balance, setBalance] = useState<string>("0.0000");
  const [balanceUSD, setBalanceUSD] = useState<string>("0.00");
  const [activeTab, setActiveTab] = useState("home");
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedMarketTab, setSelectedMarketTab] = useState("hot");
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const { addNotification } = useNotification();
  const fetchBalanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 格式化地址显示（显示前6位和后4位）
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 20)}...${address.slice(-4)}`;
  };

  // 准备图表数据
  const prepareChartData = (priceHistory: number[]) => {
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const data = priceHistory.map((price, index) => ({ index, price }));
    return { data, yDomain: [min, max] };
  };

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

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      // TODO: 显示提示消息
      alert("地址已复制到剪贴板");
    }
  };

  // 处理添加以太坊账户
  const handleAddEthereumAccount = () => {
    setShowAddAccountModal(false);
    try {
      const newAccount = walletController.addAccount();
      setCurrentAccount(newAccount);
      console.log("New account created:", newAccount);
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  };

  // 处理网络切换
  const handleNetworkSwitch = async (networkId: string) => {
    try {
      await networkController.switchNetwork(networkId);
      setShowNetworkSelector(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // 获取账户余额
  const fetchBalance = async (network: Network) => {
    if (!currentAccount?.address) {
      return;
    }
    
    const { balance: newBalance, balanceUSD: newBalanceUSD } = await walletController.getBalance(
      currentAccount.address,
      network
    );
    
    setBalance(newBalance);
    setBalanceUSD(newBalanceUSD);
  };

  // 获取市场数据
  const fetchMarketData = async (sortBy: string = "hot") => {
    setIsLoadingMarket(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/v1/market/statistics?sortBy=${sortBy}`);
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

  const startFetchBalance = (network: Network) => {
    fetchBalance(network);
    if (fetchBalanceTimerRef.current) {
      clearInterval(fetchBalanceTimerRef.current);
    }
    fetchBalanceTimerRef.current = setInterval(() => {
      console.log("Fetching balance...");
      fetchBalance(network);
    }, 10000);
  };

  useEffect(() => {
    console.log("WalletHome mounted");
    fetchBalance(currentNetwork);
    walletEventBus.on("network:changed", ({ network }) => {
      console.log("Current network:", network);
      // 切换网络后重新获取余额
      setCurrentNetwork(network);
      addNotification("success", "网络切换成功");
      startFetchBalance(network);
    });

    return () => {
      walletEventBus.off("network:changed");
    };
  }, [currentAccount, currentNetwork]);

  // 初始加载市场数据
  useEffect(() => {
    fetchMarketData("hot");
    // 每60秒刷新市场数据
    const interval = setInterval(() => fetchMarketData(selectedMarketTab), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Container with max width for large screens */}
      <div className="max-w-2xl mx-auto">
        {/* Top Bar */}
        <header className="px-8 pt-8 pb-6 relative">
          <div className="flex items-center justify-between mb-8">
            {/* Avatar - Square with rounded corners */}
            <button onClick={() => setShowAccountSelector(!showAccountSelector)} className="relative">
              <PixelAvatar address={currentAccount?.address || ""} size={42} />
            </button>

            {/* Network Dropdown */}
            <button onClick={() => setShowNetworkSelector(!showNetworkSelector)} className="relative flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
              <span className="text-sm font-medium">{currentNetwork.name}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Balance Display - Centered */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r text-primary">
              {balance} {currentNetwork.symbol}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span className="text-lg">${balanceUSD}</span>
              <span className="text-green-400 text-sm">+0.7%</span>
            </div>
          </div>

          {/* Action Buttons - Send, Receive, Buy */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button onClick={() => setShowSendModal(true)} className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <IoIosSend className="w-5 h-5" />
              <span className="font-medium">Send</span>
            </button>

            <button className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <GiReceiveMoney className="w-5 h-5" />
              <span className="font-medium">Receive</span>
            </button>

            <button className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <MdShoppingCart className="w-5 h-5" />
              <span className="font-medium">Buy</span>
            </button>
          </div>

          {/* Account Selector Dropdown */}
          {showAccountSelector && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAccountSelector(false)} />
              {/* Dropdown */}
              <div className="absolute top-20 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-50">
                <div className="p-4 space-y-2">
                  {allAccounts.map((account: Account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setCurrentAccount(account);
                        setShowAccountSelector(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${currentAccount?.id === account.id ? "bg-[#00F4C8]/20 border border-[#00F4C8]/50" : "bg-gray-800 hover:bg-gray-700"}`}>
                      <div className="flex items-center gap-3">
                        <PixelAvatar address={account?.address || ""} size={42} />
                        <div className="text-left">
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-gray-400">{formatAddress(account.address)}</div>
                        </div>
                      </div>
                      {currentAccount?.id === account.id && (
                        <svg className="w-5 h-5 text-[#00F4C8]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-800 p-4">
                  <button
                    onClick={() => {
                      setShowAccountSelector(false);
                      setShowAddAccountModal(true);
                    }}
                    className="base-button">
                    Add Account
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Add Account Modal */}
          {showAddAccountModal && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/50 z-50" />
              {/* Modal */}
              <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div></div>
                  <h2 className="text-lg font-medium">添加账户</h2>
                  <button onClick={() => setShowAddAccountModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Menu Options */}
                <div className="p-4 space-y-2">
                  {/* 创建新账户 */}
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-white font-medium">创建新账户</div>
                  </button>

                  {/* 以太坊账户 */}
                  <button onClick={handleAddEthereumAccount} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-6 h-6 flex items-center justify-center text-[#00F4C8]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-white font-medium">以太坊账户</div>
                  </button>

                  {/* 导入钱包或账户 */}
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-white font-medium">导入钱包或账户</div>
                  </button>

                  {/* 私钥助记词 */}
                  <button
                    onClick={() => {
                      setShowAddAccountModal(false);
                      setShowImportWalletModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-6 h-6 flex items-center justify-center text-purple-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-white font-medium">私钥助记词</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Network Selector Dropdown */}
          {showNetworkSelector && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNetworkSelector(false)} />
              {/* Dropdown */}
              <div className="absolute top-20 right-8 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-[60] min-w-[240px]">
                <div className="p-4 space-y-2">
                  {networkController.getAllNetworks().map((network) => (
                    <button key={network.id} onClick={() => handleNetworkSwitch(network.id)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${currentNetwork.id === network.id ? "bg-[#00F4C8]/20 border border-[#00F4C8]/50" : "bg-gray-800 hover:bg-gray-700"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold">{network.symbol.charAt(0)}</div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{network.name}</div>
                          <div className="text-xs text-gray-400">Chain ID: {network.chainId}</div>
                        </div>
                      </div>
                      {currentNetwork.id === network.id && (
                        <svg className="w-5 h-5 text-[#00F4C8]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Main Content */}
        <main className="px-8 space-y-8">
          {/* 资产展示区域 */}
          <WalletAssets></WalletAssets>

          {/* Market Statistics */}
          <section>
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
                    <div key={item.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
                            <img src={item.icon} alt={item.code} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">{item.code.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-400 text-xs">{item.code.toUpperCase()}</div>
                        </div>
                      </div>

                      {/* Mini chart - Recharts version */}
                      <div className="flex-1 mx-4 h-8">
                        <ResponsiveContainer width="100%" height={32}>
                          <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                            <YAxis domain={yDomain} hide />
                            <Line type="monotone" dataKey="price" stroke={chartColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-medium">{formatPrice(item.price)}</div>
                        <div className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          <svg className={`w-3 h-3 ${!isPositive && "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {Math.abs(item.changeRate).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>

        {/* Send Modal */}
        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          currentAccount={currentAccount}
          currentNetwork={currentNetwork}
          balance={balance}
          onTransactionComplete={(txHash) => {
            console.log("Transaction completed:", txHash);
            // Refresh balance after transaction
            fetchBalance(currentNetwork);
          }}
        />

        {/* Import Wallet Modal */}
        {showImportWalletModal && <ImportWalletModal onClose={() => setShowImportWalletModal(false)} />}
      </div>
    </div>
  );
}
