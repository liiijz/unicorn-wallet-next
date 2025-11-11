import { useWalletStore } from '@/stores/walletStore';
import { useCallback, useState } from 'react';
import { walletController } from '@/controllers';

/**
 * 钱包账户管理 Hook
 *
 * 职责:
 * - 提供账户管理操作 (添加、切换、刷新)
 * - 管理本地 UI 状态 (loading、error)
 *
 * 使用场景:
 * - WalletHome 页面 (添加账户、切换账户)
 * - 账户管理页面
 */
export const useWalletAccounts = () => {
  const { accounts, setCurrentAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 切换账户
  const switchAccount = useCallback((accountIndex: number) => {
    try {
      if (accounts[accountIndex]) {
        setCurrentAccount(accounts[accountIndex]);
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      setError('账户切换失败');
    }
  }, [accounts, setCurrentAccount]);

  // 添加新账户
  const addAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newAccount = await walletController.addAccount();
      if (newAccount) {
        setCurrentAccount(newAccount);
        return newAccount;
      } else {
        setError('账户创建失败');
        return null;
      }
    } catch (error) {
      console.error('Failed to add account:', error);
      setError('账户创建失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentAccount]);

  // 刷新钱包数据
  const refresh = useCallback(() => {
    try {
      // 刷新逻辑可以在这里实现,例如重新从 Store 获取账户
      // 当前 Store 已经是响应式的,不需要显式刷新
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
      setError('数据刷新失败');
    }
  }, []);

  return {
    // 账户管理方法
    switchAccount,
    addAccount,
    refresh,
    // UI 状态
    isLoading,
    error,
  };
};
