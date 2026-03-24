package com.example.browser.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class HistoryManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val histories = mutableListOf<History>()
    
    companion object {
        private const val PREFS_NAME = "browser_history"
        private const val KEY_HISTORIES = "histories"
        private const val MAX_HISTORY = 100
    }
    
    init {
        loadHistories()
    }
    
    fun getAllHistories(): List<History> = histories.toList()
    
    fun getHistoryCount(): Int = histories.size
    
    fun addHistory(title: String, url: String, favicon: String? = null): History {
        // Check if same URL exists, remove it first (to move to top)
        histories.removeAll { it.url == url }
        
        val history = History(
            title = title,
            url = url,
            favicon = favicon
        )
        histories.add(0, history)
        
        // Limit history size
        while (histories.size > MAX_HISTORY) {
            histories.removeAt(histories.size - 1)
        }
        
        saveHistories()
        return history
    }
    
    fun removeHistory(historyId: String): Boolean {
        val removed = histories.removeAll { it.id == historyId }
        if (removed) {
            saveHistories()
        }
        return removed
    }
    
    fun clearAllHistories() {
        histories.clear()
        saveHistories()
    }
    
    private fun saveHistories() {
        val jsonArray = JSONArray()
        histories.forEach { history ->
            val jsonObject = JSONObject().apply {
                put("id", history.id)
                put("title", history.title)
                put("url", history.url)
                put("favicon", history.favicon ?: "")
                put("visitedAt", history.visitedAt)
            }
            jsonArray.put(jsonObject)
        }
        
        prefs.edit().apply {
            putString(KEY_HISTORIES, jsonArray.toString())
            apply()
        }
    }
    
    private fun loadHistories() {
        val historiesJson = prefs.getString(KEY_HISTORIES, null)
        if (historiesJson != null) {
            try {
                val jsonArray = JSONArray(historiesJson)
                for (i in 0 until jsonArray.length()) {
                    val jsonObject = jsonArray.getJSONObject(i)
                    val history = History(
                        id = jsonObject.getString("id"),
                        title = jsonObject.getString("title"),
                        url = jsonObject.getString("url"),
                        favicon = jsonObject.optString("favicon").takeIf { it.isNotEmpty() },
                        visitedAt = jsonObject.getLong("visitedAt")
                    )
                    histories.add(history)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}