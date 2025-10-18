'use client';

import { useEffect } from 'react';
import { useWalletAuth } from '@/hooks/wallet';
import { useWalletStore } from '@/stores/walletStore';
import Welcome from '@/components/Welcome';
import Unlock from '@/components/Unlock';
import WalletHome from '@/components/WalletHome';

/**
 * 主页面路由逻辑
 *
 * 根据钱包状态自动切换显示不同的页面：
 * 1. 未初始化（无钱包数据）-> Welcome 页面
 * 2. 已初始化但未解锁 -> Unlock 页面
 * 3. 已解锁 -> WalletHome 页面
 */
export default function Home() {
  const { isInitialized, isUnlocked } = useWalletStore();
  const { initialize } = useWalletAuth();

  // 初始化钱包状态（检查是否有存储的钱包数据）
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 路由逻辑
  if (!isInitialized) {
    // 首次使用，显示欢迎页面
    return <Welcome />;
  }

  if (!isUnlocked) {
    // 有钱包但未解锁，显示解锁页面
    return <Unlock />;
  }

  // 已解锁，显示主钱包界面
  return <WalletHome />;
}
