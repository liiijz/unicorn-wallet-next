import { JsonRpcProvider, TransactionRequest } from "ethers";
import type { Network } from "@/types/Network";
import { walletEventBus } from "@/events/WalletEvents";
import { useWalletStore } from "@/stores";

/**
 * NetworkManager
 * 
 * @description
 * 负责管理区块链网络 Provider 实例的生命周期，包括：
 * - Provider 的创建、更新和销毁
 * - 监听网络切换事件并更新 Provider
 * - 提供 RPC 查询方法（余额、Gas 价格、链 ID 等）
 * - 网络连接验证
 * 
 * @architecture
 * NetworkController (业务逻辑) → emit('network:changed')
 *        ↓
 * NetworkManager (资源管理) → 创建 Provider → emit('provider:updated')
 *        ↓
 * TransactionController 等消费者 → getProvider()
 */
class NetworkManager {
  private provider: JsonRpcProvider | null = null;
  private currentNetwork: Network | null = null;

  constructor() {
    this.initialize();
    this.subscribeToNetworkEvents();
  }

  // ========== 1. Provider 生命周期管理 ==========

  /**
   * 初始化 Provider
   * 从 Store 读取当前网络配置并创建 Provider 实例
   */
  private initialize(): void {
    try {
      const { currentNetwork } = useWalletStore.getState();
      this.currentNetwork = currentNetwork;
      this.provider = new JsonRpcProvider(currentNetwork.rpcUrl);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[NetworkManager] 初始化 Provider: ${currentNetwork.name}`);
      }
    } catch (error) {
      console.error("[NetworkManager] 初始化失败:", error);
      this.provider = null;
    }
  }

  /**
   * 获取当前 Provider 实例
   * @returns JsonRpcProvider 实例，如果未初始化则返回 null
   */
  getProvider(): JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * 检查 Provider 是否就绪
   */
  isReady(): boolean {
    return this.provider !== null;
  }

  /**
   * 销毁 Provider（清理资源）
   */
  destroy(): void {
    if (this.provider) {
      // ethers v6 的 Provider 会自动清理，无需手动调用
      this.provider = null;
      this.currentNetwork = null;
      
      if (process.env.NODE_ENV === "development") {
        console.log("[NetworkManager] Provider 已销毁");
      }
    }
  }

  /**
   * 重新连接 Provider
   */
  async reconnect(): Promise<void> {
    if (!this.currentNetwork) {
      throw new Error("No network configured");
    }
    
    this.provider = new JsonRpcProvider(this.currentNetwork.rpcUrl);
    
    // 验证连接
    await this.validateConnection();
  }

  // ========== 2. 网络切换管理 ==========

  /**
   * 订阅网络切换事件
   * 监听 NetworkController 发出的 network:changed 事件
   */
  private subscribeToNetworkEvents(): void {
    walletEventBus.on("network:changed", ({ network }) => {
      this.handleNetworkChange(network);
    });
  }

  /**
   * 处理网络切换
   * 1. 创建新的 Provider
   * 2. 验证网络连接
   * 3. 发布 Provider 更新事件
   */
  private async handleNetworkChange(network: Network): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.log(`[NetworkManager] 网络切换到: ${network.name}`);
    }

    try {
      this.currentNetwork = network;
      
      // 创建新的 Provider
      this.provider = new JsonRpcProvider(network.rpcUrl);

      // 验证网络连接
      await this.validateConnection();

      // 发布事件：Provider 已更新
      walletEventBus.emit("keyring:providerUpdated", {
        network,
        provider: this.provider,
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`[NetworkManager] Provider 更新成功`);
      }
    } catch (error) {
      console.error("[NetworkManager] 网络切换失败:", error);
      throw error;
    }
  }

  /**
   * 验证网络连接
   * 检查 chainId 是否与配置匹配
   */
  private async validateConnection(): Promise<void> {
    if (!this.provider || !this.currentNetwork) {
      throw new Error("Provider or network not initialized");
    }

    try {
      const network = await this.provider.getNetwork();
      const actualChainId = Number(network.chainId);
      const expectedChainId = this.currentNetwork.chainId;

      if (actualChainId !== expectedChainId) {
        console.warn(
          `[NetworkManager] Chain ID 不匹配: 期望 ${expectedChainId}, 实际 ${actualChainId}`
        );
      }
    } catch (error) {
      console.error("[NetworkManager] 网络连接验证失败:", error);
      throw error;
    }
  }

  // ========== 3. 网络状态查询 ==========

  /**
   * 获取当前网络信息
   */
  getCurrentNetwork(): Network | null {
    return this.currentNetwork;
  }

  /**
   * 获取当前链 ID
   */
  async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  /**
   * 获取当前区块高度
   */
  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.getBlockNumber();
  }

  /**
   * 获取账户余额
   * @param address 账户地址
   * @returns 余额（wei）
   */
  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.getBalance(address);
  }

  /**
   * 获取 Gas 价格
   * @returns Gas 价格（wei）
   */
  async getGasPrice(): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * 获取 Fee Data (EIP-1559)
   */
  async getFeeData() {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.getFeeData();
  }

  // ========== 4. 交易相关操作 ==========

  /**
   * 估算 Gas
   * @param transaction 交易请求对象
   * @returns 估算的 Gas 限制
   */
  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.estimateGas(transaction);
  }

  /**
   * 获取交易详情
   * @param txHash 交易哈希
   */
  async getTransaction(txHash: string) {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.getTransaction(txHash);
  }

  /**
   * 获取交易回执
   * @param txHash 交易哈希
   */
  async getTransactionReceipt(txHash: string) {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * 等待交易确认
   * @param txHash 交易哈希
   * @param confirmations 确认数（默认 1）
   */
  async waitForTransaction(txHash: string, confirmations: number = 1) {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * 发送已签名的交易
   * @param signedTx 已签名的交易数据
   */
  async sendTransaction(signedTx: string) {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    return await this.provider.broadcastTransaction(signedTx);
  }

  // ========== 5. 错误处理与重试 ==========

  /**
   * 执行带重试的操作
   * @param fn 要执行的异步函数
   * @param maxRetries 最大重试次数（默认 3）
   * @param delayMs 重试延迟（默认 1000ms）
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(2, attempt); // 指数退避
          console.warn(
            `[NetworkManager] 操作失败，${delay}ms 后重试 (${attempt + 1}/${maxRetries})`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  /**
   * 健康检查
   * 验证 Provider 是否可用
   */
  async healthCheck(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.error("[NetworkManager] 健康检查失败:", error);
      return false;
    }
  }
}

// 导出单例
export const networkManager = new NetworkManager();
