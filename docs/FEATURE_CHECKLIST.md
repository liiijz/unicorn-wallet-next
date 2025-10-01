# Unicorn Wallet 功能清单与开发规划

> 📅 更新时间: 2025-10-02
> 📊 当前进度: 11/51 功能已完成 (21.6%)

---

## 📊 已完成功能 (11项) ✅

### 🔐 核心钱包功能

- ✅ **助记词生成功能** - BIP39标准,生成12词助记词
  - 📍 位置: `src/services/WalletService.ts:23`
  - 🔧 技术: bip39库, 128位熵

- ✅ **HD钱包派生** - 支持以太坊标准路径 m/44'/60'/0'/0
  - 📍 位置: `src/types/HDKeyring.ts:5`
  - 🔧 技术: ethers.js HDNodeWallet

- ✅ **钱包加密存储** - PBKDF2(10万次迭代) + AES-256-CBC加密
  - 📍 位置: `src/services/WalletService.ts:32`
  - 🔧 技术: crypto-js, PBKDF2 100k iterations

- ✅ **钱包解锁/锁定功能**
  - 📍 位置: `src/stores/walletStore.ts:72,107`
  - 🔧 功能: 密码验证, 会话管理, localStorage持久化

### 👛 账户管理

- ✅ **创建新钱包流程** - 密码设置+助记词生成
  - 📍 位置: `src/components/Welcome.tsx:96`
  - 🔧 UI: 模态框表单, 密码强度验证

- ✅ **导入已有钱包** - 通过助记词导入
  - 📍 位置: `src/components/Welcome.tsx:236`
  - 🔧 功能: 助记词验证, 密码设置

- ✅ **多账户管理** - HD派生账户,支持添加新账户
  - 📍 位置: `src/controllers/AccountController.ts:60`
  - 🔧 功能: 账户同步, 元数据管理, 最多1000账户

- ✅ **账户切换和展示** - 账户选择器UI
  - 📍 位置: `src/components/WalletHome.tsx:94`
  - 🔧 UI: 下拉选择器, 地址缩略显示

### 🎨 基础设施

- ✅ **国际化支持** - i18next多语言支持
  - 📍 位置: `src/i18n/config.ts`
  - 🔧 技术: i18next, react-i18next, 浏览器语言检测

- ✅ **状态管理** - Zustand + mitt事件总线架构
  - 📍 位置: `src/stores/walletStore.ts`, `src/events/WalletEvents.ts`
  - 🔧 技术: zustand持久化, mitt事件驱动

- ✅ **基础UI界面** - Welcome/Unlock/Home页面完整实现
  - 📍 位置: `src/components/`
  - 🔧 UI: Tailwind CSS, 响应式设计, 暗色主题

---

## 🔥 待实现功能 - P0 核心功能 (8项)

**优先级: 最高 🚨**
这些功能是钱包基本可用的核心要素，应优先实现

### 1. 助记词备份确认流程
- **需求**: 创建钱包后显示助记词,要求用户手动抄写并验证
- **实现要点**:
  - 显示12个助记词单词（可遮罩/显示切换）
  - 警告提示：不要截图、不要分享
  - 验证环节：随机选择3-4个单词让用户填写
  - 只有验证通过才能进入钱包主页
- **文件位置**: 新建 `src/components/MnemonicBackup.tsx`

### 2. 交易签名功能 (signTransaction)
- **需求**: 实现HDKeyring的交易签名方法
- **实现要点**:
  - 根据地址找到对应的HDNodeWallet
  - 使用ethers.js签名交易对象
  - 返回签名后的rawTransaction
- **文件位置**: `src/types/HDKeyring.ts:31`

### 3. 消息签名功能 (signMessage)
- **需求**: 实现HDKeyring的消息签名方法（用于DApp连接）
- **实现要点**:
  - 支持字符串和Uint8Array消息格式
  - EIP-191个人签名标准
  - 返回65字节签名结果
- **文件位置**: `src/types/HDKeyring.ts:34`

### 4. 以太坊RPC Provider集成
- **需求**: 连接以太坊节点,读取链上数据
- **实现要点**:
  - 创建 `src/services/EthereumProvider.ts`
  - 使用ethers.js的JsonRpcProvider
  - 支持Infura/Alchemy等RPC节点
  - 实现余额查询、交易历史查询
- **文件位置**: 新建 `src/services/EthereumProvider.ts`

### 5. 发送ETH功能
- **需求**: 完整的转账流程
- **实现要点**:
  - 新建发送页面 `src/components/SendTransaction.tsx`
  - 地址验证（checksumAddress）
  - 余额不足检测
  - Gas费估算和自定义
  - 交易签名并广播
  - 交易hash显示和区块链浏览器链接
- **文件位置**: 新建 `src/components/SendTransaction.tsx`

### 6. 接收地址展示
- **需求**: 显示当前账户地址,生成二维码
- **实现要点**:
  - 新建接收页面 `src/components/ReceiveAddress.tsx`
  - 显示完整地址和checksumAddress
  - 使用qrcode.react生成二维码
  - 一键复制地址功能
- **文件位置**: 新建 `src/components/ReceiveAddress.tsx`
- **依赖**: `npm install qrcode.react`

### 7. 实时余额查询
- **需求**: 定期刷新账户ETH余额
- **实现要点**:
  - 创建 `src/controllers/BalanceController.ts`
  - 使用useEffect定时查询（每15秒）
  - 更新到Account对象的balance字段
  - 支持手动刷新
- **文件位置**: 新建 `src/controllers/BalanceController.ts`

### 8. Toast通知组件
- **需求**: 替换当前的alert提示,提升用户体验
- **实现要点**:
  - 创建 `src/components/Toast.tsx`
  - 支持success/error/warning/info四种类型
  - 自动消失（3秒）和手动关闭
  - 支持多个toast堆叠显示
- **文件位置**: 新建 `src/components/Toast.tsx`
- **参考**: `src/components/WalletHome.tsx:28` (当前使用alert)

---

## ⚡ 待实现功能 - P1 重要功能 (7项)

**优先级: 高 ⭐⭐⭐**
完善基础功能,提升用户体验

### 1. 网络切换功能
- **需求**: 支持Mainnet/Testnet/自定义RPC
- **实现要点**:
  - 创建 `src/types/Network.ts` 定义网络配置
  - 预设网络: Mainnet, Goerli, Sepolia, Localhost
  - 支持添加自定义RPC URL和ChainID
  - 网络切换时刷新余额和交易历史
- **文件位置**: 新建 `src/controllers/NetworkController.ts`

### 2. 交易历史记录查询
- **需求**: 显示过往交易记录
- **实现要点**:
  - 使用Etherscan API查询交易历史
  - 显示时间、from/to地址、金额、状态
  - 支持分页加载
  - 点击查看交易详情
- **文件位置**: 新建 `src/components/TransactionHistory.tsx`

### 3. ERC20代币支持
- **需求**: 查询ERC20余额和转账
- **实现要点**:
  - 创建 `src/services/ERC20Service.ts`
  - 使用ethers.js Contract调用ERC20标准方法
  - balanceOf, transfer, approve等方法
  - 显示代币余额和交易历史
- **文件位置**: 新建 `src/services/ERC20Service.ts`

### 4. 代币列表管理
- **需求**: 添加/删除/搜索自定义代币
- **实现要点**:
  - 创建 `src/controllers/TokenController.ts`
  - 支持通过合约地址添加代币
  - 自动读取token name/symbol/decimals
  - 持久化代币列表到localStorage
  - 内置常用代币列表（USDT/USDC/DAI等）
- **文件位置**: 新建 `src/controllers/TokenController.ts`

### 5. Gas费估算和自定义
- **需求**: 慢速/标准/快速三档Gas费选择
- **实现要点**:
  - 使用eth_gasPrice和eth_estimateGas
  - 慢速（-20%）、标准、快速（+50%）三档
  - 支持手动输入Gas Price和Gas Limit
  - EIP-1559支持（maxFeePerGas, maxPriorityFeePerGas）
- **文件位置**: 修改 `src/components/SendTransaction.tsx`

### 6. 交易确认界面
- **需求**: 详细展示交易信息供用户确认
- **实现要点**:
  - 新建确认模态框 `src/components/TransactionConfirm.tsx`
  - 显示: From地址、To地址、金额、Gas费、Total
  - 显示代币信息（如果是ERC20转账）
  - 警告：不可逆操作提示
- **文件位置**: 新建 `src/components/TransactionConfirm.tsx`

### 7. 优化复制地址功能
- **需求**: 替换alert为Toast提示
- **实现要点**:
  - 修改 `src/components/WalletHome.tsx:28`
  - 使用Toast组件显示"地址已复制"
  - 添加复制成功动画效果
- **文件位置**: 修改 `src/components/WalletHome.tsx`

---

## 💎 待实现功能 - P2 增强功能 (7项)

**优先级: 中 ⭐⭐**
增强钱包功能性和实用性

### 1. 私钥导入功能 (SimpleKeyring)
- **需求**: 支持通过私钥直接导入账户
- **实现要点**:
  - 创建 `src/types/SimpleKeyring.ts`
  - 实现IKeyring接口
  - 支持单个私钥或多个私钥管理
  - 私钥加密存储
- **文件位置**: 新建 `src/types/SimpleKeyring.ts`

### 2. 私钥导出功能
- **需求**: 导出账户私钥（需密码验证）
- **实现要点**:
  - 二次密码验证
  - 显示私钥（可遮罩/显示切换）
  - 复制私钥功能
  - 安全警告提示
- **文件位置**: 新建 `src/components/ExportPrivateKey.tsx`

### 3. 账户删除/隐藏功能
- **需求**: 管理不需要的账户
- **实现要点**:
  - HD账户只能隐藏不能删除
  - 导入的私钥账户可以删除
  - 删除前二次确认
  - 更新AccountController
- **文件位置**: 修改 `src/controllers/AccountController.ts`

### 4. 修改账户名称功能UI
- **需求**: 修改账户名称的交互界面
- **实现要点**:
  - 在账户列表中添加编辑按钮
  - 弹出输入框修改名称
  - 实时更新显示
  - 已有后端方法: `src/controllers/AccountController.ts:117`
- **文件位置**: 修改 `src/components/WalletHome.tsx`

### 5. 价格API集成
- **需求**: 接入CoinGecko/CoinMarketCap显示实时价格
- **实现要点**:
  - 创建 `src/services/PriceService.ts`
  - 使用CoinGecko免费API
  - 缓存价格数据（避免频繁请求）
  - 显示USD/CNY等多币种价格
  - 显示24h涨跌幅
- **文件位置**: 新建 `src/services/PriceService.ts`

### 6. 交易状态追踪
- **需求**: pending/confirmed/failed状态实时更新
- **实现要点**:
  - 发送交易后轮询交易状态
  - 使用eth_getTransactionReceipt
  - 显示确认数（1/12, 2/12...）
  - 交易失败显示错误原因
- **文件位置**: 新建 `src/services/TransactionTracker.ts`

### 7. 地址簿功能
- **需求**: 保存和管理常用转账地址
- **实现要点**:
  - 创建 `src/controllers/AddressBookController.ts`
  - 地址+名称+备注
  - 持久化到localStorage
  - 在发送页面支持从地址簿选择
- **文件位置**: 新建 `src/controllers/AddressBookController.ts`

### 8. WalletConnect集成
- **需求**: 连接DApps(Uniswap/OpenSea等)
- **实现要点**:
  - 安装 @walletconnect/web3-provider
  - 扫码连接DApp
  - 显示已连接的DApp列表
  - 断开连接功能
  - 处理DApp请求（签名、发送交易）
- **文件位置**: 新建 `src/services/WalletConnectService.ts`

---

## 🚀 待实现功能 - P3 高级功能 (10项)

**优先级: 低 ⭐**
长期规划,差异化功能

### 1. 硬件钱包支持 (Ledger/Trezor)
- **实现要点**:
  - 集成 @ledgerhq/hw-app-eth
  - 集成 trezor-connect
  - 创建 `src/types/HardwareKeyring.ts`
  - USB/蓝牙连接
  - 设备上确认交易

### 2. NFT资产展示
- **实现要点**:
  - 支持ERC721/ERC1155
  - 使用OpenSea API获取NFT元数据
  - 显示NFT图片、名称、描述
  - NFT转移功能

### 3. 多链支持 (BTC/SOL/ADA等)
- **实现要点**:
  - 支持比特币（BIP44路径）
  - 支持Solana（@solana/web3.js）
  - 支持Cardano
  - 统一的账户管理界面

### 4. DeFi协议集成 (Swap/Stake等)
- **实现要点**:
  - 集成Uniswap SDK进行代币兑换
  - 显示流动性池信息
  - Staking功能
  - 收益查询

### 5. 密码修改功能
- **实现要点**:
  - 输入旧密码验证
  - 输入新密码（强度验证）
  - 重新加密vault
  - 更新localStorage

### 6. 自动锁定功能
- **实现要点**:
  - 设置自动锁定时间（5分钟/15分钟/1小时）
  - 监听用户活动（鼠标/键盘事件）
  - 超时自动调用lock()方法
  - 可配置是否启用

### 7. 生物识别解锁 (指纹/Face ID)
- **实现要点**:
  - 使用Web Authentication API
  - 首次启用时加密保存密码
  - 生物识别验证后自动填充密码
  - 仅支持HTTPS和现代浏览器

### 8. 交易加速/取消功能
- **实现要点**:
  - Replace-by-fee (RBF)机制
  - 提高Gas Price重发交易
  - 发送0 ETH到自己取消交易
  - 显示加速费用预估

---

## 📈 开发路线图

### 🎯 第一阶段: MVP核心功能 (2-3周)
**目标**: 实现可用的基础钱包功能

```
Week 1:
- [ ] 助记词备份确认流程
- [ ] 交易签名 + 消息签名功能
- [ ] RPC Provider集成

Week 2:
- [ ] 实时余额查询
- [ ] 发送ETH功能
- [ ] 接收地址展示

Week 3:
- [ ] Toast通知组件
- [ ] 测试与bug修复
- [ ] 部署测试版本
```

### ⚡ 第二阶段: 完善基础功能 (3-4周)
**目标**: 提升用户体验,支持代币

```
Week 4-5:
- [ ] 网络切换功能
- [ ] ERC20代币支持
- [ ] 代币列表管理

Week 6-7:
- [ ] 交易历史查询
- [ ] Gas费优化
- [ ] 交易确认界面优化
```

### 💎 第三阶段: 增强功能 (4-6周)
**目标**: 增强钱包实用性

```
Week 8-9:
- [ ] 私钥导入/导出
- [ ] 价格API集成
- [ ] 地址簿功能

Week 10-11:
- [ ] 交易状态追踪
- [ ] 账户管理优化

Week 12-13:
- [ ] WalletConnect集成
- [ ] 测试与优化
```

### 🚀 第四阶段: 高级功能 (长期)
**目标**: 差异化竞争优势

```
根据用户反馈和市场需求逐步实现:
- 硬件钱包支持
- NFT资产展示
- 多链支持
- DeFi协议集成
- 其他高级功能
```

---

## 🏗️ 技术架构评价

### ✅ 优点
1. **清晰的架构分层**
   - Controller层: 业务逻辑处理
   - Service层: 加密、钱包服务
   - Store层: 状态管理
   - Component层: UI展示

2. **事件驱动设计**
   - 使用mitt事件总线
   - Controller之间解耦
   - 易于扩展和维护

3. **安全性考虑**
   - PBKDF2加密（10万次迭代）
   - AES-256-CBC加密算法
   - 敏感数据不直接存储

4. **代码质量**
   - TypeScript类型安全
   - 接口定义清晰
   - 注释完整

### 🔧 改进建议
1. **测试覆盖**: 建议添加单元测试和集成测试
2. **错误处理**: 统一的错误处理机制
3. **日志系统**: 添加详细的操作日志（不记录敏感信息）
4. **性能优化**: 大量账户时的性能优化
5. **安全审计**: 建议进行专业的安全审计

---

## 📊 项目统计

- **总功能数**: 51项
- **已完成**: 11项 (21.6%)
- **P0核心**: 8项 (待实现)
- **P1重要**: 7项 (待实现)
- **P2增强**: 7项 (待实现)
- **P3高级**: 10项 (待实现)

**预计开发时间**: 3-6个月（根据团队规模）

---

## 🔗 相关链接

- **BIP39**: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **BIP44**: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- **EIP-191**: https://eips.ethereum.org/EIPS/eip-191
- **EIP-1559**: https://eips.ethereum.org/EIPS/eip-1559
- **ethers.js**: https://docs.ethers.org/v6/
- **MetaMask架构**: https://github.com/MetaMask/core

---

**最后更新**: 2025-10-02
**文档维护**: 请在完成功能后及时更新此文档
