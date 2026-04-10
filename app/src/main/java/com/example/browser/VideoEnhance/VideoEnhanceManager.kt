package com.example.browser.VideoEnhance

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatActivity

class VideoEnhanceManager(private val activity: AppCompatActivity) {
    
    private val prefs: SharedPreferences = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val pipManager = PiPManager(activity)
    private val videoDetector = VideoDetector()
    
    private var isEnabled = true
    private var onPipEnterListener: (() -> Unit)? = null
    
    companion object {
        private const val PREFS_NAME = "video_enhance_settings"
        private const val KEY_ENABLED = "enabled"
    }
    
    init {
        isEnabled = prefs.getBoolean(KEY_ENABLED, true)
        setupPipCallback()
    }
    
    private fun setupPipCallback() {
        pipManager.setPipCallback {
            if (pipManager.isInPipMode()) {
                onPipEnterListener?.invoke()
            }
        }
    }
    
    fun isEnabled(): Boolean = isEnabled
    
    fun setEnabled(enabled: Boolean) {
        isEnabled = enabled
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isPipSupported(): Boolean = pipManager.isPipSupported()
    
    fun isInPipMode(): Boolean = pipManager.isInPipMode()
    
    fun enterPipMode(): Boolean {
        if (!isEnabled || !isPipSupported()) return false
        return pipManager.enterPipMode()
    }
    
    fun getVideoDetector(): VideoDetector = videoDetector
    
    fun getDetectVideoScript(): String = videoDetector.getDetectVideoScript()
    
    fun getHasPlayingVideoScript(): String = videoDetector.getHasPlayingVideoScript()
    
    fun parseVideoInfo(jsonResult: String): List<VideoDetector.VideoInfo> {
        return videoDetector.parseVideoInfo(jsonResult)
    }
    
    fun setOnPipEnterListener(listener: () -> Unit) {
        onPipEnterListener = listener
    }
    
    fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        pipManager.onConfigurationChanged(newConfig)
    }
}
