'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/hooks/useWallet';
import { useUIStore } from '@/stores/uiStore';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Welcome 组件 - 欢迎页面
 *
 * 首次使用钱包时显示，提供创建或导入钱包的选项
 */
export default function Welcome() {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative">
        {/* Language Switcher - Top Right */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="mb-16">
          <div className="relative">
            {/* Glowing effect background */}
            <div className="absolute inset-0 bg-green-400 blur-2xl opacity-40 rounded-2xl transform scale-125"></div>

            {/* Main logo grid */}
            <div className="relative grid grid-cols-2 gap-1 p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-sm"></div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-400 rounded-sm"></div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-sm"></div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold mb-4">{t('welcome.title')}</h1>
          <p className="text-gray-400 text-base">{t('welcome.subtitle')}</p>
        </div>

        {/* Main Actions */}
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-white text-black py-5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            {t('welcome.createWallet')}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="w-full border border-gray-600 text-white py-5 rounded-full font-semibold text-lg hover:border-gray-500 transition-colors"
          >
            {t('welcome.importWallet')}
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm mb-4">{t('welcome.firstTime')}</p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert(t('welcome.helpDev'));
            }}
            className="text-green-500 hover:text-green-400 text-sm transition-colors"
          >
            {t('welcome.learnMore')}
          </a>
        </div>
      </div>

      {/* Create Wallet Modal */}
      {showCreateModal && (
        <CreateWalletModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Import Wallet Modal */}
      {showImportModal && (
        <ImportWalletModal onClose={() => setShowImportModal(false)} />
      )}
    </>
  );
}

/**
 * CreateWalletModal - 创建钱包模态框
 */
function CreateWalletModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { createWallet } = useWallet();
  const { isLoading } = useUIStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password || !confirmPassword) {
      setLocalError(t('createWallet.errors.allFieldsRequired'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('createWallet.errors.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t('createWallet.errors.passwordMismatch'));
      return;
    }

    if (!agreed) {
      setLocalError(t('createWallet.errors.mustAgreeTerms'));
      return;
    }

    const mnemonic = await createWallet(password);
    if (mnemonic) {
      // TODO: 显示助记词备份页面
      alert(t('createWallet.successMessage', { mnemonic }));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('createWallet.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Error Message */}
          {localError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-400">{localError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('createWallet.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t('createWallet.passwordPlaceholder')}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('createWallet.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t('createWallet.confirmPasswordPlaceholder')}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isLoading}
              className="mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="agree" className="text-sm text-gray-400">
              {t('createWallet.agreeTerms')} <a href="#" className="text-green-500 hover:text-green-400">{t('createWallet.termsOfService')}</a> {t('createWallet.and')} <a href="#" className="text-green-500 hover:text-green-400">{t('createWallet.privacyPolicy')}</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('createWallet.creating')}</span>
              </span>
            ) : (
              t('createWallet.createButton')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * ImportWalletModal - 导入钱包模态框
 */
function ImportWalletModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { importExistingWallet } = useWallet();
  const { isLoading } = useUIStore();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!mnemonic || !password || !confirmPassword) {
      setLocalError(t('importWallet.errors.allFieldsRequired'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('importWallet.errors.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t('importWallet.errors.passwordMismatch'));
      return;
    }

    const success = await importExistingWallet(mnemonic.trim(), password);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('importWallet.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleImport} className="space-y-4">
          {/* Error Message */}
          {localError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-400">{localError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('importWallet.mnemonic')}</label>
            <textarea
              value={mnemonic}
              onChange={(e) => {
                setMnemonic(e.target.value);
                setLocalError(null);
              }}
              placeholder={t('importWallet.mnemonicPlaceholder')}
              rows={3}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('importWallet.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t('importWallet.passwordPlaceholder')}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('importWallet.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t('importWallet.confirmPasswordPlaceholder')}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('importWallet.importing')}</span>
              </span>
            ) : (
              t('importWallet.importButton')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}