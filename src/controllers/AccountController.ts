import type { Account } from "@/types/Account";
import type { IKeyring } from "@/types/Keyring";
import { walletEventBus } from "@/events/WalletEvents";

/**
 * AccountController - 管理账户信息和状态
 *
 * 职责：
 * - 从 Keyring 中获取地址并生成 Account 对象
 * - 管理账户元数据（名称、索引等）
 * - 持久化账户配置
 * - 提供账户查询和管理接口
 * - 通过事件订阅响应 KeyringController 的变化
 */
export class AccountController {
  private accounts: Account[] = [];
  private keyringsCache: IKeyring[] = [];

  constructor() {
    this.subscribeToKeyringEvents();
  }

  /**
   * 订阅 Keyring 事件
   */
  private subscribeToKeyringEvents(): void {
    // 钱包创建时同步账户
    walletEventBus.on('keyring:created', ({ keyrings }) => {
      this.keyringsCache = keyrings;
      this.syncAccountsFromKeyrings();
    });

    // 钱包导入时同步账户
    walletEventBus.on('keyring:imported', ({ keyrings }) => {
      this.keyringsCache = keyrings;
      this.syncAccountsFromKeyrings();
    });

    // 钱包恢复时同步账户
    walletEventBus.on('keyring:restored', ({ keyrings }) => {
      this.keyringsCache = keyrings;
      this.syncAccountsFromKeyrings();
      this.restoreAccounts();
    });

    // 账户添加时同步
    walletEventBus.on('keyring:accountAdded', () => {
      this.syncAccountsFromKeyrings();
    });

    // 钱包锁定时清空账户
    walletEventBus.on('keyring:locked', () => {
      this.clear();
    });
  }

  /**
   * 从缓存的 keyrings 中同步账户
   */
  private syncAccountsFromKeyrings(): Account[] {
    const newAccounts: Account[] = [];

    this.keyringsCache.forEach((keyring: IKeyring) => {
      const addresses = keyring.getAccounts();
      const keyringData = keyring.serialize();

      addresses.forEach((address: string, index: number) => {
        // 检查是否已存在
        let existingAccount = this.accounts.find(acc => acc.address === address);

        if (!existingAccount) {
          // 创建新账户
          const account: Account = {
            id: `${keyring.type}-${address}`,
            address,
            name: this.generateAccountName(keyring.type, index),
            type: this.mapKeyringTypeToAccountType(keyring.type),
            derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${index}` : null,
            accountIndex: index,
            createdAt: Date.now(),
          };
          newAccounts.push(account);
        } else {
          newAccounts.push(existingAccount);
        }
      });
    });

    this.accounts = newAccounts;
    this.persistAccounts();

    // 发布事件：账户已同步
    walletEventBus.emit('account:synced', {
      accounts: this.accounts,
    });

    return this.accounts;
  }

  /**
   * 获取所有账户
   */
  getAllAccounts(): Account[] {
    return this.accounts;
  }

  /**
   * 根据地址获取账户
   */
  getAccountByAddress(address: string): Account | undefined {
    return this.accounts.find(acc => acc.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * 更新账户名称
   */
  updateAccountName(address: string, name: string): void {
    const account = this.getAccountByAddress(address);
    if (account) {
      account.name = name;
      this.persistAccounts();

      // 发布事件：账户已更新
      walletEventBus.emit('account:updated', {
        account,
      });
    }
  }

  /**
   * 生成账户默认名称
   */
  private generateAccountName(keyringType: string, index: number): string {
    switch (keyringType) {
      case 'HD':
        return `Account ${index + 1}`;
      case 'Simple':
        return `Imported ${index + 1}`;
      case 'Hardware':
        return `Hardware ${index + 1}`;
      default:
        return `Account ${index + 1}`;
    }
  }

  /**
   * 映射 KeyringType 到 AccountType
   */
  private mapKeyringTypeToAccountType(keyringType: string): 'mnemonic' | 'privateKey' | 'hardware' {
    switch (keyringType) {
      case 'HD':
        return 'mnemonic';
      case 'Simple':
        return 'privateKey';
      case 'Hardware':
      case 'Ledger':
      case 'Trezor':
        return 'hardware';
      default:
        return 'mnemonic';
    }
  }

  /**
   * 持久化账户元数据到 localStorage
   */
  private persistAccounts(): void {
    const accountsData = this.accounts.map(acc => ({
      address: acc.address,
      name: acc.name,
      customData: {
        // 只存储用户自定义的数据
      }
    }));

    localStorage.setItem('AccountController', JSON.stringify(accountsData));
  }

  /**
   * 从 localStorage 恢复账户元数据
   */
  restoreAccounts(): void {
    const dataString = localStorage.getItem('AccountController');
    if (!dataString) return;

    try {
      const accountsData = JSON.parse(dataString);

      // 合并已保存的元数据
      this.accounts.forEach(account => {
        const savedData = accountsData.find(
          (data: any) => data.address.toLowerCase() === account.address.toLowerCase()
        );
        if (savedData) {
          account.name = savedData.name;
        }
      });
    } catch (error) {
      console.error('Failed to restore accounts:', error);
    }
  }

  /**
   * 清空账户数据
   */
  clear(): void {
    this.accounts = [];
    this.keyringsCache = [];
  }

  /**
   * 销毁控制器，取消所有事件订阅
   */
  destroy(): void {
    // mitt 的 all.clear() 会清除所有监听器
    // 如果只想清除特定的监听器，需要保存 handler 引用
    this.clear();
  }
}