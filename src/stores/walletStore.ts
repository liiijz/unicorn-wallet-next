import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { KeyringController } from '@/controllers/KeyringController';
import type { IKeyring } from '@/types/Keyring';
import type { Account } from '@/types/Account';

interface WalletState {
  // 认证状态
  isUnlocked: boolean;
  isInitialized: boolean;

  // 钱包数据
  keyrings: IKeyring[];
  currentAccount: Account | null;

  // KeyringController 实例
  keyringController: KeyringController;
}

interface WalletActions {
  // 初始化操作
  initializeWallet: () => void;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;

  // 钱包管理
  createNewWallet: (password: string) => Promise<string>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;

  // 账户管理
  setCurrentAccount: (account: Account) => void;
  getAllAccounts: () => Account[];

  // 数据同步
  refreshWalletData: () => void;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        isUnlocked: false,
        isInitialized: false,
        keyrings: [],
        currentAccount: null,
        keyringController: new KeyringController(),

        // 初始化钱包
        initializeWallet: () => {
          const hasVault = localStorage.getItem('KeyringController');
          set({ isInitialized: !!hasVault });
        },

        // 解锁钱包
        unlock: async (password: string): Promise<boolean> => {
          try {
            const { keyringController } = get();
            keyringController.setPassword(password);
            keyringController.restoreVault();

            const keyrings = keyringController.getKeyrings();
            const allAccounts = get().getAllAccounts();

            set({
              isUnlocked: true,
              keyrings,
              currentAccount: allAccounts[0] || null,
            });

            return true;
          } catch (error) {
            console.error('Failed to unlock wallet:', error);
            return false;
          }
        },

        // 锁定钱包
        lock: () => {
          set({
            isUnlocked: false,
            keyrings: [],
            currentAccount: null,
          });
        },

        // 创建新钱包
        createNewWallet: async (password: string): Promise<string> => {
          const { keyringController } = get();
          keyringController.setPassword(password);
          const mnemonic = keyringController.createNew();
          keyringController.persistVault();

          const keyrings = keyringController.getKeyrings();
          const allAccounts = get().getAllAccounts();

          set({
            isUnlocked: true,
            isInitialized: true,
            keyrings,
            currentAccount: allAccounts[0] || null,
          });

          return mnemonic;
        },

        // 导入钱包
        importWallet: async (mnemonic: string, password: string): Promise<void> => {
          const { keyringController } = get();
          keyringController.setPassword(password);
          keyringController.importFromMnemonic(mnemonic);
          keyringController.persistVault();

          const keyrings = keyringController.getKeyrings();
          const allAccounts = get().getAllAccounts();

          set({
            isUnlocked: true,
            isInitialized: true,
            keyrings,
            currentAccount: allAccounts[0] || null,
          });
        },

        // 设置当前账户
        setCurrentAccount: (account: Account) => {
          set({ currentAccount: account });
        },

        // 获取所有账户
        getAllAccounts: (): Account[] => {
          return [];
        },

        // 刷新钱包数据
        refreshWalletData: () => {
          const { keyringController } = get();
          const keyrings = keyringController.getKeyrings();
          const allAccounts = get().getAllAccounts();

          set({
            keyrings,
            currentAccount: allAccounts[0] || null,
          });
        },
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          isInitialized: state.isInitialized,
          // 只持久化基本状态，敏感数据通过 KeyringController 加密存储
        }),
      }
    ),
    {
      name: 'wallet-store',
    }
  )
);