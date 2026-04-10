package com.example.browser.Download

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(entities = [DownloadItem::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class DownloadDatabase : RoomDatabase() {
    
    abstract fun downloadDao(): DownloadDao
    
    companion object {
        @Volatile
        private var INSTANCE: DownloadDatabase? = null
        
        fun getInstance(context: Context): DownloadDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DownloadDatabase::class.java,
                    "download_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

class Converters {
    @androidx.room.TypeConverter
    fun fromDownloadStatus(status: DownloadStatus): String = status.name
    
    @androidx.room.TypeConverter
    fun toDownloadStatus(value: String): DownloadStatus = DownloadStatus.valueOf(value)
    
    @androidx.room.TypeConverter
    fun fromDownloadCategory(category: DownloadCategory): String = category.name
    
    @androidx.room.TypeConverter
    fun toDownloadCategory(value: String): DownloadCategory = DownloadCategory.valueOf(value)
}
