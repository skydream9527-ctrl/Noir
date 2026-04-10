# 视频增强功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现画中画（PiP）模式和悬浮播放按钮功能

**Architecture:** 
- PiPManager 处理画中画生命周期
- VideoDetector 通过 JS 检测页面视频
- VideoEnhanceManager 协调各组件

**Tech Stack:** Kotlin, Android PiP API, X5 WebView, JavaScript 注入

---

## 文件结构

```
app/src/main/java/com/example/browser/
├── VideoEnhance/
│   ├── PiPManager.kt           # 画中画管理
│   ├── VideoDetector.kt         # 视频检测
│   └── VideoEnhanceManager.kt   # 协调器
├── VideoEnhanceActivity.kt      # 视频全屏Activity（可选）
```

---

## 实现任务

### Task 1: 创建 PiPManager 画中画管理类

**Files:**
- Create: `app/src/main/java/com/example/browser/VideoEnhance/PiPManager.kt`

- [ ] **Step 1: 创建 PiPManager 类**

```kotlin
package com.example.browser.VideoEnhance

import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import androidx.appcompat.app.AppCompatActivity

class PiPManager(private val activity: AppCompatActivity) {
    
    private var isInPipMode = false
    private var pipCallback: (() -> Unit)? = null
    
    fun isPipSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && 
               activity.packageManager.hasSystemFeature("android.software.picture_in_picture")
    }
    
    fun isInPipMode(): Boolean = isInPipMode
    
    fun enterPipMode(): Boolean {
        if (!isPipSupported()) return false
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            
            return activity.enterPictureInPictureMode(params)
        }
        return false
    }
    
    fun updatePipParams(): PictureInPictureParams? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
        }
        return null
    }
    
    fun setPipCallback(callback: () -> Unit) {
        pipCallback = callback
    }
    
    fun onPipModeChanged(inPipMode: Boolean) {
        isInPipMode = inPipMode
        pipCallback?.invoke()
    }
    
    fun onConfigurationChanged(newConfig: Configuration) {
        isInPipMode = newConfig.orientation == Configuration.ORIENTATION_UNDEFINED
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/VideoEnhance/PiPManager.kt
git commit -m "feat: add PiPManager for picture-in-picture mode"
```

---

### Task 2: 创建 VideoDetector 视频检测类

**Files:**
- Create: `app/src/main/java/com/example/browser/VideoEnhance/VideoDetector.kt`

- [ ] **Step 1: 创建 VideoDetector 类**

```kotlin
package com.example.browser.VideoEnhance

import org.json.JSONArray
import org.json.JSONObject

class VideoDetector {
    
    data class VideoInfo(
        val url: String,
        val title: String?,
        val isPlaying: Boolean,
        val duration: Long
    )
    
    fun getDetectVideoScript(): String {
        return """
            (function() {
                var videos = document.querySelectorAll('video');
                var result = [];
                videos.forEach(function(video) {
                    if (video && video.src) {
                        result.push({
                            url: video.src,
                            title: document.title,
                            isPlaying: !video.paused && !video.ended,
                            duration: video.duration || 0
                        });
                    }
                });
                return JSON.stringify(result);
            })();
        """.trimIndent()
    }
    
    fun parseVideoInfo(jsonResult: String): List<VideoInfo> {
        if (jsonResult.isEmpty()) return emptyList()
        
        return try {
            val jsonArray = JSONArray(jsonResult)
            (0 until jsonArray.length()).map { index ->
                val obj = jsonArray.getJSONObject(index)
                VideoInfo(
                    url = obj.optString("url", ""),
                    title = obj.optString("title", null),
                    isPlaying = obj.optBoolean("isPlaying", false),
                    duration = obj.optLong("duration", 0)
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun getHasPlayingVideoScript(): String {
        return """
            (function() {
                var videos = document.querySelectorAll('video');
                for (var i = 0; i < videos.length; i++) {
                    var video = videos[i];
                    if (!video.paused && !video.ended && video.offsetWidth > 0) {
                        return 'true';
                    }
                }
                return 'false';
            })();
        """.trimIndent()
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/VideoEnhance/VideoDetector.kt
git commit -m "feat: add VideoDetector for video detection via JS"
```

---

### Task 3: 创建 VideoEnhanceManager 协调器类

**Files:**
- Create: `app/src/main/java/com/example/browser/VideoEnhance/VideoEnhanceManager.kt`

- [ ] **Step 1: 创建 VideoEnhanceManager 类**

```kotlin
package com.example.browser.VideoEnhance

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatActivity

class VideoEnhanceManager(private val activity: AppCompatActivity) {
    
    private val prefs: SharedPreferences = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val pipManager = PiPManager(activity)
    private val videoDetector = VideoDetector()
    
    private var isEnabled = true
    private var onPipEnterListener: (() -> Unit)? = null
    
    companion object {
        private const val PREFS_NAME = "video_enhance_settings"
        private const val KEY_ENABLED = "enabled"
    }
    
    init {
        isEnabled = prefs.getBoolean(KEY_ENABLED, true)
        setupPipCallback()
    }
    
    private fun setupPipCallback() {
        pipManager.setPipCallback {
            if (pipManager.isInPipMode()) {
                onPipEnterListener?.invoke()
            }
        }
    }
    
    fun isEnabled(): Boolean = isEnabled
    
    fun setEnabled(enabled: Boolean) {
        isEnabled = enabled
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isPipSupported(): Boolean = pipManager.isPipSupported()
    
    fun isInPipMode(): Boolean = pipManager.isInPipMode()
    
    fun enterPipMode(): Boolean {
        if (!isEnabled || !isPipSupported()) return false
        return pipManager.enterPipMode()
    }
    
    fun getVideoDetector(): VideoDetector = videoDetector
    
    fun getDetectVideoScript(): String = videoDetector.getDetectVideoScript()
    
    fun getHasPlayingVideoScript(): String = videoDetector.getHasPlayingVideoScript()
    
    fun parseVideoInfo(jsonResult: String): List<VideoDetector.VideoInfo> {
        return videoDetector.parseVideoInfo(jsonResult)
    }
    
    fun setOnPipEnterListener(listener: () -> Unit) {
        onPipEnterListener = listener
    }
    
    fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        pipManager.onConfigurationChanged(newConfig)
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/VideoEnhance/VideoEnhanceManager.kt
git commit -m "feat: add VideoEnhanceManager coordinating PiP and video detection"
```

---

### Task 4: 创建悬浮按钮布局

**Files:**
- Create: `app/src/main/res/layout/layout_video_float_button.xml`

- [ ] **Step 1: 创建悬浮按钮布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/floatButtonContainer"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:layout_gravity="bottom|end"
    android:layout_margin="16dp"
    android:visibility="gone">
    
    <ImageButton
        android:id="@+id/btnPip"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:background="@drawable/bg_float_button"
        android:src="@android:drawable/ic_menu_crop"
        android:contentDescription="画中画"
        android:padding="12dp"
        android:scaleType="centerInside"/>
        
</FrameLayout>
```

- [ ] **Step 2: 创建悬浮按钮背景**

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#80000000"/>
    <size android:width="48dp" android:height="48dp"/>
</shape>
```

创建 `app/src/main/res/drawable/bg_float_button.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#80000000"/>
    <size android:width="48dp" android:height="48dp"/>
</shape>
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/res/layout/layout_video_float_button.xml app/src/main/res/drawable/bg_float_button.xml
git commit -m "feat: add video float button layout and drawable"
```

---

### Task 5: 集成视频增强到 BrowserActivity

**Files:**
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: 添加导入**

```kotlin
import com.example.browser.VideoEnhance.VideoEnhanceManager
import android.widget.FrameLayout
import android.view.View
import android.view.Gravity
import android.widget.ImageButton
import android.view.animation.AlphaAnimation
```

- [ ] **Step 2: 添加成员变量**

```kotlin
private lateinit var videoEnhanceManager: VideoEnhanceManager
private lateinit var floatButtonContainer: FrameLayout
private lateinit var btnPip: ImageButton
```

- [ ] **Step 3: 在 setupWebView 后添加 setupVideoEnhance 方法调用**

在 `setupDrawer()` 之后添加：
```kotlin
setupVideoEnhance()
```

- [ ] **Step 4: 添加 setupVideoEnhance 方法**

```kotlin
private fun setupVideoEnhance() {
    videoEnhanceManager = VideoEnhanceManager(this)
    
    floatButtonContainer = binding.root.findViewById(R.id.floatButtonContainer)
    btnPip = binding.root.findViewById(R.id.btnPip)
    
    if (!videoEnhanceManager.isPipSupported()) {
        floatButtonContainer.visibility = View.GONE
        return
    }
    
    btnPip.setOnClickListener {
        if (videoEnhanceManager.isInPipMode()) {
            // 已在画中画模式，不做处理
        } else {
            videoEnhanceManager.enterPipMode()
        }
    }
    
    videoEnhanceManager.setOnPipEnterListener {
        hideFloatButton()
    }
}
```

- [ ] **Step 5: 添加 showFloatButton 和 hideFloatButton 方法**

```kotlin
private fun showFloatButton() {
    if (!videoEnhanceManager.isEnabled() || !videoEnhanceManager.isPipSupported()) return
    if (videoEnhanceManager.isInPipMode()) return
    if (floatButtonContainer.visibility == View.VISIBLE) return
    
    floatButtonContainer.visibility = View.VISIBLE
    val fadeIn = AlphaAnimation(0f, 1f).apply {
        duration = 300
        fillAfter = true
    }
    floatButtonContainer.startAnimation(fadeIn)
}

private fun hideFloatButton() {
    if (floatButtonContainer.visibility != View.VISIBLE) return
    
    val fadeOut = AlphaAnimation(1f, 0f).apply {
        duration = 300
        fillAfter = true
    }
    floatButtonContainer.startAnimation(fadeOut)
    floatButtonContainer.visibility = View.GONE
}
```

- [ ] **Step 6: 修改 onPageFinished 检测视频**

在 `onPageFinished` 中，广告拦截脚本注入之后添加：
```kotlin
// 检测视频并显示悬浮按钮
if (videoEnhanceManager.isEnabled()) {
    val script = videoEnhanceManager.getHasPlayingVideoScript()
    webView.evaluateJavascript(script) { result ->
        if (result == "true") {
            runOnUiThread { showFloatButton() }
        }
    }
}
```

- [ ] **Step 7: 修改 onBackPressed 处理 PiP 返回**

```kotlin
override fun onBackPressed() {
    when {
        videoEnhanceManager.isInPipMode() -> {
            videoEnhanceManager.enterPipMode()  // 退出 PiP
        }
        binding.drawerContainer.isVisible -> closeDrawer()
        webView.canGoBack() -> webView.goBack()
        else -> super.onBackPressed()
    }
}
```

- [ ] **Step 8: 重写 onUserLeaveHint 处理 PiP 进入**

```kotlin
override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    // 用户按 Home 键，尝试进入画中画
    if (videoEnhanceManager.isEnabled() && videoEnhanceManager.isPipSupported()) {
        val script = videoEnhanceManager.getHasPlayingVideoScript()
        webView.evaluateJavascript(script) { result ->
            if (result == "true") {
                videoEnhanceManager.enterPipMode()
            }
        }
    }
}
```

- [ ] **Step 9: 提交**

```bash
git add app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "feat: integrate video enhance with PiP and float button"
```

---

## 自检清单

- [ ] Spec 覆盖：所有设计规格中的功能都有对应任务实现
- [ ] 无占位符：所有步骤都包含完整代码
- [ ] 类型一致性：类名、方法签名、属性名在各任务间一致
- [ ] 文件路径正确：所有创建/修改的文件路径准确

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-video-enhance-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
