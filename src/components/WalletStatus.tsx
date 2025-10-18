'use client';

import { useWalletAuth } from '@/hooks/wallet';
import { useWalletStore } from '@/stores/walletStore';
import { useUIStore } from '@/stores/uiStore';

export default function WalletStatus() {
  const { isUnlocked, isInitialized, currentAccount, getAllAccounts } = useWalletStore();
  const { initialize, unlockWallet, lockWallet, createWallet } = useWalletAuth();
  const allAccounts = getAllAccounts();

  const { isLoading, loadingMessage, error, clearError } = useUIStore();

  // 初始化钱包（仅在首次加载时）
  if (!isInitialized) {
    initialize();
  }

  const handleCreateWallet = async () => {
    const mnemonic = await createWallet('test123');
    if (mnemonic) {
      alert(`钱包创建成功！助记词：${mnemonic}`);
    }
  };

  const handleUnlock = async () => {
    await unlockWallet('test123');
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <div className="text-blue-700">
          加载中... {loadingMessage}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <div className="text-red-700 mb-2">错误: {error}</div>
        <button
          onClick={clearError}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          清除错误
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">欢迎使用 Unicorn Wallet</h3>
        <button
          onClick={handleCreateWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          创建新钱包
        </button>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">钱包已锁定</h3>
        <button
          onClick={handleUnlock}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          解锁钱包
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">钱包状态</h3>

      <div className="space-y-2 mb-4">
        <div className="text-green-600">✅ 钱包已解锁</div>
        <div>账户数量: {allAccounts.length}</div>
        {currentAccount && (
          <div className="text-sm">
            <div>当前账户: {currentAccount.address}</div>
            <div>余额: {currentAccount.balance || '0'} ETH</div>
          </div>
        )}
      </div>

      <button
        onClick={lockWallet}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        锁定钱包
      </button>
    </div>
  );
}