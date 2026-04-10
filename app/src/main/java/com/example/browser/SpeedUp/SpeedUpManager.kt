package com.example.browser.SpeedUp

import android.content.Context
import android.content.SharedPreferences
import android.net.ConnectivityManager
import android.net.NetworkInfo

class SpeedUpManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val webAccelerator = WebAccelerator()
    private val dataCompressor: DataCompressor
    
    private var settings: SpeedUpSettings
    
    companion object {
        private const val PREFS_NAME = "speed_up_settings"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_DATA_COMPRESSION = "data_compression"
        private const val KEY_WEB_ACCELERATION = "web_acceleration"
    }
    
    init {
        settings = loadSettings()
        val quality = if (isMobileNetwork(context)) 60 else 80
        dataCompressor = DataCompressor(quality)
    }
    
    private fun isMobileNetwork(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val info: NetworkInfo? = cm.activeNetworkInfo
        return info?.type == ConnectivityManager.TYPE_MOBILE
    }
    
    private fun loadSettings(): SpeedUpSettings {
        return SpeedUpSettings(
            enabled = prefs.getBoolean(KEY_ENABLED, true),
            dataCompression = DataCompressionSettings(
                enabled = prefs.getBoolean("data_compression_enabled", true),
                imageQuality = prefs.getInt("image_quality", 80),
                minifyJsCss = prefs.getBoolean("minify_js_css", false)
            ),
            webAcceleration = WebAccelerationSettings(
                dnsPrefetch = prefs.getBoolean("dns_prefetch", true),
                preloadResources = prefs.getBoolean("preload_resources", true),
                connectionReuse = prefs.getBoolean("connection_reuse", true)
            )
        )
    }
    
    fun saveSettings(settings: SpeedUpSettings) {
        this.settings = settings
        prefs.edit().apply {
            putBoolean(KEY_ENABLED, settings.enabled)
            putBoolean("data_compression_enabled", settings.dataCompression.enabled)
            putInt("image_quality", settings.dataCompression.imageQuality)
            putBoolean("minify_js_css", settings.dataCompression.minifyJsCss)
            putBoolean("dns_prefetch", settings.webAcceleration.dnsPrefetch)
            putBoolean("preload_resources", settings.webAcceleration.preloadResources)
            putBoolean("connection_reuse", settings.webAcceleration.connectionReuse)
            apply()
        }
    }
    
    fun isEnabled(): Boolean = settings.enabled
    
    fun setEnabled(enabled: Boolean) {
        settings = settings.copy(enabled = enabled)
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isDataCompressionEnabled(): Boolean = settings.enabled && settings.dataCompression.enabled
    
    fun isWebAccelerationEnabled(): Boolean = settings.enabled && settings.webAcceleration.dnsPrefetch
    
    fun getSettings(): SpeedUpSettings = settings
    
    fun getWebAccelerator(): WebAccelerator = webAccelerator
    
    fun getDataCompressor(): DataCompressor = dataCompressor
    
    fun getDnsPrefetchScript(): String {
        if (!isEnabled() || !settings.webAcceleration.dnsPrefetch) return ""
        return webAccelerator.getDnsPrefetchScript()
    }
    
    fun getPreloadScript(): String {
        if (!isEnabled() || !settings.webAcceleration.preloadResources) return ""
        return webAccelerator.getPreloadScript()
    }
    
    fun shouldInjectAccelerationScript(): Boolean {
        return isEnabled() && (settings.webAcceleration.dnsPrefetch || settings.webAcceleration.preloadResources)
    }
}
