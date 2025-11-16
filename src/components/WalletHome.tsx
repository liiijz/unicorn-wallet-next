"use client";

import React, { useEffect, useRef, useState } from "react";

import { GiReceiveMoney } from "react-icons/gi";
import { IoIosSend } from "react-icons/io";
import { IoCopy } from "react-icons/io5";
import { MdShoppingCart } from "react-icons/md";

import { walletController } from "@/controllers";
import type { IKeyring } from "@/types/Keyring";
import { networkController } from "@/controllers/NetworkController";
import { walletEventBus } from "@/events/WalletEvents";
import { useWalletStore } from "@/stores/walletStore";
import type { Account } from "@/types/Account";
import { Network } from "@/types/Network";

import ImportWalletModal from "./ImportWalletModal";
import MarketStats from "./MarketStats";
import { useNotification } from "./Notification";
import PixelAvatar from "./PixelAvatar";
import ReceiveModal from "./ReceiveModal";
import SendModal from "./SendModal";
import { WalletAssets } from "./WalletAssets";
import { formatAddress } from "@/utils";
import { useTranslation } from "react-i18next";
import { MdOutlineMoreHoriz } from "react-icons/md";

// 计算当前账户所属 keyring 及序号
function getKeyringLabel(account: Account | null, keyrings: IKeyring[]): { label: string; color: string } {
  if (!account || !keyrings || keyrings.length === 0) return { label: "", color: "#00F4C8" };
  // 撞色列表，可扩展
  const colors = ["#00F4C8", "#A259FF", "#FFB443", "#FF4F7A", "#2DCE89", "#FF7F50"];
  for (let i = 0; i < keyrings.length; i++) {
    const kr = keyrings[i];
    if (kr.getAddresses().some((addr: string) => addr.toLowerCase() === account.address.toLowerCase())) {
      // 类型如 HD、Simple、Hardware，序号从 1 开始
      const label = `${kr.type}${i + 1}`;
      const color = colors[i % colors.length];
      return { label, color };
    }
  }
  return { label: "", color: "#00F4C8" };
}

/**
 * WalletHome 组件 - 主钱包界面
 *
 * 当用户已解锁钱包后显示的主界面
 */
export default function WalletHome() {
  const { currentAccount, setCurrentAccount, accounts, accountMetadataMap, keyrings } = useWalletStore();
  // 新增：keyring 选择弹窗相关 state
  const [showKeyringSelector, setShowKeyringSelector] = useState(false);
  const [selectedKeyringIndex, setSelectedKeyringIndex] = useState<number>(0);
  const allAccounts = accounts;
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [showImportWalletModal, setShowImportWalletModal] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(networkController.getCurrentNetwork());
  const [balance, setBalance] = useState<string>("0.0000");
  const [balanceUSD, setBalanceUSD] = useState<string>("0.00");
  const [activeTab, setActiveTab] = useState("home");
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [contextMenuAccount, setContextMenuAccount] = useState<Account | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const { addNotification } = useNotification();
  const fetchBalanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  // 复制地址到剪贴板
  const copyAddress = async () => {
    if (currentAccount?.address) {
      try {
        await navigator.clipboard.writeText(currentAccount.address);
        addNotification("success", "地址已复制到剪贴板");
      } catch (error) {
        console.error("Failed to copy address:", error);
        addNotification("error", "复制失败");
      }
    }
  };

  // 复制指定账户地址
  const copyAccountAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      addNotification("success", "地址已复制到剪贴板");
      setContextMenuAccount(null);
    } catch (error) {
      console.error("Failed to copy address:", error);
      addNotification("error", "复制失败");
    }
  };

  // 打开重命名对话框
  const openRenameDialog = (account: Account) => {
    const name = accountMetadataMap[account.address]?.name || "";
    setNewAccountName(name);
    setShowRenameDialog(true);
    // 不立即清空 contextMenuAccount，保证弹窗能正常显示
  };

  // 重命名账户
  const handleRenameAccount = () => {
    if (contextMenuAccount && newAccountName.trim()) {
      try {
        walletController.renameAccount(contextMenuAccount.id, newAccountName.trim());
        addNotification("success", "账户已重命名");
        setShowRenameDialog(false);
        setNewAccountName("");
      } catch (error) {
        console.error("Failed to rename account:", error);
        addNotification("error", "重命名失败");
      }
    }
  };

  // 处理添加以太坊账户
  // 支持传入 keyring
  const handleAddEthereumAccount = (keyring?: IKeyring) => {
    console.log("🎯 handleAddEthereumAccount called");
    setShowAddAccountModal(false);
    setShowKeyringSelector(false);
    try {
      const newAccount = walletController.addAccount(keyring);
      setCurrentAccount(newAccount);
      const newName = accountMetadataMap[newAccount.address]?.name || formatAddress(newAccount.address);
      console.log("✅ New account created:", newAccount);
      addNotification("success", `账户 ${newName} 已创建`);
    } catch (error) {
      console.error("❌ Failed to add account:", error);
      addNotification("error", "创建账户失败");
    }
  };

  // 处理网络切换
  const handleNetworkSwitch = async (networkId: string) => {
    try {
      await networkController.switchNetwork(networkId);
      setShowNetworkSelector(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // 获取账户余额
  const fetchBalance = async (network: Network) => {
    if (!currentAccount?.address) {
      return;
    }

    const { balance: newBalance, balanceUSD: newBalanceUSD } = await walletController.getBalance(currentAccount.address, network);

    setBalance(newBalance);
    setBalanceUSD(newBalanceUSD);
  };

  const startFetchBalance = (network: Network) => {
    fetchBalance(network);
    if (fetchBalanceTimerRef.current) {
      clearInterval(fetchBalanceTimerRef.current);
    }
    fetchBalanceTimerRef.current = setInterval(() => {
      console.log("Fetching balance...");
      fetchBalance(network);
    }, 10000);
  };

  useEffect(() => {
    console.log("WalletHome mounted");
    fetchBalance(currentNetwork);
    walletEventBus.on("network:changed", ({ network }) => {
      console.log("Current network:", network);
      // 切换网络后重新获取余额
      setCurrentNetwork(network);
      addNotification("success", "网络切换成功");
      startFetchBalance(network);
    });

    return () => {
      walletEventBus.off("network:changed");
    };
  }, [currentAccount, currentNetwork]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Container with max width for large screens */}
      <div className="max-w-2xl mx-auto">
        {/* Top Bar */}
        <header className="px-8 pt-8 pb-6 relative">
          <div className="flex items-center justify-between mb-8">
            {/* Avatar - Square with rounded corners + Keyring 标签 */}
            <button onClick={() => setShowAccountSelector(!showAccountSelector)} className="relative">
              <div className="relative inline-block">
                {/* Keyring 标签 */}
                {currentAccount && (
                  <span className="absolute left-0 top-0 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow" style={{ zIndex: 2, transform: "translate(-40%, -40%)", backgroundColor: getKeyringLabel(currentAccount, keyrings).color }}>
                    {getKeyringLabel(currentAccount, keyrings).label}
                  </span>
                )}
                <PixelAvatar address={currentAccount?.address || ""} size={42} />
              </div>
            </button>

            <div className="flex gap-2 items-center">
              {/* Network Dropdown */}
              <button onClick={() => setShowNetworkSelector(!showNetworkSelector)} className="relative flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                <span className="text-sm font-medium">{currentNetwork.name}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="w-8 h-8 relative flex items-center bg-gray-800/50 hover:bg-gray-800 px-2 py-2 rounded-full transition-colors">
                <MdOutlineMoreHoriz/>
              </button>
            </div>
          </div>

          {/* Balance Display - Centered */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r text-primary">
              {balance} {currentNetwork.symbol}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <span className="text-lg">${balanceUSD}</span>
            </div>
            {/* 地址显示区域 */}
            {currentAccount?.address && (
              <div className="flex items-center justify-center mt-4 gap-2">
                <span className="px-3 py-1 rounded-lg bg-gray-800 text-primary text-base font-mono select-all">{formatAddress(currentAccount.address)}</span>
                <span onClick={copyAddress} className="bg-gray-700 hover:bg-primary text-white rounded-full px-2 py-1 transition-colors cursor-pointer" title="复制地址" role="button" tabIndex={0} aria-label="复制地址">
                  <IoCopy className="w-4 h-4" />
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons - Send, Receive, Buy, Copy */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button onClick={copyAddress} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90">
                <IoCopy className="w-6 h-6 text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Copy</span>
            </button>

            <button onClick={() => setShowReceiveModal(true)} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90">
                <GiReceiveMoney className="w-6 h-6 text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Receive</span>
            </button>

            <button onClick={() => setShowSendModal(true)} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90">
                <IoIosSend className="w-6 h-6 text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Send</span>
            </button>

            <button className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90">
                <MdShoppingCart className="w-6 h-6 text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Buy</span>
            </button>
          </div>

          {/* Account Selector Dropdown */}
          {showAccountSelector && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => {
                  setShowAccountSelector(false);
                  setContextMenuAccount(null);
                }}
              />
              {/* Dropdown */}
              <div className="absolute top-20 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-50">
                <div className="p-4 space-y-2">
                  {allAccounts.map((account: Account) => (
                    <div key={account.id} className="relative">
                      <button
                        onClick={() => {
                          setCurrentAccount(account);
                          setShowAccountSelector(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-700">
                        <div className="flex items-center gap-3 relative">
                          {/* 选中指示器 */}
                          <div className="w-5 flex items-center justify-center">
                            {currentAccount?.id === account.id && (
                              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="relative inline-block">
                            {/* Keyring 标签 */}
                            <span className="absolute left-0 top-0 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow" style={{ zIndex: 2, transform: "translate(-40%, -40%)", backgroundColor: getKeyringLabel(account, keyrings).color }}>
                              {getKeyringLabel(account, keyrings).label}
                            </span>
                            <PixelAvatar address={account?.address || ""} size={42} />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{accountMetadataMap[account.address]?.name ? accountMetadataMap[account.address].name : formatAddress(account.address)}</div>
                            <div className="text-sm text-gray-400">{formatAddress(account.address)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContextMenuAccount(contextMenuAccount?.id === account.id ? null : account);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-all hover:scale-110 active:scale-95">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </button>

                      {/* Context Menu */}
                      {contextMenuAccount?.id === account.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-[70] overflow-hidden">
                          <button onClick={() => openRenameDialog(account)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Rename Wallet</span>
                          </button>
                          <button onClick={() => copyAccountAddress(account.address)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left">
                            <IoCopy className="w-5 h-5" />
                            <div>
                              <div>Copy Address</div>
                              <div className="text-xs text-gray-400">{formatAddress(account.address)}</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-800 p-4">
                  <button
                    onClick={() => {
                      setShowAccountSelector(false);
                      setShowAddAccountModal(true);
                    }}
                    className="base-button">
                    Add Wallet
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Add Account Modal */}
          {showAddAccountModal && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/50 z-50" />
              {/* Modal */}
              <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div></div>
                  <h2 className="text-lg font-medium">{t("home.addWalletTitle")}</h2>
                  <button onClick={() => setShowAddAccountModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Menu Options */}
                <div className="p-4 space-y-2">
                  {/* 以太坊账户：多 keyring 选择 */}
                  {keyrings.length > 1 ? (
                    <>
                      <button onClick={() => setShowKeyringSelector(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center text-[#00F4C8]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-white font-medium">{t("home.createNewWalletTitle")}</span>
                          <span className="text-xs text-gray-400 mt-1">{t("home.createNewWalletSubtitle")}</span>
                        </div>
                      </button>
                      {/* Keyring Selector 弹窗 */}
                      {showKeyringSelector && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/60" onClick={() => setShowKeyringSelector(false)} />
                          <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full mx-auto p-6 z-70">
                            <h3 className="text-lg font-semibold mb-4">{t("home.selectKeyringTitle")}</h3>
                            <div className="space-y-2">
                              {keyrings.map((kr, idx) => (
                                <button key={idx} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${selectedKeyringIndex === idx ? "bg-primary text-black" : "hover:bg-gray-800"}`} onClick={() => setSelectedKeyringIndex(idx)}>
                                  <span className="font-medium">{kr.type}</span>
                                  <span className="text-xs text-gray-400 ml-2">{kr.getAddresses().length} accounts</span>
                                </button>
                              ))}
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                              <button className="px-4 py-2 rounded-lg bg-gray-700 text-white" onClick={() => setShowKeyringSelector(false)}>
                                {t("common.cancel")}
                              </button>
                              <button className="px-4 py-2 rounded-lg bg-primary text-black font-bold" onClick={() => handleAddEthereumAccount(keyrings[selectedKeyringIndex])}>
                                {t("common.confirm")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleAddEthereumAccount(keyrings[0])} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                      <div className="w-6 h-6 flex items-center justify-center text-[#00F4C8]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white font-medium">{t("home.createNewWalletTitle")}</span>
                        <span className="text-xs text-gray-400 mt-1">{t("home.createNewWalletSubtitle")}</span>
                      </div>
                    </button>
                  )}

                  {/* 私钥助记词 */}
                  <button
                    onClick={() => {
                      setShowAddAccountModal(false);
                      setShowImportWalletModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-6 h-6 flex items-center justify-center text-purple-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white font-medium">{t("home.importWalletFromPhraseTitle")}</span>
                      <span className="text-xs text-gray-400 mt-1 text-left">{t("home.importWalletFromPhraseSubtitle")}</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Network Selector Dropdown */}
          {showNetworkSelector && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNetworkSelector(false)} />
              {/* Dropdown */}
              <div className="absolute top-20 right-8 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-[60] min-w-[240px]">
                <div className="p-4 space-y-2">
                  {networkController.getAllNetworks().map((network) => (
                    <button key={network.id} onClick={() => handleNetworkSwitch(network.id)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${currentNetwork.id === network.id ? "bg-[#00F4C8]/20 border border-[#00F4C8]/50" : "bg-gray-800 hover:bg-gray-700"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold">{network.symbol.charAt(0)}</div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{network.name}</div>
                          <div className="text-xs text-gray-400">Chain ID: {network.chainId}</div>
                        </div>
                      </div>
                      {currentNetwork.id === network.id && (
                        <svg className="w-5 h-5 text-[#00F4C8]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Main Content */}
        <main className="px-8 space-y-8">
          {/* 资产展示区域 */}
          <WalletAssets></WalletAssets>

          {/* Market Statistics */}
          <section>
            <MarketStats />
          </section>
        </main>

        {/* Send Modal */}
        {showSendModal && (
          <SendModal
            onClose={() => setShowSendModal(false)}
            balance={balance}
            onTransactionComplete={(txHash) => {
              console.log("Transaction completed:", txHash);
              // Refresh balance after transaction
              fetchBalance(currentNetwork);
            }}
          />
        )}

        {/* Receive Modal */}
        <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} currentAccount={currentAccount} currentNetwork={currentNetwork} />

        {/* Rename Account Dialog */}
        {showRenameDialog && contextMenuAccount && (
          <>
            <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={() => setShowRenameDialog(false)} />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-800">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-lg font-semibold">重命名账户</h2>
                <button onClick={() => setShowRenameDialog(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">账户名称</label>
                  <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRenameAccount()} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="输入新的账户名称" autoFocus />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRenameDialog(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                    取消
                  </button>
                  <button onClick={handleRenameAccount} disabled={!newAccountName.trim()} className="flex-1 bg-primary hover:bg-primary/80 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    确认
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Import Wallet Modal */}
        {showImportWalletModal && <ImportWalletModal onClose={() => setShowImportWalletModal(false)} />}
      </div>
    </div>
  );
}
