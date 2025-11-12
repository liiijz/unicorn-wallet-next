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

    // 直接使用 Store 中持久化的 accounts (不再重新生成)
    const { accounts, currentAccount } = useWalletStore.getState();

    // 更新 Store (恢复 keyrings,保持 accounts 不变)
    this.setWalletStatus("unlocked");
    useWalletStore.setState({
      keyrings,
      currentAccount: currentAccount || accounts[0],
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
      name: `Account ${accountCount + 1}`,
      type: this.mapKeyringTypeToAccountType(keyring.type),
      derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${accountIndex}` : null,
      accountIndex,
      createdAt: Date.now(),
    };
  }

  /**
   * 更新账户名称
   */
  updateAccountName(address: string, name: string): void {
    const { accounts } = useWalletStore.getState();
    const account = accounts.find((acc) => acc.address.toLowerCase() === address.toLowerCase());

    if (account) {
      account.name = name;
      useWalletStore.setState({ accounts: [...accounts] });
      // 账户已通过 Zustand persist 自动持久化,无需手动保存
    }
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
   */
  addAccount(): Account {
    const { keyrings, password, accounts: existingAccounts } = useWalletStore.getState();
    if (!password) throw new Error("No password set");

    const keyring = keyrings[0];
    if (!keyring) throw new Error("No keyring found");

    const oldAddressCount = keyring.getAddresses().length;

    // 派生新地址 (同步操作)
    keyring.addAddresses(1);

    // 持久化 Keyring (同步操作)
    keyringService.persistVault(keyrings, password);

    // 创建新账户并追加到 Store
    const newAccount = this.createNewAccount(keyring, oldAddressCount);
    const accounts = [...existingAccounts, newAccount];

    useWalletStore.setState({ keyrings: [...keyrings], accounts });

    // 返回新创建的账户
    return newAccount;
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

  // ========== Balance ==========

  /**
   * 获取账户余额
   * @param address 账户地址
   * @param network 网络配置（可选，用于日志输出）
   * @returns 余额对象 { balance: "0.0000", balanceUSD: "0.00" }
   */
  async getBalance(address: string, network?: Network): Promise<{ balance: string; balanceUSD: string }> {
    if (!address) {
      return { balance: "0.0000", balanceUSD: "0.00" };
    }

    try {
      // 使用 NetworkManager 的 getBalance 方法
      const balanceWei = await networkManager.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      
      // 格式化为4位小数
      const formattedBalance = parseFloat(balanceEth).toFixed(4);
      
      // 简单的USD估算（TODO: 接入真实价格API）
      const ethPriceUSD = 2000;
      const usdValue = (parseFloat(balanceEth) * ethPriceUSD).toFixed(2);
      
      return {
        balance: formattedBalance,
        balanceUSD: usdValue,
      };
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return { balance: "0.0000", balanceUSD: "0.00" };
    }
  }

  // ========== Transaction ==========
  // Provider 管理已移至 NetworkManager
  // 使用 networkManager.getProvider() 获取 Provider 实例
}

export const walletController = new WalletController();
