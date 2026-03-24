package com.example.browser

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.browser.data.SearchEngineManager
import com.example.browser.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var searchEngineManager: SearchEngineManager
    
    private var currentSearchEngine = "百度"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        searchEngineManager = SearchEngineManager(this)
        currentSearchEngine = searchEngineManager.getDefaultEngine()

        setupSearchEngineSpinner()
        setupSearchInput()
        setupQuickAccessButtons()
        setupBottomNavigation()
    }

    private fun setupSearchEngineSpinner() {
        val engines = searchEngineManager.getEngineList()
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, engines)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerSearchEngine.adapter = adapter
        
        val currentIndex = engines.indexOf(currentSearchEngine)
        if (currentIndex >= 0) {
            binding.spinnerSearchEngine.setSelection(currentIndex)
        }

        binding.spinnerSearchEngine.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                currentSearchEngine = engines[position]
                searchEngineManager.setDefaultEngine(currentSearchEngine)
                updateEngineIcon()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun updateEngineIcon() {
        val iconRes = when (currentSearchEngine) {
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
        binding.btnEngineIcon.setImageResource(iconRes)
    }

    private fun setupSearchInput() {
        // 搜索按钮点击
        binding.btnSearch.setOnClickListener {
            performSearch()
        }

        // 搜索引擎图标点击 - 显示下拉菜单
        binding.btnEngineIcon.setOnClickListener {
            binding.spinnerSearchEngine.performClick()
        }

        // 键盘搜索按钮
        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH || actionId == EditorInfo.IME_ACTION_DONE) {
                performSearch()
                return@setOnEditorActionListener true
            }
            false
        }

        // 输入框点击聚焦
        binding.etSearch.setOnClickListener {
            binding.etSearch.isFocusableInTouchMode = true
            binding.etSearch.requestFocus()
        }
    }

    private fun performSearch() {
        val query = binding.etSearch.text.toString().trim()
        if (query.isEmpty()) {
            Toast.makeText(this, "请输入搜索内容", Toast.LENGTH_SHORT).show()
            return
        }

        // 检查是否是网址
        val url = if (isUrl(query)) {
            if (query.startsWith("http://") || query.startsWith("https://")) {
                query
            } else {
                "https://$query"
            }
        } else {
            buildSearchUrl(query)
        }

        openBrowser(url)
    }

    private fun isUrl(query: String): Boolean {
        return query.contains(".") && !query.contains(" ")
    }

    private fun buildSearchUrl(query: String): String {
        return searchEngineManager.getSearchUrl(currentSearchEngine) + java.net.URLEncoder.encode(query, "UTF-8")
    }

    private fun openBrowser(url: String) {
        val intent = Intent(this, MultiWindowBrowserActivity::class.java).apply {
            putExtra("url", url)
        }
        startActivity(intent)
    }

    private fun setupQuickAccessButtons() {
        // 百度快捷访问
        binding.quickBaidu.setOnClickListener {
            openQuickAccess("百度", "https://www.baidu.com")
        }

        // 搜狗快捷访问
        binding.quickSogou.setOnClickListener {
            openQuickAccess("搜狗", "https://www.sogou.com")
        }

        // 必应快捷访问
        binding.quickBing.setOnClickListener {
            openQuickAccess("必应", "https://www.bing.com")
        }

        // 抖音快捷访问
        binding.quickDouyin.setOnClickListener {
            openQuickAccess("抖音", "https://www.douyin.com")
        }

        // 哔哩哔哩快捷访问
        binding.quickBilibili.setOnClickListener {
            openQuickAccess("哔哩哔哩", "https://www.bilibili.com")
        }

        // 知乎快捷访问
        binding.quickZhihu.setOnClickListener {
            openQuickAccess("知乎", "https://www.zhihu.com")
        }

        // 优酷快捷访问
        binding.quickYouku.setOnClickListener {
            openQuickAccess("优酷", "https://www.youku.com")
        }

        // 爱奇艺快捷访问
        binding.quickIqiyi.setOnClickListener {
            openQuickAccess("爱奇艺", "https://www.iqiyi.com")
        }

        // 腾讯视频快捷访问
        binding.quickTencent.setOnClickListener {
            openQuickAccess("腾讯视频", "https://v.qq.com")
        }

        // 豆包快捷访问
        binding.quickDoubao.setOnClickListener {
            openQuickAccess("豆包", "https://www.doubao.com")
        }

        // 千问快捷访问
        binding.quickQianwen.setOnClickListener {
            openQuickAccess("千问", "https://tongyi.aliyun.com/qianwen")
        }
    }

    private fun setupBottomNavigation() {
        // Home - 清空搜索框
        binding.btnHome.setOnClickListener {
            binding.etSearch.text.clear()
            binding.etSearch.clearFocus()
        }

        // 多窗口 - 打开多窗口浏览器并显示窗口列表
        binding.btnMultiWindow.setOnClickListener {
            val intent = Intent(this, MultiWindowBrowserActivity::class.java).apply {
                putExtra("show_tabs", true)
            }
            startActivity(intent)
        }

        // Back - 双击退出应用
        binding.btnBack.setOnClickListener {
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                finish()
            } else {
                Toast.makeText(this, "再按一次退出应用", Toast.LENGTH_SHORT).show()
            }
            backPressedTime = System.currentTimeMillis()
        }

        // 我的 - 打开个人中心页面
        binding.btnProfile.setOnClickListener {
            val intent = Intent(this, ProfileActivity::class.java)
            startActivity(intent)
        }
    }
    
    private var backPressedTime: Long = 0

    private fun openQuickAccess(name: String, url: String) {
        currentSearchEngine = name
        searchEngineManager.setDefaultEngine(name)
        val engines = searchEngineManager.getEngineList()
        val position = engines.indexOf(name)
        if (position >= 0) {
            binding.spinnerSearchEngine.setSelection(position)
        }
        updateEngineIcon()
        
        openBrowser(url)
    }
}