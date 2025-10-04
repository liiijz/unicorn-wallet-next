"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import type { Account } from "@/types/Account";
import Avatar from "./Avatar";

/**
 * WalletHome 组件 - 主钱包界面
 *
 * 当用户已解锁钱包后显示的主界面
 */
export default function WalletHome() {
  const { currentAccount, allAccounts, lockWallet, setCurrentAccount, addAccount } = useWallet();
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // 格式化地址显示（显示前6位和后4位）
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  const handleAddEthereumAccount = async () => {
    setShowAddAccountModal(false);
    const newAccount = await addAccount();
    if (newAccount) {
      // 账户已自动设置为当前账户
      console.log("New account created:", newAccount);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Container with max width for large screens */}
      <div className="max-w-2xl mx-auto">
        {/* Top Bar */}
        <header className="px-8 pt-8 pb-6 relative">
          <div className="flex items-center justify-between mb-8">
            {/* Avatar - Square with rounded corners */}
            <button onClick={() => setShowAccountSelector(!showAccountSelector)} className="relative">
              {/* <div className="w-[42px] h-[42px] rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 flex items-center justify-center text-sm font-bold overflow-hidden">
                {currentAccount?.name?.charAt(0) || "A"}</div> */}
              <Avatar address={currentAccount?.address || ""} />
            </button>

            {/* Network Dropdown */}
            <button className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
              <span className="text-sm font-medium">Ethereum Main</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Balance Display - Centered */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{currentAccount?.balance || "0.0000"} ETH</div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span className="text-lg">${currentAccount?.balance ? (parseFloat(currentAccount.balance) * 2000).toFixed(2) : "0.00"}</span>
              <span className="text-green-400 text-sm">+0.7%</span>
            </div>
          </div>

          {/* Action Buttons - Send, Receive, Buy */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="font-medium">Sent</span>
            </button>

            <button className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="font-medium">Receive</span>
            </button>

            <button className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-800 px-6 py-3 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Buy</span>
            </button>
          </div>

          {/* Account Selector Dropdown */}
          {showAccountSelector && (
            <>
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
                        <Avatar address={account?.address || ""}></Avatar>
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
                  <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
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
        </header>

        {/* Main Content */}
        <main className="px-8 space-y-8">
          {/* My Portfolio Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">My Portfolio</h3>
              <button className="flex items-center gap-1 text-[#00F4C8] text-sm">
                <span>Monthly</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Portfolio Cards Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Bitcoin Card */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 backdrop-blur-xl rounded-3xl p-5 border border-purple-800/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">₿</div>
                  <div>
                    <div className="text-white font-medium text-sm">Bitcoin</div>
                    <div className="text-gray-400 text-xs">BTC</div>
                  </div>
                </div>

                {/* Simple chart line */}
                <div className="h-12 mb-4 flex items-end">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <path d="M 0,20 Q 15,25 25,15 T 50,18 T 75,8 T 100,12" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-white font-semibold text-lg">$6780</div>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>11.75%</span>
                  </div>
                </div>
              </div>

              {/* Ethereum Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 backdrop-blur-xl rounded-3xl p-5 border border-blue-800/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">Ξ</div>
                  <div>
                    <div className="text-white font-medium text-sm">Ethereum</div>
                    <div className="text-gray-400 text-xs">ETH</div>
                  </div>
                </div>

                {/* Simple chart line */}
                <div className="h-12 mb-4 flex items-end">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <path d="M 0,15 Q 15,10 25,18 T 50,12 T 75,16 T 100,10" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-white font-semibold text-lg">$1478.10</div>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>4.75%</span>
                  </div>
                </div>
              </div>

              {/* Cardano Card */}
              <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 backdrop-blur-xl rounded-3xl p-5 border border-cyan-800/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">₳</div>
                  <div>
                    <div className="text-white font-medium text-sm">Cardano</div>
                    <div className="text-gray-400 text-xs">ADA</div>
                  </div>
                </div>

                {/* Simple chart line */}
                <div className="h-12 mb-4 flex items-end">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <path d="M 0,18 Q 15,14 25,20 T 50,15 T 75,12 T 100,8" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-white font-semibold text-lg">$892.45</div>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>8.32%</span>
                  </div>
                </div>
              </div>

              {/* Solana Card */}
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 backdrop-blur-xl rounded-3xl p-5 border border-emerald-800/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">◎</div>
                  <div>
                    <div className="text-white font-medium text-sm">Solana</div>
                    <div className="text-gray-400 text-xs">SOL</div>
                  </div>
                </div>

                {/* Simple chart line */}
                <div className="h-12 mb-4 flex items-end">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <path d="M 0,22 Q 15,18 25,12 T 50,15 T 75,10 T 100,14" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-white font-semibold text-lg">$324.80</div>
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <svg className="w-3 h-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>2.15%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Refer Rewards Banner */}
          {/* <section>
          <div className="relative bg-gradient-to-r from-[#00F4C8] to-[#00D4B8] rounded-3xl p-6 overflow-hidden">
            <button className="absolute top-4 right-4 text-black/60 hover:text-black">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative z-10">
              <div className="text-black/70 text-sm font-medium mb-1">Refer Rewards</div>
              <div className="text-black text-xl font-bold mb-2">Earn 5$ rewards on every<br />successfull refers</div>
            </div>
            <div className="absolute -right-2 -bottom-2 text-6xl">👌</div>
          </div>
        </section> */}

          {/* Market Statistics */}
          <section>
            <h3 className="text-white text-lg font-medium mb-4">Market Statistics</h3>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {["24 hrs", "Hot", "Profit", "Rising", "Loss", "Top Gain"].map((tab, index) => (
                <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${index === 0 ? "bg-gray-800 text-white" : "bg-transparent text-gray-400 hover:bg-gray-800/50"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Market Items - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cardano */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">₳</div>
                  <div>
                    <div className="text-white font-medium">Cardano</div>
                    <div className="text-gray-400 text-xs">ADA</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,12 Q 15,8 25,14 T 50,10 T 80,6" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$123.77</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    11.75%
                  </div>
                </div>
              </div>

              {/* Uniswap */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold">🦄</div>
                  <div>
                    <div className="text-white font-medium">Uniswap</div>
                    <div className="text-gray-400 text-xs">LTC</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,8 Q 15,12 25,6 T 50,10 T 80,14" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$16.96</div>
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    11.75%
                  </div>
                </div>
              </div>

              {/* Tether */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">₮</div>
                  <div>
                    <div className="text-white font-medium">Tether</div>
                    <div className="text-gray-400 text-xs">USDT</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,10 Q 15,10 25,10 T 50,10 T 80,10" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$0.98</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    0.05%
                  </div>
                </div>
              </div>

              {/* Polkadot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">●</div>
                  <div>
                    <div className="text-white font-medium">Polkadot</div>
                    <div className="text-gray-400 text-xs">DOT</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,16 Q 15,12 25,8 T 50,12 T 80,10" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$45.23</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    6.82%
                  </div>
                </div>
              </div>

              {/* Chainlink */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">⬡</div>
                  <div>
                    <div className="text-white font-medium">Chainlink</div>
                    <div className="text-gray-400 text-xs">LINK</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,14 Q 15,16 25,12 T 50,14 T 80,8" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$28.94</div>
                  <div className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    9.54%
                  </div>
                </div>
              </div>

              {/* Avalanche */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">▲</div>
                  <div>
                    <div className="text-white font-medium">Avalanche</div>
                    <div className="text-gray-400 text-xs">AVAX</div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="flex-1 mx-4 h-8">
                  <svg viewBox="0 0 80 20" className="w-full h-full">
                    <path d="M 0,10 Q 15,14 25,18 T 50,16 T 80,12" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">$67.32</div>
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    3.24%
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
