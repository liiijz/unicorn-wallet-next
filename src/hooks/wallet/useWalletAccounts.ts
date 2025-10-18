import { useWalletStore } from '@/stores/walletStore';
import { useUIStore } from '@/stores/uiStore';
import { useCallback } from 'react';

/**
 * 钱包账户管理 Hook
 *
 * 职责:
 * - 提供账户管理操作 (添加、切换、刷新)
 * - 自动处理 UI 反馈 (loading、error)
 *
 * 使用场景:
 * - WalletHome 页面 (添加账户、切换账户)
 * - 账户管理页面
 */
export const useWalletAccounts = () => {
  const {
    setCurrentAccount,
    getAllAccounts,
    addNewAccount,
    refreshWalletData,
  } = useWalletStore();

  const { setLoading, setError, clearError } = useUIStore();

  // 切换账户
  const switchAccount = useCallback((accountIndex: number) => {
    try {
      const accounts = getAllAccounts();
      if (accounts[accountIndex]) {
        setCurrentAccount(accounts[accountIndex]);
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      setError('账户切换失败');
    }
  }, [getAllAccounts, setCurrentAccount, setError]);

  // 添加新账户
  const addAccount = useCallback(async () => {
    setLoading(true, '正在创建新账户...');
    clearError();

    try {
      const newAccount = await addNewAccount();
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
      setLoading(false);
    }
  }, [addNewAccount, setCurrentAccount, setLoading, setError, clearError]);

  // 刷新钱包数据
  const refresh = useCallback(() => {
    try {
      refreshWalletData();
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
      setError('数据刷新失败');
    }
  }, [refreshWalletData, setError]);

  return {
    // 账户管理方法
    switchAccount,
    addAccount,
    refresh,
  };
};
