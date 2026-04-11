package com.example.browser

import android.content.Context
import android.util.Log
import com.tencent.smtt.sdk.QbSdk
import com.tencent.smtt.sdk.TbsListener

object X5InitHelper {
    private const val TAG = "X5InitHelper"
    private var isInitialized = false
    private var initFailed = false
    
    fun init(context: Context) {
        if (isInitialized || initFailed) return
        
        try {
            QbSdk.setDownloadWithoutWifi(true)
            
            QbSdk.setTbsListener(object : TbsListener {
                override fun onDownloadFinish(i: Int) {
                    Log.d(TAG, "X5内核下载完成: $i")
                }
                
                override fun onInstallFinish(i: Int) {
                    Log.d(TAG, "X5内核安装完成: $i")
                }
                
                override fun onDownloadProgress(progress: Int) {
                    Log.d(TAG, "X5内核下载进度: $progress%")
                }
            })
            
            QbSdk.initX5Environment(context.applicationContext, object : QbSdk.PreInitCallback {
                override fun onCoreInitFinished() {
                    Log.d(TAG, "X5内核核心初始化完成")
                }
                
                override fun onViewInitFinished(success: Boolean) {
                    if (success) {
                        Log.d(TAG, "X5内核视图初始化完成")
                        isInitialized = true
                    } else {
                        Log.e(TAG, "X5内核初始化失败，将使用系统WebView")
                        initFailed = true
                    }
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "X5初始化异常: ${e.message}")
            initFailed = true
        }
    }
    
    fun isX5CoreAvailable(): Boolean {
        return try {
            QbSdk.canLoadX5(null) || QbSdk.isX5Core()
        } catch (e: Exception) {
            false
        }
    }
    
    fun canLoadX5(context: Context): Boolean {
        return try {
            QbSdk.canLoadX5(context)
        } catch (e: Exception) {
            false
        }
    }
    
    fun isInitialized(): Boolean = isInitialized
    
    fun isFailed(): Boolean = initFailed
}