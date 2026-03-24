package com.example.browser

import android.app.Application
import com.tencent.smtt.sdk.CookieManager

class BrowserApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        X5InitHelper.init(this)
        initCookieManager()
    }
    
    private fun initCookieManager() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(null, true)
    }
}