package com.example.browser.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class FavoriteManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val favorites = mutableListOf<Favorite>()
    
    companion object {
        private const val PREFS_NAME = "browser_favorites"
        private const val KEY_FAVORITES = "favorites"
    }
    
    init {
        loadFavorites()
    }
    
    fun getAllFavorites(): List<Favorite> = favorites.toList()
    
    fun getFavoriteCount(): Int = favorites.size
    
    fun addFavorite(title: String, url: String, favicon: String? = null): Favorite {
        val favorite = Favorite(
            title = title,
            url = url,
            favicon = favicon
        )
        favorites.add(0, favorite)
        saveFavorites()
        return favorite
    }
    
    fun removeFavorite(favoriteId: String): Boolean {
        val removed = favorites.removeAll { it.id == favoriteId }
        if (removed) {
            saveFavorites()
        }
        return removed
    }
    
    fun isFavorite(url: String): Boolean {
        return favorites.any { it.url == url }
    }
    
    fun getFavoriteByUrl(url: String): Favorite? {
        return favorites.find { it.url == url }
    }
    
    fun updateFavorite(favoriteId: String, title: String? = null, url: String? = null) {
        val favorite = favorites.find { it.id == favoriteId }
        favorite?.let {
            title?.let { t -> it.title = t }
            url?.let { u -> it.url = u }
            saveFavorites()
        }
    }
    
    private fun saveFavorites() {
        val jsonArray = JSONArray()
        favorites.forEach { favorite ->
            val jsonObject = JSONObject().apply {
                put("id", favorite.id)
                put("title", favorite.title)
                put("url", favorite.url)
                put("favicon", favorite.favicon ?: "")
                put("createdAt", favorite.createdAt)
            }
            jsonArray.put(jsonObject)
        }
        
        prefs.edit().apply {
            putString(KEY_FAVORITES, jsonArray.toString())
            apply()
        }
    }
    
    private fun loadFavorites() {
        val favoritesJson = prefs.getString(KEY_FAVORITES, null)
        if (favoritesJson != null) {
            try {
                val jsonArray = JSONArray(favoritesJson)
                for (i in 0 until jsonArray.length()) {
                    val jsonObject = jsonArray.getJSONObject(i)
                    val favorite = Favorite(
                        id = jsonObject.getString("id"),
                        title = jsonObject.getString("title"),
                        url = jsonObject.getString("url"),
                        favicon = jsonObject.optString("favicon").takeIf { it.isNotEmpty() },
                        createdAt = jsonObject.getLong("createdAt")
                    )
                    favorites.add(favorite)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}