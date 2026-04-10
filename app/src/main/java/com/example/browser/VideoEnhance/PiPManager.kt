package com.example.browser.VideoEnhance

import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import androidx.appcompat.app.AppCompatActivity

class PiPManager(private val activity: AppCompatActivity) {
    
    private var isInPipMode = false
    private var pipCallback: (() -> Unit)? = null
    
    fun isPipSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && 
               activity.packageManager.hasSystemFeature("android.software.picture_in_picture")
    }
    
    fun isInPipMode(): Boolean = isInPipMode
    
    fun enterPipMode(): Boolean {
        if (!isPipSupported()) return false
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            
            return activity.enterPictureInPictureMode(params)
        }
        return false
    }
    
    fun updatePipParams(): PictureInPictureParams? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
        }
        return null
    }
    
    fun setPipCallback(callback: () -> Unit) {
        pipCallback = callback
    }
    
    fun onPipModeChanged(inPipMode: Boolean) {
        isInPipMode = inPipMode
        pipCallback?.invoke()
    }
    
    fun onConfigurationChanged(newConfig: Configuration) {
        isInPipMode = newConfig.orientation == Configuration.ORIENTATION_UNDEFINED
    }
}