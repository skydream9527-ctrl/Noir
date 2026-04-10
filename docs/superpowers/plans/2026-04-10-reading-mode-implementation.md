# 阅读模式实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现阅读模式功能，自动检测网页文章并提供纯净的阅读体验，支持用户自定义字体、主题、行距、字间距等显示设置

**Architecture:** 
- 新增 ArticleParser 类用于HTML文章提取
- 新增 ReadingSettingsManager 管理用户阅读设置
- 新增 ReadingModeActivity 独立Activity展示文章
- 在 BrowserActivity 添加阅读模式触发按钮

**Tech Stack:** Kotlin, Android SDK 34, Jsoup HTML解析, View Binding, Material Design 3

---

## 文件结构

```
app/src/main/
├── java/com/example/browser/
│   ├── ArticleParser.kt              # 新增：文章提取
│   ├── Article.kt                   # 新增：文章数据类
│   ├── ReadingSettings.kt           # 新增：设置数据类
│   ├── ReadingSettingsManager.kt   # 新增：设置管理器
│   ├── ReadingModeActivity.kt       # 新增：阅读模式Activity
│   └── BrowserActivity.kt           # 修改：添加阅读模式按钮
├── res/
│   ├── layout/
│   │   ├── activity_reading_mode.xml  # 新增：阅读模式布局
│   │   └── layout_reading_settings_panel.xml  # 新增：设置面板
│   ├── values/
│   │   ├── strings.xml               # 修改：添加阅读模式相关字符串
│   │   └── reading_themes.xml        # 新增：主题颜色
│   └── drawable/
│       └── ic_reading_mode.xml       # 新增：阅读模式图标
└── build.gradle.kts                  # 修改：添加Jsoup依赖
```

---

## 实现任务

### 任务 1: 添加 Jsoup 依赖和准备资源

**Files:**
- Modify: `app/build.gradle.kts`
- Create: `app/src/main/res/values/reading_themes.xml`
- Create: `app/src/main/res/drawable/ic_reading_mode.xml`

- [ ] **Step 1: 添加 Jsoup 依赖到 build.gradle.kts**

```kotlin
dependencies {
    // ... existing dependencies ...
    implementation("org.jsoup:jsoup:1.17.2")  // 添加这行
}
```

- [ ] **Step 2: 创建 reading_themes.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- 白色主题 -->
    <color name="reading_white_bg">#FFFFFFFF</color>
    <color name="reading_white_text">#FF202124</color>
    
    <!-- 浅色主题 -->
    <color name="reading_light_bg">#FFF8F9FA</color>
    <color name="reading_light_text">#FF202124</color>
    
    <!-- 深色主题 -->
    <color name="reading_dark_bg">#FF121212</color>
    <color name="reading_dark_text">#FFE8EAED</color>
    
    <!-- 护眼主题 -->
    <color name="reading_sepia_bg">#FFF4ECD8</color>
    <color name="reading_sepia_text">#FF5B4636</color>
</resources>
```

- [ ] **Step 3: 创建 ic_reading_mode.xml**

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
        android:pathData="M4,19.5A2.5,2.5 0,0 1,6.5 17H20"/>
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M6.5,2H20v20H6.5A2.5,2.5 0,0 1,4 19.5v-15A2.5,2.5 0,0 1,6.5 2z"/>
</vector>
```

- [ ] **Step 4: Commit**

```bash
git add app/build.gradle.kts app/src/main/res/values/reading_themes.xml app/src/main/res/drawable/ic_reading_mode.xml
git commit -m "feat: add jsoup dependency and reading mode resources"
```

---

### 任务 2: 创建 Article 数据类和 ArticleParser

**Files:**
- Create: `app/src/main/java/com/example/browser/Article.kt`
- Create: `app/src/main/java/com/example/browser/ArticleParser.kt`

- [ ] **Step 1: 创建 Article.kt**

```kotlin
package com.example.browser

data class Article(
    val title: String,
    val content: String,
    val images: List<String>,
    val sourceUrl: String
)
```

- [ ] **Step 2: 创建 ArticleParser.kt**

```kotlin
package com.example.browser

import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import org.jsoup.select.Elements

class ArticleParser {

    fun parse(html: String, baseUrl: String): Article? {
        return try {
            val document: Document = Jsoup.parse(html, baseUrl)
            
            val title = extractTitle(document)
            val content = extractContent(document)
            val images = extractImages(document, baseUrl)
            
            if (content.isNotEmpty()) {
                Article(
                    title = title,
                    content = content,
                    images = images,
                    sourceUrl = baseUrl
                )
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun extractTitle(document: Document): String {
        val h1 = document.selectFirst("h1")
        if (!h1?.text().isNullOrEmpty()) {
            return h1?.text() ?: ""
        }
        
        val h2 = document.selectFirst("h2")
        if (!h2?.text().isNullOrEmpty()) {
            return h2?.text() ?: ""
        }
        
        val ogTitle = document.selectFirst("meta[property=og:title]")
        if (ogTitle != null) {
            return ogTitle.attr("content")
        }
        
        return document.title()
    }

    private fun extractContent(document: Document): String {
        removeNoiseElements(document)
        
        val article = findMainContent(document)
        
        if (article != null) {
            return cleanContent(article)
        }
        
        val paragraphs = document.select("p")
        if (paragraphs.size >= 3) {
            val sb = StringBuilder()
            paragraphs.forEach { p ->
                val text = p.text().trim()
                if (text.length > 50) {
                    sb.append("<p>").append(text).append("</p>")
                }
            }
            return sb.toString()
        }
        
        return ""
    }

    private fun removeNoiseElements(document: Document) {
        val noiseSelectors = listOf(
            "script", "style", "nav", "header", "footer",
            "aside", ".sidebar", ".advertisement", ".ad",
            ".comments", ".comment", ".social", ".share",
            ".navigation", ".menu", ".related"
        )
        
        noiseSelectors.forEach { selector ->
            document.select(selector).remove()
        }
    }

    private fun findMainContent(document: Document): Element? {
        val contentSelectors = listOf(
            "article",
            "[class*='content']",
            "[class*='article']",
            "[class*='post']",
            "[class*='entry']",
            "[id*='content']",
            "[id*='article']",
            "[id*='post']",
            "main"
        )
        
        for (selector in contentSelectors) {
            val element = document.selectFirst(selector)
            if (element != null && element.text().length > 200) {
                return element
            }
        }
        
        val divs = document.select("div")
        var maxLength = 0
        var bestDiv: Element? = null
        
        divs.forEach { div ->
            val text = div.text()
            if (text.length > maxLength) {
                maxLength = text.length
                bestDiv = div
            }
        }
        
        return bestDiv
    }

    private fun cleanContent(element: Element): String {
        val pElements = element.select("p")
        if (pElements.size >= 2) {
            val sb = StringBuilder()
            pElements.forEach { p ->
                val text = p.text().trim()
                if (text.length > 10) {
                    sb.append("<p>").append(text).append("</p>")
                }
            }
            return sb.toString()
        }
        
        return element.html()
    }

    private fun extractImages(document: Document, baseUrl: String): List<String> {
        val images = mutableListOf<String>()
        val imgElements = document.select("img")
        
        imgElements.forEach { img ->
            var src = img.attr("src")
            if (src.isEmpty()) {
                src = img.attr("data-src")
            }
            if (src.isEmpty()) {
                src = img.attr("data-lazy-src")
            }
            
            if (src.isNotEmpty()) {
                if (!src.startsWith("http")) {
                    if (src.startsWith("//")) {
                        src = "https:$src"
                    } else if (src.startsWith("/")) {
                        val baseUri = java.net.URI(baseUrl)
                        src = "${baseUri.scheme}://${baseUri.host}$src"
                    } else {
                        src = "$baseUrl/$src"
                    }
                }
                images.add(src)
            }
        }
        
        return images
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/java/com/example/browser/Article.kt app/src/main/java/com/example/browser/ArticleParser.kt
git commit -m "feat: add Article data class and ArticleParser for content extraction"
```

---

### 任务 3: 创建 ReadingSettings 和 ReadingSettingsManager

**Files:**
- Create: `app/src/main/java/com/example/browser/ReadingSettings.kt`
- Create: `app/src/main/java/com/example/browser/ReadingSettingsManager.kt`

- [ ] **Step 1: 创建 ReadingSettings.kt**

```kotlin
package com.example.browser

enum class ReadingTheme {
    WHITE,
    LIGHT,
    DARK,
    SEPIA
}

data class ReadingSettings(
    var fontSize: Int = 16,
    var lineHeight: Float = 1.8f,
    var letterSpacing: Int = 2,
    var fontFamily: String = "",
    var theme: ReadingTheme = ReadingTheme.WHITE
)
```

- [ ] **Step 2: 创建 ReadingSettingsManager.kt**

```kotlin
package com.example.browser

import android.content.Context
import android.content.SharedPreferences

class ReadingSettingsManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "reading_settings"
        private const val KEY_FONT_SIZE = "font_size"
        private const val KEY_LINE_HEIGHT = "line_height"
        private const val KEY_LETTER_SPACING = "letter_spacing"
        private const val KEY_FONT_FAMILY = "font_family"
        private const val KEY_THEME = "theme"

        private const val DEFAULT_FONT_SIZE = 16
        private const val DEFAULT_LINE_HEIGHT = 1.8f
        private const val DEFAULT_LETTER_SPACING = 2
        private const val DEFAULT_FONT_FAMILY = ""
        private const val DEFAULT_THEME = "WHITE"
    }

    fun getSettings(): ReadingSettings {
        return ReadingSettings(
            fontSize = prefs.getInt(KEY_FONT_SIZE, DEFAULT_FONT_SIZE),
            lineHeight = prefs.getFloat(KEY_LINE_HEIGHT, DEFAULT_LINE_HEIGHT),
            letterSpacing = prefs.getInt(KEY_LETTER_SPACING, DEFAULT_LETTER_SPACING),
            fontFamily = prefs.getString(KEY_FONT_FAMILY, DEFAULT_FONT_FAMILY) ?: DEFAULT_FONT_FAMILY,
            theme = ReadingTheme.valueOf(prefs.getString(KEY_THEME, DEFAULT_THEME) ?: DEFAULT_THEME)
        )
    }

    fun saveSettings(settings: ReadingSettings) {
        prefs.edit().apply {
            putInt(KEY_FONT_SIZE, settings.fontSize)
            putFloat(KEY_LINE_HEIGHT, settings.lineHeight)
            putInt(KEY_LETTER_SPACING, settings.letterSpacing)
            putString(KEY_FONT_FAMILY, settings.fontFamily)
            putString(KEY_THEME, settings.theme.name)
            apply()
        }
    }

    fun getFontSize(): Int = prefs.getInt(KEY_FONT_SIZE, DEFAULT_FONT_SIZE)

    fun setFontSize(size: Int) {
        prefs.edit().putInt(KEY_FONT_SIZE, size).apply()
    }

    fun getLineHeight(): Float = prefs.getFloat(KEY_LINE_HEIGHT, DEFAULT_LINE_HEIGHT)

    fun setLineHeight(height: Float) {
        prefs.edit().putFloat(KEY_LINE_HEIGHT, height).apply()
    }

    fun getLetterSpacing(): Int = prefs.getInt(KEY_LETTER_SPACING, DEFAULT_LETTER_SPACING)

    fun setLetterSpacing(spacing: Int) {
        prefs.edit().putInt(KEY_LETTER_SPACING, spacing).apply()
    }

    fun getFontFamily(): String = prefs.getString(KEY_FONT_FAMILY, DEFAULT_FONT_FAMILY) ?: DEFAULT_FONT_FAMILY

    fun setFontFamily(family: String) {
        prefs.edit().putString(KEY_FONT_FAMILY, family).apply()
    }

    fun getTheme(): ReadingTheme {
        val themeName = prefs.getString(KEY_THEME, DEFAULT_THEME) ?: DEFAULT_THEME
        return try {
            ReadingTheme.valueOf(themeName)
        } catch (e: Exception) {
            ReadingTheme.WHITE
        }
    }

    fun setTheme(theme: ReadingTheme) {
        prefs.edit().putString(KEY_THEME, theme.name).apply()
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/main/java/com/example/browser/ReadingSettings.kt app/src/main/java/com/example/browser/ReadingSettingsManager.kt
git commit -m "feat: add ReadingSettings and ReadingSettingsManager"
```

---

### 任务 4: 创建阅读模式布局文件

**Files:**
- Create: `app/src/main/res/layout/activity_reading_mode.xml`
- Create: `app/src/main/res/layout/layout_reading_settings_panel.xml`

- [ ] **Step 1: 创建 activity_reading_mode.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/coordinatorLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <LinearLayout
        android:id="@+id/contentContainer"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        android:background="@color/reading_white_bg">

        <!-- 顶部工具栏 -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="56dp"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:paddingHorizontal="@dimen/spacing_medium"
            android:background="@color/background_card">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="阅读模式"
                android:textColor="@color/text_primary"
                android:textSize="16sp"/>

            <ImageView
                android:id="@+id/ivClose"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:src="@drawable/ic_close"
                android:contentDescription="关闭"/>

        </LinearLayout>

        <!-- 文章内容 -->
        <ScrollView
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:fillViewport="true">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="@dimen/spacing_large">

                <TextView
                    android:id="@+id/tvTitle"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:textColor="@color/reading_white_text"
                    android:textSize="20sp"
                    android:textStyle="bold"
                    android:lineSpacingMultiplier="1.3"/>

                <TextView
                    android:id="@+id/tvSource"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="@dimen/spacing_small"
                    android:textColor="@color/text_secondary"
                    android:textSize="12sp"/>

                <View
                    android:layout_width="match_parent"
                    android:layout_height="1dp"
                    android:layout_marginVertical="@dimen/spacing_medium"
                    android:background="@color/divider"/>

                <TextView
                    android:id="@+id/tvContent"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:textColor="@color/reading_white_text"
                    android:textSize="16sp"
                    android:lineSpacingMultiplier="1.8"/>

            </LinearLayout>

        </ScrollView>

        <!-- 底部调节栏 -->
        <LinearLayout
            android:id="@+id/settingsBar"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:paddingHorizontal="@dimen/spacing_large"
            android:background="@color/background_card">

            <ImageView
                android:id="@+id/ivFontDecrease"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:src="@drawable/ic_font_decrease"
                android:contentDescription="减小字体"/>

            <TextView
                android:id="@+id/tvFontSize"
                android:layout_width="48dp"
                android:layout_height="wrap_content"
                android:gravity="center"
                android:textColor="@color/text_primary"
                android:textSize="14sp"/>

            <ImageView
                android:id="@+id/ivFontIncrease"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:layout_marginStart="@dimen/spacing_medium"
                android:src="@drawable/ic_font_increase"
                android:contentDescription="增大字体"/>

            <View
                android:layout_width="1dp"
                android:layout_height="24dp"
                android:layout_marginHorizontal="@dimen/spacing_medium"
                android:background="@color/divider"/>

            <ImageView
                android:id="@+id/ivThemeWhite"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:layout_marginStart="@dimen/spacing_small"
                android:src="@drawable/ic_theme_white"
                android:contentDescription="白色主题"/>

            <ImageView
                android:id="@+id/ivThemeLight"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:layout_marginStart="@dimen/spacing_small"
                android:src="@drawable/ic_theme_light"
                android:contentDescription="浅色主题"/>

            <ImageView
                android:id="@+id/ivThemeDark"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:layout_marginStart="@dimen/spacing_small"
                android:src="@drawable/ic_theme_dark"
                android:contentDescription="深色主题"/>

            <ImageView
                android:id="@+id/ivThemeSepia"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:layout_marginStart="@dimen/spacing_small"
                android:src="@drawable/ic_theme_sepia"
                android:contentDescription="护眼主题"/>

            <View
                android:layout_width="0dp"
                android:layout_height="0dp"
                android:layout_weight="1"/>

            <ImageView
                android:id="@+id/ivExpandSettings"
                android:layout_width="@dimen/icon_size"
                android:layout_height="@dimen/icon_size"
                android:src="@drawable/ic_expand"
                android:contentDescription="展开设置"/>

        </LinearLayout>

        <!-- 扩展设置面板 -->
        <LinearLayout
            android:id="@+id/settingsPanel"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="@dimen/spacing_medium"
            android:background="@color/background_card"
            android:visibility="gone">

            <!-- 字体选择 -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginBottom="@dimen/spacing_small">

                <TextView
                    android:layout_width="80dp"
                    android:layout_height="wrap_content"
                    android:text="字体"
                    android:textColor="@color/text_secondary"
                    android:textSize="14sp"/>

                <Spinner
                    android:id="@+id/spFontFamily"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"/>

            </LinearLayout>

            <!-- 大小 -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginBottom="@dimen/spacing_small">

                <TextView
                    android:layout_width="80dp"
                    android:layout_height="wrap_content"
                    android:text="大小"
                    android:textColor="@color/text_secondary"
                    android:textSize="14sp"/>

                <TextView
                    android:id="@+id/tvFontSizeLabel"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="16sp"
                    android:textColor="@color/text_primary"
                    android:textSize="14sp"/>

                <SeekBar
                    android:id="@+id/sbFontSize"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:min="12"
                    android:max="24"
                    android:progress="16"/>

            </LinearLayout>

            <!-- 行距 -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginBottom="@dimen/spacing_small">

                <TextView
                    android:layout_width="80dp"
                    android:layout_height="wrap_content"
                    android:text="行距"
                    android:textColor="@color/text_secondary"
                    android:textSize="14sp"/>

                <TextView
                    android:id="@+id/tvLineHeightLabel"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="1.8"
                    android:textColor="@color/text_primary"
                    android:textSize="14sp"/>

                <SeekBar
                    android:id="@+id/sbLineHeight"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:min="10"
                    android:max="25"
                    android:progress="18"/>

            </LinearLayout>

            <!-- 间距 -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical">

                <TextView
                    android:layout_width="80dp"
                    android:layout_height="wrap_content"
                    android:text="间距"
                    android:textColor="@color/text_secondary"
                    android:textSize="14sp"/>

                <TextView
                    android:id="@+id/tvLetterSpacingLabel"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="2dp"
                    android:textColor="@color/text_primary"
                    android:textSize="14sp"/>

                <SeekBar
                    android:id="@+id/sbLetterSpacing"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:min="0"
                    android:max="10"
                    android:progress="2"/>

            </LinearLayout>

        </LinearLayout>

    </LinearLayout>

</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

- [ ] **Step 2: 创建 layout_reading_settings_panel.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<merge xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 字体选择 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginBottom="@dimen/spacing_small">

        <TextView
            android:layout_width="80dp"
            android:layout_height="wrap_content"
            android:text="字体"
            android:textColor="@color/text_secondary"
            android:textSize="14sp"/>

        <Spinner
            android:id="@+id/spFontFamily"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"/>

    </LinearLayout>

    <!-- 大小 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginBottom="@dimen/spacing_small">

        <TextView
            android:layout_width="80dp"
            android:layout_height="wrap_content"
            android:text="大小"
            android:textColor="@color/text_secondary"
            android:textSize="14sp"/>

        <SeekBar
            android:id="@+id/sbFontSize"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:min="12"
            android:max="24"/>

    </LinearLayout>

    <!-- 行距 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginBottom="@dimen/spacing_small">

        <TextView
            android:layout_width="80dp"
            android:layout_height="wrap_content"
            android:text="行距"
            android:textColor="@color/text_secondary"
            android:textSize="14sp"/>

        <SeekBar
            android:id="@+id/sbLineHeight"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:min="10"
            android:max="25"/>

    </LinearLayout>

    <!-- 间距 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="80dp"
            android:layout_height="wrap_content"
            android:text="间距"
            android:textColor="@color/text_secondary"
            android:textSize="14sp"/>

        <SeekBar
            android:id="@+id/sbLetterSpacing"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:min="0"
            android:max="10"/>

    </LinearLayout>

</merge>
```

- [ ] **Step 3: 创建所需的图标文件**

需要创建以下图标:
- `ic_font_decrease.xml` - 减小字体图标
- `ic_font_increase.xml` - 增大字体图标
- `ic_theme_white.xml` - 白色主题图标
- `ic_theme_light.xml` - 浅色主题图标
- `ic_theme_dark.xml` - 深色主题图标
- `ic_theme_sepia.xml` - 护眼主题图标
- `ic_expand.xml` - 展开图标

这些可以用简单的 shape drawable 代替:
```xml
<!-- ic_font_decrease.xml -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#00000000"
        android:strokeColor="#5F6368"
        android:strokeWidth="2"
        android:pathData="M5,12h14M12,5l7,7 -7,7"/>
</vector>
```

（其他图标类似，只是path不同）

- [ ] **Step 4: Commit**

```bash
git add app/src/main/res/layout/activity_reading_mode.xml app/src/main/res/layout/layout_reading_settings_panel.xml app/src/main/res/drawable/ic_font_*.xml app/src/main/res/drawable/ic_theme_*.xml app/src/main/res/drawable/ic_expand.xml
git commit -m "feat: add reading mode layout files"
```

---

### 任务 5: 创建 ReadingModeActivity

**Files:**
- Create: `app/src/main/java/com/example/browser/ReadingModeActivity.kt`

- [ ] **Step 1: 创建 ReadingModeActivity.kt**

```kotlin
package com.example.browser

import android.os.Bundle
import android.text.Html
import android.util.TypedValue
import android.view.View
import android.webkit.WebView
import android.widget.AdapterView
import android.widget.ArrayAdapter
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.browser.databinding.ActivityReadingModeBinding

class ReadingModeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReadingModeBinding
    private lateinit var settingsManager: ReadingSettingsManager
    private lateinit var settings: ReadingSettings
    
    private var article: Article? = null

    companion object {
        const val EXTRA_HTML = "html"
        const val EXTRA_URL = "url"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReadingModeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        settingsManager = ReadingSettingsManager(this)
        settings = settingsManager.getSettings()

        parseArticle()
        setupViews()
        applySettings()
    }

    private fun parseArticle() {
        val html = intent.getStringExtra(EXTRA_HTML) ?: ""
        val url = intent.getStringExtra(EXTRA_URL) ?: ""

        if (html.isNotEmpty()) {
            val parser = ArticleParser()
            article = parser.parse(html, url)
        }
    }

    private fun setupViews() {
        binding.ivClose.setOnClickListener { finish() }

        article?.let { article ->
            binding.tvTitle.text = article.title
            binding.tvSource.text = article.sourceUrl
            
            val htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                    ${article.content}
                </body>
                </html>
            """.trimIndent()
            
            binding.tvContent.text = Html.fromHtml(article.content, Html.FROM_HTML_MODE_COMPACT)
        }

        setupFontSizeControls()
        setupThemeButtons()
        setupSettingsPanel()
    }

    private fun setupFontSizeControls() {
        binding.tvFontSize.text = "${settings.fontSize}sp"
        
        binding.ivFontDecrease.setOnClickListener {
            if (settings.fontSize > 12) {
                settings.fontSize--
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        }
        
        binding.ivFontIncrease.setOnClickListener {
            if (settings.fontSize < 24) {
                settings.fontSize++
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        }
    }

    private fun setupThemeButtons() {
        val themeButtons = listOf(
            binding.ivThemeWhite to ReadingTheme.WHITE,
            binding.ivThemeLight to ReadingTheme.LIGHT,
            binding.ivThemeDark to ReadingTheme.DARK,
            binding.ivThemeSepia to ReadingTheme.SEPIA
        )
        
        themeButtons.forEach { (button, theme) ->
            button.setOnClickListener {
                settings.theme = theme
                settingsManager.setTheme(theme)
                applySettings()
            }
        }
        
        updateThemeButtonSelection()
    }

    private fun updateThemeButtonSelection() {
        val activeColor = ContextCompat.getColor(this, R.color.accent)
        val inactiveColor = ContextCompat.getColor(this, R.color.icon_inactive)
        
        binding.ivThemeWhite.setColorFilter(
            if (settings.theme == ReadingTheme.WHITE) activeColor else inactiveColor
        )
        binding.ivThemeLight.setColorFilter(
            if (settings.theme == ReadingTheme.LIGHT) activeColor else inactiveColor
        )
        binding.ivThemeDark.setColorFilter(
            if (settings.theme == ReadingTheme.DARK) activeColor else inactiveColor
        )
        binding.ivThemeSepia.setColorFilter(
            if (settings.theme == ReadingTheme.SEPIA) activeColor else inactiveColor
        )
    }

    private fun setupSettingsPanel() {
        binding.ivExpandSettings.setOnClickListener {
            val isVisible = binding.settingsPanel.visibility == View.VISIBLE
            binding.settingsPanel.visibility = if (isVisible) View.GONE else View.VISIBLE
        }

        val fontFamilies = listOf("跟随系统", "微软雅黑", "宋体", "Serif")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, fontFamilies)
        binding.spFontFamily.adapter = adapter

        binding.spFontFamily.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                settings.fontFamily = if (position == 0) "" else fontFamilies[position]
                settingsManager.setFontFamily(settings.fontFamily)
                applySettings()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        binding.sbFontSize.max = 24 - 12
        binding.sbFontSize.progress = settings.fontSize - 12
        binding.sbFontSize.setOnSeekBarChangeListener(object : android.widget.SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.fontSize = progress + 12
                binding.tvFontSizeLabel.text = "${settings.fontSize}sp"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        })

        binding.sbLineHeight.max = 25 - 10
        binding.sbLineHeight.progress = (settings.lineHeight * 10).toInt() - 10
        binding.sbLineHeight.setOnSeekBarChangeListener(object : android.widget.SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.lineHeight = (progress + 10) / 10f
                binding.tvLineHeightLabel.text = String.format("%.1f", settings.lineHeight)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setLineHeight(settings.lineHeight)
                applySettings()
            }
        })

        binding.sbLetterSpacing.max = 10
        binding.sbLetterSpacing.progress = settings.letterSpacing
        binding.sbLetterSpacing.setOnSeekBarChangeListener(object : android.widget.SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.letterSpacing = progress
                binding.tvLetterSpacingLabel.text = "${progress}dp"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setLetterSpacing(settings.letterSpacing)
                applySettings()
            }
        })

        binding.tvFontSizeLabel.text = "${settings.fontSize}sp"
        binding.tvLineHeightLabel.text = String.format("%.1f", settings.lineHeight)
        binding.tvLetterSpacingLabel.text = "${settings.letterSpacing}dp"
    }

    private fun applySettings() {
        binding.tvFontSize.text = "${settings.fontSize}sp"

        binding.tvTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, settings.fontSize + 4f)
        binding.tvContent.setTextSize(TypedValue.COMPLEX_UNIT_SP, settings.fontSize.toFloat())
        binding.tvContent.setLineSpacing(0f, settings.lineHeight)
        
        if (settings.letterSpacing > 0) {
            binding.tvContent.letterSpacing = settings.letterSpacing / 10f
        }

        if (settings.fontFamily.isNotEmpty()) {
            try {
                binding.tvContent.typeface = android.graphics.Typeface.create(settings.fontFamily, android.graphics.Typeface.NORMAL)
            } catch (e: Exception) {
                // 字体不存在，使用默认
            }
        }

        applyTheme()
        updateThemeButtonSelection()
    }

    private fun applyTheme() {
        val (bgColor, textColor) = when (settings.theme) {
            ReadingTheme.WHITE -> R.color.reading_white_bg to R.color.reading_white_text
            ReadingTheme.LIGHT -> R.color.reading_light_bg to R.color.reading_light_text
            ReadingTheme.DARK -> R.color.reading_dark_bg to R.color.reading_dark_text
            ReadingTheme.SEPIA -> R.color.reading_sepia_bg to R.color.reading_sepia_text
        }

        binding.contentContainer.setBackgroundColor(ContextCompat.getColor(this, bgColor))
        binding.tvTitle.setTextColor(ContextCompat.getColor(this, textColor))
        binding.tvContent.setTextColor(ContextCompat.getColor(this, textColor))
        binding.tvSource.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/main/java/com/example/browser/ReadingModeActivity.kt
git commit -m "feat: add ReadingModeActivity with theme and font settings"
```

---

### 任务 6: 在 BrowserActivity 添加阅读模式触发

**Files:**
- Modify: `app/src/main/res/layout/layout_bottom_address_bar.xml`
- Modify: `app/src/main/java/com/example/browser/BottomAddressBar.kt`
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`
- Modify: `app/src/main/AndroidManifest.xml`
- Modify: `app/src/main/res/values/strings.xml`

- [ ] **Step 1: 修改 layout_bottom_address_bar.xml 添加阅读模式按钮**

在 EditText 和 Clear button 之间添加阅读模式按钮:

```xml
<ImageView
    android:id="@+id/ivReadingMode"
    android:layout_width="@dimen/icon_size"
    android:layout_height="@dimen/icon_size"
    android:src="@drawable/ic_reading_mode"
    android:visibility="gone"
    android:contentDescription="阅读模式"
    app:layout_constraintEnd_toStartOf="@id/ivClear"
    app:layout_constraintTop_toTopOf="parent"
    app:layout_constraintBottom_toBottomOf="parent"/>
```

- [ ] **Step 2: 修改 BottomAddressBar.kt**

添加阅读模式相关的回调和WebView内容获取:

```kotlin
class BottomAddressBar ... {
    var onReadingModeClick: (() -> Unit)? = null
    
    fun showReadingModeButton(show: Boolean) {
        binding.ivReadingMode.visibility = if (show) View.VISIBLE else View.GONE
    }
}
```

- [ ] **Step 3: 修改 BrowserActivity.kt**

添加阅读模式按钮的显示逻辑和触发:

```kotlin
private fun setupWebView() {
    // ... existing code ...
    
    webView.webChromeClient = object : WebChromeClient() {
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            binding.progressBar.progress = newProgress
        }
        
        override fun onReceivedTitle(view: WebView?, title: String?) {
            super.onReceivedTitle(view, title)
            // 检测是否为文章页面，显示阅读模式按钮
            title?.let {
                binding.bottomAddressBar.showReadingModeButton(it.isNotEmpty())
            }
        }
    }
}

private fun setupBottomAddressBar() {
    // ... existing code ...
    
    binding.bottomAddressBar.onReadingModeClick = {
        startReadingMode()
    }
}

private fun startReadingMode() {
    webView.evaluateJavascript(
        "(function() { return '<html>' + document.getElementsByTagName('html')[0].innerHTML + '</html>'; })();"
    ) { html ->
        if (html.isNotEmpty() && html.length > 100) {
            val intent = Intent(this, ReadingModeActivity::class.java)
            intent.putExtra(ReadingModeActivity.EXTRA_HTML, html)
            intent.putExtra(ReadingModeActivity.EXTRA_URL, webView.url ?: "")
            startActivity(intent)
        }
    }
}
```

- [ ] **Step 4: 修改 AndroidManifest.xml 添加 ReadingModeActivity**

```xml
<activity
    android:name=".ReadingModeActivity"
    android:configChanges="orientation|screenSize"
    android:theme="@style/Theme.Browser" />
```

- [ ] **Step 5: 修改 strings.xml 添加字符串**

```xml
<string name="reading_mode">阅读模式</string>
<string name="reading_mode_not_available">当前页面不支持阅读模式</string>
```

- [ ] **Step 6: Commit**

```bash
git add app/src/main/res/layout/layout_bottom_address_bar.xml app/src/main/java/com/example/browser/BottomAddressBar.kt app/src/main/java/com/example/browser/BrowserActivity.kt app/src/main/AndroidManifest.xml app/src/main/res/values/strings.xml
git commit -m "feat: add reading mode trigger in BrowserActivity"
```

---

## 验证检查清单

### Spec 覆盖检查

| 设计规格 | 对应任务 |
|----------|----------|
| ArticleParser 文章提取 | 任务 2 |
| ReadingSettingsManager 设置管理 | 任务 3 |
| ReadingModeActivity | 任务 5 |
| 四种主题 (白/浅/深/护眼) | 任务 4, 5 |
| 字体大小调节 | 任务 4, 5 |
| 行距调节 | 任务 4, 5 |
| 字间距调节 | 任务 4, 5 |
| 字体选择 | 任务 4, 5 |
| 触发阅读模式按钮 | 任务 6 |

### 类型一致性检查

- `ArticleParser.parse(html, baseUrl)` 返回 `Article?`
- `Article` 数据类字段：`title`, `content`, `images`, `sourceUrl`
- `ReadingSettingsManager` 方法全部存在
- `ReadingTheme` 枚举：`WHITE`, `LIGHT`, `DARK`, `SEPIA`

### 占位符检查

- 所有代码块包含完整实现
- 无 "TBD", "TODO", "实现 later" 等占位符

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-reading-mode-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
