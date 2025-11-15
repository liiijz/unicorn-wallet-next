"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { walletController } from "@/controllers/WalletController";
import Welcome from "@/components/Welcome";
import Unlock from "@/components/Unlock";
import WalletHome from "@/components/WalletHome";
import Splash from "@/components/Splash";

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
  const { walletStatus } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // 等待客户端挂载，避免 i18n SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    walletController.initialize();
  }, []);

  // SSR 阶段显示加载占位符
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center opacity-0">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // Splash 启动动画
  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} duration={2000} />;
  }

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
