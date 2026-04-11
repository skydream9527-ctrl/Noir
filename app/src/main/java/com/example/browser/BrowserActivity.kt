package com.example.browser

import android.annotation.SuppressLint
import android.content.Intent
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
import com.example.browser.AdBlockManager
import com.example.browser.Download.DownloadManager
import com.example.browser.SpeedUp.SpeedUpManager
import com.example.browser.VideoEnhance.VideoEnhanceManager
import android.webkit.DownloadListener
import com.example.browser.databinding.ActivityBrowserBinding
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.view.animation.AlphaAnimation
import com.example.browser.data.TabManager

class BrowserActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBrowserBinding
    private lateinit var webView: WebView
    private lateinit var tabManager: TabManager
    private lateinit var drawerController: DrawerController
    private lateinit var adBlockManager: AdBlockManager
    private lateinit var speedUpManager: SpeedUpManager
    private lateinit var downloadManager: DownloadManager
    private lateinit var videoEnhanceManager: VideoEnhanceManager
    private lateinit var floatButtonContainer: FrameLayout
    private lateinit var btnPip: ImageButton
    
    private var currentTabId: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBrowserBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tabManager = TabManager(this)
        adBlockManager = AdBlockManager(this)
        speedUpManager = SpeedUpManager(this)
        downloadManager = DownloadManager(this)
        videoEnhanceManager = VideoEnhanceManager(this)
        
        setupWebView()
        setupBottomAddressBar()
        setupDrawer()
        setupVideoEnhance()
        
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
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
            url?.let {
                if (adBlockManager.shouldBlockRequest(it)) {
                    return true
                }
            }
            return false
        }

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
                binding.bottomAddressBar.setAddress(url ?: "")
                
                if (adBlockManager.shouldInjectContentScript()) {
                    val script = adBlockManager.getContentBlockerScript()
                    if (script.isNotEmpty()) {
                        view?.evaluateJavascript(script, null)
                    }
                }
                
                if (videoEnhanceManager.isEnabled()) {
                    val script = videoEnhanceManager.getHasPlayingVideoScript()
                    webView.evaluateJavascript(script) { result ->
                        if (result == "true") {
                            runOnUiThread { showFloatButton() }
                        }
                    }
                }

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
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                binding.progressBar.progress = newProgress
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                super.onReceivedTitle(view, title)
                title?.let {
                    binding.bottomAddressBar.showReadingModeButton(it.isNotEmpty())
                }
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
            downloadManager.download(url, null)
        }
    }

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
            } else {
                videoEnhanceManager.enterPipMode()
            }
        }
        
        videoEnhanceManager.setOnPipEnterListener {
            hideFloatButton()
        }
    }

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

    private fun setupBottomAddressBar() {
        binding.bottomAddressBar.onAddressSubmit = { url ->
            webView.loadUrl(url)
        }
        
        binding.bottomAddressBar.onMenuClick = {
            toggleDrawer()
        }

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
    
    private fun setupDrawer() {
        val rootLayout = binding.drawerContainer.root
        
        drawerController = DrawerController(
            activity = this,
            tabContainer = rootLayout.findViewById<View>(R.id.tabContainer),
            contentContainer = rootLayout.findViewById<FrameLayout>(R.id.contentContainer),
            ivBookmark = rootLayout.findViewById<ImageView>(R.id.ivBookmark),
            ivHistory = rootLayout.findViewById<ImageView>(R.id.ivHistory),
            ivTabs = rootLayout.findViewById<ImageView>(R.id.ivTabs),
            onNavigate = { url ->
                webView.loadUrl(url)
                closeDrawer()
            }
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
            videoEnhanceManager.isInPipMode() -> {
                videoEnhanceManager.enterPipMode()
            }
            binding.drawerContainer.root.isVisible -> closeDrawer()
            webView.canGoBack() -> webView.goBack()
            else -> super.onBackPressed()
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (videoEnhanceManager.isEnabled() && videoEnhanceManager.isPipSupported()) {
            val script = videoEnhanceManager.getHasPlayingVideoScript()
            webView.evaluateJavascript(script) { result ->
                if (result == "true") {
                    videoEnhanceManager.enterPipMode()
                }
            }
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
