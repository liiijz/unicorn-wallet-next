"use client";

import { useEffect } from "react";
import { useWalletAuth } from "@/hooks/wallet";
import { useWalletStore } from "@/stores/walletStore";
import Welcome from "@/components/Welcome";
import Unlock from "@/components/Unlock";
import WalletHome from "@/components/WalletHome";
import { useUIStore } from "@/stores";

/**
 * 主页面路由逻辑
 *
 * 根据钱包状态自动切换显示不同的页面：
 * 1. uninitialized -> Welcome 页面
 * 2. locked -> Unlock 页面
 * 3. unlocked -> WalletHome 页面
 * 4. showing-mnemonic -> Welcome 页面（会显示助记词模态框）
 */
export default function Home() {
  const { walletStatus, setWalletStatus } = useWalletStore();
  const { setError } = useUIStore();

  const initialize = () => {
    try {
      const hasVault = localStorage.getItem("vault");
      setWalletStatus(hasVault ? "locked" : "uninitialized");
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      setError("钱包初始化失败");
    }
  };

  // 初始化钱包状态（检查是否有存储的钱包数据）
  useEffect(() => {
    initialize();
  }, []);

  // 路由逻辑
  if (walletStatus === "uninitialized" || walletStatus === "showing-mnemonic") {
    // 首次使用或正在显示助记词，显示欢迎页面
    return <Welcome />;
  }

  if (walletStatus === "locked") {
    // 有钱包但未解锁，显示解锁页面
    return <Unlock />;
  }

  if (walletStatus === "unlocked") {
    // 已解锁，显示主钱包界面
    return <WalletHome />;
  }

  // 加载中状态
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-400">加载中...</p>
      </div>
    </div>
  );
}
