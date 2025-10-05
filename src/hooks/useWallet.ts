import { useWalletStore } from '@/stores/walletStore';
import { useUIStore } from '@/stores/uiStore';
import { useCallback } from 'react';

/**
 * 钱包相关的自定义 Hook
 * 提供钱包操作的便捷方法和状态管理
 */
export const useWallet = () => {
  const {
    isUnlocked,
    isInitialized,
    currentAccount,
    keyrings,
    networkController,
    initializeWallet,
    unlock,
    lock,
    createNewWallet,
    importWallet,
    setCurrentAccount,
    getAllAccounts,
    addNewAccount,
    refreshWalletData,
  } = useWalletStore();

  const { setLoading, setError, clearError } = useUIStore();

  // 初始化钱包
  const initialize = useCallback(() => {
    try {
      initializeWallet();
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      setError('钱包初始化失败');
    }
  }, [initializeWallet, setError]);

  // 解锁钱包
  const unlockWallet = useCallback(async (password: string) => {
    setLoading(true, '正在解锁钱包...');
    clearError();

    try {
      const success = await unlock(password);
      if (!success) {
        setError('密码错误');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      setError('钱包解锁失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [unlock, setLoading, setError, clearError]);

  // 锁定钱包
  const lockWallet = useCallback(() => {
    try {
      lock();
    } catch (error) {
      console.error('Failed to lock wallet:', error);
      setError('钱包锁定失败');
    }
  }, [lock, setError]);

  // 创建新钱包
  const createWallet = useCallback(async (password: string) => {
    setLoading(true, '正在创建钱包...');
    clearError();

    try {
      const mnemonic = await createNewWallet(password);
      return mnemonic;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      setError('钱包创建失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, [createNewWallet, setLoading, setError, clearError]);

  // 导入钱包
  const importExistingWallet = useCallback(async (mnemonic: string, password: string) => {
    setLoading(true, '正在导入钱包...');
    clearError();

    try {
      await importWallet(mnemonic, password);
      return true;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      setError('钱包导入失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [importWallet, setLoading, setError, clearError]);

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

  // 刷新钱包数据
  const refresh = useCallback(() => {
    try {
      refreshWalletData();
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
      setError('数据刷新失败');
    }
  }, [refreshWalletData, setError]);

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

  return {
    // 状态
    isUnlocked,
    isInitialized,
    currentAccount,
    keyrings,
    allAccounts: getAllAccounts(),
    networkController,

    // 方法
    initialize,
    unlockWallet,
    lockWallet,
    createWallet,
    importExistingWallet,
    switchAccount,
    setCurrentAccount,
    addAccount,
    refresh,
  };
};