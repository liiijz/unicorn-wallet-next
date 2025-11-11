import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { Account } from "@/types/Account";
import type { IKeyring } from "@/types/Keyring";
import type { WalletStatus } from "@/types/WalletStatus";

interface WalletState {
  // 钱包状态（替代 isUnlocked 和 isInitialized）
  walletStatus: WalletStatus;

  // 钱包数据
  keyrings: IKeyring[];
  accounts: Account[];
  currentAccount: Account | null;
  password: string | null;
}

interface WalletActions {

  setKeyrings: (keyrings: IKeyring[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setCurrentAccount: (account: Account) => void;
  setPassword: (password: string | null) => void;
  setWalletStatus: (status: WalletStatus) => void;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        walletStatus: 'uninitialized',
        keyrings: [],
        accounts: [],
        currentAccount: null,
        password: null,

        // setters
        setKeyrings: (keyrings) => set({ keyrings }),
        setAccounts: (accounts) => set({ accounts }),
        setCurrentAccount: (account) => set({ currentAccount: account }),
        setPassword: (password) => set({ password }),
        setWalletStatus: (status) => set({ walletStatus: status }),
      }),
      {
        name: "wallet-storage",
        partialize: (state) => ({
          walletStatus: state.walletStatus,
        }),
      }
    ),
    {
      name: "wallet-store",
    }
  )
);
