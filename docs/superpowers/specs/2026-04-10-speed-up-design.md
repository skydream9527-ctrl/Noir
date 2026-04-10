# 加速压缩功能设计规格书

**项目**：极简浏览器 Android 应用  
**功能**：加速压缩（数据压缩 + 网页加速）  
**版本**：v1.0  
**日期**：2026-04-10  
**状态**：已批准

---

## 1. 功能概述

为浏览器添加加速压缩功能，通过数据压缩和网页加速双重机制，提升页面加载速度并减少流量消耗。

---

## 2. 设计方案

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    UI 层                             │
│  SpeedUpSettingsFragment (设置页面)                  │
├─────────────────────────────────────────────────────┤
│                    业务层                             │
│  SpeedUpManager (加速管理)                           │
│  DataCompressor (数据压缩)                           │
│  WebAccelerator (网页加速 - DNS/预加载)              │
├─────────────────────────────────────────────────────┤
│                    数据层                             │
│  SharedPreferences (设置存储)                        │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 类名 | 职责 |
|------|------|
| `SpeedUpManager` | 统一入口，协调加速和压缩 |
| `DataCompressor` | 资源压缩（图片、JS、CSS） |
| `WebAccelerator` | DNS 预解析 + 预加载 |
| `SpeedUpSettings` | 设置数据类 |

### 2.3 数据流

```
用户开启加速模式 → SpeedUpManager 协调
    ↓
DataCompressor 压缩请求资源 → 返回压缩后数据
    ↓
WebAccelerator 预解析 DNS + 预加载关键资源
    ↓
页面加载加速完成
```

---

## 3. 功能详细

### 3.1 数据压缩 (DataCompressor)

**压缩策略：**
- 图片压缩：根据网络类型自动调整质量（WiFi: 80%, 移动: 60%）
- JS/CSS 精简：去除注释和空白
- 资源合并：合并多个小文件

**实现方式：**
- 使用 OkHttp 拦截器处理响应
- 本地缓存压缩后的资源

### 3.2 网页加速 (WebAccelerator)

**DNS 预解析：**
- 页面加载前预解析外部链接域名
- 减少 DNS 查询时间

**预加载：**
- 识别关键资源并预加载
- 预测用户可能点击的链接

**连接复用：**
- 复用 HTTP 连接
- 减少 TCP握手开销

---

## 4. UI 设计

### 4.1 设置页面

```
┌─────────────────────────────┐
│  ☰ 加速设置                  │
├─────────────────────────────┤
│  [  ] 启用加速模式           │  ← 全局开关
├─────────────────────────────┤
│  数据压缩                    │
│  [  ] 图片压缩              │
│  [  ] JS/CSS 精简           │
├─────────────────────────────┤
│  网页加速                    │
│  [  ] DNS 预解析            │
│  [  ] 资源预加载            │
│  [  ] 连接复用              │
├─────────────────────────────┤
│  流量节省                    │
│  预计节省：30%              │
└─────────────────────────────┘
```

### 4.2 入口

- 设置页面入口
- 可选：抽屉菜单快速开关

---

## 5. 技术实现

### 5.1 SpeedUpManager

```kotlin
class SpeedUpManager(context: Context) {
    
    fun isEnabled(): Boolean
    fun setEnabled(enabled: Boolean)
    
    fun isDataCompressionEnabled(): Boolean
    fun isWebAccelerationEnabled(): Boolean
    
    fun getCompressionInterceptor(): Interceptor  // OkHttp 拦截器
    fun getDnsPrefetchScript(): String  // DNS 预解析 JS
}
```

### 5.2 DataCompressor

```kotlin
class DataCompressor {
    
    fun shouldCompress(url: String): Boolean
    fun compressResponse(response: Response): Response
    fun getCompressionLevel(): Int  // 0-100
}
```

### 5.3 WebAccelerator

```kotlin
class WebAccelerator {
    
    fun getDnsPrefetchScript(domains: List<String>): String
    fun getPreloadScript(urls: List<String>): String
    fun shouldPreload(url: String): Boolean
}
```

---

## 6. 技术约束

- **最低API**：24 (Android 7.0)
- **目标SDK**：34 (Android 14)
- **网络库**：OkHttp（用于拦截器）
- **WebView**：腾讯 X5 WebView

---

## 7. 实现优先级

### 第一阶段：核心功能
1. SpeedUpManager 主管理类
2. WebAccelerator 网页加速
3. DataCompressor 数据压缩

### 第二阶段：UI
4. SpeedUpSettingsFragment 设置页面
5. 集成到 BrowserActivity

---

## 8. 设计决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-10 | 使用 OkHttp 拦截器 | 透明的压缩处理，不影响现有代码 |
| 2026-04-10 | JS 实现 DNS 预解析 | X5 WebView 支持 JS 注入 |
| 2026-04-10 | 自适应图片压缩 | 根据网络类型自动调整 |
