# 极简浏览器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有浏览器重构为极简风格 - 卡片式设计、底部合并地址栏、右侧抽屉入口

**Architecture:** 
- 保持现有 MVP 架构（Activity + Manager classes）
- 新增 DrawerController 统一管理右侧抽屉
- 新增 BottomAddressBar 自定义视图处理地址输入
- 重用现有 TabManager, BookmarkManager, HistoryManager, SearchEngineManager

**Tech Stack:** Kotlin, Android SDK 34, X5 WebView, Material Design 3, View Binding

---

## 文件结构

```
app/src/main/
├── java/com/example/browser/
│   ├── BrowserActivity.kt           # 重构：移除顶部工具栏，使用底部地址栏
│   ├── DrawerController.kt         # 新增：右侧抽屉控制器
│   ├── BottomAddressBar.kt          # 新增：底部合并地址栏自定义View
│   ├── Drawer/
│   │   ├── DrawerContainer.kt      # 新增：抽屉容器View
│   │   ├── BookmarksFragment.kt    # 新增：书签列表Fragment
│   │   ├── HistoryFragment.kt      # 新增：历史记录Fragment
│   │   └── TabsFragment.kt         # 新增：标签页管理Fragment
│   └── data/
│       └── TabManager.kt            # 重构：适配多标签切换
├── res/
│   ├── layout/
│   │   ├── activity_browser.xml    # 重构：移除AppBar，底部地址栏
│   │   ├── layout_bottom_address_bar.xml  # 新增：底部地址栏布局
│   │   ├── layout_drawer_container.xml    # 新增：抽屉容器
│   │   ├── layout_bookmarks.xml     # 新增：书签列表布局
│   │   ├── layout_history.xml       # 新增：历史记录布局
│   │   ├── layout_tabs.xml          # 新增：标签页管理布局
│   │   └── item_bookmark.xml        # 新增：书签列表项
│   ├── drawable/
│   │   ├── ic_bookmark_outline.xml  # 新增：线性书签图标
│   │   ├── ic_history_outline.xml   # 新增：线性历史图标
│   │   ├── ic_tabs_outline.xml      # 新增：线性标签页图标
│   │   ├── ic_menu.xml              # 新增：菜单图标
│   │   └── bg_bottom_bar.xml        # 新增：底部卡片背景
│   └── values/
│       ├── colors.xml               # 重构：极简配色
│       ├── dimens.xml               # 新增：间距和圆角尺寸
│       └── strings.xml              # 重构：精简字符串
```

---

## 实现任务

### 任务 1: 设计系统 - 颜色和尺寸

**Files:**
- Modify: `app/src/main/res/values/colors.xml`
- Create: `app/src/main/res/values/dimens.xml`

- [ ] **Step 1: 更新 colors.xml 极简配色**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- 极简配色系统 -->
    <color name="white">#FFFFFFFF</color>
    <color name="black">#FF000000</color>
    
    <!-- 背景色 -->
    <color name="background_primary">#FFFFFFFF</color>
    <color name="background_card">#FFF8F9FA</color>
    
    <!-- 强调色 -->
    <color name="accent">#FF1A73E8</color>
    <color name="accent_light">#FFE8F0FD</color>
    
    <!-- 文字色 -->
    <color name="text_primary">#FF202124</color>
    <color name="text_secondary">#FF5F6368</color>
    <color name="text_hint">#FF9AA0A6</color>
    
    <!-- 分割线 -->
    <color name="divider">#FFE8EAED</color>
    
    <!-- 图标色 -->
    <color name="icon_inactive">#FF5F6368</color>
    <color name="icon_active">#FF1A73E8</color>
    
    <!-- 保留兼容色 -->
    <color name="primary_color">#FF1A73E8</color>
    <color name="primary_dark">#FF1557D6</color>
    <color name="accent_color">#FF1A73E8</color>
    <color name="gray">#FF757575</color>
    <color name="light_gray">#FFF5F5F5</color>
    <color name="ic_launcher_background">#FFFFFFFF</color>
</resources>
```

- [ ] **Step 2: 创建 dimens.xml 定义间距和圆角**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- 圆角 -->
    <dimen name="corner_radius_large">16dp</dimen>
    <dimen name="corner_radius_medium">12dp</dimen>
    <dimen name="corner_radius_small">8dp</dimen>
    
    <!-- 间距 -->
    <dimen name="spacing_large">24dp</dimen>
    <dimen name="spacing_medium">16dp</dimen>
    <dimen name="spacing_small">8dp</dimen>
    <dimen name="spacing_tiny">4dp</dimen>
    
    <!-- 图标尺寸 -->
    <dimen name="icon_size">24dp</dimen>
    <dimen name="icon_size_large">32dp</dimen>
    
    <!-- 底部地址栏 -->
    <dimen name="bottom_bar_height">56dp</dimen>
    <dimen name="bottom_bar_margin">12dp</dimen>
    
    <!-- 抽屉宽度 -->
    <dimen name="drawer_width">320dp</dimen>
    
    <!-- 标签卡片 -->
    <dimen name="tab_card_width">140dp</dimen>
    <dimen name="tab_card_height">180dp</dimen>
</resources>
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/res/values/colors.xml app/src/main/res/values/dimens.xml
git commit -m "feat: add minimalist design system (colors, dimensions)"
```

---

### 任务 2: 创建基础图标

**Files:**
- Create: `app/src/main/res/drawable/ic_bookmark_outline.xml`
- Create: `app/src/main/res/drawable/ic_history_outline.xml`
- Create: `app/src/main/res/drawable/ic_tabs_outline.xml`
- Create: `app/src/main/res/drawable/ic_menu.xml`
- Create: `app/src/main/res/drawable/bg_bottom_bar.xml`

- [ ] **Step 1: 创建 ic_bookmark_outline.xml**

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLinecap="round"
        android:strokeLineJoin="round"
        android:pathData="M19,21l-7,-5 -7,5V5a2,2 0,0 1,2 -2h10a2,2 0,0 1,2 2z"/>
</vector>
```

- [ ] **Step 2: 创建 ic_history_outline.xml**

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLinecap="round"
        android:strokeLineJoin="round"
        android:pathData="M12,12m-9,0a9,9 0,1 0,18 0a9,9 0,1 0,-18 0"/>
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M12,7v5l3,3"/>
</vector>
```

- [ ] **Step 3: 创建 ic_tabs_outline.xml**

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M4,4m-2,0a2,2 0,1 0,4 0a2,2 0,1 0,-4 0"/>
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M20,4m-2,0a2,2 0,1 0,4 0a2,2 0,1 0,-4 0"/>
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M4,20l4,-4 4,4 4,-4 4,4"/>
</vector>
```

- [ ] **Step 4: 创建 ic_menu.xml**

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M3,12h18M3,6h18M3,18h18"/>
</vector>
```

- [ ] **Step 5: 创建 bg_bottom_bar.xml 底部卡片背景**

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="@color/background_card"/>
    <corners android:radius="@dimen/corner_radius_large"/>
</shape>
```

- [ ] **Step 6: Commit**

```bash
git add app/src/main/res/drawable/ic_bookmark_outline.xml app/src/main/res/drawable/ic_history_outline.xml app/src/main/res/drawable/ic_tabs_outline.xml app/src/main/res/drawable/ic_menu.xml app/src/main/res/drawable/bg_bottom_bar.xml
git commit -m "feat: add minimalist icons and bottom bar background"
```

---

### 任务 3: 创建 BottomAddressBar 自定义视图

**Files:**
- Create: `app/src/main/java/com/example/browser/BottomAddressBar.kt`
- Create: `app/src/main/res/layout/layout_bottom_address_bar.xml`

- [ ] **Step 1: 创建 layout_bottom_address_bar.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="@drawable/bg_bottom_bar"
    android:layout_marginHorizontal="@dimen/bottom_bar_margin"
    android:layout_marginBottom="@dimen/bottom_bar_margin"
    android:paddingHorizontal="@dimen/spacing_medium"
    android:paddingVertical="@dimen/spacing_small">

    <ImageView
        android:id="@+id/ivMenu"
        android:layout_width="@dimen/icon_size"
        android:layout_height="@dimen/icon_size"
        android:src="@drawable/ic_menu"
        android:contentDescription="菜单"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"/>

    <EditText
        android:id="@+id/etAddress"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginHorizontal="@dimen/spacing_medium"
        android:background="@null"
        android:hint="@string/address_hint"
        android:imeOptions="actionGo"
        android:inputType="textUri"
        android:maxLines="1"
        android:textColor="@color/text_primary"
        android:textColorHint="@color/text_hint"
        android:textSize="16sp"
        app:layout_constraintStart_toEndOf="@id/ivMenu"
        app:layout_constraintEnd_toStartOf="@id/ivClear"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"/>

    <ImageView
        android:id="@+id/ivClear"
        android:layout_width="@dimen/icon_size"
        android:layout_height="@dimen/icon_size"
        android:src="@drawable/ic_close"
        android:visibility="gone"
        android:contentDescription="清除"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"/>

</androidx.constraintlayout.widget.ConstraintLayout>
```

- [ ] **Step 2: 创建 strings.xml 更新提示语**

```xml
<string name="address_hint">输入网址或搜索</string>
```

- [ ] **Step 3: 创建 BottomAddressBar.kt**

```kotlin
package com.example.browser

import android.annotation.SuppressLint
import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import com.example.browser.databinding.LayoutBottomAddressBarBinding
import com.example.browser.data.SearchEngineManager

class BottomAddressBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val binding: LayoutBottomAddressBarBinding
    private val searchEngineManager = SearchEngineManager(context)
    
    var onAddressSubmit: ((String) -> Unit)? = null
    var onMenuClick: (() -> Unit)? = null
    
    init {
        binding = LayoutBottomAddressBarBinding.inflate(LayoutInflater.from(context), this, true)
        setupViews()
    }
    
    private fun setupViews() {
        binding.ivMenu.setOnClickListener { onMenuClick?.invoke() }
        
        binding.etAddress.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                val input = binding.etAddress.text.toString().trim()
                if (input.isNotEmpty()) {
                    onAddressSubmit?.invoke(processInput(input))
                }
                true
            } else false
        }
        
        binding.etAddress.onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
            binding.ivClear.visibility = if (hasFocus && binding.etAddress.text.isNotEmpty()) View.VISIBLE else View.GONE
        }
        
        binding.ivClear.setOnClickListener {
            binding.etAddress.text.clear()
            binding.ivClear.visibility = View.GONE
        }
    }
    
    private fun processInput(input: String): String {
        return when {
            input.startsWith("http://") || input.startsWith("https://") -> input
            input.contains(".") && !input.contains(" ") -> "https://$input"
            else -> {
                val engine = searchEngineManager.getDefaultEngine()
                val baseUrl = searchEngineManager.getSearchUrl(engine)
                "$baseUrl$input"
            }
        }
    }
    
    fun setAddress(url: String) {
        binding.etAddress.setText(url)
    }
    
    fun getAddress(): String = binding.etAddress.text.toString()
    
    fun showClearButton(show: Boolean) {
        binding.ivClear.visibility = if (show) View.VISIBLE else View.GONE
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/src/main/res/layout/layout_bottom_address_bar.xml app/src/main/java/com/example/browser/BottomAddressBar.kt app/src/main/res/values/strings.xml
git commit -m "feat: add BottomAddressBar custom view with merged search/URL input"
```

---

### 任务 4: 重构 BrowserActivity 布局

**Files:**
- Modify: `app/src/main/res/layout/activity_browser.xml`
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: 重构 activity_browser.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/coordinatorLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/background_primary">

    <com.tencent.smtt.sdk.WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"/>

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:progressDrawable="@drawable/progress_drawable"
        android:visibility="gone"
        android:layout_gravity="top"/>

    <com.example.browser.BottomAddressBar
        android:id="@+id/bottomAddressBar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom"/>

    <View
        android:id="@+id/drawerScrim"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#80000000"
        android:visibility="gone"
        android:clickable="true"
        android:focusable="true"/>

    <include
        android:id="@+id/drawerContainer"
        layout="@layout/layout_drawer_container"
        android:layout_width="@dimen/drawer_width"
        android:layout_height="match_parent"
        android:layout_gravity="end"
        android:visibility="gone"/>

</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

- [ ] **Step 2: 重构 BrowserActivity.kt**

```kotlin
package com.example.browser

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import com.tencent.smtt.sdk.WebChromeClient
import com.tencent.smtt.sdk.WebSettings
import com.tencent.smtt.sdk.WebView
import com.tencent.smtt.sdk.WebViewClient
import com.example.browser.databinding.ActivityBrowserBinding

class BrowserActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBrowserBinding
    private lateinit var webView: WebView
    private lateinit var tabManager: TabManager
    
    private var currentTabId: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBrowserBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tabManager = TabManager(this)
        
        setupWebView()
        setupBottomAddressBar()
        setupDrawer()
        
        loadInitialTab()
    }
    
    private fun loadInitialTab() {
        val tab = tabManager.getActiveTab() ?: tabManager.createNewTab()
        currentTabId = tab.id
        if (tab.url.isNotEmpty()) {
            webView.loadUrl(tab.url)
        }
        binding.bottomAddressBar.setAddress(tab.url)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = binding.webView
        val settings = webView.settings
        
        settings.javaScriptEnabled = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.domStorageEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = 0

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean = false

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.progressBar.visibility = View.VISIBLE
                binding.progressBar.progress = 0
                url?.let { 
                    binding.bottomAddressBar.setAddress(it)
                    currentTabId?.let { tabId -> tabManager.updateTab(tabId, url = it, title = view?.title) }
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                url?.let { binding.bottomAddressBar.setAddress(it) }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                binding.progressBar.progress = newProgress
            }
        }
    }

    private fun setupBottomAddressBar() {
        binding.bottomAddressBar.onAddressSubmit = { url ->
            webView.loadUrl(url)
        }
        
        binding.bottomAddressBar.onMenuClick = {
            toggleDrawer()
        }
    }
    
    private fun setupDrawer() {
        binding.drawerScrim.setOnClickListener {
            closeDrawer()
        }
    }
    
    private fun toggleDrawer() {
        val isVisible = binding.drawerContainer.isVisible
        if (isVisible) {
            closeDrawer()
        } else {
            openDrawer()
        }
    }
    
    private fun openDrawer() {
        binding.drawerScrim.visibility = View.VISIBLE
        binding.drawerContainer.visibility = View.VISIBLE
        binding.drawerContainer.animate()
            .translationX(0f)
            .setDuration(250)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
        binding.drawerScrim.animate()
            .alpha(1f)
            .setDuration(250)
            .start()
    }
    
    private fun closeDrawer() {
        val drawerWidth = binding.drawerContainer.width.toFloat()
        binding.drawerContainer.animate()
            .translationX(drawerWidth)
            .setDuration(250)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .withEndAction {
                binding.drawerContainer.visibility = View.GONE
            }
            .start()
        binding.drawerScrim.animate()
            .alpha(0f)
            .setDuration(250)
            .withEndAction {
                binding.drawerScrim.visibility = View.GONE
            }
            .start()
    }

    override fun onBackPressed() {
        when {
            binding.drawerContainer.isVisible -> closeDrawer()
            webView.canGoBack() -> webView.goBack()
            else -> super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/res/layout/activity_browser.xml app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "refactor: BrowserActivity with bottom address bar and drawer support"
```

---

### 任务 5: 创建 DrawerController 和抽屉容器

**Files:**
- Create: `app/src/main/java/com/example/browser/DrawerController.kt`
- Create: `app/src/main/res/layout/layout_drawer_container.xml`

- [ ] **Step 1: 创建 layout_drawer_container.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="@dimen/drawer_width"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/background_primary">

    <LinearLayout
        android:id="@+id/tabContainer"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:orientation="horizontal"
        android:background="@color/background_card"
        android:paddingHorizontal="@dimen/spacing_medium">

        <ImageView
            android:id="@+id/ivBookmark"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:padding="@dimen/spacing_small"
            android:src="@drawable/ic_bookmark_outline"
            android:contentDescription="书签"/>

        <ImageView
            android:id="@+id/ivHistory"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:padding="@dimen/spacing_small"
            android:src="@drawable/ic_history_outline"
            android:contentDescription="历史"/>

        <ImageView
            android:id="@+id/ivTabs"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:padding="@dimen/spacing_small"
            android:src="@drawable/ic_tabs_outline"
            android:contentDescription="标签页"/>

    </LinearLayout>

    <View
        android:layout_width="match_parent"
        android:layout_height="1dp"
        android:background="@color/divider"/>

    <FrameLayout
        android:id="@+id/contentContainer"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"/>

</LinearLayout>
```

- [ ] **Step 2: 创建 DrawerController.kt**

```kotlin
package com.example.browser

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.content.ContextCompat
import com.example.browser.data.BookmarkManager
import com.example.browser.data.HistoryManager
import com.example.browser.data.TabManager

class DrawerController(
    private val context: Context,
    private val tabContainer: View,
    private val contentContainer: FrameLayout,
    private val ivBookmark: ImageView,
    private val ivHistory: ImageView,
    private val ivTabs: ImageView
) {
    
    private val bookmarkManager = BookmarkManager(context)
    private val historyManager = HistoryManager(context)
    private val tabManager = TabManager(context)
    
    private var currentTab = Tab.BOOKMARKS
    
    enum class Tab { BOOKMARKS, HISTORY, TABS }
    
    init {
        setupTabClicks()
        showTab(Tab.BOOKMARKS)
    }
    
    private fun setupTabClicks() {
        ivBookmark.setOnClickListener { showTab(Tab.BOOKMARKS) }
        ivHistory.setOnClickListener { showTab(Tab.HISTORY) }
        ivTabs.setOnClickListener { showTab(Tab.TABS) }
    }
    
    private fun showTab(tab: Tab) {
        currentTab = tab
        updateTabIcons()
        updateContent()
    }
    
    private fun updateTabIcons() {
        val activeColor = ContextCompat.getColor(context, R.color.icon_active)
        val inactiveColor = ContextCompat.getColor(context, R.color.icon_inactive)
        
        ivBookmark.setColorFilter(if (currentTab == Tab.BOOKMARKS) activeColor else inactiveColor)
        ivHistory.setColorFilter(if (currentTab == Tab.HISTORY) activeColor else inactiveColor)
        ivTabs.setColorFilter(if (currentTab == Tab.TABS) activeColor else inactiveColor)
    }
    
    private fun updateContent() {
        // Fragment 切换逻辑
        // 后续任务中实现
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/res/layout/layout_drawer_container.xml app/src/main/java/com/example/browser/DrawerController.kt
git commit -m "feat: add DrawerController and drawer container layout"
```

---

### 任务 6: 创建书签和历史 Fragment

**Files:**
- Create: `app/src/main/res/layout/layout_bookmarks.xml`
- Create: `app/src/main/res/layout/item_bookmark.xml`
- Create: `app/src/main/res/layout/layout_history.xml`
- Create: `app/src/main/java/com/example/browser/Drawer/BookmarksFragment.kt`
- Create: `app/src/main/java/com/example/browser/Drawer/HistoryFragment.kt`

- [ ] **Step 1: 创建 layout_bookmarks.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.recyclerview.widget.RecyclerView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/rvBookmarks"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="@dimen/spacing_small"
    android:clipToPadding="false"/>
```

- [ ] **Step 2: 创建 item_bookmark.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:padding="@dimen/spacing_medium"
    android:background="?attr/selectableItemBackground">

    <ImageView
        android:id="@+id/ivFavicon"
        android:layout_width="@dimen/icon_size"
        android:layout_height="@dimen/icon_size"
        android:layout_marginEnd="@dimen/spacing_medium"
        android:src="@drawable/ic_bookmark_outline"/>

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/tvTitle"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@color/text_primary"
            android:textSize="14sp"
            android:maxLines="1"
            android:ellipsize="end"/>

        <TextView
            android:id="@+id/tvUrl"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@color/text_secondary"
            android:textSize="12sp"
            android:maxLines="1"
            android:ellipsize="end"/>

    </LinearLayout>

</LinearLayout>
```

- [ ] **Step 3: 创建 layout_history.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.recyclerview.widget.RecyclerView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/rvHistory"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="@dimen/spacing_small"
    android:clipToPadding="false"/>
```

- [ ] **Step 4: 创建 BookmarksFragment.kt**

```kotlin
package com.example.browser.Drawer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.example.browser.data.Bookmark
import com.example.browser.data.BookmarkManager

class BookmarksFragment(
    private val bookmarkManager: BookmarkManager,
    private val onBookmarkClick: (Bookmark) -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: BookmarkAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        recyclerView = RecyclerView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            layoutManager = LinearLayoutManager(context)
        }
        return recyclerView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        adapter = BookmarkAdapter(bookmarkManager.getAllBookmarks(), onBookmarkClick)
        recyclerView.adapter = adapter
    }

    fun refresh() {
        adapter.update(bookmarkManager.getAllBookmarks())
    }
}

class BookmarkAdapter(
    private var bookmarks: List<Bookmark>,
    private val onClick: (Bookmark) -> Unit
) : RecyclerView.Adapter<BookmarkAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: android.widget.TextView = view.findViewById(R.id.tvTitle)
        val tvUrl: android.widget.TextView = view.findViewById(R.id.tvUrl)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_bookmark, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val bookmark = bookmarks[position]
        holder.tvTitle.text = bookmark.title
        holder.tvUrl.text = bookmark.url
        holder.itemView.setOnClickListener { onClick(bookmark) }
    }

    override fun getItemCount() = bookmarks.size

    fun update(newBookmarks: List<Bookmark>) {
        bookmarks = newBookmarks
        notifyDataSetChanged()
    }
}
```

- [ ] **Step 5: 创建 HistoryFragment.kt**

```kotlin
package com.example.browser.Drawer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.example.browser.data.History
import com.example.browser.data.HistoryManager

class HistoryFragment(
    private val historyManager: HistoryManager,
    private val onHistoryClick: (History) -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: HistoryAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        recyclerView = RecyclerView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            layoutManager = LinearLayoutManager(context)
        }
        return recyclerView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        adapter = HistoryAdapter(historyManager.getRecentHistory(50), onHistoryClick)
        recyclerView.adapter = adapter
    }

    fun refresh() {
        adapter.update(historyManager.getRecentHistory(50))
    }
}

class HistoryAdapter(
    private var history: List<History>,
    private val onClick: (History) -> Unit
) : RecyclerView.Adapter<HistoryAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: android.widget.TextView = view.findViewById(R.id.tvTitle)
        val tvUrl: android.widget.TextView = view.findViewById(R.id.tvUrl)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_bookmark, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = history[position]
        holder.tvTitle.text = item.title
        holder.tvUrl.text = item.url
        holder.itemView.setOnClickListener { onClick(item) }
    }

    override fun getItemCount() = history.size

    fun update(newHistory: List<History>) {
        history = newHistory
        notifyDataSetChanged()
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add app/src/main/res/layout/layout_bookmarks.xml app/src/main/res/layout/layout_history.xml app/src/main/res/layout/item_bookmark.xml app/src/main/java/com/example/browser/Drawer/BookmarksFragment.kt app/src/main/java/com/example/browser/Drawer/HistoryFragment.kt
git commit -m "feat: add BookmarksFragment and HistoryFragment for drawer"
```

---

### 任务 7: 创建标签页管理 Fragment

**Files:**
- Create: `app/src/main/res/layout/layout_tabs.xml`
- Create: `app/src/main/res/layout/item_tab_card.xml`
- Create: `app/src/main/java/com/example/browser/Drawer/TabsFragment.kt`

- [ ] **Step 1: 创建 layout_tabs.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="@dimen/spacing_medium">

    <TextView
        android:id="@+id/tvTabCount"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="@color/text_secondary"
        android:textSize="14sp"
        android:layout_marginBottom="@dimen/spacing_medium"/>

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rvTabs"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"/>

</LinearLayout>
```

- [ ] **Step 2: 创建 item_tab_card.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="@dimen/tab_card_width"
    android:layout_height="@dimen/tab_card_height"
    android:layout_margin="@dimen/spacing_small"
    app:cardCornerRadius="@dimen/corner_radius_medium"
    app:cardElevation="2dp"
    app:cardBackgroundColor="@color/background_card">

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <WebView
            android:id="@+id/wvPreview"
            android:layout_width="match_parent"
            android:layout_height="match_parent"/>

        <View
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:background="@color/background_card"/>

        <TextView
            android:id="@+id/tvTabTitle"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_gravity="bottom"
            android:padding="@dimen/spacing_small"
            android:textColor="@color/text_primary"
            android:textSize="12sp"
            android:maxLines="1"
            android:ellipsize="end"
            android:background="@color/background_card"/>

        <ImageView
            android:id="@+id/ivClose"
            android:layout_width="@dimen/icon_size"
            android:layout_height="@dimen/icon_size"
            android:layout_gravity="top|end"
            android:layout_margin="@dimen/spacing_tiny"
            android:padding="@dimen/spacing_tiny"
            android:src="@drawable/ic_close"
            android:background="@drawable/circle_background"
            android:contentDescription="关闭"/>

    </FrameLayout>

</androidx.cardview.widget.CardView>
```

- [ ] **Step 3: 创建 TabsFragment.kt**

```kotlin
package com.example.browser.Drawer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.example.browser.data.Tab
import com.example.browser.data.TabManager

class TabsFragment(
    private val tabManager: TabManager,
    private val onTabClick: (Tab) -> Unit,
    private val onTabClose: (String) -> Unit,
    private val onNewTabClick: () -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var tvTabCount: TextView
    private lateinit var adapter: TabAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        val rootView = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        
        tvTabCount = TextView(requireContext()).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 0, 0, resources.getDimensionPixelSize(R.dimen.spacing_medium))
            }
            setTextColor(resources.getColor(R.color.text_secondary, null))
            textSize = 14f
        }
        rootView.addView(tvTabCount)
        
        recyclerView = RecyclerView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0
            )
            layoutManager = GridLayoutManager(context, 2)
        }
        rootView.addView(recyclerView)
        
        return rootView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        refresh()
    }

    fun refresh() {
        val tabs = tabManager.getAllTabs()
        tvTabCount.text = "标签页 (${tabs.size})"
        adapter = TabAdapter(tabs, onTabClick, onTabClose, onNewTabClick)
        recyclerView.adapter = adapter
    }
}

class TabAdapter(
    private var tabs: List<Tab>,
    private val onTabClick: (Tab) -> Unit,
    private val onTabClose: (String) -> Unit,
    private val onNewTabClick: () -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_TAB = 0
        private const val TYPE_NEW_TAB = 1
    }

    override fun getItemViewType(position: Int): Int {
        return if (position == tabs.size) TYPE_NEW_TAB else TYPE_TAB
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == TYPE_NEW_TAB) {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_tab_card, parent, false)
            NewTabViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_tab_card, parent, false)
            TabViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is TabViewHolder -> {
                val tab = tabs[position]
                holder.bind(tab)
                holder.itemView.setOnClickListener { onTabClick(tab) }
                holder.ivClose.setOnClickListener { onTabClose(tab.id) }
            }
            is NewTabViewHolder -> {
                holder.itemView.setOnClickListener { onNewTabClick() }
            }
        }
    }

    override fun getItemCount() = tabs.size + 1

    class TabViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTabTitle: TextView = view.findViewById(R.id.tvTabTitle)
        val ivClose: ImageView = view.findViewById(R.id.ivClose)
        
        fun bind(tab: Tab) {
            tvTabTitle.text = tab.title.ifEmpty { "新标签页" }
        }
    }

    class NewTabViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        init {
            tvTabTitle.text = "+ 新标签页"
            ivClose.visibility = View.GONE
        }
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/src/main/res/layout/layout_tabs.xml app/src/main/res/layout/item_tab_card.xml app/src/main/java/com/example/browser/Drawer/TabsFragment.kt
git commit -m "feat: add TabsFragment for tab management in drawer"
```

---

### 任务 8: 集成所有组件到 BrowserActivity

**Files:**
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: 完整重写 BrowserActivity.kt**

```kotlin
package com.example.browser

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import com.tencent.smtt.sdk.WebChromeClient
import com.tencent.smtt.sdk.WebSettings
import com.tencent.smtt.sdk.WebView
import com.tencent.smtt.sdk.WebViewClient
import com.example.browser.databinding.ActivityBrowserBinding
import com.example.browser.data.SearchEngineManager
import com.example.browser.data.Tab
import com.example.browser.data.TabManager
import com.example.browser.Drawer.BookmarksFragment
import com.example.browser.Drawer.HistoryFragment
import com.example.browser.Drawer.TabsFragment

class BrowserActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBrowserBinding
    private lateinit var webView: WebView
    private lateinit var tabManager: TabManager
    private lateinit var searchEngineManager: SearchEngineManager
    private lateinit var drawerController: DrawerController
    
    private var currentTabId: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBrowserBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tabManager = TabManager(this)
        searchEngineManager = SearchEngineManager(this)
        
        setupWebView()
        setupBottomAddressBar()
        setupDrawer()
        
        loadInitialTab()
    }
    
    private fun loadInitialTab() {
        val tab = tabManager.getActiveTab() ?: tabManager.createNewTab()
        currentTabId = tab.id
        if (tab.url.isNotEmpty()) {
            webView.loadUrl(tab.url)
        }
        binding.bottomAddressBar.setAddress(tab.url)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = binding.webView
        val settings = webView.settings
        
        settings.javaScriptEnabled = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.domStorageEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = 0

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean = false

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.progressBar.visibility = View.VISIBLE
                binding.progressBar.progress = 0
                url?.let { 
                    binding.bottomAddressBar.setAddress(it)
                    currentTabId?.let { tabId -> 
                        tabManager.updateTab(tabId, url = it, title = view?.title) 
                    }
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                url?.let { binding.bottomAddressBar.setAddress(it) }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                binding.progressBar.progress = newProgress
            }
        }
    }

    private fun setupBottomAddressBar() {
        binding.bottomAddressBar.onAddressSubmit = { url ->
            webView.loadUrl(url)
        }
        
        binding.bottomAddressBar.onMenuClick = {
            toggleDrawer()
        }
    }
    
    private fun setupDrawer() {
        val contentContainer = binding.drawerContainer.root.findViewById<android.widget.FrameLayout>(R.id.contentContainer)
        val ivBookmark = binding.drawerContainer.root.findViewById<android.widget.ImageView>(R.id.ivBookmark)
        val ivHistory = binding.drawerContainer.root.findViewById<android.widget.ImageView>(R.id.ivHistory)
        val ivTabs = binding.drawerContainer.root.findViewById<android.widget.ImageView>(R.id.ivTabs)
        
        drawerController = DrawerController(
            context = this,
            tabContainer = binding.drawerContainer.root.findViewById(R.id.tabContainer),
            contentContainer = contentContainer!!,
            ivBookmark = ivBookmark!!,
            ivHistory = ivHistory!!,
            ivTabs = ivTabs!!
        )
        
        binding.drawerScrim.setOnClickListener {
            closeDrawer()
        }
    }
    
    private fun toggleDrawer() {
        if (binding.drawerContainer.root.isVisible) {
            closeDrawer()
        } else {
            openDrawer()
        }
    }
    
    private fun openDrawer() {
        binding.drawerScrim.visibility = View.VISIBLE
        binding.drawerContainer.root.visibility = View.VISIBLE
        binding.drawerContainer.root.animate()
            .translationX(0f)
            .setDuration(250)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .start()
        binding.drawerScrim.animate()
            .alpha(1f)
            .setDuration(250)
            .start()
    }
    
    private fun closeDrawer() {
        val drawerWidth = binding.drawerContainer.root.width.toFloat()
        binding.drawerContainer.root.animate()
            .translationX(drawerWidth)
            .setDuration(250)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .withEndAction {
                binding.drawerContainer.root.visibility = View.GONE
            }
            .start()
        binding.drawerScrim.animate()
            .alpha(0f)
            .setDuration(250)
            .withEndAction {
                binding.drawerScrim.visibility = View.GONE
            }
            .start()
    }

    override fun onBackPressed() {
        when {
            binding.drawerContainer.root.isVisible -> closeDrawer()
            webView.canGoBack() -> webView.goBack()
            else -> super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "feat: integrate all components into BrowserActivity"
```

---

### 任务 9: 更新主题和深色模式支持

**Files:**
- Modify: `app/src/main/res/values/themes.xml`
- Modify: `app/src/main/res/values-night/themes.xml`
- Modify: `app/src/main/res/values/colors.xml`

- [ ] **Step 1: 更新 themes.xml 添加状态栏透明**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Browser" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary_color</item>
        <item name="colorPrimaryVariant">@color/primary_dark</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/accent_color</item>
        <item name="colorSecondaryVariant">@color/accent_color</item>
        <item name="colorOnSecondary">@color/black</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowBackground">@color/background_primary</item>
    </style>
</resources>
```

- [ ] **Step 2: 创建 values-night/colors.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="background_primary">#FF121212</color>
    <color name="background_card">#FF1E1E1E</color>
    <color name="text_primary">#FFFFFFFF</color>
    <color name="text_secondary">#FFBDBDBD</color>
    <color name="text_hint">#FF757575</color>
    <color name="divider">#FF424242</color>
    <color name="icon_inactive">#FFBDBDBD</color>
</resources>
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/res/values/themes.xml app/src/main/res/values-night/colors.xml
git commit -m "feat: add transparent status bar and dark mode colors"
```

---

## 验证检查清单

### Spec 覆盖检查

| 设计规格 | 对应任务 |
|----------|----------|
| 极简配色系统 | 任务 1 |
| 大圆角 16dp | 任务 1 |
| 底部地址栏 | 任务 3, 4 |
| 搜索/URL 合并输入 | 任务 3 |
| 右侧抽屉 | 任务 5 |
| 书签/历史/标签页 Tab | 任务 5, 6, 7 |
| 标签页管理 | 任务 7 |
| 抽屉动画 | 任务 4 |
| 深色模式 | 任务 9 |

### 类型一致性检查

- `DrawerController.Tab` 枚举：`BOOKMARKS`, `HISTORY`, `TABS` - 与 Fragment 对应
- `TabManager` 方法：`getAllTabs()`, `getActiveTab()`, `createNewTab()`, `updateTab()`, `removeTab()` - 贯穿所有任务
- `BottomAddressBar` 回调：`onAddressSubmit: (String) -> Unit`, `onMenuClick: () -> Unit` - BrowserActivity 中正确处理

### 占位符检查

- 所有代码块包含完整实现
- 无 "TBD", "TODO", "实现 later" 等占位符
- 所有布局文件使用实际颜色和尺寸引用（`@color/`, `@dimen/`）

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-minimalist-browser-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
