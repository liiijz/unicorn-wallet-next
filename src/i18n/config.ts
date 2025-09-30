import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = {
  'zh-CN': '简体中文',
  'en-US': 'English',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * 初始化 i18next
 */
i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 传递 i18n 实例到 react-i18next
  .use(initReactI18next)
  // 初始化配置
  .init({
    resources: {
      'zh-CN': {
        translation: zhCN,
      },
      'en-US': {
        translation: enUS,
      },
    },
    // 默认语言
    fallbackLng: 'zh-CN',
    // 支持的语言
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    // 调试模式（开发环境）
    debug: process.env.NODE_ENV === 'development',

    // 语言检测选项
    detection: {
      // 检测顺序
      order: ['localStorage', 'navigator'],
      // 缓存语言选择
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'unicorn-wallet-language',
    },

    interpolation: {
      // React 已经安全地转义了
      escapeValue: false,
    },

    // 命名空间（如果需要拆分翻译文件）
    defaultNS: 'translation',
  });

export default i18n;