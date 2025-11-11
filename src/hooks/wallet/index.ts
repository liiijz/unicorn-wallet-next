/**
 * 钱包 Hooks 统一导出
 *
 * 架构说明:
 * - useWalletAuth: 认证相关操作 (unlock, lock, create, import)
 * - useWalletAccounts: 账户管理操作 (add, switch, refresh)
 *
 * 配合 Stores 使用:
 * - useWalletStore: 钱包状态和基础方法
 * - useUIStore: UI 状态 (loading, error, modals)
 */
export { useWalletAccounts } from './useWalletAccounts';
