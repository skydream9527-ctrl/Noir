package com.example.browser

import android.app.Application
import com.tencent.smtt.sdk.CookieManager
import com.tencent.smtt.sdk.QbSdk

class BrowserApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        try {
            X5InitHelper.init(this)
            initCookieManager()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun initCookieManager() {
        try {
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setAcceptThirdPartyCookies(null, true)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}