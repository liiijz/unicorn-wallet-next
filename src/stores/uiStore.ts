import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // 模态框状态
  isWalletModalOpen: boolean;
  isAccountModalOpen: boolean;
  isSettingsModalOpen: boolean;

  // 加载状态
  isLoading: boolean;
  loadingMessage: string;

  // 错误状态
  error: string | null;

  // 主题
  theme: 'light' | 'dark';
}

interface UIActions {
  // 模态框控制
  openWalletModal: () => void;
  closeWalletModal: () => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  closeAllModals: () => void;

  // 加载状态控制
  setLoading: (loading: boolean, message?: string) => void;

  // 错误状态控制
  setError: (error: string | null) => void;
  clearError: () => void;

  // 主题控制
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isWalletModalOpen: false,
      isAccountModalOpen: false,
      isSettingsModalOpen: false,
      isLoading: false,
      loadingMessage: '',
      error: null,
      theme: 'light',

      // 模态框控制
      openWalletModal: () => set({ isWalletModalOpen: true }),
      closeWalletModal: () => set({ isWalletModalOpen: false }),
      openAccountModal: () => set({ isAccountModalOpen: true }),
      closeAccountModal: () => set({ isAccountModalOpen: false }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),
      closeAllModals: () => set({
        isWalletModalOpen: false,
        isAccountModalOpen: false,
        isSettingsModalOpen: false,
      }),

      // 加载状态控制
      setLoading: (loading: boolean, message = '') => set({
        isLoading: loading,
        loadingMessage: message,
      }),

      // 错误状态控制
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // 主题控制
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
    }),
    {
      name: 'ui-store',
    }
  )
);