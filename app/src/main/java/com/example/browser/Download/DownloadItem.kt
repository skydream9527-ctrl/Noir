package com.example.browser.Download

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadItem(
    @PrimaryKey val id: String,
    val url: String,
    val fileName: String,
    val filePath: String,
    val fileSize: Long,
    val downloadedSize: Long = 0,
    val status: DownloadStatus = DownloadStatus.PENDING,
    val mimeType: String? = null,
    val category: DownloadCategory = DownloadCategory.OTHER,
    val createTime: Long = System.currentTimeMillis(),
    val completeTime: Long? = null
)

enum class DownloadStatus {
    PENDING, DOWNLOADING, PAUSED, COMPLETED, FAILED
}

enum class DownloadCategory {
    IMAGE, VIDEO, DOCUMENT, OTHER
}
