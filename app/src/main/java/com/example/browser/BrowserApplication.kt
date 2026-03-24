package com.example.browser

import android.app.Application

class BrowserApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        X5InitHelper.init(this)
    }
}