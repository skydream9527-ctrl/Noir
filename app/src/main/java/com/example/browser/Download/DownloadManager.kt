package com.example.browser.Download

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.File

class DownloadManager(private val context: Context) {
    
    private val downloadDao = DownloadDatabase.getInstance(context).downloadDao()
    private val downloadTask = DownloadTask(context, downloadDao)
    private val downloadMap = mutableMapOf<String, DownloadTask>()
    
    companion object {
        private val IMAGE_EXTENSIONS = listOf(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp")
        private val VIDEO_EXTENSIONS = listOf(".mp4", ".avi", ".mkv", ".webm", ".mov", ".flv")
        private val DOCUMENT_EXTENSIONS = listOf(".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx")
    }
    
    fun download(url: String, fileName: String? = null): String {
        val id = java.util.UUID.randomUUID().toString()
        val name = fileName ?: url.substringAfterLast("/").substringBefore("?") ?: "download"
        val extension = "." + name.substringAfterLast(".", "")
        val category = getCategoryByExtension(extension)
        
        val downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        val filePath = File(downloadDir, name).absolutePath
        
        val item = DownloadItem(
            id = id,
            url = url,
            fileName = name,
            filePath = filePath,
            fileSize = 0,
            status = DownloadStatus.PENDING,
            mimeType = getMimeType(extension),
            category = category
        )
        
        GlobalScope.launch(Dispatchers.IO) {
            downloadDao.insertDownload(item)
        }
        
        downloadTask.startDownload(item, object : DownloadTask.ProgressCallback {
            override fun onProgress(downloaded: Long, total: Long) {}
            override fun onComplete(success: Boolean, error: String?) {}
        })
        
        downloadMap[id] = downloadTask
        return id
    }
    
    private fun getCategoryByExtension(extension: String): DownloadCategory {
        val ext = extension.lowercase()
        return when {
            IMAGE_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.IMAGE
            VIDEO_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.VIDEO
            DOCUMENT_EXTENSIONS.any { ext.endsWith(it) } -> DownloadCategory.DOCUMENT
            else -> DownloadCategory.OTHER
        }
    }
    
    private fun getMimeType(extension: String): String {
        val ext = extension.lowercase()
        return when {
            ext.endsWith(".pdf") -> "application/pdf"
            ext.endsWith(".doc") -> "application/msword"
            ext.endsWith(".docx") -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ext.endsWith(".jpg") || ext.endsWith(".jpeg") -> "image/jpeg"
            ext.endsWith(".png") -> "image/png"
            ext.endsWith(".gif") -> "image/gif"
            ext.endsWith(".mp4") -> "video/mp4"
            ext.endsWith(".webm") -> "video/webm"
            else -> "application/octet-stream"
        }
    }
    
    fun pause(downloadId: String) {
        downloadMap[downloadId]?.pauseDownload(downloadId)
    }
    
    fun resume(downloadId: String) {
        GlobalScope.launch(Dispatchers.IO) {
            val item = downloadDao.getDownload(downloadId) ?: return@launch
            if (item.status == DownloadStatus.PAUSED) {
                downloadTask.startDownload(item, object : DownloadTask.ProgressCallback {
                    override fun onProgress(downloaded: Long, total: Long) {}
                    override fun onComplete(success: Boolean, error: String?) {}
                })
            }
        }
    }
    
    fun cancel(downloadId: String) {
        downloadMap[downloadId]?.cancelDownload(downloadId)
        downloadMap.remove(downloadId)
    }
    
    fun delete(downloadId: String) {
        GlobalScope.launch(Dispatchers.IO) {
            val item = downloadDao.getDownload(downloadId) ?: return@launch
            File(item.filePath).delete()
            downloadDao.deleteDownload(item)
        }
    }
    
    fun getAllDownloads(): Flow<List<DownloadItem>> = downloadDao.getAllDownloads()
    
    fun getDownloadsByCategory(category: DownloadCategory): Flow<List<DownloadItem>> {
        return downloadDao.getDownloadsByCategory(category)
    }
    
    fun openFile(downloadId: String): Boolean {
        val item = runBlocking { downloadDao.getDownload(downloadId) } ?: return false
        val file = File(item.filePath)
        if (!file.exists()) return false
        
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, item.mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        context.startActivity(Intent.createChooser(intent, "打开文件"))
        return true
    }
    
    fun shareFile(downloadId: String): Boolean {
        val item = runBlocking { downloadDao.getDownload(downloadId) } ?: return false
        val file = File(item.filePath)
        if (!file.exists()) return false
        
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = item.mimeType ?: "application/octet-stream"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        context.startActivity(Intent.createChooser(intent, "分享文件"))
        return true
    }
}
