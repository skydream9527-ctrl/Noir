# 阅读模式功能设计规格书

**项目**：极简浏览器 Android 应用  
**功能**：阅读模式  
**版本**：v1.0  
**日期**：2026-04-10  
**状态**：已批准

---

## 1. 功能概述

为浏览器添加阅读模式功能，自动检测网页文章并提供纯净的阅读体验，支持用户自定义字体、主题、行距、字间距等显示设置。

---

## 2. 设计方案

### 2.1 架构概览

```
┌─────────────────────────────────────┐
│           UI层                       │
│  ReadingModeActivity                │
│  (独立Activity，纯文章展示)           │
├─────────────────────────────────────┤
│           业务层                     │
│  ArticleParser (文章提取)            │
│  ReadingSettingsManager (设置管理)   │
├─────────────────────────────────────┤
│           数据层                     │
│  SharedPreferences (阅读设置)         │
└─────────────────────────────────────┘
```

### 2.2 数据流

```
WebView加载网页 → 检测文章内容
→ 用户点击阅读模式 → 启动ReadingModeActivity
→ ArticleParser提取正文 → 展示 + 应用用户设置
```

### 2.3 关键类职责

| 类名 | 职责 |
|------|------|
| `ArticleParser` | 解析HTML，提取标题、正文、图片 |
| `ReadingSettingsManager` | 管理字体/主题/行距/间距设置 |
| `ReadingModeActivity` | 展示文章和调节UI |
| `ReadingSettings` | 设置数据类 |

---

## 3. UI 设计

### 3.1 页面布局

**ReadingModeActivity**
```
┌─────────────────────────┐
│  ☰ 阅读模式    [× 关闭]  │  ← 顶部栏 (56dp)
├─────────────────────────┤
│                         │
│      文章标题            │  ← 标题 (20sp, bold)
│      来源网站            │  ← 来源 (12sp, gray)
│                         │
│  ─────────────────────   │  ← 分割线
│                         │
│     文章正文内容          │  ← 正文 (16sp, 可滚动)
│     支持图片展示          │
│     支持段落缩进          │
│                         │
│                         │
├─────────────────────────┤
│  A⁻    [☀️/🌙/📖/🍂]    A⁺ │  ← 底部调节栏 (48dp)
│  字体大小  主题     字体大小  │
└─────────────────────────┘
```

### 3.2 底部调节面板（展开状态）
```
├─────────────────────────┤
│  字体   [微软雅黑 ▼]     │
│  大小   [-  16  +]      │
│  行距   [-  1.8 +]      │
│  间距   [-  8   +]      │
└─────────────────────────┘
```

---

## 4. ArticleParser 提取逻辑

### 4.1 提取策略

1. 优先查找 `<article>` 标签
2. 其次查找 class/id 包含 "content", "article", "post", "entry" 的元素
3. 再查找 `<main>` 标签
4. 最后尝试正文区域最大的 `<div>`

### 4.2 提取内容

- **标题**：`<h1>` 或 `<title>`
- **正文**：`<p>` 段落，去除脚本和样式
- **图片**：从正文中提取 `<img>`，保留真实 src

### 4.3 特殊处理

- 去除广告、导航、评论等干扰内容
- 保留段落结构（<p> 换行）
- 过滤空白内容

---

## 5. 阅读设置

### 5.1 设置项

| 设置 | 类型 | 范围 | 默认值 |
|------|------|------|--------|
| 字体大小 | int | 12-24sp | 16sp |
| 行距 | float | 1.0-2.5 | 1.8 |
| 字间距 | int | 0-10dp | 2dp |
| 字体 | String | 4种 | 跟随系统 |
| 主题 | Enum | 4种 | 白色 |

### 5.2 主题颜色

| 主题 | 背景色 | 文字色 |
|------|--------|--------|
| 白色 (WHITE) | `#FFFFFF` | `#202124` |
| 浅色 (LIGHT) | `#F8F9FA` | `#202124` |
| 深色 (DARK) | `#121212` | `#E8EAED` |
| 护眼 (SEPIA) | `#F4ECD8` | `#5B4636` |

### 5.3 可选字体

- 跟随系统（默认）
- 微软雅黑
- 宋体
- serif

### 5.4 持久化

- 存储方式：SharedPreferences
- Key：`reading_settings`
- 格式：JSON 或 分项存储

---

## 6. 组件接口

### 6.1 ArticleParser

```kotlin
class ArticleParser {
    fun parse(html: String): Article?
}

data class Article(
    val title: String,
    val content: String,      // 纯HTML
    val images: List<String>, // 图片URL列表
    val sourceUrl: String
)
```

### 6.2 ReadingSettingsManager

```kotlin
class ReadingSettingsManager(context: Context) {
    fun getFontSize(): Int
    fun setFontSize(size: Int)
    fun getLineHeight(): Float
    fun setLineHeight(height: Float)
    fun getLetterSpacing(): Int
    fun setLetterSpacing(spacing: Int)
    fun getFontFamily(): String
    fun setFontFamily(family: String)
    fun getTheme(): ReadingTheme
    fun setTheme(theme: ReadingTheme)
}

enum class ReadingTheme { WHITE, LIGHT, DARK, SEPIA }
```

### 6.3 ReadingModeActivity 启动方式

```kotlin
// 从 BrowserActivity 启动
val intent = Intent(context, ReadingModeActivity::class.java)
intent.putExtra("html", htmlContent)
intent.putExtra("url", pageUrl)
startActivity(intent)
```

---

## 7. 交互流程

### 7.1 进入阅读模式

1. 用户在 BrowserActivity 点击阅读模式按钮
2. 获取当前 WebView 的 HTML 内容
3. ArticleParser 解析检测是否为文章
4. 如果是文章，启动 ReadingModeActivity
5. 如果不是文章，显示提示"当前页面不支持阅读模式"

### 7.2 调节阅读设置

1. 用户点击底部调节栏的任意按钮
2. 展开/收起详细调节面板
3. 用户调整各项设置
4. 设置实时应用到文章显示
5. 设置自动保存到 SharedPreferences

### 7.3 关闭阅读模式

1. 用户点击关闭按钮 [×]
2. 关闭 ReadingModeActivity
3. 返回 BrowserActivity

---

## 8. 技术约束

- **最低API**：24 (Android 7.0)
- **目标SDK**：34 (Android 14)
- **文章解析**：Jsoup HTML解析
- **UI框架**：View Binding + Material Design 3
- **内核**：腾讯X5 WebView（已集成）

---

## 9. 实现优先级

### 第一阶段：核心功能
1. ArticleParser 文章提取
2. ReadingSettingsManager 设置管理
3. ReadingModeActivity 基本布局

### 第二阶段：完善功能
4. 调节面板交互
5. 主题切换
6. 设置持久化

### 第三阶段：优化
7. 文章检测算法优化
8. 图片加载优化
9. 性能优化

---

## 10. 设计决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-10 | 独立 ReadingModeActivity | 文章提取彻底，不受原页面干扰，可做更多定制 |
| 2026-04-10 | 自动检测 + 手动触发 | 既能智能发现文章，又给用户主动权 |
| 2026-04-10 | 完整自定义设置 | 提供最好的阅读体验 |
| 2026-04-10 | 四种主题 | 覆盖白天/夜间/护眼等常见场景 |
