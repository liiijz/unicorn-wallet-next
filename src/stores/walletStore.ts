import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { Account } from "@/types/Account";
import type { IKeyring } from "@/types/Keyring";
import type { WalletStatus } from "@/types/WalletStatus";
import type { Network } from "@/types/Network";
import { PRESET_NETWORKS } from "@/types/Network";

interface WalletState {
    // 账户元数据映射（address -> AccountMetadata）
    accountMetadataMap: Record<string, import("@/types/Account").AccountMetadata>;
  // 钱包状态（替代 isUnlocked 和 isInitialized）
  walletStatus: WalletStatus;

  // 钱包数据
  keyrings: IKeyring[];
  accounts: Account[];
  currentAccount: Account | null;
  password: string | null;

  // 网络数据
  currentNetwork: Network;
  customNetworks: Network[];
}

interface WalletActions {
  setAccountMetadata: (address: string, metadata: import("@/types/Account").AccountMetadata) => void;
  setAccountMetadataMap: (map: Record<string, import("@/types/Account").AccountMetadata>) => void;

  setKeyrings: (keyrings: IKeyring[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setCurrentAccount: (account: Account) => void;
  setPassword: (password: string | null) => void;
  setWalletStatus: (status: WalletStatus) => void;
  setCurrentNetwork: (network: Network) => void;
  setCustomNetworks: (networks: Network[]) => void;
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
        currentNetwork: PRESET_NETWORKS[0], // 默认以太坊主网
        customNetworks: [],
        accountMetadataMap: {},

        // setters
        setKeyrings: (keyrings) => set({ keyrings }),
        setAccounts: (accounts) => set({ accounts }),
        setCurrentAccount: (account) => set({ currentAccount: account }),
        setPassword: (password) => set({ password }),
        setWalletStatus: (status) => set({ walletStatus: status }),
        setCurrentNetwork: (network) => set({ currentNetwork: network }),
        setCustomNetworks: (networks) => set({ customNetworks: networks }),
        setAccountMetadata: (address, metadata) => set((state) => ({
          accountMetadataMap: {
            ...state.accountMetadataMap,
            [address]: metadata,
          },
        })),
        setAccountMetadataMap: (map) => set({ accountMetadataMap: map }),
      }),
      {
        name: "wallet-storage",
        partialize: (state) => ({
          walletStatus: state.walletStatus,
          accountMetadataMap: state.accountMetadataMap,
        }),
      }
    ),
    {
      name: "wallet-store",
    }
  )
);
