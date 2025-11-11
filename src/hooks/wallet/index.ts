/**
 * 钱包 Hooks 统一导出
 *
 * 架构说明:
 * 所有钱包操作直接通过 Controller 实现:
 * - walletController: 钱包创建、导入、解锁、账户管理
 * - networkController: 网络切换和自定义网络管理
 *
 * 配合 Stores 使用:
 * - useWalletStore: 钱包状态和基础方法
 * - useUIStore: UI 状态 (loading, error, modals)
 */

// 该目录已废弃，所有功能通过 Controller 实现
// import { walletController, networkController } from '@/controllers';
