package com.example.browser.Download

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {
    
    @Query("SELECT * FROM downloads ORDER BY createTime DESC")
    fun getAllDownloads(): Flow<List<DownloadItem>>
    
    @Query("SELECT * FROM downloads WHERE category = :category ORDER BY createTime DESC")
    fun getDownloadsByCategory(category: DownloadCategory): Flow<List<DownloadItem>>
    
    @Query("SELECT * FROM downloads WHERE id = :id")
    suspend fun getDownload(id: String): DownloadItem?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDownload(download: DownloadItem)
    
    @Update
    suspend fun updateDownload(download: DownloadItem)
    
    @Delete
    suspend fun deleteDownload(download: DownloadItem)
    
    @Query("DELETE FROM downloads WHERE id = :id")
    suspend fun deleteDownloadById(id: String)
    
    @Query("UPDATE downloads SET status = :status, downloadedSize = :downloadedSize WHERE id = :id")
    suspend fun updateProgress(id: String, status: DownloadStatus, downloadedSize: Long)
    
    @Query("UPDATE downloads SET status = :status, completeTime = :completeTime WHERE id = :id")
    suspend fun updateStatus(id: String, status: DownloadStatus, completeTime: Long?)
}
