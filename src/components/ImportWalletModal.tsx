import { useWalletStore } from "@/stores";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { walletController } from "@/controllers/WalletController";

function ImportWalletModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 使用组件内部状态
  
  // 获取钱包状态和已有密码
  const { walletStatus, password: existingPassword } = useWalletStore();
  
  // 判断是否已有钱包(已解锁且有密码)
  const hasExistingWallet = walletStatus === 'unlocked' && existingPassword !== null;

  const importExistingWallet = async (mnemonic: string, passwordToUse: string) => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await walletController.importWallet(mnemonic, passwordToUse);
      return true;
    } catch (error) {
      console.error("Failed to import wallet:", error);
      setLocalError("钱包导入失败");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ImportWalletModal - 导入钱包模态框
   */
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // 验证助记词
    if (!mnemonic) {
      setLocalError(t("importWallet.errors.allFieldsRequired"));
      return;
    }

    let passwordToUse: string;

    if (hasExistingWallet) {
      // 场景1: 已有钱包,使用现有密码
      passwordToUse = existingPassword!;
    } else {
      // 场景2: 首次创建钱包,验证新密码
      if (!password || !confirmPassword) {
        setLocalError(t("importWallet.errors.allFieldsRequired"));
        return;
      }

      if (password.length < 8) {
        setLocalError(t("importWallet.errors.passwordTooShort"));
        return;
      }

      if (password !== confirmPassword) {
        setLocalError(t("importWallet.errors.passwordMismatch"));
        return;
      }

      passwordToUse = password;
    }

    const success = await importExistingWallet(mnemonic.trim(), passwordToUse);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("importWallet.title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 transition-colors">
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
            <label className="block text-sm text-gray-400 mb-2">{t("importWallet.mnemonic")}</label>
            <textarea
              value={mnemonic}
              onChange={(e) => {
                setMnemonic(e.target.value);
                setLocalError(null);
              }}
              placeholder={t("importWallet.mnemonicPlaceholder")}
              rows={3}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 仅在没有现有钱包时显示密码输入 */}
          {!hasExistingWallet && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t("importWallet.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder={t("importWallet.passwordPlaceholder")}
                  disabled={isLoading}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t("importWallet.confirmPassword")}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder={t("importWallet.confirmPasswordPlaceholder")}
                  disabled={isLoading}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </>
          )}

          {/* 已有钱包时显示提示 */}
          {hasExistingWallet && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">导入到现有钱包</p>
                <p className="text-blue-400/80">将使用当前钱包密码加密新导入的账户</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="cursor-pointer w-full bg-primary text-black h-[52px] rounded-2xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading && (
              <svg aria-hidden="true" role="status" className="inline w-4 h-4 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" fillOpacity="0.25" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
              </svg>
            )}
            <span>{isLoading ? t("importWallet.importing") : t("importWallet.importButton")}</span>
            {!isLoading && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ImportWalletModal;
