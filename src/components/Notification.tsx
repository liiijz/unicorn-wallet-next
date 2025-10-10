"use client"

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  IoClose, 
  IoCheckmarkCircle, 
  IoAlertCircle, 
  IoInformationCircle, 
  IoWarning 
} from 'react-icons/io5';
import { IconType } from 'react-icons';

// 定义通知类型
type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 定义通知对象接口
interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// 定义通知配置接口
interface NotificationConfig {
  bg: string;
  border: string;
  text: string;
  icon: IconType;
  iconColor: string;
}

// 定义 Context 值的接口
interface NotificationContextValue {
  addNotification: (type: NotificationType, message: string) => void;
}

// 创建全局通知 Context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// 自定义 Hook 用于在任何组件中调用通知
export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// 通知提供者组件的 Props
interface NotificationProviderProps {
  children: ReactNode;
}

// 通知提供者组件
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string): void => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number): void => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map(notif => (
          <NotificationItem
            key={notif.id}
            type={notif.type}
            message={notif.message}
            onClose={() => removeNotification(notif.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// 通知组件的 Props
interface NotificationItemProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
}

// 通知组件
function NotificationItem({ type, message, onClose }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const config: Record<NotificationType, NotificationConfig> = {
    success: {
      bg: 'bg-gray-900/95',
      border: 'border-[#00F4C8]/50',
      text: 'text-white',
      icon: IoCheckmarkCircle,
      iconColor: 'text-[#00F4C8]'
    },
    error: {
      bg: 'bg-gray-900/95',
      border: 'border-red-400/50',
      text: 'text-white',
      icon: IoAlertCircle,
      iconColor: 'text-red-400'
    },
    warning: {
      bg: 'bg-gray-900/95',
      border: 'border-amber-400/50',
      text: 'text-white',
      icon: IoWarning,
      iconColor: 'text-amber-400'
    },
    info: {
      bg: 'bg-gray-900/95',
      border: 'border-cyan-400/50',
      text: 'text-white',
      icon: IoInformationCircle,
      iconColor: 'text-cyan-400'
    }
  };

  const { bg, border, text, icon: Icon, iconColor } = config[type];

  return (
    <div
      className={`${bg} ${border} border-l-4 rounded-xl shadow-2xl backdrop-blur-xl p-4 flex items-start gap-3 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
      <p className={`${text} flex-1 text-sm font-medium`}>{message}</p>
      <button
        onClick={onClose}
        className={`${text} hover:opacity-70 transition flex-shrink-0`}
        aria-label="关闭通知"
      >
        <IoClose size={18} />
      </button>
    </div>
  );
}

// 示例组件 - 可以在应用的任何地方使用
function ExampleComponent() {
  const { addNotification } = useNotification();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">组件 A - 可以触发全局通知</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => addNotification('success', '操作成功完成！')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          成功通知
        </button>
        <button
          onClick={() => addNotification('error', '发生错误,请重试')}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          错误通知
        </button>
      </div>
    </div>
  );
}

function AnotherComponent() {
  const { addNotification } = useNotification();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">组件 B - 同样可以触发全局通知</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => addNotification('warning', '这需要你的注意')}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          警告通知
        </button>
        <button
          onClick={() => addNotification('info', '这里有一些有用的信息')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          信息通知
        </button>
      </div>
    </div>
  );
}

// 主应用组件
export default function App() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">React Icons 全局通知系统</h1>
          <ExampleComponent />
          <AnotherComponent />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <h3 className="font-semibold text-blue-900 mb-2">使用 React Icons:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>✅ 使用 <code className="bg-blue-100 px-2 py-1 rounded">react-icons/io5</code> (Ionicons 5)</li>
              <li>✅ 类型定义使用 <code className="bg-blue-100 px-2 py-1 rounded">IconType</code></li>
              <li>✅ 完整的 TypeScript 支持</li>
              <li>✅ 更轻量，按需加载</li>
            </ul>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}