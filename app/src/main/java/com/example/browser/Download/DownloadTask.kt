package com.example.browser.Download

import android.content.Context
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

class DownloadTask(
    private val context: Context,
    private val downloadDao: DownloadDao
) {
    
    private val okHttpClient = OkHttpClient.Builder().build()
    private var currentJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    interface ProgressCallback {
        fun onProgress(downloaded: Long, total: Long)
        fun onComplete(success: Boolean, error: String?)
    }
    
    fun startDownload(item: DownloadItem, callback: ProgressCallback) {
        currentJob = scope.launch {
            try {
                val request = Request.Builder().url(item.url).build()
                val response = okHttpClient.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    callback.onComplete(false, "HTTP error: ${response.code}")
                    return@launch
                }
                
                val body = response.body ?: run {
                    callback.onComplete(false, "Empty response")
                    return@launch
                }
                
                val totalBytes = body.contentLength()
                val file = File(item.filePath)
                file.parentFile?.mkdirs()
                
                var downloadedBytes = 0L
                
                body.byteStream().use { input ->
                    FileOutputStream(file).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            
                            val progress = if (totalBytes > 0) {
                                (downloadedBytes * 100 / totalBytes)
                            } else 0L
                            
                            downloadDao.updateProgress(item.id, DownloadStatus.DOWNLOADING, downloadedBytes)
                            withContext(Dispatchers.Main) {
                                callback.onProgress(downloadedBytes, totalBytes)
                            }
                        }
                    }
                }
                
                downloadDao.updateStatus(item.id, DownloadStatus.COMPLETED, System.currentTimeMillis())
                withContext(Dispatchers.Main) {
                    callback.onComplete(true, null)
                }
                
            } catch (e: Exception) {
                downloadDao.updateStatus(item.id, DownloadStatus.FAILED, null)
                withContext(Dispatchers.Main) {
                    callback.onComplete(false, e.message)
                }
            }
        }
    }
    
    fun pauseDownload(downloadId: String) {
        currentJob?.cancel()
        scope.launch {
            downloadDao.updateStatus(downloadId, DownloadStatus.PAUSED, null)
        }
    }
    
    fun cancelDownload(downloadId: String) {
        currentJob?.cancel()
        scope.launch {
            val download = downloadDao.getDownload(downloadId)
            download?.let {
                File(it.filePath).delete()
                downloadDao.deleteDownload(it)
            }
        }
    }
}
