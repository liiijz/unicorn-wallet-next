'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

/**
 * I18nProvider - 国际化提供者
 *
 * 包裹应用以提供多语言支持
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 确保 i18n 已初始化
    if (!i18n.isInitialized) {
      i18n.init();
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}