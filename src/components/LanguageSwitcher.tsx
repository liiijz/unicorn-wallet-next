"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";
import { IoLanguage } from "react-icons/io5";

/**
 * LanguageSwitcher - 语言切换器组件
 *
 * 允许用户在支持的语言之间切换
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 等待客户端挂载完成，避免 SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = i18n.language as SupportedLanguage;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  // SSR 时显示占位符，避免 hydration mismatch
  if (!mounted) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 transition-colors text-sm opacity-0">
          <IoLanguage className="text-lg"/>
          <span className="text-white">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Language Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-sm">
        <IoLanguage className="text-lg"/>
        <span className="text-white">{SUPPORTED_LANGUAGES[currentLanguage]}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <button key={code} onClick={() => changeLanguage(code as SupportedLanguage)} className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${currentLanguage === code ? "bg-primary text-black" : "hover:bg-gray-800 text-white"}`}>
                <span>{name}</span>
                {currentLanguage === code && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
