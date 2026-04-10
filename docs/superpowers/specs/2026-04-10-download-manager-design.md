# 下载管理功能设计规格书

**项目**：极简浏览器 Android 应用  
**功能**：下载管理  
**版本**：v1.0  
**日期**：2026-04-10  
**状态**：已批准

---

## 1. 功能概述

为浏览器添加完整的下载管理功能，支持文件下载、后台下载、断点续传、下载列表管理，以及文件操作（打开、删除、分享）。

---

## 2. 设计方案

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    UI 层                             │
│  DownloadListFragment (下载列表)                     │
│  DownloadNotification (通知)                        │
├─────────────────────────────────────────────────────┤
│                    业务层                             │
│  DownloadManager (下载管理)                          │
│  DownloadTask (下载任务)                             │
│  DownloadDatabase (数据库存储)                       │
├─────────────────────────────────────────────────────┤
│                    数据层                             │
│  Room Database (下载历史)                           │
│  SharedPreferences (设置)                           │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 类名 | 职责 |
|------|------|
| `DownloadManager` | 统一管理所有下载任务，生命周期处理 |
| `DownloadTask` | 单个下载任务，支持暂停/继续/取消 |
| `DownloadItem` | 下载项数据类（Room Entity） |
| `DownloadDatabase` | Room 数据库访问 |
| `DownloadListFragment` | 下载列表 UI |
| `DownloadAdapter` | RecyclerView 适配器 |

### 2.3 数据流

```
用户点击下载链接 → DownloadManager 拦截
    ↓
创建 DownloadTask → 显示下载通知
    ↓
后台下载 → 更新进度通知
    ↓
下载完成 → 通知用户 + 保存到数据库
    ↓
用户可在列表中打开/删除/分享
```

---

## 3. UI 设计

### 3.1 下载列表页面

**位置**：抽屉菜单入口

**布局**：
```
┌─────────────────────────────┐
│  ☰ 下载管理                  │
├─────────────────────────────┤
│  [全部] [图片] [视频] [文档] │  ← 分类标签
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ 📄 document.pdf         ││
│  │ 2.5MB | 2026-04-10 15:30││
│  │              [打开][删除]││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🎬 video.mp4            ││
│  │ 15MB | 50%   ████░░░░░  ││
│  │ (进行中)    [暂停][取消] ││
│  └─────────────────────────┘│
│  ...                        │
└─────────────────────────────┘
```

### 3.2 分类标签

- 全部：显示所有下载
- 图片：*.jpg, *.png, *.gif, *.webp
- 视频：*.mp4, *.avi, *.mkv, *.webm
- 文档：*.pdf, *.doc, *.docx, *.txt

### 3.3 通知栏

- 下载开始：显示"开始下载 xxx"
- 下载中：显示进度条
- 下载完成：显示"下载完成 xxx"
- 点击通知：打开下载列表

---

## 4. 数据结构

### 4.1 DownloadItem (Room Entity)

```kotlin
@Entity(tableName = "downloads")
data class DownloadItem(
    @PrimaryKey val id: String,
    val url: String,
    val fileName: String,
    val filePath: String,
    val fileSize: Long,
    val downloadedSize: Long = 0,
    val status: DownloadStatus,
    val mimeType: String?,
    val category: DownloadCategory,
    val createTime: Long,
    val completeTime: Long?
)

enum class DownloadStatus {
    PENDING, DOWNLOADING, PAUSED, COMPLETED, FAILED
}

enum class DownloadCategory {
    IMAGE, VIDEO, DOCUMENT, OTHER
}
```

### 4.2 DownloadManager 接口

```kotlin
class DownloadManager(private val context: Context) {
    
    fun download(url: String, fileName: String?): String  // 返回下载ID
    
    fun pause(downloadId: String)
    fun resume(downloadId: String)
    fun cancel(downloadId: String)
    fun delete(downloadId: String)
    
    fun getDownload(downloadId: String): DownloadItem?
    fun getAllDownloads(): List<DownloadItem>
    fun getDownloadsByCategory(category: DownloadCategory): List<DownloadItem>
    
    fun openFile(downloadId: String): Boolean
    fun shareFile(downloadId: String): Boolean
}
```

---

## 5. 交互流程

### 5.1 下载文件

1. 用户点击下载链接
2. DownloadManager 拦截请求
3. 获取文件名和 URL
4. 创建下载任务，开始下载
5. 显示下载通知
6. 后台继续下载（使用 WorkManager 或 Service）

### 5.2 暂停/继续

1. 用户在列表或通知中点击暂停
2. 保存当前进度
3. 暂停下载任务
4. 更新通知状态

### 5.3 删除文件

1. 用户点击删除
2. 删除本地文件
3. 从数据库移除记录
4. 更新列表

### 5.4 打开/分享

1. 用户点击打开/分享
2. 调用系统 Intent
3. 使用 FileProvider 处理 URI

---

## 6. 技术约束

- **最低API**：24 (Android 7.0)
- **目标SDK**：34 (Android 14)
- **数据库**：Room
- **下载**：OkHttp + WorkManager
- **文件访问**：FileProvider

---

## 7. 实现优先级

### 第一阶段：核心功能
1. DownloadItem 数据类和 Room 数据库
2. DownloadTask 下载任务
3. DownloadManager 主管理类

### 第二阶段：UI
4. DownloadListFragment 下载列表
5. DownloadAdapter 列表适配器
6. 抽屉入口

### 第三阶段：完善
7. 通知栏进度显示
8. 文件操作（打开/分享/删除）
9. 下载完成广播

---

## 8. 设计决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-04-10 | Room 数据库存储 | 方便查询、分类、排序 |
| 2026-04-10 | WorkManager 后台下载 | 可靠的系统级后台任务 |
| 2026-04-10 | FileProvider 分享 | 安全的跨应用文件分享 |
| 2026-04-10 | 分类标签筛选 | 方便用户快速找到文件 |
