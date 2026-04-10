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
import com.example.browser.databinding.ActivityBrowserBinding

class BrowserActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBrowserBinding
    private lateinit var webView: WebView
    private lateinit var tabManager: TabManager
    private lateinit var drawerController: DrawerController
    private lateinit var adBlockManager: AdBlockManager
    
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
        val contentContainer = binding.drawerContainer.findViewById<android.widget.FrameLayout>(R.id.contentContainer)
        val ivBookmark = binding.drawerContainer.findViewById<android.widget.ImageView>(R.id.ivBookmark)
        val ivHistory = binding.drawerContainer.findViewById<android.widget.ImageView>(R.id.ivHistory)
        val ivTabs = binding.drawerContainer.findViewById<android.widget.ImageView>(R.id.ivTabs)
        
        drawerController = DrawerController(
            activity = this,
            tabContainer = binding.drawerContainer.findViewById(R.id.tabContainer),
            contentContainer = contentContainer!!,
            ivBookmark = ivBookmark!!,
            ivHistory = ivHistory!!,
            ivTabs = ivTabs!!,
            onNavigate = { url ->
                webView.loadUrl(url)
                closeDrawer()
            }
        )
        
        adBlockManager = AdBlockManager(this)
        
        binding.drawerScrim.setOnClickListener {
            closeDrawer()
        }
    }
    
    private fun toggleDrawer() {
        if (binding.drawerContainer.isVisible) {
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
