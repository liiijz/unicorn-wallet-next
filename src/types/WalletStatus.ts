/**
 * 钱包状态枚举
 * 
 * 使用单一状态枚举替代分散的 isInitialized/isUnlocked 等标志位
 * 让状态流转更清晰、更易维护
 */
export type WalletStatus =
  | 'uninitialized'       // 未初始化（首次使用，无钱包）
  | 'creating'            // 创建中
  | 'importing'           // 导入中
  | 'showing-mnemonic'    // 显示助记词（等待用户确认备份）
  | 'locked'              // 已锁定（有钱包但未解锁）
  | 'unlocking'           // 解锁中
  | 'unlocked';           // 已解锁

/**
 * 状态转换关系：
 * 
 * uninitialized → creating → showing-mnemonic → unlocked
 *                    ↓
 * uninitialized → importing → unlocked
 * 
 * locked → unlocking → unlocked
 * 
 * unlocked → locked
 */
