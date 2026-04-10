# 广告拦截功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 DNS 域名拦截 + 网页内容过滤双重广告拦截功能

**Architecture:** 
- DNS 拦截层在网络请求层面阻止广告域名
- 内容过滤层通过 WebView JS 注入隐藏广告元素
- AdBlockManager 统一协调两部分

**Tech Stack:** Kotlin, SharedPreferences, WebView JS 注入, X5 WebView

---

## 文件结构

```
app/src/main/java/com/example/browser/
├── AdBlockSettings.kt          # 广告拦截设置数据类
├── AdBlockManager.kt           # 主管理类，协调 DNS 和内容拦截
├── DnsBlocker.kt               # DNS 域名拦截
├── ContentBlocker.kt           # 内容过滤（JS 注入）
├── AdBlockRulesManager.kt      # 规则管理
└── AdBlock/
    └── AdBlockSettingsFragment.kt  # 设置页面（集成在抽屉中）

app/src/main/assets/adblock/
├── dns_rules.txt               # DNS 拦截规则
└── content_rules.txt           # 内容过滤规则

app/src/main/res/layout/
├── fragment_ad_block_settings.xml  # 设置页面布局
└── item_trusted_site.xml           # 信任网站列表项
```

---

## 实现任务

### Task 1: 创建 AdBlockSettings 数据类

**Files:**
- Create: `app/src/main/java/com/example/browser/AdBlockSettings.kt`

- [ ] **Step 1: 创建数据类**

```kotlin
package com.example.browser

data class AdBlockSettings(
    val enabled: Boolean = true,
    val trustedSites: Set<String> = emptySet(),
    val lastUpdateTime: Long = 0
)

data class SiteSettings(
    val site: String,
    val adBlockEnabled: Boolean = true
)
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/AdBlockSettings.kt
git commit -m "feat: add AdBlockSettings data class"
```

---

### Task 2: 创建 AdBlockRulesManager 规则管理类

**Files:**
- Create: `app/src/main/java/com/example/browser/AdBlockRulesManager.kt`

- [ ] **Step 1: 创建规则管理类**

```kotlin
package com.example.browser

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader

class AdBlockRulesManager(private val context: Context) {
    
    private var dnsRules: Set<String> = emptySet()
    private var contentRules: List<String> = emptyList()
    
    init {
        loadRules()
    }
    
    private fun loadRules() {
        dnsRules = loadDnsRules()
        contentRules = loadContentRules()
    }
    
    private fun loadDnsRules(): Set<String> {
        return try {
            context.assets.open("adblock/dns_rules.txt").use { inputStream ->
                BufferedReader(InputStreamReader(inputStream)).use { reader ->
                    reader.lineSequence()
                        .filter { it.isNotBlank() && !it.startsWith("!") && !it.startsWith("[") }
                        .map { it.trim() }
                        .toSet()
                }
            }
        } catch (e: Exception) {
            emptySet()
        }
    }
    
    private fun loadContentRules(): List<String> {
        return try {
            context.assets.open("adblock/content_rules.txt").use { inputStream ->
                BufferedReader(InputStreamReader(inputStream)).use { reader ->
                    reader.lineSequence()
                        .filter { it.isNotBlank() && !it.startsWith("!") && !it.startsWith("[") }
                        .map { it.trim() }
                        .toList()
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun getDnsRulesCount(): Int = dnsRules.size
    
    fun getContentRulesCount(): Int = contentRules.size
    
    fun matchesDnsRule(url: String): Boolean {
        val host = try {
            java.net.URL(url).host
        } catch (e: Exception) {
            return false
        }
        return dnsRules.any { rule ->
            val pattern = rule.removePrefix("||").removeSuffix("^")
            host == pattern || host.endsWith(".$pattern")
        }
    }
    
    fun getContentBlockerScript(): String {
        if (contentRules.isEmpty()) return ""
        
        val selectors = contentRules.joinToString(",\n") { rule ->
            if (rule.startsWith("##")) {
                rule.removePrefix("##")
            } else if (rule.startsWith("###")) {
                rule.removePrefix("###")
            } else {
                return@joinToString ""
            }
        }.filter { it.isNotEmpty() }
        
        return """
            (function() {
                var style = document.createElement('style');
                style.innerHTML = '$selectors { display: none !important; visibility: hidden !important; }';
                document.head.appendChild(style);
            })();
        """.trimIndent()
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/AdBlockRulesManager.kt
git commit -m "feat: add AdBlockRulesManager for rules loading and matching"
```

---

### Task 3: 创建 DnsBlocker DNS 拦截类

**Files:**
- Create: `app/src/main/java/com/example/browser/DnsBlocker.kt`

- [ ] **Step 1: 创建 DNS 拦截类**

```kotlin
package com.example.browser

class DnsBlocker(private val rulesManager: AdBlockRulesManager) {
    
    fun shouldBlockUrl(url: String): Boolean {
        return rulesManager.matchesDnsRule(url)
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/DnsBlocker.kt
git commit -m "feat: add DnsBlocker for URL blocking"
```

---

### Task 4: 创建 ContentBlocker 内容过滤类

**Files:**
- Create: `app/src/main/java/com/example/browser/ContentBlocker.kt`

- [ ] **Step 1: 创建内容过滤类**

```kotlin
package com.example.browser

class ContentBlocker(private val rulesManager: AdBlockRulesManager) {
    
    fun getBlockingScript(): String {
        return rulesManager.getContentBlockerScript()
    }
    
    fun shouldInjectScript(): Boolean {
        return rulesManager.getContentRulesCount() > 0
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/ContentBlocker.kt
git commit -m "feat: add ContentBlocker for JS injection"
```

---

### Task 5: 创建 AdBlockManager 主管理类

**Files:**
- Create: `app/src/main/java/com/example/browser/AdBlockManager.kt`

- [ ] **Step 1: 创建主管理类**

```kotlin
package com.example.browser

import android.content.Context
import android.content.SharedPreferences

class AdBlockManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val rulesManager = AdBlockRulesManager(context)
    private val dnsBlocker = DnsBlocker(rulesManager)
    private val contentBlocker = ContentBlocker(rulesManager)
    
    companion object {
        private const val PREFS_NAME = "ad_block_settings"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_TRUSTED_SITES = "trusted_sites"
        private const val KEY_LAST_UPDATE = "last_update"
    }
    
    fun isEnabled(): Boolean = prefs.getBoolean(KEY_ENABLED, true)
    
    fun setEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isSiteBlocked(site: String): Boolean {
        val trustedSites = getTrustedSites()
        return site !in trustedSites
    }
    
    fun getTrustedSites(): Set<String> {
        return prefs.getStringSet(KEY_TRUSTED_SITES, emptySet()) ?: emptySet()
    }
    
    fun addTrustedSite(site: String) {
        val sites = getTrustedSites().toMutableSet()
        sites.add(site)
        prefs.edit().putStringSet(KEY_TRUSTED_SITES, sites).apply()
    }
    
    fun removeTrustedSite(site: String) {
        val sites = getTrustedSites().toMutableSet()
        sites.remove(site)
        prefs.edit().putStringSet(KEY_TRUSTED_SITES, sites).apply()
    }
    
    fun shouldBlockRequest(url: String): Boolean {
        if (!isEnabled()) return false
        val host = try {
            java.net.URL(url).host
        } catch (e: Exception) {
            return false
        }
        if (!isSiteBlocked(host)) return false
        return dnsBlocker.shouldBlockUrl(url)
    }
    
    fun getContentBlockerScript(): String {
        if (!isEnabled()) return ""
        return contentBlocker.getBlockingScript()
    }
    
    fun shouldInjectContentScript(): Boolean {
        return isEnabled() && contentBlocker.shouldInjectScript()
    }
    
    fun getRulesCount(): Pair<Int, Int> {
        return Pair(rulesManager.getDnsRulesCount(), rulesManager.getContentRulesCount())
    }
    
    fun getLastUpdateTime(): Long = prefs.getLong(KEY_LAST_UPDATE, 0)
    
    fun updateRules() {
        prefs.edit().putLong(KEY_LAST_UPDATE, System.currentTimeMillis()).apply()
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/AdBlockManager.kt
git commit -m "feat: add AdBlockManager coordinating DNS and content blocking"
```

---

### Task 6: 创建规则文件

**Files:**
- Create: `app/src/main/assets/adblock/dns_rules.txt`
- Create: `app/src/main/assets/adblock/content_rules.txt`

- [ ] **Step 1: 创建 DNS 规则文件**

```
||doubleclick.net^
||googlesyndication.com^
||googleadservices.com^
||googleads.g.doubleclick.net^
||pagead2.googlesyndication.com^
||adservice.google.com^
||ads.facebook.com^
||pixel.facebook.com^
||advertising.com^
||adnxs.com^
||rubiconproject.com^
||pubmatic.com^
||openx.net^
||criteo.com^
||outbrain.com^
||taboola.com^
||mgid.com^
||disqus.com^ads^
||baidu.com^ad^
||taobao.com^ad^
||alibaba.com^ad^
||jd.com^ad^
||pinduoduo.com^ad^
||bytedance.com^ad^
||toutiao.com^ad^
```

- [ ] **Step 2: 创建内容过滤规则文件**

```
##.ad-container
##.advertisement
##.ad-wrapper
##.ad-banner
###banner-ad
##[class*="ad-"]
##[id*="ad-"]
##.sidebar-ad
##.footer-ad
##.header-ad
##[class*="advertisement"]
##[id*="advertisement"]
##[class*="google-ad"]
##[id*="google-ad"]
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/assets/adblock/
git commit -m "feat: add ad block rule files"
```

---

### Task 7: 创建设置页面布局

**Files:**
- Create: `app/src/main/res/layout/fragment_ad_block_settings.xml`
- Create: `app/src/main/res/layout/item_trusted_site.xml`

- [ ] **Step 1: 创建设置页面布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/surface">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="16dp"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="启用广告拦截"
            android:textSize="16sp"
            android:textColor="@color/text_primary"/>

        <androidx.appcompat.widget.SwitchCompat
            android:id="@+id/switchAdBlock"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"/>
    </LinearLayout>

    <View
        android:layout_width="match_parent"
        android:layout_height="1dp"
        android:background="@color/divider"/>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="规则统计"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"/>

        <TextView
            android:id="@+id/tvRulesCount"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="DNS 规则：0 | 内容规则：0"
            android:textSize="12sp"
            android:textColor="@color/text_hint"/>
    </LinearLayout>

    <View
        android:layout_width="match_parent"
        android:layout_height="1dp"
        android:background="@color/divider"/>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="信任网站"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"/>

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:text="不拦截以下网站的广告"
            android:textSize="12sp"
            android:textColor="@color/text_hint"/>

        <androidx.recyclerview.widget.RecyclerView
            android:id="@+id/rvTrustedSites"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_marginTop="12dp"/>

        <Button
            android:id="@+id/btnAddTrustedSite"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="12dp"
            android:text="+ 添加信任网站"
            android:backgroundTint="@color/primary"/>
    </LinearLayout>

</LinearLayout>
```

- [ ] **Step 2: 创建信任网站列表项布局**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:padding="12dp"
    android:gravity="center_vertical">

    <TextView
        android:id="@+id/tvSite"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:textSize="14sp"
        android:textColor="@color/text_primary"/>

    <ImageButton
        android:id="@+id/btnRemove"
        android:layout_width="32dp"
        android:layout_height="32dp"
        android:background="?attr/selectableItemBackgroundBorderless"
        android:src="@android:drawable/ic_delete"
        android:contentDescription="删除"/>

</LinearLayout>
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/res/layout/fragment_ad_block_settings.xml app/src/main/res/layout/item_trusted_site.xml
git commit -m "feat: add ad block settings layout"
```

---

### Task 8: 创建 AdBlockSettingsFragment

**Files:**
- Create: `app/src/main/java/com/example/browser/AdBlock/AdBlockSettingsFragment.kt`
- Create: `app/src/main/java/com/example/browser/AdBlock/TrustedSiteAdapter.kt`

- [ ] **Step 1: 创建 TrustedSiteAdapter**

```kotlin
package com.example.browser.AdBlock

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R

class TrustedSiteAdapter(
    private var sites: List<String>,
    private val onRemoveClick: (String) -> Unit
) : RecyclerView.Adapter<TrustedSiteAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvSite: TextView = view.findViewById(R.id.tvSite)
        val btnRemove: ImageButton = view.findViewById(R.id.btnRemove)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_trusted_site, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val site = sites[position]
        holder.tvSite.text = site
        holder.btnRemove.setOnClickListener { onRemoveClick(site) }
    }

    override fun getItemCount(): Int = sites.size

    fun updateData(newSites: List<String>) {
        sites = newSites
        notifyDataSetChanged()
    }
}
```

- [ ] **Step 2: 创建 AdBlockSettingsFragment**

```kotlin
package com.example.browser.AdBlock

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.appcompat.widget.SwitchCompat
import com.example.browser.AdBlockManager
import com.example.browser.R

class AdBlockSettingsFragment : Fragment() {
    
    private lateinit var adBlockManager: AdBlockManager
    private lateinit var adapter: TrustedSiteAdapter
    
    private lateinit var switchAdBlock: SwitchCompat
    private lateinit var tvRulesCount: TextView
    private lateinit var rvTrustedSites: RecyclerView
    private lateinit var btnAddTrustedSite: Button
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_ad_block_settings, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        adBlockManager = AdBlockManager(requireContext())
        
        switchAdBlock = view.findViewById(R.id.switchAdBlock)
        tvRulesCount = view.findViewById(R.id.tvRulesCount)
        rvTrustedSites = view.findViewById(R.id.rvTrustedSites)
        btnAddTrustedSite = view.findViewById(R.id.btnAddTrustedSite)
        
        setupViews()
        updateRulesCount()
        updateTrustedSitesList()
    }
    
    private fun setupViews() {
        switchAdBlock.isChecked = adBlockManager.isEnabled()
        switchAdBlock.setOnCheckedChangeListener { _, isChecked ->
            adBlockManager.setEnabled(isChecked)
        }
        
        rvTrustedSites.layoutManager = LinearLayoutManager(context)
        adapter = TrustedSiteAdapter(emptyList()) { site ->
            adBlockManager.removeTrustedSite(site)
            updateTrustedSitesList()
        }
        rvTrustedSites.adapter = adapter
        
        btnAddTrustedSite.setOnClickListener {
            showAddSiteDialog()
        }
    }
    
    private fun updateRulesCount() {
        val (dnsCount, contentCount) = adBlockManager.getRulesCount()
        tvRulesCount.text = "DNS 规则：$dnsCount | 内容规则：$contentCount"
    }
    
    private fun updateTrustedSitesList() {
        adapter.updateData(adBlockManager.getTrustedSites().toList())
    }
    
    private fun showAddSiteDialog() {
        val editText = EditText(requireContext()).apply {
            hint = "输入网站域名"
            setPadding(48, 32, 48, 32)
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("添加信任网站")
            .setView(editText)
            .setPositiveButton("添加") { _, _ ->
                val site = editText.text.toString().trim()
                if (site.isNotEmpty()) {
                    adBlockManager.addTrustedSite(site)
                    updateTrustedSitesList()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }
}
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/java/com/example/browser/AdBlock/
git commit -m "feat: add AdBlockSettingsFragment and TrustedSiteAdapter"
```

---

### Task 9: 集成广告拦截到 BrowserActivity

**Files:**
- Modify: `app/src/main/java/com/example/browser/BrowserActivity.kt`

- [ ] **Step 1: 修改 BrowserActivity 集成广告拦截**

在 `BrowserActivity.kt` 中添加:

1. 添加导入:
```kotlin
import com.example.browser.AdBlockManager
```

2. 添加成员变量:
```kotlin
private lateinit var adBlockManager: AdBlockManager
```

3. 在 `onCreate` 中初始化:
```kotlin
adBlockManager = AdBlockManager(this)
```

4. 修改 `setupWebView` 方法，在 WebViewClient 的 `shouldOverrideUrlLoading` 中添加 DNS 拦截:
```kotlin
webView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        url?.let {
            if (adBlockManager.shouldBlockRequest(it)) {
                return true
            }
        }
        return false
    }
    // ... 其他代码保持不变
}
```

5. 在 `onPageFinished` 中注入内容过滤脚本:
```kotlin
override fun onPageFinished(view: WebView?, url: String?) {
    super.onPageFinished(view, url)
    binding.bottomAddressBar.setAddress(url ?: "")
    
    if (adBlockManager.shouldInjectContentScript()) {
        val script = adBlockManager.getContentBlockerScript()
        if (script.isNotEmpty()) {
            view?.evaluateJavascript(script, null)
        }
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/src/main/java/com/example/browser/BrowserActivity.kt
git commit -m "feat: integrate ad block into BrowserActivity"
```

---

### Task 10: 在抽屉中添加广告拦截入口

**Files:**
- Modify: `app/src/main/java/com/example/browser/DrawerController.kt`
- Modify: `app/src/main/res/layout/layout_drawer.xml`

- [ ] **Step 1: 修改 DrawerController 添加广告拦截菜单项**

在 `DrawerController.kt` 中:
1. 添加导入:
```kotlin
import com.example.browser.AdBlock.AdBlockSettingsFragment
```

2. 在 `setupViews` 中添加广告拦截菜单项:
```kotlin
val ivAdBlock = contentContainer.findViewById<ImageView>(R.id.ivAdBlock)
ivAdBlock?.setOnClickListener {
    showAdBlockSettings()
}
```

3. 添加 `showAdBlockSettings` 方法:
```kotlin
private fun showAdBlockSettings() {
    activity.supportFragmentManager.beginTransaction()
        .replace(R.id.fragmentContainer, AdBlockSettingsFragment())
        .addToBackStack(null)
        .commit()
    fragmentContainer.visibility = View.VISIBLE
    tabContainer.visibility = View.GONE
    ivBookmark.setColorFilter(Color.GRAY)
    ivHistory.setColorFilter(Color.GRAY)
    ivTabs.setColorFilter(Color.GRAY)
    ivAdBlock?.setColorFilter(Color.parseColor("#007AFF"))
}
```

- [ ] **Step 2: 修改布局添加广告拦截菜单项**

在 `layout_drawer.xml` 中添加:
```xml
<ImageView
    android:id="@+id/ivAdBlock"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:padding="12dp"
    android:src="@android:drawable/ic_menu_close_clear_cancel"
    android:contentDescription="广告拦截"/>
```

- [ ] **Step 3: 提交**

```bash
git add app/src/main/java/com/example/browser/DrawerController.kt app/src/main/res/layout/layout_drawer.xml
git commit -m "feat: add ad block menu entry in drawer"
```

---

## 自检清单

- [ ] Spec 覆盖：所有设计规格中的功能都有对应任务实现
- [ ] 无占位符：所有步骤都包含完整代码
- [ ] 类型一致性：类名、方法签名、属性名在各任务间一致
- [ ] 文件路径正确：所有创建/修改的文件路径准确

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-ad-block-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
