"use client";

import React, { useCallback, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import {walletController} from "@/controllers/WalletController";
import { useWalletStore } from "@/stores";

/**
 * Unlock 组件 - 钱包解锁页面
 *
 * 当用户已创建/导入钱包但尚未解锁时显示
 */
export default function Unlock() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, loadingMessage, error, setError, clearError, setLoading } = useUIStore();
  const {setWalletStatus} = useWalletStore();

  const unlockWallet = async (password: string) => {
    setLoading(true, "正在解锁钱包...");
    clearError();

    try {
      const success = walletController.unlock(password);
      if (!success) {
        setError("密码错误，请重试");
        return false;
      }
      console.log("钱包解锁成功");
      return true;
    } catch (error: any) {
      // 这里不应该再有异常了，因为 unlock 已经处理了所有错误
      console.error("Unexpected error during unlock:", error);
      setError("钱包解锁失败，请稍后重试");
      return false;
    } finally {
      console.log("解锁完成");
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!password) {
      setError("请输入密码");
      return;
    }

    const success = await unlockWallet(password);
    if (!success) {
      setPassword("");
    }
    setWalletStatus("unlocked");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Container with max width for large screens */}
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12">
          <img src="/images/ic_lock.png" alt="Unlock Wallet" className="w-32 h-32" />
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
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={handlePasswordChange} placeholder="输入您的密码" disabled={isLoading} className={`w-full bg-gray-900 border ${error ? "border-red-500" : "border-gray-700"} rounded-lg px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} autoFocus />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors" tabIndex={-1}>
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
          <button type="submit" disabled={isLoading || !password} className="cursor-pointer w-full bg-primary text-black h-[52px] rounded-2xl font-semibold text-base hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg aria-hidden="true" role="status" className="inline w-5 h-5 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                </svg>
                <span>{loadingMessage || "解锁中..."}</span>
              </>
            ) : (
              <>
                <span>解锁钱包</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
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
                <p className="text-xs text-gray-400 leading-relaxed">请妥善保管您的密码和助记词。Unicorn Wallet 不会存储您的密码，如果忘记密码，您需要使用助记词重新导入钱包。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
