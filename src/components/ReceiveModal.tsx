"use client";

import React, { useEffect, useRef } from "react";
import { IoCopy, IoClose, IoShareSocial } from "react-icons/io5";
import { useNotification } from "./Notification";
import QRCode from "qrcode";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: {
    address: string;
    name: string;
  } | null;
  currentNetwork: {
    name: string;
    symbol: string;
  };
}

export default function ReceiveModal({
  isOpen,
  onClose,
  currentAccount,
  currentNetwork,
}: ReceiveModalProps) {
  const { addNotification } = useNotification();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成二维码
  useEffect(() => {
    if (isOpen && currentAccount?.address && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        currentAccount.address,
        {
          width: 280,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error: Error | null | undefined) => {
          if (error) {
            console.error("Error generating QR code:", error);
          }
        }
      );
    }
  }, [isOpen, currentAccount?.address]);

  if (!isOpen || !currentAccount) return null;

  // 复制地址到剪贴板
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentAccount.address);
      addNotification("success", "地址已复制到剪贴板");
    } catch (error) {
      console.error("Failed to copy address:", error);
      addNotification("error", "复制失败");
    }
  };

  // 分享地址
  const shareAddress = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "我的钱包地址",
          text: `${currentAccount.name}\n${currentAccount.address}`,
        });
      } else {
        // 如果不支持分享，则复制地址
        await copyAddress();
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gray-900 rounded-3xl shadow-2xl z-50 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold">接收 {currentNetwork.symbol}</h2>
            <p className="text-sm text-gray-400 mt-1">{currentAccount.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 提示信息 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-400">
              发送 {currentNetwork.name} 网络上的 {currentNetwork.symbol} 和代币到此地址
            </p>
          </div>

          {/* 二维码 */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>

          {/* 地址显示 */}
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-2">钱包地址</div>
              <div className="text-sm font-mono break-all text-gray-200">
                {currentAccount.address}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={copyAddress}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all hover:scale-105 active:scale-95">
                <IoCopy className="w-5 h-5" />
                <span>复制地址</span>
              </button>

              <button
                onClick={shareAddress}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all hover:scale-105 active:scale-95">
                <IoShareSocial className="w-5 h-5" />
                <span>分享</span>
              </button>
            </div>
          </div>

          {/* 警告信息 */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <p className="text-xs text-orange-400">
              ⚠️ 仅发送 {currentNetwork.name} 网络资产到此地址。发送其他网络资产可能导致永久丢失。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
