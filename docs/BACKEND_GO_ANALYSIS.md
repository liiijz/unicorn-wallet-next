# Unicorn Wallet 后端方案 - Go (Gin + GORM) 技术分析

> 📅 更新时间: 2025-10-02
> 🔧 技术栈: Go + Gin + GORM + Redis + PostgreSQL

---

## 🎯 为什么选择 Go？

### ✅ Go 的优势

1. **高性能**
   - 编译型语言，性能接近C/C++
   - 适合高并发场景（区块链RPC代理需要处理大量请求）
   - 内存占用小，成本低

2. **并发模型优秀**
   - Goroutine轻量级协程
   - Channel天然支持并发通信
   - 适合RPC请求转发、区块数据同步等场景

3. **区块链生态丰富**
   - `go-ethereum` (Geth) 官方客户端
   - `ether-go` 以太坊开发库
   - 大量区块链项目使用Go开发

4. **部署简单**
   - 单一可执行文件
   - 跨平台编译
   - Docker友好

5. **类型安全**
   - 静态类型，编译时发现错误
   - 接口设计优雅

### ⚠️ Go 的劣势

1. **开发速度略慢于Node.js**
   - 需要编译
   - 语法相对繁琐（错误处理）

2. **生态不如Node.js丰富**
   - 某些第三方API库需要自己封装

3. **学习曲线**
   - 如果团队不熟悉Go，有学习成本

---

## 📊 Go vs Node.js 对比分析

| 维度 | Go (Gin + GORM) | Node.js (Express) | 推荐 |
|------|-----------------|-------------------|------|
| **性能** | ⭐⭐⭐⭐⭐ 编译型，高性能 | ⭐⭐⭐ 单线程，I/O密集型优秀 | **Go** |
| **并发处理** | ⭐⭐⭐⭐⭐ Goroutine天生优势 | ⭐⭐⭐ Event Loop，需要cluster | **Go** |
| **开发效率** | ⭐⭐⭐⭐ 需要编译 | ⭐⭐⭐⭐⭐ 开发快速 | **Node.js** |
| **区块链生态** | ⭐⭐⭐⭐⭐ go-ethereum官方支持 | ⭐⭐⭐⭐ ethers.js, web3.js | **Go** |
| **内存占用** | ⭐⭐⭐⭐ 低内存 | ⭐⭐⭐ 相对较高 | **Go** |
| **部署难度** | ⭐⭐⭐⭐⭐ 单一二进制文件 | ⭐⭐⭐⭐ 需要Node环境 | **Go** |
| **学习曲线** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 容易（JS开发者） | **Node.js** |
| **生态丰富度** | ⭐⭐⭐⭐ 丰富 | ⭐⭐⭐⭐⭐ 非常丰富 | **Node.js** |

**总结**:
- **性能要求高、并发量大** → 选择 **Go**
- **快速开发、团队熟悉JS** → 选择 **Node.js**
- **区块链钱包后端** → **Go 更适合**（性能+区块链生态）

---

## 🏗️ Go 后端架构设计

### 项目结构

```
unicorn-wallet-backend/
├── cmd/
│   └── server/
│       └── main.go                 # 入口文件
├── internal/
│   ├── handler/                    # HTTP处理器 (Controller层)
│   │   ├── rpc_handler.go
│   │   ├── price_handler.go
│   │   ├── transaction_handler.go
│   │   └── token_handler.go
│   ├── service/                    # 业务逻辑层
│   │   ├── rpc_service.go
│   │   ├── price_service.go
│   │   ├── blockchain_service.go
│   │   └── cache_service.go
│   ├── repository/                 # 数据访问层 (GORM)
│   │   ├── transaction_repo.go
│   │   ├── token_repo.go
│   │   └── user_repo.go
│   ├── model/                      # 数据模型
│   │   ├── transaction.go
│   │   ├── token.go
│   │   └── user.go
│   ├── middleware/                 # 中间件
│   │   ├── cors.go
│   │   ├── rate_limit.go
│   │   └── logger.go
│   └── config/                     # 配置
│       └── config.go
├── pkg/                            # 公共包
│   ├── ethereum/                   # 以太坊客户端封装
│   │   └── client.go
│   ├── cache/                      # Redis缓存
│   │   └── redis.go
│   └── utils/
│       └── helpers.go
├── api/                            # API文档
│   └── swagger.yaml
├── migrations/                     # 数据库迁移
│   └── 001_init.sql
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── go.mod
├── go.sum
├── .env.example
└── README.md
```

---

## 🔧 核心功能实现方案

### 1️⃣ RPC代理服务 🔴 核心

#### 技术选型
```go
// 使用 go-ethereum 官方库
import (
    "github.com/ethereum/go-ethereum/ethclient"
    "github.com/ethereum/go-ethereum/rpc"
)
```

#### 实现代码

**pkg/ethereum/client.go** - 以太坊客户端封装
```go
package ethereum

import (
    "context"
    "github.com/ethereum/go-ethereum/ethclient"
    "github.com/ethereum/go-ethereum/rpc"
)

type Client struct {
    rpcClient *rpc.Client
    ethClient *ethclient.Client
}

func NewClient(endpoint string) (*Client, error) {
    rpcClient, err := rpc.Dial(endpoint)
    if err != nil {
        return nil, err
    }

    ethClient := ethclient.NewClient(rpcClient)

    return &Client{
        rpcClient: rpcClient,
        ethClient: ethClient,
    }, nil
}

// 通用RPC调用
func (c *Client) Call(ctx context.Context, result interface{}, method string, args ...interface{}) error {
    return c.rpcClient.CallContext(ctx, result, method, args...)
}

// 批量RPC调用 (性能优化)
func (c *Client) BatchCall(ctx context.Context, batch []rpc.BatchElem) error {
    return c.rpcClient.BatchCallContext(ctx, batch)
}
```

**internal/service/rpc_service.go** - RPC业务逻辑
```go
package service

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "unicorn-wallet-backend/pkg/ethereum"
    "unicorn-wallet-backend/pkg/cache"
)

type RPCService struct {
    ethClient *ethereum.Client
    cache     *cache.RedisCache
}

func NewRPCService(ethClient *ethereum.Client, cache *cache.RedisCache) *RPCService {
    return &RPCService{
        ethClient: ethClient,
        cache:     cache,
    }
}

// RPC请求结构
type RPCRequest struct {
    Method  string        `json:"method" binding:"required"`
    Params  []interface{} `json:"params"`
    ID      int           `json:"id"`
    JSONRpc string        `json:"jsonrpc"`
}

type RPCResponse struct {
    Result  interface{} `json:"result,omitempty"`
    Error   *RPCError   `json:"error,omitempty"`
    ID      int         `json:"id"`
    JSONRpc string      `json:"jsonrpc"`
}

type RPCError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

// 处理RPC请求
func (s *RPCService) HandleRPCRequest(ctx context.Context, req *RPCRequest) (*RPCResponse, error) {
    // 对于查询类请求，先查缓存
    if s.isCacheableMethod(req.Method) {
        cacheKey := s.getCacheKey(req)
        if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
            var result interface{}
            if err := json.Unmarshal([]byte(cached), &result); err == nil {
                return &RPCResponse{
                    Result:  result,
                    ID:      req.ID,
                    JSONRpc: "2.0",
                }, nil
            }
        }
    }

    // 调用以太坊节点
    var result interface{}
    err := s.ethClient.Call(ctx, &result, req.Method, req.Params...)
    if err != nil {
        return &RPCResponse{
            Error: &RPCError{
                Code:    -32000,
                Message: err.Error(),
            },
            ID:      req.ID,
            JSONRpc: "2.0",
        }, nil
    }

    // 缓存结果
    if s.isCacheableMethod(req.Method) {
        cacheKey := s.getCacheKey(req)
        resultJSON, _ := json.Marshal(result)
        s.cache.Set(ctx, cacheKey, string(resultJSON), s.getCacheDuration(req.Method))
    }

    return &RPCResponse{
        Result:  result,
        ID:      req.ID,
        JSONRpc: "2.0",
    }, nil
}

// 判断是否可缓存
func (s *RPCService) isCacheableMethod(method string) bool {
    cacheableMethods := map[string]bool{
        "eth_getBalance":           true,
        "eth_getTransactionCount":  true,
        "eth_getCode":              true,
        "eth_call":                 true,
        "eth_chainId":              true,
    }
    return cacheableMethods[method]
}

func (s *RPCService) getCacheKey(req *RPCRequest) string {
    params, _ := json.Marshal(req.Params)
    return fmt.Sprintf("rpc:%s:%s", req.Method, string(params))
}

func (s *RPCService) getCacheDuration(method string) time.Duration {
    switch method {
    case "eth_chainId":
        return 24 * time.Hour // chainId不会变
    case "eth_getBalance":
        return 10 * time.Second // 余额变化频繁
    default:
        return 30 * time.Second
    }
}
```

**internal/handler/rpc_handler.go** - HTTP处理器
```go
package handler

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "unicorn-wallet-backend/internal/service"
)

type RPCHandler struct {
    rpcService *service.RPCService
}

func NewRPCHandler(rpcService *service.RPCService) *RPCHandler {
    return &RPCHandler{rpcService: rpcService}
}

// POST /api/rpc
func (h *RPCHandler) HandleRPC(c *gin.Context) {
    var req service.RPCRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 安全检查：禁止某些危险方法
    if h.isDangerousMethod(req.Method) {
        c.JSON(http.StatusForbidden, gin.H{"error": "method not allowed"})
        return
    }

    resp, err := h.rpcService.HandleRPCRequest(c.Request.Context(), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, resp)
}

func (h *RPCHandler) isDangerousMethod(method string) bool {
    dangerousMethods := []string{
        "eth_sendTransaction", // 只允许sendRawTransaction
        "eth_sign",
        "eth_signTransaction",
        "personal_unlockAccount",
    }
    for _, m := range dangerousMethods {
        if m == method {
            return true
        }
    }
    return false
}
```

#### 性能优化

**批量请求支持** - 减少HTTP往返
```go
// POST /api/rpc/batch
func (h *RPCHandler) HandleBatchRPC(c *gin.Context) {
    var reqs []service.RPCRequest
    if err := c.ShouldBindJSON(&reqs); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 使用Goroutine并发处理
    results := make([]*service.RPCResponse, len(reqs))
    errChan := make(chan error, len(reqs))

    for i, req := range reqs {
        go func(index int, request service.RPCRequest) {
            resp, err := h.rpcService.HandleRPCRequest(c.Request.Context(), &request)
            if err != nil {
                errChan <- err
                return
            }
            results[index] = resp
            errChan <- nil
        }(i, req)
    }

    // 等待所有请求完成
    for i := 0; i < len(reqs); i++ {
        if err := <-errChan; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    c.JSON(http.StatusOK, results)
}
```

---

### 2️⃣ 价格服务 🟡 重要

#### 实现代码

**internal/model/price.go** - 价格模型
```go
package model

import "time"

type TokenPrice struct {
    Symbol     string    `json:"symbol" gorm:"primaryKey"`
    USD        float64   `json:"usd"`
    CNY        float64   `json:"cny"`
    EUR        float64   `json:"eur"`
    Change24h  float64   `json:"change_24h"`
    Volume24h  float64   `json:"volume_24h"`
    MarketCap  float64   `json:"market_cap"`
    UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
```

**internal/service/price_service.go** - 价格服务
```go
package service

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
    "time"

    "gorm.io/gorm"
    "unicorn-wallet-backend/internal/model"
    "unicorn-wallet-backend/pkg/cache"
)

type PriceService struct {
    db       *gorm.DB
    cache    *cache.RedisCache
    httpClient *http.Client
}

func NewPriceService(db *gorm.DB, cache *cache.RedisCache) *PriceService {
    return &PriceService{
        db:    db,
        cache: cache,
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

// CoinGecko API响应结构
type CoinGeckoResponse map[string]struct {
    USD       float64 `json:"usd"`
    CNY       float64 `json:"cny"`
    EUR       float64 `json:"eur"`
    USDChange float64 `json:"usd_24h_change"`
    USDVolume float64 `json:"usd_24h_vol"`
    MarketCap float64 `json:"usd_market_cap"`
}

// 获取价格（带缓存）
func (s *PriceService) GetPrices(ctx context.Context, symbols []string) ([]model.TokenPrice, error) {
    // 1. 先查Redis缓存
    cacheKey := "prices:" + strings.Join(symbols, ",")
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        var prices []model.TokenPrice
        if err := json.Unmarshal([]byte(cached), &prices); err == nil {
            return prices, nil
        }
    }

    // 2. 查数据库
    var prices []model.TokenPrice
    err := s.db.Where("symbol IN ?", symbols).Find(&prices).Error
    if err != nil {
        return nil, err
    }

    // 3. 检查是否需要更新（超过1分钟）
    needUpdate := false
    for _, price := range prices {
        if time.Since(price.UpdatedAt) > time.Minute {
            needUpdate = true
            break
        }
    }

    if needUpdate || len(prices) == 0 {
        // 从CoinGecko获取最新价格
        prices, err = s.fetchFromCoinGecko(ctx, symbols)
        if err != nil {
            return nil, err
        }

        // 更新数据库
        for _, price := range prices {
            s.db.Save(&price)
        }
    }

    // 4. 更新缓存（1分钟过期）
    pricesJSON, _ := json.Marshal(prices)
    s.cache.Set(ctx, cacheKey, string(pricesJSON), time.Minute)

    return prices, nil
}

// 从CoinGecko获取价格
func (s *PriceService) fetchFromCoinGecko(ctx context.Context, symbols []string) ([]model.TokenPrice, error) {
    // CoinGecko ID映射
    idMap := map[string]string{
        "ETH":  "ethereum",
        "BTC":  "bitcoin",
        "USDT": "tether",
        "USDC": "usd-coin",
        "BNB":  "binancecoin",
    }

    ids := make([]string, 0, len(symbols))
    for _, symbol := range symbols {
        if id, ok := idMap[symbol]; ok {
            ids = append(ids, id)
        }
    }

    url := fmt.Sprintf(
        "https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=usd,cny,eur&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true",
        strings.Join(ids, ","),
    )

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := s.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var cgResp CoinGeckoResponse
    if err := json.Unmarshal(body, &cgResp); err != nil {
        return nil, err
    }

    // 转换为内部模型
    prices := make([]model.TokenPrice, 0, len(symbols))
    reverseMap := make(map[string]string)
    for symbol, id := range idMap {
        reverseMap[id] = symbol
    }

    for id, data := range cgResp {
        if symbol, ok := reverseMap[id]; ok {
            prices = append(prices, model.TokenPrice{
                Symbol:    symbol,
                USD:       data.USD,
                CNY:       data.CNY,
                EUR:       data.EUR,
                Change24h: data.USDChange,
                Volume24h: data.USDVolume,
                MarketCap: data.MarketCap,
                UpdatedAt: time.Now(),
            })
        }
    }

    return prices, nil
}

// 定时任务：每分钟更新价格
func (s *PriceService) StartPriceUpdateJob(ctx context.Context) {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()

    symbols := []string{"ETH", "BTC", "USDT", "USDC", "BNB"}

    for {
        select {
        case <-ticker.C:
            _, err := s.fetchFromCoinGecko(ctx, symbols)
            if err != nil {
                fmt.Printf("Failed to update prices: %v\n", err)
            }
        case <-ctx.Done():
            return
        }
    }
}
```

**internal/handler/price_handler.go**
```go
package handler

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "unicorn-wallet-backend/internal/service"
)

type PriceHandler struct {
    priceService *service.PriceService
}

func NewPriceHandler(priceService *service.PriceService) *PriceHandler {
    return &PriceHandler{priceService: priceService}
}

// GET /api/prices?symbols=ETH,BTC,USDT
func (h *PriceHandler) GetPrices(c *gin.Context) {
    symbolsStr := c.Query("symbols")
    if symbolsStr == "" {
        symbolsStr = "ETH,BTC,USDT" // 默认值
    }

    symbols := strings.Split(symbolsStr, ",")

    prices, err := h.priceService.GetPrices(c.Request.Context(), symbols)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"prices": prices})
}
```

---

### 3️⃣ 交易历史服务 🟡 重要

#### 数据模型

**internal/model/transaction.go**
```go
package model

import (
    "time"
    "gorm.io/gorm"
)

type Transaction struct {
    ID              uint           `gorm:"primaryKey"`
    Hash            string         `gorm:"uniqueIndex;size:66"`
    From            string         `gorm:"index;size:42"`
    To              string         `gorm:"index;size:42"`
    Value           string         `gorm:"type:varchar(78)"` // 大数字用字符串
    Gas             uint64
    GasPrice        string         `gorm:"type:varchar(78)"`
    GasUsed         uint64
    Nonce           uint64
    BlockNumber     uint64         `gorm:"index"`
    BlockHash       string         `gorm:"size:66"`
    TransactionIndex uint
    Input           string         `gorm:"type:text"`
    Status          uint           // 1=success, 0=failed
    Timestamp       time.Time      `gorm:"index"`
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       gorm.DeletedAt `gorm:"index"`
}
```

#### 服务实现

**internal/service/transaction_service.go**
```go
package service

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "encoding/json"

    "gorm.io/gorm"
    "unicorn-wallet-backend/internal/model"
    "unicorn-wallet-backend/internal/repository"
)

type TransactionService struct {
    repo          *repository.TransactionRepository
    etherscanKey  string
    httpClient    *http.Client
}

func NewTransactionService(db *gorm.DB, etherscanKey string) *TransactionService {
    return &TransactionService{
        repo:         repository.NewTransactionRepository(db),
        etherscanKey: etherscanKey,
        httpClient:   &http.Client{},
    }
}

// Etherscan API响应
type EtherscanResponse struct {
    Status  string `json:"status"`
    Message string `json:"message"`
    Result  []struct {
        Hash             string `json:"hash"`
        From             string `json:"from"`
        To               string `json:"to"`
        Value            string `json:"value"`
        Gas              string `json:"gas"`
        GasPrice         string `json:"gasPrice"`
        GasUsed          string `json:"gasUsed"`
        Nonce            string `json:"nonce"`
        BlockNumber      string `json:"blockNumber"`
        BlockHash        string `json:"blockHash"`
        TransactionIndex string `json:"transactionIndex"`
        Input            string `json:"input"`
        IsError          string `json:"isError"`
        TimeStamp        string `json:"timeStamp"`
    } `json:"result"`
}

// 获取地址的交易历史
func (s *TransactionService) GetTransactionsByAddress(ctx context.Context, address string, page, pageSize int) ([]model.Transaction, int64, error) {
    // 1. 先从数据库查询
    txs, total, err := s.repo.FindByAddress(address, page, pageSize)
    if err != nil {
        return nil, 0, err
    }

    // 2. 如果数据库为空或数据较旧，从Etherscan同步
    if len(txs) == 0 {
        txs, err = s.syncFromEtherscan(ctx, address)
        if err != nil {
            return nil, 0, err
        }
        total = int64(len(txs))
    }

    return txs, total, nil
}

// 从Etherscan同步交易
func (s *TransactionService) syncFromEtherscan(ctx context.Context, address string) ([]model.Transaction, error) {
    url := fmt.Sprintf(
        "https://api.etherscan.io/api?module=account&action=txlist&address=%s&startblock=0&endblock=99999999&sort=desc&apikey=%s",
        address, s.etherscanKey,
    )

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := s.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var etherscanResp EtherscanResponse
    if err := json.Unmarshal(body, &etherscanResp); err != nil {
        return nil, err
    }

    // 转换并保存到数据库
    txs := make([]model.Transaction, 0, len(etherscanResp.Result))
    for _, item := range etherscanResp.Result {
        tx := s.convertEtherscanTx(item)
        if err := s.repo.Create(&tx); err != nil {
            fmt.Printf("Failed to save tx %s: %v\n", tx.Hash, err)
        }
        txs = append(txs, tx)
    }

    return txs, nil
}

// 转换Etherscan交易格式
func (s *TransactionService) convertEtherscanTx(item struct {
    Hash             string `json:"hash"`
    From             string `json:"from"`
    To               string `json:"to"`
    Value            string `json:"value"`
    Gas              string `json:"gas"`
    GasPrice         string `json:"gasPrice"`
    GasUsed          string `json:"gasUsed"`
    Nonce            string `json:"nonce"`
    BlockNumber      string `json:"blockNumber"`
    BlockHash        string `json:"blockHash"`
    TransactionIndex string `json:"transactionIndex"`
    Input            string `json:"input"`
    IsError          string `json:"isError"`
    TimeStamp        string `json:"timeStamp"`
}) model.Transaction {
    // 省略类型转换代码...
    return model.Transaction{}
}
```

**internal/repository/transaction_repo.go** - GORM数据访问层
```go
package repository

import (
    "gorm.io/gorm"
    "unicorn-wallet-backend/internal/model"
)

type TransactionRepository struct {
    db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
    return &TransactionRepository{db: db}
}

func (r *TransactionRepository) FindByAddress(address string, page, pageSize int) ([]model.Transaction, int64, error) {
    var txs []model.Transaction
    var total int64

    query := r.db.Where("\"from\" = ? OR \"to\" = ?", address, address)

    // 统计总数
    query.Model(&model.Transaction{}).Count(&total)

    // 分页查询
    offset := (page - 1) * pageSize
    err := query.Order("timestamp DESC").Offset(offset).Limit(pageSize).Find(&txs).Error

    return txs, total, err
}

func (r *TransactionRepository) Create(tx *model.Transaction) error {
    return r.db.Create(tx).Error
}
```

---

### 4️⃣ Gas费估算服务 🟢 可选

**internal/service/gas_service.go**
```go
package service

import (
    "context"
    "math/big"

    "unicorn-wallet-backend/pkg/ethereum"
)

type GasService struct {
    ethClient *ethereum.Client
}

func NewGasService(ethClient *ethereum.Client) *GasService {
    return &GasService{ethClient: ethClient}
}

type GasEstimate struct {
    Slow     GasPrice `json:"slow"`
    Standard GasPrice `json:"standard"`
    Fast     GasPrice `json:"fast"`
}

type GasPrice struct {
    MaxFeePerGas         string `json:"maxFeePerGas"`         // EIP-1559
    MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"` // EIP-1559
    GasPrice             string `json:"gasPrice"`             // Legacy
    EstimatedTime        string `json:"estimatedTime"`
}

func (s *GasService) EstimateGas(ctx context.Context) (*GasEstimate, error) {
    // 1. 获取当前baseFee
    var baseFee string
    err := s.ethClient.Call(ctx, &baseFee, "eth_gasPrice")
    if err != nil {
        return nil, err
    }

    baseFeeInt := new(big.Int)
    baseFeeInt.SetString(baseFee[2:], 16) // 去掉0x前缀

    // 2. 计算三档Gas费
    // Slow: baseFee * 0.8
    // Standard: baseFee * 1.0
    // Fast: baseFee * 1.5

    slow := new(big.Int).Mul(baseFeeInt, big.NewInt(8))
    slow.Div(slow, big.NewInt(10))

    standard := baseFeeInt

    fast := new(big.Int).Mul(baseFeeInt, big.NewInt(15))
    fast.Div(fast, big.NewInt(10))

    return &GasEstimate{
        Slow: GasPrice{
            GasPrice:      "0x" + slow.Text(16),
            EstimatedTime: "~5 minutes",
        },
        Standard: GasPrice{
            GasPrice:      "0x" + standard.Text(16),
            EstimatedTime: "~2 minutes",
        },
        Fast: GasPrice{
            GasPrice:      "0x" + fast.Text(16),
            EstimatedTime: "~30 seconds",
        },
    }, nil
}
```

---

### 5️⃣ 代币信息服务 🟢 可选

**internal/model/token.go**
```go
package model

import "gorm.io/gorm"

type Token struct {
    gorm.Model
    Symbol   string `gorm:"index;size:10"`
    Name     string `gorm:"size:100"`
    Address  string `gorm:"uniqueIndex;size:42"`
    Decimals uint8
    LogoURL  string `gorm:"size:255"`
    ChainID  uint
}
```

**internal/service/token_service.go**
```go
package service

import (
    "context"
    "gorm.io/gorm"
    "unicorn-wallet-backend/internal/model"
    "unicorn-wallet-backend/pkg/ethereum"
)

type TokenService struct {
    db        *gorm.DB
    ethClient *ethereum.Client
}

func NewTokenService(db *gorm.DB, ethClient *ethereum.Client) *TokenService {
    return &TokenService{db: db, ethClient: ethClient}
}

// 搜索代币
func (s *TokenService) SearchTokens(query string) ([]model.Token, error) {
    var tokens []model.Token
    err := s.db.Where("symbol LIKE ? OR name LIKE ?", "%"+query+"%", "%"+query+"%").
        Limit(20).
        Find(&tokens).Error
    return tokens, err
}

// 根据合约地址获取代币信息
func (s *TokenService) GetTokenByAddress(ctx context.Context, address string) (*model.Token, error) {
    // 1. 先查数据库
    var token model.Token
    err := s.db.Where("address = ?", address).First(&token).Error
    if err == nil {
        return &token, nil
    }

    // 2. 数据库没有，从链上读取
    token, err = s.fetchTokenInfoFromChain(ctx, address)
    if err != nil {
        return nil, err
    }

    // 3. 保存到数据库
    s.db.Create(&token)

    return &token, nil
}

// 从链上读取代币信息
func (s *TokenService) fetchTokenInfoFromChain(ctx context.Context, address string) (model.Token, error) {
    // ERC20 ABI: name(), symbol(), decimals()
    // 调用合约方法获取代币信息
    // 省略具体实现...
    return model.Token{}, nil
}
```

---

## 🔧 中间件实现

### 限流中间件

**internal/middleware/rate_limit.go**
```go
package middleware

import (
    "net/http"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

type IPRateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    r        rate.Limit
    b        int
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
    return &IPRateLimiter{
        limiters: make(map[string]*rate.Limiter),
        r:        r,
        b:        b,
    }
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
    i.mu.Lock()
    defer i.mu.Unlock()

    limiter, exists := i.limiters[ip]
    if !exists {
        limiter = rate.NewLimiter(i.r, i.b)
        i.limiters[ip] = limiter
    }

    return limiter
}

func RateLimitMiddleware() gin.HandlerFunc {
    // 每秒最多10个请求，突发20个
    limiter := NewIPRateLimiter(rate.Every(time.Second/10), 20)

    return func(c *gin.Context) {
        ip := c.ClientIP()
        limiter := limiter.GetLimiter(ip)

        if !limiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Too many requests",
            })
            c.Abort()
            return
        }

        c.Next()
    }
}
```

### CORS中间件

**internal/middleware/cors.go**
```go
package middleware

import (
    "github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    }
}
```

---

## 🚀 主程序入口

**cmd/server/main.go**
```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "unicorn-wallet-backend/internal/handler"
    "unicorn-wallet-backend/internal/middleware"
    "unicorn-wallet-backend/internal/model"
    "unicorn-wallet-backend/internal/service"
    "unicorn-wallet-backend/pkg/cache"
    "unicorn-wallet-backend/pkg/ethereum"
)

func main() {
    // 1. 初始化配置
    ethRPC := os.Getenv("ETH_RPC_URL")
    dbDSN := os.Getenv("DATABASE_URL")
    redisURL := os.Getenv("REDIS_URL")
    etherscanKey := os.Getenv("ETHERSCAN_API_KEY")

    // 2. 连接数据库
    db, err := gorm.Open(postgres.Open(dbDSN), &gorm.Config{})
    if err != nil {
        log.Fatalf("Failed to connect database: %v", err)
    }

    // 自动迁移
    db.AutoMigrate(&model.Transaction{}, &model.Token{}, &model.TokenPrice{})

    // 3. 连接Redis
    redisCache := cache.NewRedisCache(redisURL)

    // 4. 初始化以太坊客户端
    ethClient, err := ethereum.NewClient(ethRPC)
    if err != nil {
        log.Fatalf("Failed to connect to Ethereum: %v", err)
    }

    // 5. 初始化服务
    rpcService := service.NewRPCService(ethClient, redisCache)
    priceService := service.NewPriceService(db, redisCache)
    txService := service.NewTransactionService(db, etherscanKey)
    gasService := service.NewGasService(ethClient)
    tokenService := service.NewTokenService(db, ethClient)

    // 6. 初始化处理器
    rpcHandler := handler.NewRPCHandler(rpcService)
    priceHandler := handler.NewPriceHandler(priceService)
    txHandler := handler.NewTransactionHandler(txService)
    gasHandler := handler.NewGasHandler(gasService)
    tokenHandler := handler.NewTokenHandler(tokenService)

    // 7. 启动定时任务
    go priceService.StartPriceUpdateJob(context.Background())

    // 8. 设置路由
    r := gin.Default()

    // 中间件
    r.Use(middleware.CORSMiddleware())
    r.Use(middleware.RateLimitMiddleware())

    // API路由
    api := r.Group("/api")
    {
        api.POST("/rpc", rpcHandler.HandleRPC)
        api.POST("/rpc/batch", rpcHandler.HandleBatchRPC)
        api.GET("/prices", priceHandler.GetPrices)
        api.GET("/transactions/:address", txHandler.GetTransactions)
        api.GET("/gas-price", gasHandler.GetGasPrice)
        api.GET("/tokens/search", tokenHandler.SearchTokens)
        api.GET("/tokens/:address", tokenHandler.GetTokenInfo)
    }

    // 9. 启动服务器
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    fmt.Printf("Server running on port %s\n", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
```

---

## 📦 依赖管理

**go.mod**
```go
module unicorn-wallet-backend

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/ethereum/go-ethereum v1.13.5
    github.com/go-redis/redis/v8 v8.11.5
    gorm.io/gorm v1.25.5
    gorm.io/driver/postgres v1.5.4
    golang.org/x/time v0.5.0
)
```

**安装依赖**
```bash
go mod download
```

---

## 🐳 Docker部署

**Dockerfile**
```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译（静态链接）
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: unicorn_wallet
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      ETH_RPC_URL: https://mainnet.infura.io/v3/YOUR_INFURA_KEY
      DATABASE_URL: postgresql://postgres:password@postgres:5432/unicorn_wallet?sslmode=disable
      REDIS_URL: redis://redis:6379
      ETHERSCAN_API_KEY: YOUR_ETHERSCAN_KEY
      PORT: 8080
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

**启动**
```bash
docker-compose up -d
```

---

## 📊 性能对比测试

### 基准测试结果（估算）

| 指标 | Go (Gin) | Node.js (Express) | 优势 |
|------|----------|-------------------|------|
| RPC转发QPS | ~5000 | ~2000 | Go快2.5倍 |
| 内存占用 | ~50MB | ~150MB | Go省3倍内存 |
| 启动时间 | <100ms | ~2s | Go快20倍 |
| 并发处理 | 10000+ goroutines | ~100 (cluster模式) | Go更强 |
| 镜像大小 | ~20MB | ~100MB | Go小5倍 |

### 压力测试示例

```bash
# 使用wrk压测RPC接口
wrk -t12 -c400 -d30s --latency http://localhost:8080/api/rpc \
  -s rpc_test.lua
```

**预期结果 (Go)**:
```
Requests/sec:  4523.45
Latency avg:   88.32ms
Latency 99%:   256.12ms
```

**预期结果 (Node.js)**:
```
Requests/sec:  1892.34
Latency avg:   211.45ms
Latency 99%:   512.67ms
```

---

## 💰 成本估算

### 方案一: 最小化部署（Railway/Render）

```
- Go后端 (512MB RAM): $7/月
- PostgreSQL (256MB): $7/月
- Redis (100MB): 免费（Upstash）
总计: ~$14/月
```

### 方案二: 生产环境（阿里云/AWS）

```
- ECS (2核4GB): $30/月
- RDS PostgreSQL (2GB): $20/月
- Redis (1GB): $15/月
- 流量费: $10/月
总计: ~$75/月
```

### 对比Node.js成本

```
Go方案: $14-75/月
Node.js方案: $20-100/月 (需要更大内存)

节省: 20-30%
```

---

## ✅ 总结与建议

### Go (Gin + GORM) 最适合以下场景：

1. ✅ **高并发要求** - 钱包需要处理大量RPC请求
2. ✅ **性能敏感** - 区块链数据同步、批量查询
3. ✅ **成本敏感** - 创业项目，需要降低服务器成本
4. ✅ **长期维护** - 类型安全，重构容易
5. ✅ **团队有Go经验** - 发挥技术优势

### 推荐架构方案

**阶段一: MVP (1-2周开发)**
```
必需服务:
- RPC代理服务 (Gin + go-ethereum)
- 价格服务 (CoinGecko API + Redis缓存)
- CORS + 限流中间件

部署: Railway ($14/月)
```

**阶段二: 生产环境 (1个月开发)**
```
完整服务:
- RPC代理 (Gin + 连接池)
- 价格服务 (定时任务 + PostgreSQL)
- 交易历史 (Etherscan API + 数据库索引)
- Gas费估算
- 代币信息

部署: 阿里云 ($75/月)
性能: 支持1000+ QPS
```

### 技术栈推荐

```go
// 核心框架
Gin         - HTTP框架 (高性能)
GORM        - ORM (开发效率)
go-ethereum - 以太坊官方库

// 缓存&数据库
Redis       - 缓存层
PostgreSQL  - 关系型数据库

// 工具库
golang.org/x/time/rate  - 限流
github.com/spf13/viper  - 配置管理
github.com/sirupsen/logrus - 日志
```

### 最终建议

**如果满足以下条件，选择Go：**
- 团队有Go开发经验
- 追求极致性能和低成本
- 计划长期运营（类型安全利于维护）

**如果满足以下条件，选择Node.js：**
- 团队全栈都是JavaScript
- 需要快速原型开发（1周内上线）
- 前端开发者兼顾后端

**我的推荐: Go (Gin + GORM)**
理由: 钱包后端对性能要求高，Go在区块链领域生态完善，长期成本更低。
