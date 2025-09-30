'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import type { Account } from '@/types/Account';

/**
 * WalletHome 组件 - 主钱包界面
 *
 * 当用户已解锁钱包后显示的主界面
 */
export default function WalletHome() {
  const { currentAccount, allAccounts, lockWallet, setCurrentAccount } = useWallet();
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 格式化地址显示（显示前6位和后4位）
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 复制地址到剪贴板
  const copyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      // TODO: 显示提示消息
      alert('地址已复制到剪贴板');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          {/* Account Selector */}
          <button
            onClick={() => setShowAccountSelector(!showAccountSelector)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-sm font-bold">
              {currentAccount?.name?.charAt(0) || 'A'}
            </div>
            <span className="font-medium">{currentAccount?.name || 'Account 1'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAccountSelector ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-900 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Account Selector Dropdown */}
        {showAccountSelector && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-xl max-w-md mx-auto">
            <div className="p-4 space-y-2">
              {allAccounts.map((account: Account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    setCurrentAccount(account);
                    setShowAccountSelector(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    currentAccount?.id === account.id
                      ? 'bg-green-500/20 border border-green-500/50'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {account.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-400">{formatAddress(account.address)}</div>
                    </div>
                  </div>
                  {currentAccount?.id === account.id && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowAccountSelector(false);
                  // TODO: 实现添加账户功能
                  alert('添加账户功能开发中...');
                }}
                className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 rounded-lg hover:border-gray-600 hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>添加账户</span>
              </button>
            </div>
          </div>
        )}

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute top-full right-0 bg-gray-900 border-t border-gray-800 shadow-xl w-64 mr-6">
            <div className="p-2">
              <button
                onClick={() => {
                  setShowSettings(false);
                  lockWallet();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>锁定钱包</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pb-6">
        {/* Balance Section */}
        <section className="py-8 text-center">
          {/* Address */}
          <button
            onClick={copyAddress}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-6 transition-colors group"
          >
            <span className="text-sm">{formatAddress(currentAccount?.address || '')}</span>
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Main Balance */}
          <div className="mb-2">
            <h2 className="text-5xl font-bold">{currentAccount?.balance || '0.00'}</h2>
            <span className="text-2xl text-gray-400 ml-2">ETH</span>
          </div>

          {/* USD Value */}
          <div className="text-gray-400 text-lg">
            ≈ $0.00 USD
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-gray-800 py-6 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <span className="text-sm font-medium">发送</span>
            </button>

            <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-gray-800 py-6 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
              <span className="text-sm font-medium">接收</span>
            </button>

            <button className="flex flex-col items-center gap-3 bg-gray-900 hover:bg-gray-800 py-6 rounded-2xl transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-sm font-medium">交换</span>
            </button>
          </div>
        </section>

        {/* Assets Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">资产</h3>
            <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              管理
            </button>
          </div>

          <div className="space-y-2">
            {/* ETH Token */}
            <div className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Ethereum</div>
                    <div className="text-sm text-gray-400">ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{currentAccount?.balance || '0.00'}</div>
                  <div className="text-sm text-gray-400">$0.00</div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            <div className="text-center py-8 text-gray-500 text-sm">
              暂无其他资产
            </div>
          </div>
        </section>

        {/* Activity Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">活动</h3>
            <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              查看全部
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-gray-900 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">暂无交易记录</p>
          </div>
        </section>
      </main>
    </div>
  );
}