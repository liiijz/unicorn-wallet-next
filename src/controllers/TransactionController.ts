import { useWalletStore } from "@/stores";
import { BaseWallet, ethers } from "ethers";
import { HDKeyring } from "@/types/HDKeyring";
import type { IKeyring } from "@/types/Keyring";
import { networkManager } from "@/services/NetworkManager";

class TransactionController {
  /**
   * 发送交易
   */
  async sendTransaction(fromAddress: string, to: string, value: string): Promise<string> {
    const { keyrings } = useWalletStore.getState();
    const wallet = this.getConnectedWallet(keyrings, fromAddress);

    if (!wallet) throw new Error(`Wallet ${fromAddress} not found`);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(value),
    });

    return tx.hash;
  }

  /**
   * 获取连接到当前网络的钱包实例
   * @description 通过 NetworkManager 获取 Provider，确保使用当前网络配置
   */
  private getConnectedWallet(keyrings: IKeyring[], address: string): BaseWallet | null {
    const provider = networkManager.getProvider();
    
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    for (const keyring of keyrings) {
      if (keyring instanceof HDKeyring) {
        const wallet = keyring.wallets.find((w) => w.address === address);
        if (wallet) {
          return wallet.connect(provider);
        }
      }
    }

    return null;
  }
}

export const transactionController = new TransactionController();
