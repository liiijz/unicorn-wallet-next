import mitt, { Emitter } from "mitt";
import type { IKeyring } from "@/types/Keyring";
import type { Account } from "@/types/Account";
import type { Network } from "@/types/Network";
import { ethers } from "ethers";

/**
 * 钱包事件类型定义
 *
 * KeyringController 发布的事件:
 * - keyring:created      - 新建钱包时触发
 * - keyring:imported     - 导入钱包时触发
 * - keyring:restored     - 解锁钱包时触发
 * - keyring:accountAdded - 添加新账户时触发
 * - keyring:locked       - 锁定钱包时触发
 * - keyring:updated      - Keyring 更新时触发
 *
 * AccountController 发布的事件:
 * - account:synced       - 账户同步完成时触发
 * - account:added        - 新增账户时触发
 * - account:updated      - 账户信息更新时触发
 */
export type WalletEvents = {
  // ========== KeyringController 事件 ==========

  /** 钱包创建事件 */
  "keyring:created": {
    keyrings: IKeyring[];
  };

  /** 钱包导入事件 */
  "keyring:imported": {
    keyrings: IKeyring[];
  };

  /** 钱包恢复/解锁事件 */
  "keyring:restored": {
    keyrings: IKeyring[];
  };

  /** 账户添加事件 */
  "keyring:accountAdded": {
    keyringIndex: number;
    addresses: string[];
  };

  /** 钱包锁定事件 */
  "keyring:locked": void;

  /** Keyring 更新事件 */
  "keyring:updated": {
    keyrings: IKeyring[];
  };

  // ========== AccountController 事件 ==========

  /** 账户同步完成事件 */
  "account:synced": {
    accounts: Account[];
  };

  /** 新增账户事件 */
  "account:added": {
    account: Account;
  };

  /** 账户更新事件 */
  "account:updated": {
    account: Account;
  };

  "network:changed": { network: Network };
  "keyring:providerUpdated": { network: Network; provider: ethers.JsonRpcProvider };
};

/**
 * 全局钱包事件总线实例
 *
 * 使用示例:
 *
 * // 发布事件
 * walletEventBus.emit('keyring:created', { keyrings: [...] });
 *
 * // 订阅事件
 * walletEventBus.on('keyring:created', ({ keyrings }) => {
 *   console.log('Wallet created with keyrings:', keyrings);
 * });
 *
 * // 取消订阅
 * const unsubscribe = walletEventBus.on('keyring:created', handler);
 * unsubscribe();
 */
export const walletEventBus: Emitter<WalletEvents> = mitt<WalletEvents>();
