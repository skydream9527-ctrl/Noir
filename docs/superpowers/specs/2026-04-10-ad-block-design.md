# 广告拦截功能设计规格书

**项目**：极简浏览器 Android 应用  
**功能**：广告拦截  
**版本**：v1.0  
**日期**：2026-04-10  
**状态**：已批准

---

## 1. 功能概述

为浏览器添加广告拦截功能，通过 DNS 域名拦截和网页内容过滤双重机制，有效屏蔽常见网页广告，提升浏览体验。

---

## 2. 设计方案

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    UI 层                             │
│  AdBlockSettingsFragment (设置页面)                 │
│  集成在 BrowserActivity 抽屉中                      │
├─────────────────────────────────────────────────────┤
│                    业务层                             │
│  AdBlockManager (拦截管理)                           │
│  DnsBlocker (DNS 域名拦截)                           │
│  ContentBlocker (页面元素隐藏)                       │
│  AdBlockRulesManager (规则管理 + 更新)               │
├─────────────────────────────────────────────────────┤
│                    数据层                             │
│  SharedPreferences (规则缓存 + 网站设置)             │
│  本地 Easylist 规则文件                              │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 类名 | 职责 |
|------|------|
| `AdBlockManager` | 统一入口，协调 DNS 和内容拦截 |
| `DnsBlocker` | DNS 域名匹配拦截 |
| `ContentBlocker` | WebView 注入 JS 隐藏广告元素 |
| `AdBlockRulesManager` | 规则下载、解析、缓存 |
| `AdBlockSettings` | 网站级拦截设置存储 |

### 2.3 数据流

```
用户打开网页 → AdBlockManager 拦截请求
    ↓
DNS 拦截层检查域名 → 匹配规则？→ 阻止并返回空白
    ↓
页面加载 → ContentBlocker 注入 JS → 隐藏匹配的广告元素
    ↓
每个网站独立记录拦截设置
```

---

## 3. UI 设计

### 3.1 入口位置

- 浏览器右上角菜单 → 广告拦截设置

### 3.2 设置页面布局

```
┌─────────────────────────────┐
│  ☰ 广告拦截设置             │
├─────────────────────────────┤
│  [  ] 启用广告拦截          │  ← 全局开关
├─────────────────────────────┤
│  自动更新规则      [ > ]    │
│  上次更新：2026-04-10       │
├─────────────────────────────┤
│  规则统计                   │
│  - DNS 规则：50,000+       │
│  - 内容规则：30,000+       │
├─────────────────────────────┤
│  信任网站                   │
│  (不拦截以下网站)           │
│  + 添加网站                 │
│  - example.com        [×]  │
└─────────────────────────────┘
```

### 3.3 信任网站管理

- 用户可添加不拦截广告的信任网站
- 每个网站独立记录设置
- 支持删除信任网站

---

## 4. 拦截机制

### 4.1 DNS 域名拦截

- 拦截已知广告域名（如 `doubleclick.net`, `googlesyndication.com`）
- 基于域名规则匹配
- 在网络请求层面阻止

### 4.2 内容过滤（JS 注入）

- 网页加载时注入 JavaScript
- 隐藏匹配的广告元素（如 `.ad-container`, `#banner-ad`）
- CSS 选择器规则匹配

### 4.3 规则来源

- **Easylist China**: 针对中国网站的广告规则
- **Easylist**: 国际通用规则
- 规则存储在 `assets/adblock/rules/` 目录

---

## 5. 数据结构

### 5.1 AdBlockSettings

```kotlin
data class AdBlockSettings(
    val enabled: Boolean = true,           // 全局开关
    val trustedSites: Set<String> = emptySet(),  // 信任网站
    val lastUpdateTime: Long = 0           // 上次更新时间
)
```

### 5.2 SiteSettings（网站级设置）

```kotlin
data class SiteSettings(
    val site: String,                      // 网站域名
    val adBlockEnabled: Boolean = true     // 该网站是否拦截
)
```

### 5.3 AdBlockManager 接口

```kotlin
class AdBlockManager(private val context: Context) {
    fun isAdBlockEnabled(): Boolean
    fun setAdBlockEnabled(enabled: Boolean)
    fun isSiteBlocked(site: String): Boolean  // 检查网站是否拦截
    fun setSiteBlocked(site: String, blocked: Boolean)
    fun shouldBlockRequest(url: String): Boolean  // DNS 拦截判断
    fun getContentBlockerScript(): String  // 获取 JS 注入脚本
    fun getRulesCount(): Pair<Int, Int>    // 返回 (dnsRules, contentRules) 数量
}
```

### 5.4 规则文件格式

**DNS 规则** (`dns_rules.txt`):
```
||doubleclick.net^
||googlesyndication.com^
||googleadservices.com^
```

**内容规则** (`content_rules.txt`):
```
##.ad-container
##.advertisement
###banner-ad
##[class*="ad-"]
```

---

## 6. 交互流程

### 6.1 全局开关控制

1. 用户在设置页面切换全局开关
2. 设置立即保存到 SharedPreferences
3. 所有后续请求根据新设置决定是否拦截

### 6.2 网站级控制

1. 用户长按网页内容或进入设置添加信任网站
2. 网站域名保存到信任列表
3. 该网站的广告不再被拦截

### 6.3 规则更新

1. 用户点击"自动更新规则"
2. 从远程获取最新 Easylist 规则
3. 解析并保存到本地文件
4. 更新 `lastUpdateTime`

---

## 7. 技术约束

- **最低API**：24 (Android 7.0)
- **目标SDK**：34 (Android 14)
- **规则来源**：Easylist China + Easylist
- **存储**：SharedPreferences + Assets 文件

---

## 8. 实现优先级

### 第一阶段：核心功能
1. 创建广告拦截相关类
2. 内置基础规则文件
3. DNS 拦截功能
4. 内容过滤 JS 注入

### 第二阶段：完善功能
5. 设置页面 UI
6. 信任网站管理
7. 规则统计显示

### 第三阶段：优化
8. 规则更新功能
9. 性能优化
10. 规则文件压缩

---

## 9. 设计决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-10 | DNS + 内容双重拦截 | 覆盖范围最全面 |
| 2026-04-10 | 内置 Easylist 规则 | 开箱即用，用户无需配置 |
| 2026-04-10 | 网站级独立开关 | 平衡便利性与灵活性 |
| 2026-04-10 | 集成在抽屉设置中 | 与现有 UI 风格统一 |
