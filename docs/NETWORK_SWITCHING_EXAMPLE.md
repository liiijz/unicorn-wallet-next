# 网络切换示例 (Network Switching Example)

## 1. 基本使用 (Basic Usage)

```typescript
import NetworkController from './controllers/NetworkController';
import { ethers } from 'ethers';

// 初始化网络控制器
const networkController = new NetworkController();

// 获取当前网络
const currentNetwork = networkController.getCurrentNetwork();
console.log('当前网络:', currentNetwork.name); // "Ethereum Mainnet"

// 切换到 Sepolia 测试网
await networkController.switchNetwork('sepolia');
console.log('切换后:', networkController.getCurrentNetwork().name); // "Sepolia Testnet"
```

## 2. 集成到钱包中 (Integration with Wallet)

```typescript
import { ethers } from 'ethers';
import NetworkController from './controllers/NetworkController';

class WalletManager {
  private networkController: NetworkController;
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.networkController = new NetworkController();

    // 监听网络切换，自动刷新余额和交易历史
    this.networkController.onNetworkChange(async (network) => {
      await this.handleNetworkChange(network);
    });

    // 初始化 provider
    this.initializeProvider();
  }

  /**
   * 初始化 Provider
   */
  private initializeProvider(): void {
    const network = this.networkController.getCurrentNetwork();
    this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
  }

  /**
   * 处理网络切换
   */
  private async handleNetworkChange(network: Network): Promise<void> {
    console.log(`网络切换到: ${network.name} (Chain ID: ${network.chainId})`);

    // 更新 provider
    this.provider = new ethers.JsonRpcProvider(network.rpcUrl);

    // 如果已有钱包，重新连接到新网络
    if (this.wallet) {
      this.wallet = this.wallet.connect(this.provider);
    }

    // 刷新余额
    await this.refreshBalance();

    // 刷新交易历史
    await this.refreshTransactionHistory();
  }

  /**
   * 刷新余额
   */
  private async refreshBalance(): Promise<void> {
    if (!this.wallet || !this.provider) return;

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceInEther = ethers.formatEther(balance);
      console.log('余额:', balanceInEther);

      // 触发 UI 更新
      this.notifyBalanceUpdate(balanceInEther);
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  }

  /**
   * 刷新交易历史
   */
  private async refreshTransactionHistory(): Promise<void> {
    if (!this.wallet || !this.provider) return;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const history = await this.provider.getHistory(this.wallet.address);
      console.log('交易历史:', history);

      // 触发 UI 更新
      this.notifyTransactionHistoryUpdate(history);
    } catch (error) {
      console.error('获取交易历史失败:', error);
    }
  }

  /**
   * 切换网络
   */
  async switchNetwork(networkId: string): Promise<void> {
    await this.networkController.switchNetwork(networkId);
  }

  /**
   * 获取所有可用网络
   */
  getAvailableNetworks() {
    return this.networkController.getAllNetworks();
  }

  // 这些方法需要在实际实现中连接到状态管理或 UI
  private notifyBalanceUpdate(balance: string): void {
    // 触发状态更新或事件
  }

  private notifyTransactionHistoryUpdate(history: any[]): void {
    // 触发状态更新或事件
  }
}
```

## 3. React 组件示例 (React Component Example)

```typescript
import React, { useState, useEffect } from 'react';
import { NetworkController } from '../controllers/NetworkController';
import { Network } from '../types/Network';

const networkController = new NetworkController();

export const NetworkSwitcher: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState<Network>(
    networkController.getCurrentNetwork()
  );
  const [networks, setNetworks] = useState<Network[]>(
    networkController.getAllNetworks()
  );

  useEffect(() => {
    // 监听网络变化
    const unsubscribe = networkController.onNetworkChange((network) => {
      setCurrentNetwork(network);
      console.log('网络已切换到:', network.name);
    });

    return unsubscribe;
  }, []);

  const handleNetworkSwitch = async (networkId: string) => {
    try {
      await networkController.switchNetwork(networkId);
    } catch (error) {
      console.error('切换网络失败:', error);
    }
  };

  return (
    <div className="network-switcher">
      <h3>当前网络: {currentNetwork.name}</h3>
      <select
        value={currentNetwork.id}
        onChange={(e) => handleNetworkSwitch(e.target.value)}
      >
        {networks.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name} (Chain ID: {network.chainId})
          </option>
        ))}
      </select>
    </div>
  );
};
```

## 4. 添加自定义网络 (Add Custom Network)

```typescript
// 添加自定义 RPC
const customNetwork = networkController.addCustomNetwork({
  name: 'Polygon Mainnet',
  chainId: 137,
  rpcUrl: 'https://polygon-rpc.com',
  symbol: 'MATIC',
  blockExplorerUrl: 'https://polygonscan.com'
});

console.log('添加成功:', customNetwork.id);

// 切换到自定义网络
await networkController.switchNetwork(customNetwork.id);
```

## 5. 完整的网络管理示例 (Complete Network Management)

```typescript
// 获取所有网络
const allNetworks = networkController.getAllNetworks();
console.log('所有网络:', allNetworks);

// 切换到 Goerli
await networkController.switchNetwork('goerli');

// 添加 Arbitrum
const arbitrum = networkController.addCustomNetwork({
  name: 'Arbitrum One',
  chainId: 42161,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  symbol: 'ETH',
  blockExplorerUrl: 'https://arbiscan.io'
});

// 更新自定义网络
networkController.updateCustomNetwork(arbitrum.id, {
  rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/YOUR_KEY'
});

// 删除自定义网络
networkController.removeCustomNetwork(arbitrum.id);

// 监听网络变化
const unsubscribe = networkController.onNetworkChange((network) => {
  console.log('网络改变:', network.name);
  // 这里会自动触发余额和交易历史的刷新
});

// 取消监听
unsubscribe();
```

## 6. 错误处理 (Error Handling)

```typescript
try {
  // 切换到不存在的网络
  await networkController.switchNetwork('invalid-network');
} catch (error) {
  console.error('错误:', error.message); // "Network with id "invalid-network" not found"
}

try {
  // 添加重复的 Chain ID
  networkController.addCustomNetwork({
    name: 'Duplicate',
    chainId: 1, // Mainnet 已存在
    rpcUrl: 'https://example.com',
    symbol: 'ETH'
  });
} catch (error) {
  console.error('错误:', error.message); // "Network with chain ID 1 already exists"
}

try {
  // 无效的 RPC URL
  networkController.addCustomNetwork({
    name: 'Invalid',
    chainId: 999,
    rpcUrl: 'not-a-url',
    symbol: 'INV'
  });
} catch (error) {
  console.error('错误:', error.message); // "Invalid RPC URL format"
}
```
