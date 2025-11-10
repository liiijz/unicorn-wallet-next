import { useWalletStore } from "@/stores/walletStore";
import { useUIStore } from "@/stores/uiStore";
import { useCallback } from "react";

/**
 * 钱包认证 Hook
 *
 * 职责:
 * - 提供钱包认证相关的操作 (初始化、解锁、锁定、创建、导入)
 * - 自动处理 UI 反馈 (loading、error)
 *
 * 使用场景:
 * - Welcome 页面 (创建/导入钱包)
 * - Unlock 页面 (解锁钱包)
 * - 设置页面 (锁定钱包)
 */
export const useWalletAuth = () => {
  const { initializeWallet, unlock, lock, createNewWallet, importWallet } = useWalletStore();

  const { setLoading, setError, clearError } = useUIStore();

  // 初始化钱包
  const initialize = useCallback(() => {
    try {
      initializeWallet();
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      setError("钱包初始化失败");
    }
  }, [initializeWallet, setError]);

  // 解锁钱包
  const unlockWallet = useCallback(
    async (password: string) => {
      setLoading(true, "正在解锁钱包...");
      clearError();

      try {
        const success = await unlock(password);
        if (!success) {
          setError("密码错误，请重试");
          return false;
        }
        return true;
      } catch (error: any) {
        // 这里不应该再有异常了，因为 unlock 已经处理了所有错误
        console.error("Unexpected error during unlock:", error);
        setError("钱包解锁失败，请稍后重试");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [unlock, setLoading, setError, clearError]
  );

  // 锁定钱包
  const lockWallet = useCallback(() => {
    try {
      lock();
    } catch (error) {
      console.error("Failed to lock wallet:", error);
      setError("钱包锁定失败");
    }
  }, [lock, setError]);

  // 创建新钱包
  const createWallet = useCallback(
    async (password: string) => {
      setLoading(true, "正在创建钱包...");
      clearError();

      try {
        const mnemonic = await createNewWallet(password);
        return mnemonic;
      } catch (error) {
        console.error("Failed to create wallet:", error);
        setError("钱包创建失败");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createNewWallet, setLoading, setError, clearError]
  );

  // 导入钱包
  const importExistingWallet = useCallback(
    async (mnemonic: string, password: string | null) => {
      setLoading(true, "正在导入钱包...");
      clearError();

      try {
        await importWallet(mnemonic, password);
        return true;
      } catch (error) {
        console.error("Failed to import wallet:", error);
        setError("钱包导入失败");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [importWallet, setLoading, setError, clearError]
  );

  return {
    // 认证操作方法
    initialize,
    unlockWallet,
    lockWallet,
    createWallet,
    importExistingWallet,
  };
};
