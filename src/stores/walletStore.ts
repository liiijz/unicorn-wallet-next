import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { KeyringController } from '@/controllers/KeyringController';
import { AccountController } from '@/controllers/AccountController';
import { walletEventBus } from '@/events/WalletEvents';
import type { IKeyring } from '@/types/Keyring';
import type { Account } from '@/types/Account';

interface WalletState {
  // 认证状态
  isUnlocked: boolean;
  isInitialized: boolean;

  // 钱包数据
  keyrings: IKeyring[];
  accounts: Account[];
  currentAccount: Account | null;

  // Controller 实例
  keyringController: KeyringController;
  accountController: AccountController;
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
  addNewAccount: () => Promise<Account | null>;
  updateAccountName: (address: string, name: string) => void;
  getAccountByAddress: (address: string) => Account | undefined;

  // 数据同步
  refreshWalletData: () => void;
}

type WalletStore = WalletState & WalletActions;

// 创建 KeyringController 实例
const keyringController = new KeyringController();
// 创建 AccountController 实例（不再需要传递 keyringController）
const accountController = new AccountController();

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        isUnlocked: false,
        isInitialized: false,
        keyrings: [],
        accounts: [],
        currentAccount: null,
        keyringController,
        accountController,

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

            // 订阅一次账户同步事件
            return new Promise<boolean>((resolve) => {
              const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
                const keyrings = keyringController.getKeyrings();

                set({
                  isUnlocked: true,
                  keyrings,
                  accounts,
                  currentAccount: accounts[0] || null,
                });

                // 取消订阅
                walletEventBus.off('account:synced', handleAccountSynced);
                resolve(true);
              };

              walletEventBus.on('account:synced', handleAccountSynced);

              // restoreVault 会触发 keyring:restored 事件
              // AccountController 会自动响应并同步账户
              keyringController.restoreVault();
            });
          } catch (error) {
            console.error('Failed to unlock wallet:', error);
            return false;
          }
        },

        // 锁定钱包
        lock: () => {
          const { keyringController } = get();

          // 调用 keyringController.lock() 会触发 keyring:locked 事件
          // AccountController 会自动响应并清空账户
          keyringController.lock();

          set({
            isUnlocked: false,
            keyrings: [],
            accounts: [],
            currentAccount: null,
          });
        },

        // 创建新钱包
        createNewWallet: async (password: string): Promise<string> => {
          const { keyringController } = get();
          keyringController.setPassword(password);

          // 订阅一次账户同步事件
          return new Promise<string>((resolve) => {
            const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
              const keyrings = keyringController.getKeyrings();

              set({
                isUnlocked: true,
                isInitialized: true,
                keyrings,
                accounts,
                currentAccount: accounts[0] || null,
              });

              // 取消订阅
              walletEventBus.off('account:synced', handleAccountSynced);
            };

            walletEventBus.on('account:synced', handleAccountSynced);

            // createNew 会触发 keyring:created 事件
            // AccountController 会自动响应并同步账户
            const mnemonic = keyringController.createNew();
            keyringController.persistVault();

            resolve(mnemonic);
          });
        },

        // 导入钱包
        importWallet: async (mnemonic: string, password: string): Promise<void> => {
          const { keyringController } = get();
          keyringController.setPassword(password);

          // 订阅一次账户同步事件
          return new Promise<void>((resolve) => {
            const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
              const keyrings = keyringController.getKeyrings();

              set({
                isUnlocked: true,
                isInitialized: true,
                keyrings,
                accounts,
                currentAccount: accounts[0] || null,
              });

              // 取消订阅
              walletEventBus.off('account:synced', handleAccountSynced);
              resolve();
            };

            walletEventBus.on('account:synced', handleAccountSynced);

            // importFromMnemonic 会触发 keyring:imported 事件
            // AccountController 会自动响应并同步账户
            keyringController.importFromMnemonic(mnemonic);
            keyringController.persistVault();
          });
        },

        // 设置当前账户
        setCurrentAccount: (account: Account) => {
          set({ currentAccount: account });
        },

        // 获取所有账户
        getAllAccounts: (): Account[] => {
          const { accounts } = get();
          return accounts;
        },

        // 添加新账户
        addNewAccount: async (): Promise<Account | null> => {
          const { keyringController } = get();

          // 订阅一次账户同步事件
          return new Promise<Account | null>((resolve) => {
            const handleAccountSynced = ({ accounts }: { accounts: Account[] }) => {
              set({ accounts });

              // 取消订阅
              walletEventBus.off('account:synced', handleAccountSynced);

              // 返回最后添加的账户
              resolve(accounts[accounts.length - 1] || null);
            };

            walletEventBus.on('account:synced', handleAccountSynced);

            // addAccountToKeyring 会触发 keyring:accountAdded 事件
            // AccountController 会自动响应并同步账户
            keyringController.addAccountToKeyring(0).catch((error) => {
              console.error('Failed to add account:', error);
              walletEventBus.off('account:synced', handleAccountSynced);
              resolve(null);
            });
          });
        },

        // 更新账户名称
        updateAccountName: (address: string, name: string) => {
          const { accountController } = get();
          accountController.updateAccountName(address, name);

          const accounts = accountController.getAllAccounts();
          set({ accounts });
        },

        // 根据地址获取账户
        getAccountByAddress: (address: string): Account | undefined => {
          const { accountController } = get();
          return accountController.getAccountByAddress(address);
        },

        // 刷新钱包数据
        refreshWalletData: () => {
          const { keyringController } = get();
          const keyrings = keyringController.getKeyrings();

          // 触发 keyring:updated 事件（需要先添加这个事件）
          walletEventBus.emit('keyring:updated', {
            keyrings,
          });

          // 由于没有订阅 keyring:updated，这里需要手动获取 accounts
          const { accounts } = get();

          set({
            keyrings,
            accounts,
            currentAccount: accounts[0] || null,
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