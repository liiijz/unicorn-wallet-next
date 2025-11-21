import type { IKeyring } from "@/types/Keyring";
import { HDKeyring } from "@/types/HDKeyring";
import { walletEventBus } from "@/events/WalletEvents";
import { keyringService } from "@/services/KeyringService";
import { useWalletStore } from "@/stores";
import { Account } from "@/types/Account";
import { WalletStatus } from "@/types/WalletStatus";
import { ethers } from "ethers";
import type { Network } from "@/types/Network";
import { networkManager } from "@/services/NetworkManager";
import { tokenService } from "@/services/TokenService";
import type { TokenList, Portfolio } from "@/types/Token";
import { formatAddress } from "@/utils";

class WalletController {
  /**
   * 设置钱包状态（增强版）
   *
   * 特性：
   * - 状态变更日志（包含调用栈，仅开发环境）
   * - 事件通知
   */
  setWalletStatus(status: WalletStatus): void {
    const { walletStatus: oldStatus, setWalletStatus } = useWalletStore.getState();

    // 相同状态不需要处理
    if (oldStatus === status) {
      return;
    }

    // 状态变更日志（仅在开发环境）
    if (process.env.NODE_ENV === "development") {
      // 获取调用栈信息
      const stack = new Error().stack;
      const caller = stack
        ?.split("\n")[2] // 第3行是调用方
        ?.trim()
        .replace(/^at\s+/, "") // 移除 "at "
        .split(" ")[0]; // 提取方法名

      console.log(`[WalletStatus] ${oldStatus} → ${status} (caller: ${caller || "unknown"})`);
    }

    // 更新 Store
    setWalletStatus(status);

    // 发布状态变更事件
    walletEventBus.emit("wallet:statusChanged", {
      from: oldStatus,
      to: status,
      timestamp: Date.now(),
    });
  }

  // Provider 管理已移至 NetworkManager

  // ========== 钱包生命周期 ==========

  /**
   * 初始化钱包状态
   * 检查是否存在 vault，决定初始状态是 locked 还是 uninitialized
   */
  initialize(): void {
    try {
      const hasVault = typeof window !== "undefined" && localStorage.getItem("vault");
      this.setWalletStatus(hasVault ? "locked" : "uninitialized");
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      this.setWalletStatus("uninitialized");
    }
  }

  /**
   * 创建新钱包
   */
  createNewWallet(password: string): string {
    useWalletStore.setState({ password });

    // 创建 HD Keyring (默认创建 1 个地址)
    const { keyring, mnemonic } = keyringService.createNewHDKeyring(1);

    // 持久化 Keyring (同步操作)
    keyringService.persistVault([keyring], password);

    // 创建初始账户
    const initialAccount = this.createNewAccount(keyring, 0);

    // 更新账户元数据映射（默认名 Account + 序号）
    const { accountMetadataMap, setAccountMetadata } = useWalletStore.getState();
    setAccountMetadata(initialAccount.address, {
      address: initialAccount.address,
      name: initialAccount.address, // 这里如果 AccountMetadata 需要 name 字段则保留，否则可删
    });

    // 更新 Store (追加到 accounts)
    const { accounts: existingAccounts } = useWalletStore.getState();
    const accounts = [...existingAccounts, initialAccount];

    this.setWalletStatus("showing-mnemonic");
    useWalletStore.setState({
      keyrings: [keyring],
      accounts,
      currentAccount: initialAccount,
    });

    walletEventBus.emit("keyring:created", { keyrings: [keyring] });

    return mnemonic;
  }

  /**
   * 导入钱包
   */
  importWallet(mnemonic: string, password: string): void {
    const currentState = useWalletStore.getState();
    const existingKeyrings = currentState.keyrings;
    const existingAccounts = currentState.accounts;

    useWalletStore.setState({ password });

    // 从助记词创建 HD Keyring (默认创建 1 个地址)
    const newKeyring = keyringService.createHDKeyringFromMnemonic(mnemonic, 1);

    // 合并现有 keyrings 和新 keyring
    const allKeyrings = [...existingKeyrings, newKeyring];

    // 持久化所有 keyrings (同步操作)
    keyringService.persistVault(allKeyrings, password);

    // 创建初始账户并追加到现有 accounts
    const newAccount = this.createNewAccount(newKeyring, 0);
    const accounts = [...existingAccounts, newAccount];

    // 更新 Store
    this.setWalletStatus("unlocked");
    useWalletStore.setState({
      keyrings: allKeyrings,
      accounts,
      currentAccount: existingAccounts[0] || newAccount, // 保持第一个账户为当前账户
    });

    walletEventBus.emit("keyring:imported", { keyrings: allKeyrings });
  }

  private generateAccountsFromKeyrings(keyrings: IKeyring[]): Account[] {
    // 根据 keyring 地址自动生成 accounts
    const { accountMetadataMap } = useWalletStore.getState();
    const accounts: Account[] = [];
    keyrings.forEach((keyring) => {
      if (keyring instanceof HDKeyring) {
        const hdKeyring = keyring as HDKeyring;
        hdKeyring.wallets.forEach((wallet, idx) => {
          accounts.push({
            id: wallet.address,
            address: wallet.address,
            type: this.mapKeyringTypeToAccountType(keyring.type),
            derivationPath: wallet.path,
            accountIndex: idx,
          });
        });
      }
    });
    return accounts;
  }

  /**
   * 解锁钱包
   */
  unlock(password: string): boolean {
    useWalletStore.setState({ password });

    // 恢复 Keyrings (同步操作)
    const keyrings = keyringService.restoreVault(password);
    if (!keyrings) {
      this.setWalletStatus("locked");
      useWalletStore.setState({ password: null });
      return false;
    }

    // 根据 keyrings 生成 accounts
    const accounts = this.generateAccountsFromKeyrings(keyrings);

    // 默认选中第一个账户
    const currentAccount = accounts[0] || null;

    this.setWalletStatus("unlocked");
    useWalletStore.setState({
      keyrings,
      accounts,
      currentAccount,
    });

    walletEventBus.emit("keyring:restored", { keyrings });
    return true;
  }

  /**
   * 锁定钱包
   */
  lock(): void {
    this.setWalletStatus("locked");
    useWalletStore.setState({
      keyrings: [],
      accounts: [],
      currentAccount: null,
      password: null,
    });

    walletEventBus.emit("keyring:locked");
  }

  // ========== Account 管理 ==========

  /**
   * 创建单个新账户
   */
  private createNewAccount(keyring: IKeyring, accountIndex: number): Account {
    const addresses = keyring.getAddresses();
    const address = addresses[accountIndex];
    const keyringData = keyring.serialize();

    // 获取当前所有账户数量，用于生成默认名称
    const { accounts } = useWalletStore.getState();
    const accountCount = accounts.length;

    return {
      id: `${keyring.type}-${address}`,
      address,
      type: this.mapKeyringTypeToAccountType(keyring.type),
      derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${accountIndex}` : null,
      accountIndex,
    };
  }

  /**
   * 更新账户名称
   */
  updateAccountName(address: string, name: string): void {
    // 账户名已统一走 accountMetadataMap，无需直接修改 Account 对象
  }

  /**
   * 根据地址获取账户
   */
  getAccountByAddress(address: string): Account | undefined {
    const { accounts } = useWalletStore.getState();
    return accounts.find((acc) => acc.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * 添加新账户
   * @param keyring 可选，指定在哪个 keyring 上添加账户
   */
  addAccount(keyring?: IKeyring): Account {
    const { keyrings, password, accounts: existingAccounts } = useWalletStore.getState();
    if (!password) throw new Error("No password set");

    // 如果未指定 keyring，则默认第一个
    const targetKeyring = keyring || keyrings[0];
    if (!targetKeyring) throw new Error("No keyring found");

    const oldAddressCount = targetKeyring.getAddresses().length;

    // 派生新地址 (同步操作)
    targetKeyring.addAddresses(1);

    // 持久化 Keyring (同步操作)
    keyringService.persistVault(keyrings, password);

    // 创建新账户并追加到 Store
    const newAccount = this.createNewAccount(targetKeyring, oldAddressCount);
    const accounts = [...existingAccounts, newAccount];

    useWalletStore.setState({ keyrings: [...keyrings], accounts });

    // 返回新创建的账户
    return newAccount;
  }

  /**
   * 重命名账户
   */
  renameAccount(accountId: string, newName: string): void {
    const { accounts, accountMetadataMap, setAccountMetadata } = useWalletStore.getState();

    // 查找账户
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // 更新账户元数据映射
    const oldMeta = accountMetadataMap[account.address] || {};
    setAccountMetadata(account.address, {
      ...oldMeta,
      name: newName,
    });

    // 发布事件（不再传递 name 字段，前端应从 accountMetadataMap 获取最新名称）
    walletEventBus.emit("account:renamed", {
      accountId,
      newName,
    });
  }

  /**
   * 映射 KeyringType 到 AccountType
   */
  private mapKeyringTypeToAccountType(keyringType: string): "mnemonic" | "privateKey" | "hardware" {
    switch (keyringType) {
      case "HD":
        return "mnemonic";
      case "Simple":
        return "privateKey";
      case "Hardware":
      case "Ledger":
      case "Trezor":
        return "hardware";
      default:
        return "mnemonic";
    }
  }

  /**
   * 获取账户的完整 Portfolio（原生代币 + Tokens）
   * @param address 账户地址
   * @param chainId 网络 Chain ID
   * @returns Portfolio 响应
   */
  async getPortfolio(address: string, chainId: number): Promise<Portfolio> {
    if (!address) {
      return {
        balance: "0.0000",
        balanceUSD: "0.00",
        tokens: [],
        totalValue: "0.00",
        timestamp: Date.now()
      };
    }

    try {
      // 使用 TokenService 获取完整的 token 列表（包含原生代币和 ERC20 代币）
      const tokenList = await tokenService.getTokenList(address, chainId);

      // 分离原生代币和 ERC20 代币
      const nativeToken = tokenList.tokens.find((token: any) => token.contractAddress === null);
      const erc20Tokens = tokenList.tokens.filter((token: any) => token.contractAddress !== null);

      // 处理原生代币
      let balance = "0.0000";
      let balanceUSD = "0.00";

      if (nativeToken) {
        balance = nativeToken.balanceFormatted;
        balanceUSD = (parseFloat(balance) * parseFloat(nativeToken.priceUSD || "0")).toFixed(2);
      }

      // 计算 ERC20 代币总价值
      const tokenTotalValue = erc20Tokens.reduce((total: number, token: any) => 
        total + parseFloat(token.valueUSD || "0"), 0);

      // 计算总价值
      const totalValue = (parseFloat(balanceUSD) + tokenTotalValue).toFixed(2);

      return {
        balance,
        balanceUSD,
        tokens: erc20Tokens,
        totalValue,
        timestamp: tokenList.timestamp
      };
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      return {
        balance: "0.0000",  
        balanceUSD: "0.00",
        tokens: [],
        totalValue: "0.00",
        timestamp: Date.now()
      };
    }
  }

  

  // ========== Transaction ==========
  // Provider 管理已移至 NetworkManager
  // 使用 networkManager.getProvider() 获取 Provider 实例
}

export const walletController = new WalletController();
