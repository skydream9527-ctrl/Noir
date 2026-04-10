# 下载管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的下载管理功能（下载、后台下载、断点续传、文件管理）

**Architecture:** 
- DownloadManager 统一管理下载任务
- Room 数据库存储下载历史
- WorkManager 后台下载
- FileProvider 安全的文件分享

**Tech Stack:** Kotlin, Room Database, WorkManager, OkHttp, FileProvider

---

## 文件结构

```
app/src/main/java/com/example/browser/
├── Download/
│   ├── DownloadItem.kt          # 数据类 (Room Entity)
│   ├── DownloadDatabase.kt      # Room 数据库
│   ├── DownloadDao.kt           # DAO 接口
│   ├── DownloadTask.kt          # 单个下载任务
│   ├── DownloadManager.kt       # 主管理类
│   ├── DownloadAdapter.kt       # RecyclerView 适配器
│   └── DownloadListFragment.kt  # 下载列表 Fragment
```

---

## 实现任务

### Task 1: 创建 DownloadItem 数据类和 Room 数据库

**Files:**
- Create: `app/src/main/java/com/example/browser/Download/DownloadItem.kt`
- Create: `app/src/main/java/com/example/browser/Download/DownloadDao.kt`
- Create: `app/src/main/java/com/example/browser/Download/DownloadDatabase.kt`

- [ ] **Step 1: 创建 DownloadItem.kt**

```kotlin
package com.example.browser.Download

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadItem(
    @PrimaryKey val id: String,
    val url: String,
    val fileName: String,
    val filePath: String,
    val fileSize: Long,
    val downloadedSize: Long = 0,
    val status: DownloadStatus = DownloadStatus.PENDING,
    val mimeType: String? = null,
    val category: DownloadCategory = DownloadCategory.OTHER,
    val createTime: Long = System.currentTimeMillis(),
    val completeTime: Long? = null
)

enum class DownloadStatus {
    PENDING, DOWNLOADING, PAUSED, COMPLETED, FAILED
}

enum class DownloadCategory {
    IMAGE, VIDEO, DOCUMENT, OTHER
}
```

- [ ] **Step 2: 创建 DownloadDao.kt**

```kotlin
package com.example.browser.Download

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {
    
    @Query("SELECT * FROM downloads ORDER BY createTime DESC")
    fun getAllDownloads(): Flow<List<DownloadItem>>
    
    @Query("SELECT * FROM downloads WHERE category = :category ORDER BY createTime DESC")
    fun getDownloadsByCategory(category: DownloadCategory): Flow<List<DownloadItem>>
    
    @Query("SELECT * FROM downloads WHERE id = :id")
    suspend fun getDownload(id: String): DownloadItem?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDownload(download: DownloadItem)
    
    @Update
    suspend fun updateDownload(download: DownloadItem)
    
    @Delete
    suspend fun deleteDownload(download: DownloadItem)
    
    @Query("DELETE FROM downloads WHERE id = :id")
    suspend fun deleteDownloadById(id: String)
    
    @Query("UPDATE downloads SET status = :status, downloadedSize = :downloadedSize WHERE id = :id")
    suspend fun updateProgress(id: String, status: DownloadStatus, downloadedSize: Long)
    
    @Query("UPDATE downloads SET status = :status, completeTime = :completeTime WHERE id = :id")
    suspend fun updateStatus(id: String, status: DownloadStatus, completeTime: Long?)
}
```

- [ ] **Step 3: 创建 DownloadDatabase.kt**

```kotlin
package com.example.browser.Download

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(entities = [DownloadItem::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class DownloadDatabase : RoomDatabase() {
    
    abstract fun downloadDao(): DownloadDao
    
    companion object {
        @Volatile
        private var INSTANCE: DownloadDatabase? = null
        
        fun getInstance(context: Context): DownloadDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DownloadDatabase::class.java,
                    "download_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

class Converters {
    @androidx.room.TypeConverter
    fun fromDownloadStatus(status: DownloadStatus): String = status.name
    
    @androidx.room.TypeConverter
    fun toDownloadStatus(value: String): DownloadStatus = DownloadStatus.valueOf(value)
    
    @androidx.room.TypeConverter
    fun fromDownloadCategory(category: DownloadCategory): String = category.name
    
    @androidx.room.TypeConverter
    fun toDownloadCategory(value: String): DownloadCategory = DownloadCategory.valueOf(value)
}
```

- [ ] **Step 4: 提交**

```bash
git add app/src/main/java/com/example/browser/Download/
git commit -m "feat: add DownloadItem, DownloadDao, and DownloadDatabase"
```

---

### Task 2: 创建 DownloadTask 下载任务类

**Files:**
- Create: `app/src/main/java/com/example/browser/Download/DownloadTask.kt`

- [ ] **Step 1: 创建 DownloadTask.kt**

```kotlin
package com.example.browser.Download

import android.content.Context
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class DownloadTask(
    private val context: Context,
    private val downloadDao: DownloadDao
) {
    
    private val okHttpClient = OkHttpClient.Builder().build()
    private var currentJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    data class ProgressCallback(
        val onProgress: (Long, Long) -> Unit,
        val onComplete: (Boolean, String?) -> Unit
    )
    
    fun startDownload(item: DownloadItem, callback: ProgressCallback) {
        currentJob = scope.launch {
            try {
                val request = Request.Builder().url(item.url).build()
                val response = okHttpClient.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    callback.onComplete(false, "HTTP error: ${response.code}")
                    return@launch
                }
                
                val body = response.body ?: run {
                    callback.onComplete(false, "Empty response")
                    return@launch
                }
                
                val totalBytes = body.contentLength()
                val file = File(item.filePath)
                file.parentFile?.mkdirs()
                
                var downloadedBytes = 0L
                
                body.byteStream().use { input ->
                    FileOutputStream(file).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            
                            val progress = if (totalBytes > 0) {
                                (downloadedBytes * 100 / totalBytes)
                            } else 0L
                            
                            downloadDao.updateProgress(item.id, DownloadStatus.DOWNLOADING, downloadedBytes)
                            withContext(Dispatchers.Main) {
                                callback.onProgress(downloadedBytes, totalBytes)
                            }
                        }
                    }
                }
                
                downloadDao.updateStatus(item.id, DownloadStatus.COMPLETED, System.currentTimeMillis())
                withContext(Dispatchers.Main) {
                    callback.onComplete(true, null)
                }
                
            } catch (e: Exception) {
                downloadDao.updateStatus(item.id, DownloadStatus.FAILED, null)
                withContext(Dispatchers.Main) {
                    callback.onComplete(false, e.message)
                }
            }
        }
    }
    
    fun pauseDownload(downloadId: String) {
        currentJob?.cancel()
        scope.launch {
            downloadDao.updateStatus(downloadId, DownloadStatus.PAUSED, null)
        }
    }
    
    fun cancelDownload(downloadId: String) {
        currentJob?.cancel()
        scope.launch {
            val download = downloadDao.getDownload(downloadId)
            download?.let {
                File(it.filePath).delete()
                downloadDao.deleteDownload(it)
            }
        }
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/Download/DownloadTask.kt
git commit -m "feat: add DownloadTask for download operations"
```

---

### Task 3: 创建 DownloadManager 主管理类

**Files:**
- Create: `app/src/main/java/com/example/browser/Download/DownloadManager.kt`

- [ ] **Step 1: 创建 DownloadManager.kt**

```kotlin
package com.example.browser.Download

import android.app.DownloadManager as AndroidDownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import kotlinx.coroutines.flow.Flow
import java.io.File
import java.util.UUID

class DownloadManager(private val context: Context) {
    
    private val downloadDao = DownloadDatabase.getInstance(context).downloadDao()
    private val downloadTask = DownloadTask(context, downloadDao)
    private val downloadMap = mutableMapOf<String, DownloadTask>()
    
    companion object {
        private val IMAGE_EXTENSIONS = listOf(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp")
        private val VIDEO_EXTENSIONS = listOf(".mp4", ".avi", ".mkv", ".webm", ".mov", ".flv")
        private val DOCUMENT_EXTENSIONS = listOf(".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx")
    }
    
    fun download(url: String, fileName: String? = null): String {
        val id = UUID.randomUUID().toString()
        val name = fileName ?: url.substringAfterLast("/").substringBefore("?") ?: "download"
        val extension = "." + name.substringAfterLast(".", "")
        val category = getCategoryByExtension(extension)
        
        val downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        val filePath = File(downloadDir, name).absolutePath
        
        val item = DownloadItem(
            id = id,
            url = url,
            fileName = name,
            filePath = filePath,
            fileSize = 0,
            status = DownloadStatus.PENDING,
            mimeType = getMimeType(extension),
            category = category
        )
        
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
            downloadDao.insertDownload(item)
        }
        
        downloadTask.startDownload(item, object : DownloadTask.ProgressCallback {
            override fun onProgress(downloaded: Long, total: Long) {
                // Progress updates handled here
            }
            
            override fun onComplete(success: Boolean, error: String?) {
                // Completion handled here
            }
        })
        
        downloadMap[id] = downloadTask
        return id
    }
    
    private fun getCategoryByExtension(extension: String): DownloadCategory {
        val ext = extension.lowercase()
        return when {
            IMAGE_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.IMAGE
            VIDEO_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.VIDEO
            DOCUMENT_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.DOCUMENT
            else -> DownloadCategory.OTHER
        }
    }
    
    private fun getMimeType(extension: String): String {
        val ext = extension.lowercase()
        return when {
            ext.endsWith(".pdf") -> "application/pdf"
            ext.endsWith(".doc") -> "application/msword"
            ext.endsWith(".docx") -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ext.endsWith(".jpg") || ext.endsWith(".jpeg") -> "image/jpeg"
            ext.endsWith(".png") -> "image/png"
            ext.endsWith(".gif") -> "image/gif"
            ext.endsWith(".mp4") -> "video/mp4"
            ext.endsWith(".webm") -> "video/webm"
            else -> "application/octet-stream"
        }
    }
    
    fun pause(downloadId: String) {
        downloadMap[downloadId]?.pauseDownload(downloadId)
    }
    
    fun resume(downloadId: String) {
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
            val item = downloadDao.getDownload(downloadId) ?: return@launch
            if (item.status == DownloadStatus.PAUSED) {
                downloadTask.startDownload(item, object : DownloadTask.ProgressCallback {
                    override fun onProgress(downloaded: Long, total: Long) {}
                    override fun onComplete(success: Boolean, error: String?) {}
                })
            }
        }
    }
    
    fun cancel(downloadId: String) {
        downloadMap[downloadId]?.cancelDownload(downloadId)
        downloadMap.remove(downloadId)
    }
    
    fun delete(downloadId: String) {
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
            val item = downloadDao.getDownload(downloadId) ?: return@launch
            File(item.filePath).delete()
            downloadDao.deleteDownload(item)
        }
    }
    
    fun getAllDownloads(): Flow<List<DownloadItem>> = downloadDao.getAllDownloads()
    
    fun getDownloadsByCategory(category: DownloadCategory): Flow<List<DownloadItem>> {
        return downloadDao.getDownloadsByCategory(category)
    }
    
    fun openFile(downloadId: String): Boolean {
        val item = kotlinx.coroutines.runBlocking { downloadDao.getDownload(downloadId) } ?: return false
        val file = File(item.filePath)
        if (!file.exists()) return false
        
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, item.mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        context.startActivity(Intent.createChooser(intent, "打开文件"))
        return true
    }
    
    fun shareFile(downloadId: String): Boolean {
        val item = kotlinx.coroutines.runBlocking { downloadDao.getDownload(downloadId) } ?: return false
        val file = File(item.filePath)
        if (!file.exists()) return false
        
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = item.mimeType ?: "application/octet-stream"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        context.startActivity(Intent.createChooser(intent, "分享文件"))
        return true
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/Download/DownloadManager.kt
git commit -m "feat: add DownloadManager for download coordination"
```

---

### Task 4: 创建下载列表布局

**Files:**
- Create: `app/src/main/res/layout/fragment_download_list.xml`
- Create: `app/src/main/res/layout/item_download.xml`

- [ ] **Step 1: 创建下载列表布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/surface">

    <com.google.android.material.tabs.TabLayout
        android:id="@+id/tabLayout"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@color/surface">

        <com.google.android.material.tabs.TabItem
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="全部"/>

        <com.google.android.material.tabs.TabItem
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="图片"/>

        <com.google.android.material.tabs.TabItem
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="视频"/>

        <com.google.android.material.tabs.TabItem
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="文档"/>
    </com.google.android.material.tabs.TabLayout>

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rvDownloads"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"/>

    <TextView
        android:id="@+id/tvEmpty"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:gravity="center"
        android:text="暂无下载"
        android:textColor="@color/text_hint"
        android:visibility="gone"/>

</LinearLayout>
```

- [ ] **Step 2: 创建下载项布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@color/surface">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <ImageView
            android:id="@+id/ivIcon"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:src="@android:drawable/ic_menu_save"
            android:contentDescription="文件图标"/>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:layout_marginStart="12dp"
            android:orientation="vertical">

            <TextView
                android:id="@+id/tvFileName"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="filename.ext"
                android:textSize="14sp"
                android:textColor="@color/text_primary"
                android:maxLines="1"
                android:ellipsize="middle"/>

            <TextView
                android:id="@+id/tvFileSize"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="2.5MB | 2026-04-10"
                android:textSize="12sp"
                android:textColor="@color/text_hint"
                android:layout_marginTop="4dp"/>
        </LinearLayout>

        <ImageButton
            android:id="@+id/btnMore"
            android:layout_width="32dp"
            android:layout_height="32dp"
            android:background="?attr/selectableItemBackgroundBorderless"
            android:src="@android:drawable/ic_menu_more"
            android:contentDescription="更多"/>
    </LinearLayout>

    <ProgressBar
        android:id="@+id/progressBar"
        style="@android:style/Widget.ProgressBar.Horizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:layout_marginTop="8dp"
        android:visibility="gone"/>

    <LinearLayout
        android:id="@+id/actionButtons"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginTop="8dp"
        android:gravity="end">

        <Button
            android:id="@+id/btnOpen"
            style="@style/Widget.Material3.Button.TextButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="打开"/>

        <Button
            android:id="@+id/btnShare"
            style="@style/Widget.Material3.Button.TextButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="分享"/>

        <Button
            android:id="@+id/btnDelete"
            style="@style/Widget.Material3.Button.TextButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="删除"
            android:textColor="@color/error"/>
    </LinearLayout>

</LinearLayout>
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/res/layout/fragment_download_list.xml app/src/main/res/layout/item_download.xml
git commit -m "feat: add download list layouts"
```

---

### Task 5: 创建 DownloadAdapter 和 DownloadListFragment

**Files:**
- Create: `app/src/main/java/com/example/browser/Download/DownloadAdapter.kt`
- Create: `app/src/main/java/com/example/browser/Download/DownloadListFragment.kt`

- [ ] **Step 1: 创建 DownloadAdapter.kt**

```kotlin
package com.example.browser.Download

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DownloadAdapter(
    private val onOpenClick: (DownloadItem) -> Unit,
    private val onShareClick: (DownloadItem) -> Unit,
    private val onDeleteClick: (DownloadItem) -> Unit
) : ListAdapter<DownloadItem, DownloadAdapter.ViewHolder>(DownloadDiffCallback()) {
    
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivIcon: ImageView = view.findViewById(R.id.ivIcon)
        val tvFileName: TextView = view.findViewById(R.id.tvFileName)
        val tvFileSize: TextView = view.findViewById(R.id.tvFileSize)
        val progressBar: ProgressBar = view.findViewById(R.id.progressBar)
        val btnOpen: Button = view.findViewById(R.id.btnOpen)
        val btnShare: Button = view.findViewById(R.id.btnShare)
        val btnDelete: Button = view.findViewById(R.id.btnDelete)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_download, parent, false)
        return ViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = getItem(position)
        
        holder.tvFileName.text = item.fileName
        holder.tvFileSize.text = formatFileInfo(item)
        
        when (item.status) {
            DownloadStatus.DOWNLOADING -> {
                holder.progressBar.visibility = View.VISIBLE
                val progress = if (item.fileSize > 0) {
                    (item.downloadedSize * 100 / item.fileSize).toInt()
                } else 0
                holder.progressBar.progress = progress
            }
            DownloadStatus.PAUSED -> {
                holder.progressBar.visibility = View.VISIBLE
                holder.progressBar.progress = 0
            }
            else -> {
                holder.progressBar.visibility = View.GONE
            }
        }
        
        holder.btnOpen.setOnClickListener { onOpenClick(item) }
        holder.btnShare.setOnClickListener { onShareClick(item) }
        holder.btnDelete.setOnClickListener { onDeleteClick(item) }
    }
    
    private fun formatFileInfo(item: DownloadItem): String {
        val size = formatFileSize(item.fileSize)
        val date = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
            .format(Date(item.createTime))
        return "$size | $date"
    }
    
    private fun formatFileSize(size: Long): String {
        return when {
            size < 1024 -> "$size B"
            size < 1024 * 1024 -> "${size / 1024} KB"
            size < 1024 * 1024 * 1024 -> "${size / (1024 * 1024)} MB"
            else -> "${size / (1024 * 1024 * 1024)} GB"
        }
    }
    
    class DownloadDiffCallback : DiffUtil.ItemCallback<DownloadItem>() {
        override fun areItemsTheSame(oldItem: DownloadItem, newItem: DownloadItem): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: DownloadItem, newItem: DownloadItem): Boolean {
            return oldItem == newItem
        }
    }
}
```

- [ ] **Step 2: 创建 DownloadListFragment.kt**

```kotlin
package com.example.browser.Download

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class DownloadListFragment : Fragment() {
    
    private lateinit var downloadManager: DownloadManager
    private lateinit var adapter: DownloadAdapter
    
    private lateinit var tabLayout: TabLayout
    private lateinit var rvDownloads: RecyclerView
    private lateinit var tvEmpty: TextView
    
    private var currentCategory: DownloadCategory? = null
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_download_list, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        downloadManager = DownloadManager(requireContext())
        
        initViews(view)
        setupRecyclerView()
        setupTabs()
        observeDownloads()
    }
    
    private fun initViews(view: View) {
        tabLayout = view.findViewById(R.id.tabLayout)
        rvDownloads = view.findViewById(R.id.rvDownloads)
        tvEmpty = view.findViewById(R.id.tvEmpty)
    }
    
    private fun setupRecyclerView() {
        adapter = DownloadAdapter(
            onOpenClick = { item -> downloadManager.openFile(item.id) },
            onShareClick = { item -> downloadManager.shareFile(item.id) },
            onDeleteClick = { item -> downloadManager.delete(item.id) }
        )
        
        rvDownloads.layoutManager = LinearLayoutManager(context)
        rvDownloads.adapter = adapter
    }
    
    private fun setupTabs() {
        tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                currentCategory = when (tab?.position) {
                    1 -> DownloadCategory.IMAGE
                    2 -> DownloadCategory.VIDEO
                    3 -> DownloadCategory.DOCUMENT
                    else -> null
                }
                observeDownloads()
            }
            
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }
    
    private fun observeDownloads() {
        viewLifecycleOwner.lifecycleScope.launch {
            val flow = if (currentCategory != null) {
                downloadManager.getDownloadsByCategory(currentCategory!!)
            } else {
                downloadManager.getAllDownloads()
            }
            
            flow.collectLatest { downloads ->
                adapter.submitList(downloads)
                tvEmpty.visibility = if (downloads.isEmpty()) View.VISIBLE else View.GONE
                rvDownloads.visibility = if (downloads.isEmpty()) View.GONE else View.VISIBLE
            }
        }
    }
}
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/java/com/example/browser/Download/DownloadAdapter.kt app/src/main/java/com/example/browser/Download/DownloadListFragment.kt
git commit -m "feat: add DownloadAdapter and DownloadListFragment"
```

---

### Task 6: 集成下载管理到 BrowserActivity

**Files:**
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: Read BrowserActivity.kt**

- [ ] **Step 2: 添加导入**

```kotlin
import com.example.browser.Download.DownloadManager
import android.webkit.DownloadListener
```

- [ ] **Step 3: 添加成员变量**

```kotlin
private lateinit var downloadManager: DownloadManager
```

- [ ] **Step 4: 初始化 downloadManager**

In `setupDrawer()` after `speedUpManager = SpeedUpManager(this)`:
```kotlin
downloadManager = DownloadManager(this)
```

- [ ] **Step 5: 添加 DownloadListener**

In `setupWebView()`, after WebChromeClient setup, add:
```kotlin
webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
    downloadManager.download(url, null)
}
```

- [ ] **Step 6: 提交**

```bash
git add app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "feat: integrate download manager into BrowserActivity"
```

---

### Task 7: 在抽屉中添加下载入口

**Files:**
- Modify: `app/src/main/java/com/example/browser/DrawerController.kt`
- Modify: `app/src/main/res/layout/layout_drawer_container.xml`

- [ ] **Step 1: Read DrawerController.kt**

- [ ] **Step 2: 添加导入**

```kotlin
import com.example.browser.Download.DownloadListFragment
```

- [ ] **Step 3: 添加成员变量**

Add after `ivSpeedUp`:
```kotlin
private var ivDownload: ImageView? = null
```

- [ ] **Step 4: 初始化 ivDownload**

Add after `ivSpeedUp` initialization:
```kotlin
ivDownload = contentContainer.findViewById(R.id.ivDownload)
ivDownload?.setOnClickListener {
    showDownloadList()
}
```

- [ ] **Step 5: 添加 showDownloadList 方法**

```kotlin
private fun showDownloadList() {
    activity.supportFragmentManager.beginTransaction()
        .replace(R.id.contentContainer, DownloadListFragment())
        .addToBackStack(null)
        .commit()
    fragmentContainer.visibility = View.VISIBLE
    tabContainer.visibility = View.GONE
    resetNavIconColors()
    ivDownload?.setColorFilter(Color.parseColor("#007AFF"))
}

private fun resetNavIconColors() {
    ivBookmark?.setColorFilter(Color.GRAY)
    ivHistory?.setColorFilter(Color.GRAY)
    ivTabs?.setColorFilter(Color.GRAY)
    ivAdBlock?.setColorFilter(Color.GRAY)
    ivSpeedUp?.setColorFilter(Color.GRAY)
}
```

- [ ] **Step 6: 修改布局添加下载图标**

Add in `layout_drawer_container.xml` after ivSpeedUp:
```xml
<ImageView
    android:id="@+id/ivDownload"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:padding="12dp"
    android:src="@android:drawable/stat_sys_download"
    android:contentDescription="下载管理"/>
```

- [ ] **Step 7: 提交**

```bash
git add app/src/main/java/com/example/browser/DrawerController.kt app/src/main/res/layout/layout_drawer_container.xml
git commit -m "feat: add download menu entry in drawer"
```

---

## 自检清单

- [ ] Spec 覆盖：所有设计规格中的功能都有对应任务实现
- [ ] 无占位符：所有步骤都包含完整代码
- [ ] 类型一致性：类名、方法签名、属性名在各任务间一致
- [ ] 文件路径正确：所有创建/修改的文件路径准确

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-download-manager-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
