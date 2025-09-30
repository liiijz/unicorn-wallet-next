# Unicorn Wallet - 钱包创建流程技术文档

## 📚 目录

- [架构概览](#架构概览)
- [完整调用链路](#完整调用链路)
- [各层详细说明](#各层详细说明)
- [数据流转](#数据流转)
- [持久化存储](#持久化存储)
- [安全设计](#安全设计)
- [当前问题与改进建议](#当前问题与改进建议)

---

## 架构概览

### 分层架构

```
┌─────────────────────────────────────────────┐
│          表现层 (Presentation)               │
│    WalletStatus.tsx - UI组件                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          逻辑层 (Logic)                      │
│    useWallet.ts - 业务逻辑Hook              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          状态层 (State)                      │
│  walletStore.ts - 钱包状态管理              │
│  uiStore.ts - UI状态管理                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          控制层 (Controller)                 │
│  KeyringController - 密钥环管理             │
│  AccountController - 账户管理               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          模型层 (Model)                      │
│  HDKeyring - HD钱包密钥环                   │
│  Account - 账户数据模型                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          服务层 (Service)                    │
│  WalletService - 加密/助记词生成            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       持久化层 (Persistence)                 │
│       localStorage - 浏览器本地存储          │
└─────────────────────────────────────────────┘
```

---

## 完整调用链路

### 用户点击"创建新钱包"按钮流程

```
[用户操作] 点击 "创建新钱包" 按钮
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ 1. 表现层 (WalletStatus.tsx)                        │
│    handleCreateWallet() 触发                         │
│    └─> createWallet('test123')                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. 逻辑层 (useWallet.ts)                             │
│    createWallet(password)                            │
│    ├─> setLoading(true, '正在创建钱包...')          │
│    ├─> clearError()                                 │
│    ├─> createNewWallet(password)                    │
│    ├─> 返回 mnemonic                                │
│    └─> setLoading(false)                            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. 状态层 (walletStore.ts)                           │
│    createNewWallet(password)                         │
│    ├─> keyringController.setPassword(password)      │
│    ├─> keyringController.createNew()                │
│    ├─> keyringController.persistVault()             │
│    ├─> accountController.syncAccountsFromKeyrings() │
│    ├─> 更新 Zustand 状态                            │
│    └─> 返回 mnemonic                                │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌─────────────────────┐    ┌─────────────────────────┐
│ 4A. KeyringController│    │ 4B. AccountController   │
│     createNew()      │    │     syncAccounts...()   │
│     ├─> 生成助记词   │    │     ├─> 获取地址列表    │
│     ├─> 创建 HDKeyring│    │     ├─> 创建 Account   │
│     └─> 返回助记词   │    │     ├─> 持久化元数据    │
└──────────┬───────────┘    │     └─> 返回 accounts   │
           │                └─────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────┐
│ 5. 模型层 (HDKeyring.ts)                             │
│    new HDKeyring(opts)                               │
│    ├─> deserialize(opts)                            │
│    ├─> initFromMnemonic(mnemonic)                   │
│    │   ├─> 创建 Mnemonic 对象                       │
│    │   ├─> 生成 masterWallet                        │
│    │   └─> 派生 root 节点                           │
│    └─> addAccounts(1)                               │
│        └─> root.deriveChild(0) → 生成地址          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 6. 服务层 (WalletService.ts)                         │
│    generateMnemonic()                                │
│    └─> bip39.generateMnemonic(128)                  │
│        └─> 返回12个单词的助记词                      │
│                                                      │
│    encryptVault(vaultJson, password)                 │
│    ├─> 生成 salt 和 iv                              │
│    ├─> PBKDF2 派生密钥                              │
│    ├─> AES-CBC 加密                                 │
│    └─> 返回加密数据                                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 7. 持久化层 (localStorage)                           │
│    ├─> KeyringController: 加密的 vault              │
│    └─> AccountController: 账户元数据                │
└─────────────────────────────────────────────────────┘
```

---

## 各层详细说明

### 1. 表现层 (Presentation Layer)

**文件**: `src/components/WalletStatus.tsx`

**职责**:
- 渲染 UI 界面
- 处理用户交互
- 展示钱包状态

**关键代码**:
```typescript
const handleCreateWallet = async () => {
  const mnemonic = await createWallet('test123');
  if (mnemonic) {
    alert(`钱包创建成功！助记词：${mnemonic}`);
  }
};
```

**输入**: 用户点击事件
**输出**: 调用 Hook 层方法

---

### 2. 逻辑层 (Logic Layer)

**文件**: `src/hooks/useWallet.ts`

**职责**:
- 协调多个 Store
- 统一错误处理
- 管理 UI 状态（loading、error）
- 提供简洁的 API

**关键代码**:
```typescript
const createWallet = useCallback(async (password: string) => {
  setLoading(true, '正在创建钱包...');
  clearError();

  try {
    const mnemonic = await createNewWallet(password);
    return mnemonic;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    setError('钱包创建失败');
    return null;
  } finally {
    setLoading(false);
  }
}, [createNewWallet, setLoading, setError, clearError]);
```

**输入**: 密码字符串
**输出**: 助记词或错误

---

### 3. 状态层 (State Layer)

**文件**: `src/stores/walletStore.ts`, `src/stores/uiStore.ts`

**职责**:
- 管理全局状态 (Zustand)
- 协调 Controller 层
- 持久化配置

**walletStore 关键状态**:
```typescript
interface WalletState {
  isUnlocked: boolean;      // 钱包解锁状态
  isInitialized: boolean;   // 钱包初始化状态
  keyrings: IKeyring[];     // 密钥环列表
  accounts: Account[];      // 账户列表
  currentAccount: Account | null;  // 当前活跃账户
  keyringController: KeyringController;
  accountController: AccountController;
}
```

**createNewWallet 流程**:
```typescript
createNewWallet: async (password: string): Promise<string> => {
  const { keyringController, accountController } = get();

  // 1. 设置密码
  keyringController.setPassword(password);

  // 2. 创建钱包 (生成助记词)
  const mnemonic = keyringController.createNew();

  // 3. 加密并持久化
  keyringController.persistVault();

  // 4. 同步账户
  const keyrings = keyringController.getKeyrings();
  const accounts = accountController.syncAccountsFromKeyrings();

  // 5. 更新状态
  set({
    isUnlocked: true,
    isInitialized: true,
    keyrings,
    accounts,
    currentAccount: accounts[0] || null,
  });

  return mnemonic;
}
```

**输入**: 用户密码
**输出**: 助记词 + 更新全局状态

---

### 4A. 控制层 - KeyringController

**文件**: `src/controllers/KeyringController.ts`

**职责**:
- 管理所有 Keyring 实例
- 控制密钥生命周期
- 加密/解密 vault
- 序列化/反序列化

**核心方法**:

#### `createNew()` - 创建新钱包
```typescript
createNew(): string {
  // 1. 生成助记词
  const mnemonic = this.walletService.generateMnemonic();

  // 2. 创建 HD Keyring
  const opts: HDKeyringOptions = {
    mnemonic,
    numberOfAccounts: 1,
  };
  const hdKeyring = new HDKeyring(opts);

  // 3. 添加到 keyrings 数组
  this.keyrings.push(hdKeyring);

  return mnemonic;
}
```

#### `persistVault()` - 持久化加密数据
```typescript
persistVault(): void {
  if (!this.password) {
    throw new Error("No password set");
  }

  // 序列化所有 keyrings
  const serialized = this.serializeKeyrings();

  // 加密
  const encrypted = this.walletService.encryptVault(
    JSON.stringify(serialized),
    this.password
  );

  // 保存到 localStorage
  localStorage.setItem("KeyringController", JSON.stringify({ vault: encrypted }));
}
```

#### `restoreVault()` - 解锁钱包
```typescript
restoreVault(): void {
  if (!this.password) {
    throw new Error("No password set");
  }

  // 读取加密数据
  const dataString = localStorage.getItem("KeyringController");
  if (!dataString) {
    throw new Error("No vault found");
  }

  // 清空现有 keyrings
  this.keyrings = [];

  // 解密
  const data = JSON.parse(dataString);
  const decrypted = this.walletService.decryptVault(data.vault, this.password);

  // 反序列化并恢复 keyrings
  const keyrings = JSON.parse(decrypted);
  keyrings.forEach((kr: any) => {
    const keyring: IKeyring = new HDKeyring();
    keyring.deserialize(kr);
    this.keyrings.push(keyring);
  });
}
```

---

### 4B. 控制层 - AccountController

**文件**: `src/controllers/AccountController.ts`

**职责**:
- 从 Keyring 同步账户信息
- 管理账户元数据（名称、索引等）
- 持久化账户配置
- 提供账户查询接口

**核心方法**:

#### `syncAccountsFromKeyrings()` - 同步账户
```typescript
syncAccountsFromKeyrings(): Account[] {
  const keyrings = this.keyringController.getKeyrings();
  const newAccounts: Account[] = [];

  keyrings.forEach((keyring: IKeyring) => {
    const addresses = keyring.getAccounts();
    const keyringData = keyring.serialize();

    addresses.forEach((address: string, index: number) => {
      // 检查是否已存在
      let existingAccount = this.accounts.find(acc => acc.address === address);

      if (!existingAccount) {
        // 创建新账户
        const account: Account = {
          id: `${keyring.type}-${address}`,
          address,
          name: this.generateAccountName(keyring.type, index),
          type: this.mapKeyringTypeToAccountType(keyring.type),
          derivationPath: keyringData.hdPath ? `${keyringData.hdPath}/${index}` : null,
          accountIndex: index,
          createdAt: Date.now(),
        };
        newAccounts.push(account);
      } else {
        newAccounts.push(existingAccount);
      }
    });
  });

  this.accounts = newAccounts;
  this.persistAccounts();
  return this.accounts;
}
```

#### `addNewAccount()` - 添加新账户
```typescript
async addNewAccount(keyringIndex: number = 0): Promise<Account | null> {
  const keyrings = this.keyringController.getKeyrings();
  const keyring = keyrings[keyringIndex];

  if (!keyring) {
    throw new Error(`Keyring at index ${keyringIndex} not found`);
  }

  // 派生新账户
  const newAddresses = await keyring.addAccounts(1);
  if (newAddresses.length === 0) {
    return null;
  }

  // 持久化 keyring 变化
  this.keyringController.persistVault();

  // 重新同步账户
  const accounts = this.syncAccountsFromKeyrings();
  return accounts.find(acc => acc.address === newAddresses[0]) || null;
}
```

#### `persistAccounts()` - 持久化账户元数据
```typescript
private persistAccounts(): void {
  const accountsData = this.accounts.map(acc => ({
    address: acc.address,
    name: acc.name,
    customData: {
      // 只存储用户自定义的数据
    }
  }));

  localStorage.setItem('AccountController', JSON.stringify(accountsData));
}
```

---

### 5. 模型层 (Model Layer)

**文件**: `src/types/HDKeyring.ts`

**职责**:
- 管理 HD 钱包密钥派生
- 生成以太坊地址
- 提供签名能力

**HD 路径**: `m/44'/60'/0'/0` (以太坊标准)

**核心方法**:

#### `constructor()` - 初始化
```typescript
constructor(opts?: HDKeyringOptions) {
  if (opts) {
    this.deserialize(opts);
  }
}
```

#### `deserialize()` - 从助记词恢复
```typescript
async deserialize(opts: HDKeyringOptions): Promise<void> {
  // 重置状态
  this.wallets = [];
  this.root = null;
  this.mnemonic = null;
  this.hdPath = opts.hdPath || HD_PATH;

  if (!opts.mnemonic) {
    throw new Error("Mnemonic is required");
  }

  // 从助记词初始化
  this.initFromMnemonic(opts.mnemonic);

  // 派生账户
  this.addAccounts(opts.numberOfAccounts);
}
```

#### `initFromMnemonic()` - 初始化根节点
```typescript
private initFromMnemonic(mnemonic: string): void {
  this.mnemonic = mnemonic;

  // 创建 Mnemonic 对象
  const mnemonicObj = Mnemonic.fromPhrase(mnemonic);

  // 生成 master wallet
  const masterWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m");

  // 派生到以太坊标准路径
  this.root = masterWallet.derivePath(this.hdPath);
}
```

#### `addAccounts()` - 派生新账户
```typescript
async addAccounts(count: number): Promise<string[]> {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("Count must be a positive integer");
  }
  if (!this.root) {
    throw new Error("Root wallet not initialized");
  }

  const MAX_ACCOUNTS = 1000;
  const startIndex = this.wallets.length;
  const newAddresses: string[] = [];

  if (this.wallets.length + count > MAX_ACCOUNTS) {
    throw new Error(`Cannot exceed ${MAX_ACCOUNTS} accounts`);
  }

  // 派生子钱包
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    const hdWallet = this.root.deriveChild(index);
    this.wallets.push(hdWallet);
    newAddresses.push(hdWallet.address);
  }

  return newAddresses;
}
```

#### `serialize()` - 序列化
```typescript
serialize() {
  return {
    type: this.type,
    mnemonic: this.mnemonic,
    numberOfAccounts: this.wallets.length,
    hdPath: this.hdPath,
  };
}
```

---

### 6. 服务层 (Service Layer)

**文件**: `src/services/WalletService.ts`

**职责**:
- 生成 BIP39 助记词
- 加密/解密 vault
- 密码学操作

**核心方法**:

#### `generateMnemonic()` - 生成助记词
```typescript
generateMnemonic(): string {
  // 使用 bip39 库生成 128 位强度的助记词 (12个单词)
  const mnemonic = bip39.generateMnemonic(128);
  return mnemonic;
}
```

**示例输出**:
```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

#### `encryptVault()` - 加密数据
```typescript
encryptVault(vaultJson: string, password: string): string {
  // 1. 生成随机 salt 和 iv
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);

  // 2. 使用 PBKDF2 派生密钥
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 8,
    iterations: 100000,  // 与 MetaMask 一致
  });

  // 3. AES-CBC 加密
  const encrypted = CryptoJS.AES.encrypt(vaultJson, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 4. 返回 MetaMask 兼容格式
  return JSON.stringify({
    data: encrypted.toString(),
    iv: iv.toString(),
    keyMetadata: {
      algorithm: "PBKDF2",
      params: { iterations: 100000 },
    },
    salt: salt.toString(),
  });
}
```

#### `decryptVault()` - 解密数据
```typescript
decryptVault(encryptedVault: string, password: string): string {
  const vault = JSON.parse(encryptedVault);
  const salt = CryptoJS.enc.Hex.parse(vault.salt);
  const iv = CryptoJS.enc.Hex.parse(vault.iv);

  // 使用相同参数派生密钥
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 8,
    iterations: vault.keyMetadata.params.iterations,
  });

  // 解密
  const decrypted = CryptoJS.AES.decrypt(vault.data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
```

---

## 数据流转

### 数据结构示例

#### 1. 助记词 (Mnemonic)
```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

#### 2. HDKeyring 序列化数据
```json
{
  "type": "HD",
  "mnemonic": "abandon ability able...",
  "numberOfAccounts": 1,
  "hdPath": "m/44'/60'/0'/0"
}
```

#### 3. 加密后的 Vault (localStorage)
```json
{
  "vault": {
    "data": "U2FsdGVkX1+Q3F5R7F...",
    "iv": "a3b4c5d6e7f8g9h0...",
    "salt": "1a2b3c4d5e6f7g8h...",
    "keyMetadata": {
      "algorithm": "PBKDF2",
      "params": { "iterations": 100000 }
    }
  }
}
```

#### 4. Account 对象
```json
{
  "id": "HD-0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "name": "Account 1",
  "type": "mnemonic",
  "derivationPath": "m/44'/60'/0'/0/0",
  "accountIndex": 0,
  "createdAt": 1735545600000
}
```

#### 5. AccountController 持久化数据
```json
[
  {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "name": "My Main Account",
    "customData": {}
  }
]
```

---

## 持久化存储

### localStorage 键值对

| Key | Value | 加密 | 用途 |
|-----|-------|------|------|
| `KeyringController` | `{ vault: {...} }` | ✅ 是 | 存储加密的助记词和私钥 |
| `AccountController` | `[{ address, name, ... }]` | ❌ 否 | 存储账户元数据 |
| `wallet-storage` | `{ isInitialized: true }` | ❌ 否 | Zustand 持久化配置 |

### 安全性分析

**加密的数据**:
- ✅ 助记词 (mnemonic)
- ✅ 私钥 (privateKeys)
- ✅ Keyring 序列化数据

**不加密的数据**:
- ❌ 账户地址 (公开信息)
- ❌ 账户名称 (用户自定义标签)
- ❌ 派生路径 (公开标准)

---

## 安全设计

### 1. 密码学算法

**助记词生成**:
- 标准: BIP39
- 熵值: 128 bit (12 words)
- 语言: English

**密钥派生**:
- 标准: BIP32 / BIP44
- 路径: `m/44'/60'/0'/0/n` (以太坊)
- 算法: HMAC-SHA512

**密码加密**:
- 算法: AES-256-CBC
- 密钥派生: PBKDF2
- 迭代次数: 100,000 (与 MetaMask 一致)
- 盐值长度: 128 bit
- IV 长度: 128 bit

### 2. 安全策略

**内存安全**:
- ✅ 密码仅在内存中临时存储
- ✅ 锁定钱包时清除敏感数据
- ❌ 助记词在 KeyringController 中持久化 (仅内存)

**存储安全**:
- ✅ localStorage 只存储加密数据
- ✅ 每次加密使用随机 salt 和 iv
- ✅ 不存储明文密码

**通信安全**:
- ⚠️ 当前为本地应用，无网络通信
- ⚠️ 未来需要 HTTPS + 证书校验

### 3. 威胁模型

| 威胁 | 防护措施 | 状态 |
|------|----------|------|
| 本地文件访问 | AES 加密 | ✅ 已实现 |
| 暴力破解密码 | PBKDF2 100k 迭代 | ✅ 已实现 |
| XSS 攻击 | React 自动转义 | ✅ 框架提供 |
| 中间人攻击 | HTTPS (生产环境) | ⚠️ 待部署 |
| 钓鱼攻击 | 域名校验 | ❌ 未实现 |
| 屏幕截图 | 敏感信息遮罩 | ❌ 未实现 |

---

## 当前问题与改进建议

### 🔴 高优先级问题

#### 1. 密码硬编码
**问题**: `'test123'` 写死在组件中

**影响**:
- 所有用户使用相同密码
- 无法自定义密码

**解决方案**:
```typescript
// 添加密码输入组件
const [password, setPassword] = useState('');

<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="请输入密码 (至少8位)"
/>

<button
  onClick={() => handleCreateWallet(password)}
  disabled={password.length < 8}
>
  创建新钱包
</button>
```

#### 2. 助记词展示不安全
**问题**: 使用 `alert()` 显示助记词

**影响**:
- 容易被截图
- 无法复制
- 用户体验差

**解决方案**:
```typescript
// 创建专门的助记词展示组件
<MnemonicDisplayModal
  mnemonic={mnemonic}
  onConfirm={handleMnemonicConfirmed}
  onCopy={handleCopyMnemonic}
/>
```

#### 3. 缺少助记词确认步骤
**问题**: 用户未手动确认已保存助记词

**影响**:
- 用户可能丢失助记词
- 无法恢复钱包

**解决方案**:
```typescript
// 添加确认流程
<MnemonicConfirmation
  mnemonic={mnemonic}
  onVerified={handleVerified}
  words={[3, 7, 11]}  // 随机选择3个单词让用户填写
/>
```

---

### 🟡 中优先级问题

#### 4. 缺少密码强度校验
**建议**:
```typescript
const validatePassword = (password: string) => {
  if (password.length < 8) return '密码至少8位';
  if (!/[A-Z]/.test(password)) return '需要包含大写字母';
  if (!/[a-z]/.test(password)) return '需要包含小写字母';
  if (!/[0-9]/.test(password)) return '需要包含数字';
  return null;
};
```

#### 5. 账户余额未实现
**问题**: `Account.balance` 始终为空

**解决方案**:
```typescript
// 添加余额查询服务
class BalanceService {
  async getBalance(address: string): Promise<string> {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }
}
```

#### 6. 缺少错误边界
**建议**:
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <WalletStatus />
</ErrorBoundary>
```

---

### 🟢 低优先级问题

#### 7. 缺少日志记录
**建议**: 添加结构化日志

```typescript
class Logger {
  info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta);
  }

  error(message: string, error: Error) {
    console.error(`[ERROR] ${message}`, {
      message: error.message,
      stack: error.stack,
    });
  }
}
```

#### 8. 缺少国际化
**建议**: 使用 i18n

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<button>{t('wallet.createNew')}</button>
```

#### 9. 性能优化
**建议**:
- 使用 React.memo 优化组件渲染
- 使用 useMemo/useCallback 缓存计算结果
- 虚拟化长列表 (react-window)

---

## 附录

### A. 相关标准

- [BIP39 - Mnemonic Code](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP32 - Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP44 - Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [EIP-155 - Simple Replay Attack Protection](https://eips.ethereum.org/EIPS/eip-155)

### B. 依赖库

| 库 | 版本 | 用途 |
|----|------|------|
| ethers | ^6.x | 以太坊钱包和工具 |
| bip39 | ^3.x | 助记词生成 |
| crypto-js | ^4.x | 加密/解密 |
| zustand | ^4.x | 状态管理 |
| next | ^14.x | React 框架 |

### C. 目录结构

```
src/
├── app/                    # Next.js 应用路由
│   └── page.tsx
├── components/             # React 组件
│   └── WalletStatus.tsx
├── controllers/            # 业务控制层
│   ├── KeyringController.ts
│   └── AccountController.ts
├── hooks/                  # 自定义 Hooks
│   └── useWallet.ts
├── services/               # 服务层
│   └── WalletService.ts
├── stores/                 # 状态管理
│   ├── walletStore.ts
│   └── uiStore.ts
└── types/                  # TypeScript 类型
    ├── Account.ts
    ├── Keyring.ts
    ├── HDKeyring.ts
    └── Wallet.ts
```

---

## 总结

Unicorn Wallet 采用了清晰的分层架构，将密钥管理、账户管理、状态管理和 UI 渲染分离，实现了高内聚低耦合的设计。

**核心优势**:
- ✅ 分层架构清晰
- ✅ 职责分离明确
- ✅ 安全加密可靠
- ✅ 扩展性良好

**需要改进**:
- ⚠️ UI/UX 待完善
- ⚠️ 错误处理待加强
- ⚠️ 测试覆盖待提升

---

**文档版本**: v1.0.0
**更新日期**: 2025-09-30
**作者**: Unicorn Wallet Team