"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashProps {
  onFinish?: () => void;
  duration?: number;
}

const Splash = ({ onFinish, duration = 2000 }: SplashProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 启动动画
    setTimeout(() => setAnimate(true), 100);

    // 延迟后隐藏 splash
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* 背景动画效果 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 内容 */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div
          className={`transition-all duration-1000 ${
            animate
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-50 translate-y-10"
          }`}
        >
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-full h-full bg-gray-900/50 backdrop-blur-sm rounded-3xl p-4 border border-gray-800">
              <Image
                src="/images/ic_logo.png"
                alt="Unicorn Wallet"
                width={128}
                height={128}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* 钱包名称 */}
        <div
          className={`transition-all duration-1000 delay-300 ${
            animate
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 animate-gradient">
            Unicorn Wallet
          </h1>
        </div>

        {/* 加载动画 */}
        <div
          className={`transition-all duration-1000 delay-500 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;