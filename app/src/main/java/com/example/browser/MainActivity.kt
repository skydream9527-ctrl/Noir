package com.example.browser

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.browser.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    
    // 搜索引擎URL模板
    private val searchEngines = mapOf(
        "百度" to "https://www.baidu.com/s?wd=",
        "搜狗" to "https://www.sogou.com/web?query=",
        "必应" to "https://www.bing.com/search?q=",
        "抖音" to "https://www.douyin.com/search/"
    )
    
    private var currentSearchEngine = "百度"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupSearchEngineSpinner()
        setupSearchButton()
        setupQuickAccessButtons()
    }

    private fun setupSearchEngineSpinner() {
        val engines = listOf("百度", "搜狗", "必应", "抖音")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, engines)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerSearchEngine.adapter = adapter

        binding.spinnerSearchEngine.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                currentSearchEngine = engines[position]
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun setupSearchButton() {
        binding.btnSearch.setOnClickListener {
            performSearch()
        }

        // 监听键盘搜索按钮
        binding.etSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH) {
                performSearch()
                return@setOnEditorActionListener true
            }
            false
        }
    }

    private fun performSearch() {
        val query = binding.etSearch.text.toString().trim()
        if (query.isEmpty()) {
            Toast.makeText(this, "请输入搜索内容", Toast.LENGTH_SHORT).show()
            return
        }

        val searchUrl = buildSearchUrl(query)
        openBrowser(searchUrl)
    }

    private fun buildSearchUrl(query: String): String {
        val baseUrl = searchEngines[currentSearchEngine] ?: searchEngines["百度"]!!
        return baseUrl + java.net.URLEncoder.encode(query, "UTF-8")
    }

    private fun openBrowser(url: String) {
        val intent = Intent(this, BrowserActivity::class.java).apply {
            putExtra("url", url)
        }
        startActivity(intent)
    }

    private fun setupQuickAccessButtons() {
        // 百度快捷访问
        binding.btnBaidu.setOnClickListener {
            openQuickAccess("百度", "https://www.baidu.com")
        }

        // 搜狗快捷访问
        binding.btnSogou.setOnClickListener {
            openQuickAccess("搜狗", "https://www.sogou.com")
        }

        // 必应快捷访问
        binding.btnBing.setOnClickListener {
            openQuickAccess("必应", "https://www.bing.com")
        }

        // 抖音快捷访问
        binding.btnDouyin.setOnClickListener {
            openQuickAccess("抖音", "https://www.douyin.com")
        }
    }

    private fun openQuickAccess(name: String, url: String) {
        // 设置当前搜索引擎
        currentSearchEngine = name
        val position = listOf("百度", "搜狗", "必应", "抖音").indexOf(name)
        if (position >= 0) {
            binding.spinnerSearchEngine.setSelection(position)
        }
        
        openBrowser(url)
    }
}
