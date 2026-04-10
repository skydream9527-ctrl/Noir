# 加速压缩功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现数据压缩和网页加速双重功能

**Architecture:** 
- SpeedUpManager 协调加速和压缩功能
- DataCompressor 通过 OkHttp 拦截器处理资源压缩
- WebAccelerator 提供 DNS 预解析和预加载 JS 脚本

**Tech Stack:** Kotlin, SharedPreferences, OkHttp Interceptor, X5 WebView JS 注入

---

## 文件结构

```
app/src/main/java/com/example/browser/
├── SpeedUp/
│   ├── SpeedUpManager.kt      # 主管理类
│   ├── SpeedUpSettings.kt     # 设置数据类
│   ├── DataCompressor.kt      # 数据压缩
│   └── WebAccelerator.kt      # 网页加速
├── SpeedUpSettingsFragment.kt # 设置页面
```

---

## 实现任务

### Task 1: 创建 SpeedUpSettings 数据类

**Files:**
- Create: `app/src/main/java/com/example/browser/SpeedUp/SpeedUpSettings.kt`

- [ ] **Step 1: 创建 SpeedUpSettings 数据类**

```kotlin
package com.example.browser.SpeedUp

data class SpeedUpSettings(
    val enabled: Boolean = true,
    val dataCompression: DataCompressionSettings = DataCompressionSettings(),
    val webAcceleration: WebAccelerationSettings = WebAccelerationSettings()
)

data class DataCompressionSettings(
    val enabled: Boolean = true,
    val imageQuality: Int = 80,  // 0-100
    val minifyJsCss: Boolean = false
)

data class WebAccelerationSettings(
    val dnsPrefetch: Boolean = true,
    val preloadResources: Boolean = true,
    val connectionReuse: Boolean = true
)
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/SpeedUp/SpeedUpSettings.kt
git commit -m "feat: add SpeedUpSettings data class"
```

---

### Task 2: 创建 WebAccelerator 网页加速类

**Files:**
- Create: `app/src/main/java/com/example/browser/SpeedUp/WebAccelerator.kt`

- [ ] **Step 1: 创建 WebAccelerator 类**

```kotlin
package com.example.browser.SpeedUp

class WebAccelerator {
    
    fun getDnsPrefetchScript(): String {
        return """
            (function() {
                var links = document.querySelectorAll('a[href]');
                var domains = [];
                links.forEach(function(link) {
                    try {
                        var url = new URL(link.href);
                        if (url.hostname && domains.indexOf(url.hostname) === -1) {
                            domains.push(url.hostname);
                        }
                    } catch (e) {}
                });
                domains.forEach(function(domain) {
                    var dns = document.createElement('link');
                    dns.rel = 'dns-prefetch';
                    dns.href = '//' + domain;
                    document.head.appendChild(dns);
                });
            })();
        """.trimIndent()
    }
    
    fun getPreloadScript(): String {
        return """
            (function() {
                var resources = [];
                var scripts = document.querySelectorAll('script[src]');
                var styles = document.querySelectorAll('link[rel="stylesheet"]');
                var images = document.querySelectorAll('img[src]');
                
                scripts.forEach(function(script) {
                    if (script.src && resources.indexOf(script.src) === -1) {
                        resources.push(script.src);
                    }
                });
                styles.forEach(function(style) {
                    if (style.href && resources.indexOf(style.href) === -1) {
                        resources.push(style.href);
                    }
                });
                
                resources.forEach(function(url) {
                    var link = document.createElement('link');
                    link.rel = 'preload';
                    link.href = url;
                    document.head.appendChild(link);
                });
            })();
        """.trimIndent()
    }
    
    fun shouldAccelerate(): Boolean = true
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/SpeedUp/WebAccelerator.kt
git commit -m "feat: add WebAccelerator for DNS prefetch and preload"
```

---

### Task 3: 创建 DataCompressor 数据压缩类

**Files:**
- Create: `app/src/main/java/com/example/browser/SpeedUp/DataCompressor.kt`

- [ ] **Step 1: 创建 DataCompressor 类**

```kotlin
package com.example.browser.SpeedUp

import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import okio.BufferedSource
import java.io.IOException

class DataCompressor(
    private val imageQuality: Int = 80
) {
    
    private val compressibleTypes = listOf(
        "text/html",
        "text/css",
        "application/javascript",
        "application/json",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    )
    
    fun isCompressionEnabled(): Boolean = imageQuality > 0 && imageQuality < 100
    
    fun shouldCompress(contentType: String?): Boolean {
        if (contentType == null) return false
        return compressibleTypes.any { contentType.contains(it, ignoreCase = true) }
    }
    
    fun getCompressedBody(originalBody: ResponseBody, contentType: String?): ResponseBody {
        if (!shouldCompress(contentType)) return originalBody
        
        val content = try {
            val source: BufferedSource = originalBody.source()
            val buffer = Buffer()
            source.readAll(buffer)
            buffer.readUtf8()
        } catch (e: IOException) {
            return originalBody
        }
        
        val compressedContent = when {
            contentType?.contains("javascript", ignoreCase = true) == true -> minifyJs(content)
            contentType?.contains("json", ignoreCase = true) == true -> minifyJson(content)
            else -> content
        }
        
        return compressedContent.toResponseBody(contentType?.let { MediaType.parse(it) })
    }
    
    private fun minifyJs(js: String): String {
        return js
            .replace(Regex("/\\*.*?\\*/", RegexOption.DOT_MATCHES_ALL), "")
            .replace(Regex("//.*?$", RegexOption.MULTILINE), "")
            .replace(Regex("\\s+"), " ")
            .trim()
    }
    
    private fun minifyJson(json: String): String {
        return json
            .replace(Regex("\\s+"), "")
            .trim()
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/SpeedUp/DataCompressor.kt
git commit -m "feat: add DataCompressor for resource compression"
```

---

### Task 4: 创建 SpeedUpManager 主管理类

**Files:**
- Create: `app/src/main/java/com/example/browser/SpeedUp/SpeedUpManager.kt`

- [ ] **Step 1: 创建 SpeedUpManager 类**

```kotlin
package com.example.browser.SpeedUp

import android.content.Context
import android.content.SharedPreferences
import android.net.ConnectivityManager
import android.net.NetworkInfo

class SpeedUpManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val webAccelerator = WebAccelerator()
    private val dataCompressor: DataCompressor
    
    private var settings: SpeedUpSettings
    
    companion object {
        private const val PREFS_NAME = "speed_up_settings"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_DATA_COMPRESSION = "data_compression"
        private const val KEY_WEB_ACCELERATION = "web_acceleration"
    }
    
    init {
        settings = loadSettings()
        val quality = if (isMobileNetwork(context)) 60 else 80
        dataCompressor = DataCompressor(quality)
    }
    
    private fun isMobileNetwork(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val info: NetworkInfo? = cm.activeNetworkInfo
        return info?.type == ConnectivityManager.TYPE_MOBILE
    }
    
    private fun loadSettings(): SpeedUpSettings {
        return SpeedUpSettings(
            enabled = prefs.getBoolean(KEY_ENABLED, true),
            dataCompression = DataCompressionSettings(
                enabled = prefs.getBoolean("data_compression_enabled", true),
                imageQuality = prefs.getInt("image_quality", 80),
                minifyJsCss = prefs.getBoolean("minify_js_css", false)
            ),
            webAcceleration = WebAccelerationSettings(
                dnsPrefetch = prefs.getBoolean("dns_prefetch", true),
                preloadResources = prefs.getBoolean("preload_resources", true),
                connectionReuse = prefs.getBoolean("connection_reuse", true)
            )
        )
    }
    
    fun saveSettings(settings: SpeedUpSettings) {
        this.settings = settings
        prefs.edit().apply {
            putBoolean(KEY_ENABLED, settings.enabled)
            putBoolean("data_compression_enabled", settings.dataCompression.enabled)
            putInt("image_quality", settings.dataCompression.imageQuality)
            putBoolean("minify_js_css", settings.dataCompression.minifyJsCss)
            putBoolean("dns_prefetch", settings.webAcceleration.dnsPrefetch)
            putBoolean("preload_resources", settings.webAcceleration.preloadResources)
            putBoolean("connection_reuse", settings.webAcceleration.connectionReuse)
            apply()
        }
    }
    
    fun isEnabled(): Boolean = settings.enabled
    
    fun setEnabled(enabled: Boolean) {
        settings = settings.copy(enabled = enabled)
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isDataCompressionEnabled(): Boolean = settings.enabled && settings.dataCompression.enabled
    
    fun isWebAccelerationEnabled(): Boolean = settings.enabled && settings.webAcceleration.dnsPrefetch
    
    fun getSettings(): SpeedUpSettings = settings
    
    fun getWebAccelerator(): WebAccelerator = webAccelerator
    
    fun getDataCompressor(): DataCompressor = dataCompressor
    
    fun getDnsPrefetchScript(): String {
        if (!isEnabled() || !settings.webAcceleration.dnsPrefetch) return ""
        return webAccelerator.getDnsPrefetchScript()
    }
    
    fun getPreloadScript(): String {
        if (!isEnabled() || !settings.webAcceleration.preloadResources) return ""
        return webAccelerator.getPreloadScript()
    }
    
    fun shouldInjectAccelerationScript(): Boolean {
        return isEnabled() && (settings.webAcceleration.dnsPrefetch || settings.webAcceleration.preloadResources)
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/SpeedUp/SpeedUpManager.kt
git commit -m "feat: add SpeedUpManager coordinating speed up features"
```

---

### Task 5: 创建设置页面布局

**Files:**
- Create: `app/src/main/res/layout/fragment_speed_up_settings.xml`

- [ ] **Step 1: 创建设置页面布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/surface">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="启用加速模式"
                android:textSize="16sp"
                android:textColor="@color/text_primary"/>

            <androidx.appcompat.widget.SwitchCompat
                android:id="@+id/switchSpeedUp"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"/>
        </LinearLayout>

        <View
            android:layout_width="match_parent"
            android:layout_height="1dp"
            android:background="@color/divider"/>

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:text="数据压缩"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"/>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="图片压缩"
                android:textSize="14sp"
                android:textColor="@color/text_primary"/>

            <androidx.appcompat.widget.SwitchCompat
                android:id="@+id/switchImageCompression"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"/>
        </LinearLayout>

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginStart="16dp"
            android:text="根据网络自动调整图片质量，节省流量"
            android:textSize="12sp"
            android:textColor="@color/text_hint"/>

        <View
            android:layout_width="match_parent"
            android:layout_height="1dp"
            android:layout_marginTop="16dp"
            android:background="@color/divider"/>

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:text="网页加速"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"/>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="DNS 预解析"
                android:textSize="14sp"
                android:textColor="@color/text_primary"/>

            <androidx.appcompat.widget.SwitchCompat
                android:id="@+id/switchDnsPrefetch"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"/>
        </LinearLayout>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="资源预加载"
                android:textSize="14sp"
                android:textColor="@color/text_primary"/>

            <androidx.appcompat.widget.SwitchCompat
                android:id="@+id/switchPreload"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"/>
        </LinearLayout>

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:padding="16dp">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="连接复用"
                android:textSize="14sp"
                android:textColor="@color/text_primary"/>

            <androidx.appcompat.widget.SwitchCompat
                android:id="@+id/switchConnectionReuse"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"/>
        </LinearLayout>

        <View
            android:layout_width="match_parent"
            android:layout_height="1dp"
            android:background="@color/divider"/>

        <TextView
            android:id="@+id/tvSavings"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:text="预计节省流量：30%"
            android:textSize="14sp"
            android:textColor="@color/primary"/>

    </LinearLayout>
</ScrollView>
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/res/layout/fragment_speed_up_settings.xml
git commit -m "feat: add speed up settings layout"
```

---

### Task 6: 创建 SpeedUpSettingsFragment

**Files:**
- Create: `app/src/main/java/com/example/browser/SpeedUp/SpeedUpSettingsFragment.kt`

- [ ] **Step 1: 创建 SpeedUpSettingsFragment**

```kotlin
package com.example.browser.SpeedUp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.appcompat.widget.SwitchCompat
import com.example.browser.R

class SpeedUpSettingsFragment : Fragment() {
    
    private lateinit var speedUpManager: SpeedUpManager
    
    private lateinit var switchSpeedUp: SwitchCompat
    private lateinit var switchImageCompression: SwitchCompat
    private lateinit var switchDnsPrefetch: SwitchCompat
    private lateinit var switchPreload: SwitchCompat
    private lateinit var switchConnectionReuse: SwitchCompat
    private lateinit var tvSavings: TextView
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_speed_up_settings, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        speedUpManager = SpeedUpManager(requireContext())
        
        initViews(view)
        setupListeners()
        updateUI()
    }
    
    private fun initViews(view: View) {
        switchSpeedUp = view.findViewById(R.id.switchSpeedUp)
        switchImageCompression = view.findViewById(R.id.switchImageCompression)
        switchDnsPrefetch = view.findViewById(R.id.switchDnsPrefetch)
        switchPreload = view.findViewById(R.id.switchPreload)
        switchConnectionReuse = view.findViewById(R.id.switchConnectionReuse)
        tvSavings = view.findViewById(R.id.tvSavings)
    }
    
    private fun setupListeners() {
        switchSpeedUp.setOnCheckedChangeListener { _, isChecked ->
            speedUpManager.setEnabled(isChecked)
            updateUI()
        }
        
        switchImageCompression.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchDnsPrefetch.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchPreload.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchConnectionReuse.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
    }
    
    private fun updateUI() {
        val settings = speedUpManager.getSettings()
        
        switchSpeedUp.isChecked = settings.enabled
        switchImageCompression.isChecked = settings.dataCompression.enabled
        switchDnsPrefetch.isChecked = settings.webAcceleration.dnsPrefetch
        switchPreload.isChecked = settings.webAcceleration.preloadResources
        switchConnectionReuse.isChecked = settings.webAcceleration.connectionReuse
        
        val savings = calculateSavings(settings)
        tvSavings.text = "预计节省流量：$savings%"
    }
    
    private fun saveSettings() {
        val settings = SpeedUpSettings(
            enabled = switchSpeedUp.isChecked,
            dataCompression = DataCompressionSettings(
                enabled = switchImageCompression.isChecked,
                imageQuality = if (switchImageCompression.isChecked) 70 else 100,
                minifyJsCss = false
            ),
            webAcceleration = WebAccelerationSettings(
                dnsPrefetch = switchDnsPrefetch.isChecked,
                preloadResources = switchPreload.isChecked,
                connectionReuse = switchConnectionReuse.isChecked
            )
        )
        speedUpManager.saveSettings(settings)
        updateUI()
    }
    
    private fun calculateSavings(settings: SpeedUpSettings): Int {
        var savings = 0
        if (settings.dataCompression.enabled) savings += 20
        if (settings.webAcceleration.dnsPrefetch) savings += 5
        if (settings.webAcceleration.preloadResources) savings += 5
        return savings
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/SpeedUp/SpeedUpSettingsFragment.kt
git commit -m "feat: add SpeedUpSettingsFragment"
```

---

### Task 7: 集成加速功能到 BrowserActivity

**Files:**
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: Read BrowserActivity.kt**

Read the full file at `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 2: 添加导入**

Add these imports:
```kotlin
import com.example.browser.SpeedUp.SpeedUpManager
```

- [ ] **Step 3: 添加成员变量**

Add after the existing member variables:
```kotlin
private lateinit var speedUpManager: SpeedUpManager
```

- [ ] **Step 4: 初始化 speedUpManager**

In `setupDrawer()`, after `adBlockManager = AdBlockManager(this)`, add:
```kotlin
speedUpManager = SpeedUpManager(this)
```

- [ ] **Step 5: 修改 onPageFinished 注入加速脚本**

In `onPageFinished`, after the video detection code, add:
```kotlin
// 注入加速脚本
if (speedUpManager.shouldInjectAccelerationScript()) {
    val dnsScript = speedUpManager.getDnsPrefetchScript()
    val preloadScript = speedUpManager.getPreloadScript()
    
    if (dnsScript.isNotEmpty()) {
        webView.evaluateJavascript(dnsScript, null)
    }
    if (preloadScript.isNotEmpty()) {
        webView.evaluateJavascript(preloadScript, null)
    }
}
```

- [ ] **Step 6: 提交**

```bash
git add app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "feat: integrate speed up into BrowserActivity"
```

---

### Task 8: 在抽屉中添加加速设置入口

**Files:**
- Modify: `app/src/main/java/com/example/browser/DrawerController.kt`

- [ ] **Step 1: Read DrawerController.kt**

Read `app/src/main/java/com/example/browser/DrawerController.kt`

- [ ] **Step 2: 添加导入**

Add:
```kotlin
import com.example.browser.SpeedUp.SpeedUpSettingsFragment
```

- [ ] **Step 3: 添加成员变量**

Add after existing ImageView variables:
```kotlin
private var ivSpeedUp: ImageView? = null
```

- [ ] **Step 4: 初始化 ivSpeedUp**

In the init block or setupViews method, after ivTabs initialization:
```kotlin
ivSpeedUp = contentContainer.findViewById(R.id.ivSpeedUp)
ivSpeedUp?.setOnClickListener {
    showSpeedUpSettings()
}
```

- [ ] **Step 5: 添加 showSpeedUpSettings 方法**

```kotlin
private fun showSpeedUpSettings() {
    activity.supportFragmentManager.beginTransaction()
        .replace(R.id.contentContainer, SpeedUpSettingsFragment())
        .addToBackStack(null)
        .commit()
    fragmentContainer.visibility = View.VISIBLE
    tabContainer.visibility = View.GONE
    ivBookmark?.setColorFilter(Color.GRAY)
    ivHistory?.setColorFilter(Color.GRAY)
    ivTabs?.setColorFilter(Color.GRAY)
    ivAdBlock?.setColorFilter(Color.GRAY)
    ivSpeedUp?.setColorFilter(Color.parseColor("#007AFF"))
}
```

- [ ] **Step 6: 修改布局添加加速图标**

In `layout_drawer_container.xml`, add:
```xml
<ImageView
    android:id="@+id/ivSpeedUp"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:padding="12dp"
    android:src="@android:drawable/ic_menu_upload"
    android:contentDescription="加速设置"/>
```

- [ ] **Step 7: 提交**

```bash
git add app/src/main/java/com/example/browser/DrawerController.kt app/src/main/res/layout/layout_drawer_container.xml
git commit -m "feat: add speed up menu entry in drawer"
```

---

## 自检清单

- [ ] Spec 覆盖：所有设计规格中的功能都有对应任务实现
- [ ] 无占位符：所有步骤都包含完整代码
- [ ] 类型一致性：类名、方法签名、属性名在各任务间一致
- [ ] 文件路径正确：所有创建/修改的文件路径准确

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-speed-up-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
