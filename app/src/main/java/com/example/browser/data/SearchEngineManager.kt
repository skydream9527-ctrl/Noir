package com.example.browser.data

import android.content.Context
import android.content.SharedPreferences

class SearchEngineManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("search_engine_prefs", Context.MODE_PRIVATE)
    
    companion object {
        private const val KEY_DEFAULT_ENGINE = "default_engine"
        const val DEFAULT_ENGINE = "百度"
        
        val ENGINES = mapOf(
            "百度" to "https://www.baidu.com/s?wd=",
            "搜狗" to "https://www.sogou.com/web?query=",
            "必应" to "https://www.bing.com/search?q=",
            "抖音" to "https://www.douyin.com/search/",
            "哔哩哔哩" to "https://search.bilibili.com/all?keyword=",
            "知乎" to "https://www.zhihu.com/search?q=",
            "优酷" to "https://www.youku.com/search?q=",
            "爱奇艺" to "https://so.iqiyi.com/so/q_",
            "腾讯视频" to "https://v.qq.com/x/search/?q=",
            "豆包" to "https://www.doubao.com/chat/?q=",
            "千问" to "https://tongyi.aliyun.com/qianwen/?q="
        )
    }
    
    fun getDefaultEngine(): String {
        return prefs.getString(KEY_DEFAULT_ENGINE, DEFAULT_ENGINE) ?: DEFAULT_ENGINE
    }
    
    fun setDefaultEngine(engine: String) {
        prefs.edit().putString(KEY_DEFAULT_ENGINE, engine).apply()
    }
    
    fun getSearchUrl(engine: String): String {
        return ENGINES[engine] ?: ENGINES[DEFAULT_ENGINE]!!
    }
    
    fun getEngineList(): List<String> {
        return ENGINES.keys.toList()
    }
}