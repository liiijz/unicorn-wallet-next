"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import MnemonicModal from "./MnemonicModal";
import CreateWalletModal from "./CreateWalletModal";
import ImportWalletModal from "./ImportWalletModal";
import { walletController } from "@/controllers/WalletController";

/**
 * Welcome 组件 - 欢迎页面
 *
 * 首次使用钱包时显示，提供创建或导入钱包的选项
 */
export default function Welcome() {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMnemonicModal, setShowMnemonicModal] = useState(false);
  const [mnemonic, setMnemonic] = useState("");

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative">
        {/* Language Switcher - Top Right */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        {/* Container with max width for large screens */}
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
          {/* Logo */}
          <div className="mb-16">
            <img src="/images/ic_logo.png" alt="Unicorn Wallet" className="w-32 h-32" />
          </div>

          {/* Title */}
          <div className="text-center mb-20">
            <h1 className="text-4xl font-bold mb-4">{t("welcome.title")}</h1>
            <p className="text-gray-400 text-base">{t("welcome.subtitle")}</p>
          </div>

          {/* Main Actions */}
          <div className="w-full max-w-sm space-y-6">
            <button onClick={() => setShowCreateModal(true)} className="w-full bg-primary text-black h-[52px] rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
              <span>{t("welcome.createWallet")}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button onClick={() => setShowImportModal(true)} className="w-full bg-primary text-black h-[52px] rounded-2xl font-semibold text-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
              <span>{t("welcome.importWallet")}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm mb-4">{t("welcome.firstTime")}</p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(t("welcome.helpDev"));
              }}
              className="text-primary text-sm transition-colors">
              {t("welcome.learnMore")}
            </a>
          </div>
        </div>
      </div>

      {/* Create Wallet Modal */}
      {showCreateModal && (
        <CreateWalletModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(mnemonic) => {
            if (mnemonic) {
              setMnemonic(mnemonic);
              setShowMnemonicModal(true);
            }
          }}
        />
      )}

      {/* Import Wallet Modal */}
      {showImportModal && <ImportWalletModal onClose={() => setShowImportModal(false)} />}
      {showMnemonicModal && (
        <MnemonicModal
          mnemonic={mnemonic}
          onClose={() => {
            // 用户确认备份助记词后,设置为 unlocked 状态
            walletController.setWalletStatus("unlocked");
            setShowMnemonicModal(false);
          }}
        />
      )}
    </>
  );
}
