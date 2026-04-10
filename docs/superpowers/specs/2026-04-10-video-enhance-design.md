# 视频增强功能设计规格书

**项目**：极简浏览器 Android 应用  
**功能**：视频增强（画中画 + 悬浮播放）  
**版本**：v1.0  
**日期**：2026-04-10  
**状态**：已批准

---

## 1. 功能概述

为浏览器添加视频增强功能，支持画中画（PiP）模式和悬浮播放按钮，提升用户观看视频时的多任务体验。

---

## 2. 设计方案

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    UI 层                             │
│  VideoEnhanceManager (视频控制中心)                  │
│  VideoFloatButton (悬浮按钮)                         │
├─────────────────────────────────────────────────────┤
│                    业务层                             │
│  PiPManager (画中画管理)                             │
│  VideoDetector (视频检测)                            │
├─────────────────────────────────────────────────────┤
│                    数据层                             │
│  SharedPreferences (设置存储)                       │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 类名 | 职责 |
|------|------|
| `VideoEnhanceManager` | 视频控制中心，协调 PiP 和悬浮播放 |
| `PiPManager` | 画中画模式管理，生命周期处理 |
| `VideoDetector` | 检测页面中的视频元素 |
| `VideoFloatButton` | 悬浮按钮 UI 组件 |

### 2.3 数据流

```
页面加载 → VideoDetector 检测视频元素
    ↓
检测到视频 → 显示 VideoFloatButton
    ↓
用户点击按钮 → PiPManager 启动画中画模式
    ↓
用户关闭 PiP → 恢复正常浏览
```

---

## 3. UI 设计

### 3.1 悬浮按钮

**位置**：页面右下角，距边缘 16dp

**外观**：
- 圆形按钮，半径 24dp
- 背景色：`#80000000`（半透明黑色）
- 图标：画中画图标（Android 内置）
- 文字或图标表示 "PiP"

**行为**：
- 检测到视频时淡入显示
- 视频播放时可用
- 不可见时无触摸响应

### 3.2 画中画模式

- 使用 Android 官方 PiP API
- 支持标准 PiP 窗口大小
- 点击返回全屏播放
- 支持最小化、关闭操作

---

## 4. 技术实现

### 4.1 PiPManager

```kotlin
class PiPManager(private val activity: AppCompatActivity) {
    
    fun isPipSupported(): Boolean  // 检查设备是否支持 PiP
    
    fun enterPiPMode()  // 进入画中画模式
    
    fun exitPiPMode()  // 退出画中画模式
    
    fun updatePictureInPictureParams(): PictureInPictureParams
}
```

### 4.2 VideoDetector

```kotlin
class VideoDetector {
    
    fun detectVideoScript(): String  // 返回检测视频的 JS 脚本
    
    fun parseVideoInfo(result: String): VideoInfo?  // 解析检测结果
}

data class VideoInfo(
    val url: String,
    val title: String?,
    val isPlaying: Boolean
)
```

### 4.3 VideoEnhanceManager

```kotlin
class VideoEnhanceManager(private val activity: AppCompatActivity) {
    
    private val pipManager = PiPManager(activity)
    private val videoDetector = VideoDetector()
    
    fun isEnabled(): Boolean
    fun setEnabled(enabled: Boolean)
    
    fun shouldShowFloatButton(): Boolean
    fun getFloatButtonScript(): String
    
    fun enterPiP()
    fun exitPiP()
    
    fun isInPiPMode(): Boolean
}
```

---

## 5. 交互流程

### 5.1 检测视频并显示按钮

1. WebView 页面加载完成
2. 注入 VideoDetector 脚本检测视频
3. 如果检测到播放中的视频，显示悬浮按钮
4. 用户可点击按钮进入画中画

### 5.2 进入画中画

1. 用户点击悬浮按钮
2. 获取当前视频元素信息
3. 调用 enterPiPMode() 启动画中画
4. WebView 进入全屏播放状态
5. 隐藏悬浮按钮

### 5.3 退出画中画

1. 用户关闭 PiP 窗口或点击返回
2. PiPManager 收到退出回调
3. 悬浮按钮根据视频状态显示/隐藏

---

## 6. 技术约束

- **最低API**：24 (Android 7.0)，PiP 需要 API 26+
- **目标SDK**：34 (Android 14)
- **WebView**：腾讯 X5 WebView
- **PiP API**：android.app.PictureInPictureParams

---

## 7. 实现优先级

### 第一阶段：核心功能
1. PiPManager 画中画管理
2. VideoDetector 视频检测
3. VideoEnhanceManager 协调器

### 第二阶段：UI
4. VideoFloatButton 悬浮按钮
5. 集成到 BrowserActivity

---

## 8. 设计决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-10 | 全屏按钮 + 悬浮按钮 | 用户明确选择，平衡可见性和简洁性 |
| 2026-04-10 | 悬浮按钮位置右下角 | 符合 Android 交互习惯 |
| 2026-04-10 | 使用 X5 WebView 的视频播放器 | X5 内核自带视频增强支持 |
