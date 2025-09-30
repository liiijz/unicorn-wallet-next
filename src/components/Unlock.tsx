'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useUIStore } from '@/stores/uiStore';

/**
 * Unlock 组件 - 钱包解锁页面
 *
 * 当用户已创建/导入钱包但尚未解锁时显示
 */
export default function Unlock() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { unlockWallet } = useWallet();
  const { isLoading, loadingMessage, error, setError, clearError } = useUIStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!password) {
      setError('请输入密码');
      return;
    }

    const success = await unlockWallet(password);
    if (!success) {
      setPassword('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 blur-2xl opacity-40 rounded-2xl transform scale-125"></div>
          <div className="relative grid grid-cols-2 gap-1 p-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-sm"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-400 rounded-sm"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-sm"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">欢迎回来</h1>
        <p className="text-gray-400 text-sm">输入密码以解锁您的钱包</p>
      </div>

      {/* Unlock Form */}
      <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-6">
        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-gray-400 block">
            密码
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="输入您的密码"
              disabled={isLoading}
              className={`w-full bg-gray-900 border ${
                error ? 'border-red-500' : 'border-gray-700'
              } rounded-lg px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Unlock Button */}
        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full bg-white text-black py-4 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{loadingMessage || '解锁中...'}</span>
            </span>
          ) : (
            '解锁钱包'
          )}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            onClick={() => {
              // TODO: 实现忘记密码功能
              alert('忘记密码功能开发中...\n\n提示：如果忘记密码，您需要使用助记词重新导入钱包。');
            }}
          >
            忘记密码？
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-12 max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-gray-300 font-medium mb-1">安全提示</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                请妥善保管您的密码和助记词。Unicorn Wallet 不会存储您的密码，如果忘记密码，您需要使用助记词重新导入钱包。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}