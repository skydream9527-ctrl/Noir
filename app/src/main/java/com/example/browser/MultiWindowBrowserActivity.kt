package com.example.browser

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.tencent.smtt.export.external.interfaces.WebResourceResponse
import com.tencent.smtt.sdk.WebChromeClient
import com.tencent.smtt.sdk.WebSettings
import com.tencent.smtt.sdk.WebView
import com.tencent.smtt.sdk.WebViewClient
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.data.Tab
import com.example.browser.data.TabManager
import com.example.browser.data.FavoriteManager
import com.example.browser.data.HistoryManager
import com.example.browser.data.SearchEngineManager
import com.example.browser.databinding.ActivityMultiWindowBrowserBinding
import com.google.android.material.bottomsheet.BottomSheetDialog
import java.net.URL

class MultiWindowBrowserActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMultiWindowBrowserBinding
    private lateinit var tabManager: TabManager
    private lateinit var favoriteManager: FavoriteManager
    private lateinit var historyManager: HistoryManager
    private lateinit var searchEngineManager: SearchEngineManager
    private val webViews = mutableMapOf<String, WebView>()
    private var currentSearchEngine: String = "百度"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMultiWindowBrowserBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        tabManager = TabManager(this)
        favoriteManager = FavoriteManager(this)
        historyManager = HistoryManager(this)
        searchEngineManager = SearchEngineManager(this)
        currentSearchEngine = searchEngineManager.getDefaultEngine()
        
        initToolbar()
        initWebViewContainer()
        initBottomBar()
        
        // 处理传入的参数
        val url = intent.getStringExtra("url")
        val showTabs = intent.getBooleanExtra("show_tabs", false)
        
        if (url != null) {
            // 如果有传入URL，在新标签页打开
            val tab = tabManager.createNewTab(url)
            loadUrlInTab(tab, url)
        } else if (showTabs) {
            // 显示窗口选择列表，如果没有窗口则创建新的首页
            if (tabManager.getTabCount() == 0) {
                val newTab = tabManager.createNewTab()
                showTab(newTab)
            }
            showTabsDialog()
        } else {
            // 切换到当前活动标签页
            val activeTab = tabManager.getActiveTab()
            if (activeTab != null && activeTab.url.isNotEmpty()) {
                showTab(activeTab)
            } else {
                // 没有活动标签页，创建一个新的空白标签页
                val newTab = tabManager.createNewTab()
                showTab(newTab)
            }
        }
    }
    
    private fun initToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        
        // 地址栏搜索引擎选择
        binding.ivToolbarSearchEngine.setOnClickListener {
            showSearchEngineSelector()
        }
        updateToolbarSearchEngineIcon()
        
        // 地址栏
        binding.etUrl.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_GO) {
                val query = binding.etUrl.text.toString().trim()
                if (query.isNotEmpty()) {
                    val url = if (isUrl(query)) {
                        if (query.startsWith("http://") || query.startsWith("https://")) query else "https://$query"
                    } else {
                        searchEngineManager.getSearchUrl(currentSearchEngine) + java.net.URLEncoder.encode(query, "UTF-8")
                    }
                    loadUrl(url)
                    binding.etUrl.setText(url)
                }
                true
            } else {
                false
            }
        }
        
        // 刷新按钮
        binding.btnRefresh.setOnClickListener {
            val activeTab = tabManager.getActiveTab()
            activeTab?.let { tab ->
                webViews[tab.id]?.reload()
            }
        }
        
        // 首页搜索框
        binding.etHomeSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH || 
                actionId == android.view.inputmethod.EditorInfo.IME_ACTION_GO) {
                performHomeSearch()
                true
            } else {
                false
            }
        }
        
        binding.btnHomeSearch.setOnClickListener {
            performHomeSearch()
        }
        
        // 搜索引擎选择
        binding.ivSearchEngine.setOnClickListener {
            showSearchEngineSelector()
        }
        updateSearchEngineIcon()
        
        // 快捷访问
        binding.quickBaidu.setOnClickListener { 
            currentSearchEngine = "百度"
            searchEngineManager.setDefaultEngine("百度")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.baidu.com") 
        }
        binding.quickSogou.setOnClickListener { 
            currentSearchEngine = "搜狗"
            searchEngineManager.setDefaultEngine("搜狗")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.sogou.com") 
        }
        binding.quickBing.setOnClickListener { 
            currentSearchEngine = "必应"
            searchEngineManager.setDefaultEngine("必应")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.bing.com") 
        }
        binding.quickDouyin.setOnClickListener { 
            currentSearchEngine = "抖音"
            searchEngineManager.setDefaultEngine("抖音")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.douyin.com") 
        }
        binding.quickBilibili.setOnClickListener { 
            currentSearchEngine = "哔哩哔哩"
            searchEngineManager.setDefaultEngine("哔哩哔哩")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.bilibili.com") 
        }
        binding.quickZhihu.setOnClickListener { 
            currentSearchEngine = "知乎"
            searchEngineManager.setDefaultEngine("知乎")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.zhihu.com") 
        }
        binding.quickYouku.setOnClickListener { 
            currentSearchEngine = "优酷"
            searchEngineManager.setDefaultEngine("优酷")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.youku.com") 
        }
        binding.quickIqiyi.setOnClickListener { 
            currentSearchEngine = "爱奇艺"
            searchEngineManager.setDefaultEngine("爱奇艺")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.iqiyi.com") 
        }
        binding.quickTencent.setOnClickListener { 
            currentSearchEngine = "腾讯视频"
            searchEngineManager.setDefaultEngine("腾讯视频")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://v.qq.com") 
        }
        binding.quickDoubao.setOnClickListener { 
            currentSearchEngine = "豆包"
            searchEngineManager.setDefaultEngine("豆包")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://www.doubao.com") 
        }
        binding.quickQianwen.setOnClickListener { 
            currentSearchEngine = "千问"
            searchEngineManager.setDefaultEngine("千问")
            updateSearchEngineIcon()
            updateToolbarSearchEngineIcon()
            openQuickAccess("https://tongyi.aliyun.com/qianwen") 
        }
    }
    
    private fun showSearchEngineSelector() {
        val engines = searchEngineManager.getEngineList()
        val engineNames = engines.toTypedArray()
        val engineIcons = engines.map { getSearchEngineIconRes(it) }.toIntArray()
        val currentIndex = engines.indexOf(currentSearchEngine)
        
        val adapter = object : android.widget.ArrayAdapter<String>(this, android.R.layout.select_dialog_singlechoice, engineNames) {
            override fun getView(position: Int, convertView: android.view.View?, parent: android.view.ViewGroup): android.view.View {
                val view = super.getView(position, convertView, parent)
                val textView = view.findViewById<android.widget.TextView>(android.R.id.text1)
                textView.setCompoundDrawablesWithIntrinsicBounds(engineIcons[position], 0, 0, 0)
                textView.compoundDrawablePadding = 16
                return view
            }
        }
        
        AlertDialog.Builder(this)
            .setTitle("选择搜索引擎")
            .setSingleChoiceItems(adapter, currentIndex) { dialog, which ->
                currentSearchEngine = engines[which]
                searchEngineManager.setDefaultEngine(currentSearchEngine)
                updateSearchEngineIcon()
                updateToolbarSearchEngineIcon()
                dialog.dismiss()
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun updateSearchEngineIcon() {
        val iconRes = getSearchEngineIconRes(currentSearchEngine)
        binding.ivSearchEngine.setImageResource(iconRes)
    }
    
    private fun updateToolbarSearchEngineIcon() {
        val iconRes = getSearchEngineIconRes(currentSearchEngine)
        binding.ivToolbarSearchEngine.setImageResource(iconRes)
    }
    
    private fun getSearchEngineIconRes(engine: String): Int {
        return when (engine) {
            "百度" -> R.drawable.ic_baidu
            "搜狗" -> R.drawable.ic_sogou
            "必应" -> R.drawable.ic_bing
            "抖音" -> R.drawable.ic_douyin
            "哔哩哔哩" -> R.drawable.ic_bilibili
            "知乎" -> R.drawable.ic_zhihu
            "优酷" -> R.drawable.ic_youku
            "爱奇艺" -> R.drawable.ic_iqiyi
            "腾讯视频" -> R.drawable.ic_tencent
            "豆包" -> R.drawable.ic_doubao
            "千问" -> R.drawable.ic_qianwen
            else -> R.drawable.ic_search
        }
    }
    
    private fun performHomeSearch() {
        val query = binding.etHomeSearch.text.toString().trim()
        if (query.isEmpty()) return
        
        if (!isNetworkAvailable()) {
            Toast.makeText(this, "网络不可用，请检查网络连接", Toast.LENGTH_SHORT).show()
            return
        }
        
        val url = if (isUrl(query)) {
            if (query.startsWith("http://") || query.startsWith("https://")) query else "https://$query"
        } else {
            searchEngineManager.getSearchUrl(currentSearchEngine) + java.net.URLEncoder.encode(query, "UTF-8")
        }
        
        binding.etHomeSearch.text.clear()
        loadUrl(url)
    }
    
    private fun openQuickAccess(url: String) {
        loadUrl(url)
    }
    
    private fun isUrl(query: String): Boolean {
        return query.contains(".") && !query.contains(" ")
    }
    
    private fun initWebViewContainer() {
        // WebView容器已准备在XML中
    }
    
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
               capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(tab: Tab): WebView {
        val webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            
            val settings = this.settings
            settings.javaScriptEnabled = true
            settings.setSupportZoom(true)
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mixedContentMode = 0
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.blockNetworkImage = false
            settings.loadsImagesAutomatically = true
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setSupportMultipleWindows(true)
            settings.userAgentString = settings.userAgentString
            
            // 设置WebView层级
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    url: String?
                ): Boolean {
                    if (url == null) return false
                    if (url.startsWith("tel:") || url.startsWith("mailto:") || 
                        url.startsWith("intent:") || url.startsWith("market:") ||
                        url.startsWith("weixin:") || url.startsWith("alipays:")) {
                        try {
                            val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            return false
                        }
                    }
                    return false
                }
                
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    binding.progressBar.visibility = View.VISIBLE
                    binding.progressBar.progress = 0
                    url?.let {
                        binding.etUrl.setText(it)
                        tabManager.updateTab(tab.id, url = it)
                    }
                }
                
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    binding.progressBar.visibility = View.GONE
                    val title = view?.title ?: ""
                    title.let {
                        tabManager.updateTab(tab.id, title = it)
                    }
                    url?.let {
                        if (it.startsWith("http")) {
                            historyManager.addHistory(
                                title = title.ifEmpty { it },
                                url = it
                            )
                        }
                    }
                }
                
                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    binding.progressBar.visibility = View.GONE
                    val errorMessage = when (errorCode) {
                        WebViewClient.ERROR_HOST_LOOKUP -> "无法找到服务器，请检查网络连接"
                        WebViewClient.ERROR_CONNECT -> "连接失败，请检查网络"
                        WebViewClient.ERROR_TIMEOUT -> "连接超时，请稍后重试"
                        WebViewClient.ERROR_FAILED_SSL_HANDSHAKE -> "SSL握手失败"
                        WebViewClient.ERROR_BAD_URL -> "无效的网址"
                        WebViewClient.ERROR_TOO_MANY_REQUESTS -> "请求过多，请稍后重试"
                        WebViewClient.ERROR_UNSUPPORTED_AUTH_SCHEME -> "不支持的认证方式"
                        WebViewClient.ERROR_AUTHENTICATION -> "认证失败"
                        WebViewClient.ERROR_PROXY_AUTHENTICATION -> "代理认证失败"
                        WebViewClient.ERROR_IO -> "网络IO错误"
                        else -> "页面加载失败，错误码: $errorCode"
                    }
                    Toast.makeText(this@MultiWindowBrowserActivity, errorMessage, Toast.LENGTH_SHORT).show()
                }
                
                override fun onReceivedHttpError(
                    view: WebView?,
                    request: com.tencent.smtt.export.external.interfaces.WebResourceRequest?,
                    errorResponse: WebResourceResponse?
                ) {
                    super.onReceivedHttpError(view, request, errorResponse)
                    if (request?.isForMainFrame == true) {
                        val statusCode = errorResponse?.statusCode ?: 0
                        if (statusCode >= 400) {
                            Toast.makeText(this@MultiWindowBrowserActivity, "HTTP错误: $statusCode", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
            
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    binding.progressBar.progress = newProgress
                }
                
                override fun onReceivedTitle(view: WebView?, title: String?) {
                    super.onReceivedTitle(view, title)
                    title?.let {
                        tabManager.updateTab(tab.id, title = it)
                    }
                }
                
                override fun onConsoleMessage(consoleMessage: com.tencent.smtt.export.external.interfaces.ConsoleMessage?): Boolean {
                    return true
                }
            }
        }
        
        webViews[tab.id] = webView
        return webView
    }
    
    private fun loadUrlInTab(tab: Tab, url: String) {
        // 隐藏首页，显示WebView
        binding.homeView.visibility = View.GONE
        binding.webViewContainer.visibility = View.VISIBLE
        
        var webView = webViews[tab.id]
        if (webView == null) {
            webView = createWebView(tab)
            binding.webViewContainer.addView(webView)
        }
        
        // 隐藏其他WebView，显示当前
        webViews.values.forEach { it.visibility = View.GONE }
        webView.visibility = View.VISIBLE
        
        // 修复URL处理逻辑
        var finalUrl = url.trim()
        
        // 移除多余空格
        finalUrl = finalUrl.replace(" ", "")
        
        // 处理URL格式
        finalUrl = when {
            finalUrl.startsWith("http://") || finalUrl.startsWith("https://") -> finalUrl
            finalUrl.startsWith("ftp://") -> finalUrl
            finalUrl.startsWith("www.") -> "https://$finalUrl"
            finalUrl.contains(".") && finalUrl.indexOf(".") < finalUrl.length - 1 -> {
                // 检查是否是有效域名
                if (finalUrl.matches(Regex("^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$"))) {
                    "https://$finalUrl"
                } else {
                    // 作为搜索查询处理
                    val encodedQuery = java.net.URLEncoder.encode(url, "UTF-8")
                    "https://www.baidu.com/s?wd=$encodedQuery"
                }
            }
            else -> {
                // 作为搜索查询处理
                val encodedQuery = java.net.URLEncoder.encode(url, "UTF-8")
                "https://www.baidu.com/s?wd=$encodedQuery"
            }
        }
        
        // 添加请求头
        val headers = mapOf(
            "Accept-Language" to "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept" to "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        )
        
        try {
            webView.loadUrl(finalUrl, headers)
            tabManager.updateTab(tab.id, url = finalUrl)
            binding.etUrl.setText(finalUrl)
        } catch (e: Exception) {
            Toast.makeText(this, "加载失败: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun showTab(tab: Tab) {
        // 更新标签计数
        updateTabCount()
        
        // 如果标签页没有URL，显示首页
        if (tab.url.isEmpty()) {
            binding.webViewContainer.visibility = View.GONE
            binding.homeView.visibility = View.VISIBLE
            webViews.values.forEach { it.visibility = View.GONE }
            binding.etUrl.setText("")
            return
        }
        
        // 隐藏首页，显示WebView
        binding.homeView.visibility = View.GONE
        binding.webViewContainer.visibility = View.VISIBLE
        
        // 隐藏所有WebView
        webViews.values.forEach { it.visibility = View.GONE }
        
        // 显示指定标签页的WebView
        var webView = webViews[tab.id]
        if (webView == null) {
            webView = createWebView(tab)
            binding.webViewContainer.addView(webView)
        }
        webView.visibility = View.VISIBLE
        
        // 更新地址栏
        binding.etUrl.setText(tab.url)
    }
    
    private fun loadUrl(url: String) {
        if (!isNetworkAvailable()) {
            Toast.makeText(this, "网络不可用，请检查网络连接", Toast.LENGTH_SHORT).show()
            return
        }
        
        // 隐藏首页，显示WebView容器
        binding.homeView.visibility = View.GONE
        binding.webViewContainer.visibility = View.VISIBLE
        
        val activeTab = tabManager.getActiveTab()
        if (activeTab != null) {
            loadUrlInTab(activeTab, url)
        } else {
            val newTab = tabManager.createNewTab()
            loadUrlInTab(newTab, url)
        }
    }
    
    private fun initBottomBar() {
        // 返回按钮
        binding.btnBack.setOnClickListener {
            val activeTab = tabManager.getActiveTab()
            activeTab?.let { tab ->
                webViews[tab.id]?.goBack()
            }
        }
        
        // 前进按钮
        binding.btnForward.setOnClickListener {
            val activeTab = tabManager.getActiveTab()
            activeTab?.let { tab ->
                webViews[tab.id]?.goForward()
            }
        }
        
        // 主页按钮
        binding.btnHome.setOnClickListener {
            val activeTab = tabManager.getActiveTab()
            activeTab?.let { tab ->
                // 清空当前标签页的URL，显示首页
                tabManager.updateTab(tab.id, url = "", title = "新标签页")
                showTab(tab)
            }
        }
        
        // 多窗口/标签页按钮
        binding.btnTabs.setOnClickListener {
            showTabsDialog()
        }
        
        // 菜单按钮
        binding.btnMenu.setOnClickListener {
            showMenuDialog()
        }
        
        updateTabCount()
    }
    
    private fun showTabsDialog() {
        val bottomSheet = BottomSheetDialog(this)
        val view = layoutInflater.inflate(R.layout.dialog_tabs, null)
        
        val recyclerView = view.findViewById<RecyclerView>(R.id.recyclerTabs)
        val btnNewTab = view.findViewById<View>(R.id.btnNewTab)
        val btnCloseAll = view.findViewById<View>(R.id.btnCloseAll)
        
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        
        val adapter = TabsAdapter(tabManager.getAllTabs().toMutableList()) { action, tab ->
            when (action) {
                TabAction.SWITCH -> {
                    tabManager.switchToTab(tab.id)
                    showTab(tab)
                    bottomSheet.dismiss()
                }
                TabAction.CLOSE -> {
                    removeTab(tab.id)
                    (recyclerView.adapter as? TabsAdapter)?.updateData(tabManager.getAllTabs())
                    if (tabManager.getTabCount() == 0) {
                        bottomSheet.dismiss()
                        finish()
                    }
                }
            }
        }
        recyclerView.adapter = adapter
        
        btnNewTab.setOnClickListener {
            val newTab = tabManager.createNewTab()
            showTab(newTab)
            bottomSheet.dismiss()
        }
        
        btnCloseAll.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("关闭所有标签页")
                .setMessage("确定要关闭所有标签页吗？")
                .setPositiveButton("确定") { _, _ ->
                    closeAllTabs()
                    bottomSheet.dismiss()
                    finish()
                }
                .setNegativeButton("取消", null)
                .show()
        }
        
        bottomSheet.setContentView(view)
        bottomSheet.show()
    }
    
    private fun showMenuDialog() {
        val items = arrayOf("分享", "刷新", "添加到收藏", "查看收藏", "浏览历史", "设置")
        AlertDialog.Builder(this)
            .setItems(items) { _, which ->
                when (which) {
                    0 -> shareCurrentPage()
                    1 -> {
                        val activeTab = tabManager.getActiveTab()
                        activeTab?.let { tab ->
                            webViews[tab.id]?.reload()
                        }
                    }
                    2 -> toggleFavorite()
                    3 -> openFavorites()
                    4 -> openHistory()
                    5 -> openSettings()
                }
            }
            .show()
    }
    
    private fun openHistory() {
        val intent = Intent(this, HistoryActivity::class.java)
        startActivity(intent)
    }
    
    private fun openFavorites() {
        val intent = Intent(this, FavoritesActivity::class.java)
        startActivity(intent)
    }
    
    private fun shareCurrentPage() {
        val activeTab = tabManager.getActiveTab()
        activeTab?.let { tab ->
            val shareIntent = Intent().apply {
                action = Intent.ACTION_SEND
                type = "text/plain"
                putExtra(Intent.EXTRA_TITLE, tab.title)
                putExtra(Intent.EXTRA_TEXT, tab.url)
            }
            startActivity(Intent.createChooser(shareIntent, "分享"))
        }
    }
    
    private fun openSettings() {
        val intent = Intent(this, SettingsActivity::class.java)
        startActivity(intent)
    }
    
    private fun toggleFavorite() {
        val activeTab = tabManager.getActiveTab()
        activeTab?.let { tab ->
            if (tab.url.isNotEmpty()) {
                if (favoriteManager.isFavorite(tab.url)) {
                    val favorite = favoriteManager.getFavoriteByUrl(tab.url)
                    favorite?.let {
                        favoriteManager.removeFavorite(it.id)
                        Toast.makeText(this, "已取消收藏", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    favoriteManager.addFavorite(
                        title = tab.title.ifEmpty { tab.url },
                        url = tab.url
                    )
                    Toast.makeText(this, "已添加到收藏", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun removeTab(tabId: String) {
        // 从容器中移除WebView
        webViews[tabId]?.let { webView ->
            webView.stopLoading()
            webView.destroy()
            binding.webViewContainer.removeView(webView)
        }
        webViews.remove(tabId)
        
        // 从管理器中移除
        tabManager.removeTab(tabId)
        
        // 显示新的活动标签页
        val activeTab = tabManager.getActiveTab()
        if (activeTab != null) {
            showTab(activeTab)
        }
        
        updateTabCount()
    }
    
    private fun closeAllTabs() {
        // 清理所有WebView
        webViews.values.forEach { webView ->
            webView.stopLoading()
            webView.destroy()
            binding.webViewContainer.removeView(webView)
        }
        webViews.clear()
        
        // 清空标签管理器
        tabManager.closeAllTabs()
        
        updateTabCount()
    }
    
    private fun updateTabCount() {
        val count = tabManager.getTabCount()
        // ImageButton 不支持 text 属性，使用 contentDescription 或忽略
        binding.btnTabs.contentDescription = "标签页 ($count)"
    }
    
    override fun onBackPressed() {
        // 如果首页可见，直接返回
        if (binding.homeView.visibility == View.VISIBLE) {
            super.onBackPressed()
            return
        }
        
        val activeTab = tabManager.getActiveTab()
        val webView = activeTab?.let { webViews[it.id] }
        
        if (webView?.canGoBack() == true) {
            webView.goBack()
        } else {
            // WebView无法返回，显示首页
            activeTab?.let { tab ->
                tabManager.updateTab(tab.id, url = "", title = "新标签页")
                showTab(tab)
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // 清理所有WebView
        webViews.values.forEach { webView ->
            webView.stopLoading()
            webView.destroy()
        }
        webViews.clear()
    }
    
    enum class TabAction {
        SWITCH, CLOSE
    }
    
    inner class TabsAdapter(
        private var tabs: MutableList<Tab>,
        private val onAction: (TabAction, Tab) -> Unit
    ) : RecyclerView.Adapter<TabsAdapter.TabViewHolder>() {
        
        inner class TabViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val tvTitle: TextView = itemView.findViewById(R.id.tvTabTitle)
            val tvUrl: TextView = itemView.findViewById(R.id.tvTabUrl)
            val btnClose: ImageButton = itemView.findViewById(R.id.btnCloseTab)
            val cardView: View = itemView.findViewById(R.id.cardTab)
        }
        
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TabViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_tab, parent, false)
            return TabViewHolder(view)
        }
        
        override fun onBindViewHolder(holder: TabViewHolder, position: Int) {
            val tab = tabs[position]
            holder.tvTitle.text = tab.title.ifEmpty { "新标签页" }
            holder.tvUrl.text = try {
                if (tab.url.isNotEmpty()) URL(tab.url).host else "首页"
            } catch (e: Exception) {
                tab.url.ifEmpty { "首页" }
            }
            
            // 设置点击事件
            holder.cardView.setOnClickListener {
                onAction(TabAction.SWITCH, tab)
            }
            
            holder.btnClose.setOnClickListener {
                onAction(TabAction.CLOSE, tab)
            }
        }
        
        override fun getItemCount(): Int = tabs.size
        
        fun updateData(newTabs: List<Tab>) {
            tabs.clear()
            tabs.addAll(newTabs)
            notifyDataSetChanged()
        }
    }
}