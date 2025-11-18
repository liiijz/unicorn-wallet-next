import { useWalletStore } from "@/stores/walletStore";
import { useState } from "react";
import type { Portfolio } from "@/types/Token";


export const WalletAssets = ({ portfolio, isLoading, onTabClick }: { portfolio: Portfolio, isLoading: boolean, onTabClick?: (tab: string) => void }) => {
  const { currentAccount } = useWalletStore();

  const [activeTab, setActiveTab] = useState<string>("tokens");
  
  const tabs = [
    {
      name: "Tokens",
      value: "tokens",
    },
    {
      name: "NFTs",
      value: "nfts",
    },
  ];

  return (
    <section>
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {tabs.map((tab) => (
            <li className="me-2 cursor-pointer" key={tab.value}>
              <a 
                className={
                  activeTab === tab.value 
                    ? "inline-block p-4 text-primary border-b-2 border-primary rounded-t-lg active" 
                    : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                } 
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.name}
              </a>
            </li>
          ))}
        </ul>

        {/* Tokens Tab Content */}
        {activeTab === "tokens" && (
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
            ) : !portfolio || portfolio.tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No tokens found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {currentAccount?.address ? "This address has no ERC-20 tokens" : "Connect wallet to view tokens"}
                </p>
              </div>
            ) : (
              portfolio.tokens.map((token) => (
                <div
                  key={token.contractAddress}
                  className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer"
                >
                  {/* Token Icon & Info */}
                  <div className="flex items-center gap-3">
                    {token.logoURI ? (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol} 
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          // 图片加载失败时显示默认图标
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm ${token.logoURI ? "hidden" : ""}`}
                    >
                      {token.symbol.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-white font-medium">{token.symbol}</div>
                      <div className="text-gray-400 text-xs">{token.name}</div>
                    </div>
                  </div>

                  {/* Token Balance & Value */}
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {parseFloat(token.balanceFormatted).toFixed(4)}
                    </div>
                    {token.valueUSD && (
                      <div className="text-gray-400 text-xs">
                        ${parseFloat(token.valueUSD).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NFTs Tab Content */}
        {activeTab === "nfts" && (
          <div className="mt-4 text-center py-8 text-gray-400">
            <p>NFT feature coming soon</p>
          </div>
        )}
      </div>
    </section>
  );
};
