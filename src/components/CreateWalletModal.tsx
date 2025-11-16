import { useState } from "react";
import { useTranslation } from "react-i18next";
import { walletController } from "@/controllers/WalletController";
import { IoClose, IoCloseCircle, IoArrowForward } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface CreateWalletModalProps {
  onClose: () => void;
  onCreated?: (mnemonic: string) => void;
}

/**
 * CreateWalletModal - 创建钱包模态框
 */
function CreateWalletModal({ onClose, onCreated }: CreateWalletModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 使用组件内部状态

  const createWallet = (password: string) => {
    setIsLoading(true);
    setLocalError(null);

    try {
      const mnemonic = walletController.createNewWallet(password);
      return mnemonic;
    } catch (error) {
      console.error("Failed to create wallet:", error);
      setLocalError("钱包创建失败");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password || !confirmPassword) {
      setLocalError(t("createWallet.errors.allFieldsRequired"));
      return;
    }

    if (password.length < 8) {
      setLocalError(t("createWallet.errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t("createWallet.errors.passwordMismatch"));
      return;
    }

    if (!agreed) {
      setLocalError(t("createWallet.errors.mustAgreeTerms"));
      return;
    }

    const mnemonic = createWallet(password);
    if (mnemonic) {
      // walletStatus 已经在 walletController.createNewAccount() 内部设置为 "showing-mnemonic"
      if (onCreated) {
        onCreated(mnemonic);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("createWallet.title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 transition-colors">
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Error Message */}
          {localError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <IoCloseCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-400">{localError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t("createWallet.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t("createWallet.passwordPlaceholder")}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t("createWallet.confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
              }}
              placeholder={t("createWallet.confirmPasswordPlaceholder")}
              disabled={isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={isLoading} className="mt-1 disabled:opacity-50 disabled:cursor-not-allowed" />
            <label htmlFor="agree" className="text-sm text-gray-400">
              {t("createWallet.agreeTerms")}{" "}
              <a href="#" className="text-green-500 hover:text-green-400">
                {t("createWallet.termsOfService")}
              </a>{" "}
              {t("createWallet.and")}{" "}
              <a href="#" className="text-green-500 hover:text-green-400">
                {t("createWallet.privacyPolicy")}
              </a>
            </label>
          </div>

          <button type="submit" disabled={isLoading} className="cursor-pointer w-full bg-primary text-black h-[52px] rounded-2xl font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading && <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />}
            <span>{t("createWallet.createButton")}</span>
            {!isLoading && <IoArrowForward className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateWalletModal;
