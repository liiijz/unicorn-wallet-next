import { useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

interface WalletCreatedProps {
  mnemonic: string;
  onClose: () => void;
}

const MnemonicModal = ({ mnemonic, onClose }: WalletCreatedProps) => {

  const { t } = useTranslation();
  
  // 判断 mnemonic 是否为空或空字符串
  if (!mnemonic || mnemonic.trim() === "") {
    return null;
  }
  
  const mnemonicWords = mnemonic.split(" ");

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t("mnemonicModal.title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title and Warning */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-3">{t("mnemonicModal.backupTitle")}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t("mnemonicModal.warning")}
          </p>
        </div>

        {/* Mnemonic Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {mnemonicWords.slice(0, 12).map((word, index) => (
            <div
              key={index}
              className="bg-[#2a2a2a] rounded-xl p-4 border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm font-medium">{index + 1}</span>
                <span className="text-white text-base font-medium">{word}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full bg-white text-black font-semibold py-4 rounded-full hover:bg-gray-100 transition-colors"
        >
          {t("mnemonicModal.confirmButton")}
        </button>
      </div>
    </div>
  );
};

export default MnemonicModal;
