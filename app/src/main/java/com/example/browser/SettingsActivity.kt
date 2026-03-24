package com.example.browser

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.browser.data.FavoriteManager
import com.example.browser.data.HistoryManager
import com.example.browser.databinding.ActivitySettingsBinding
import java.io.File

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var historyManager: HistoryManager
    private lateinit var favoriteManager: FavoriteManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        historyManager = HistoryManager(this)
        favoriteManager = FavoriteManager(this)

        setupToolbar()
        updateStats()
        setupClickListeners()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun updateStats() {
        binding.tvCacheSize.text = getCacheSize()
        binding.tvHistoryCount.text = "${historyManager.getHistoryCount()} 条记录"
        binding.tvFavoritesCount.text = "${favoriteManager.getFavoriteCount()} 条收藏"
    }

    private fun getCacheSize(): String {
        val cacheDir = cacheDir
        var size: Long = 0
        if (cacheDir.exists()) {
            size = getDirSize(cacheDir)
        }
        return formatSize(size)
    }

    private fun getDirSize(dir: File): Long {
        var size: Long = 0
        dir.listFiles()?.forEach { file ->
            size += if (file.isDirectory) {
                getDirSize(file)
            } else {
                file.length()
            }
        }
        return size
    }

    private fun formatSize(size: Long): String {
        return when {
            size < 1024 -> "$size B"
            size < 1024 * 1024 -> String.format("%.1f KB", size / 1024.0)
            size < 1024 * 1024 * 1024 -> String.format("%.1f MB", size / (1024.0 * 1024))
            else -> String.format("%.1f GB", size / (1024.0 * 1024 * 1024))
        }
    }

    private fun setupClickListeners() {
        binding.btnClearCache.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("清除缓存")
                .setMessage("确定要清除缓存吗？")
                .setPositiveButton("确定") { _, _ ->
                    clearCache()
                    updateStats()
                    Toast.makeText(this, "缓存已清除", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("取消", null)
                .show()
        }

        binding.btnClearHistory.setOnClickListener {
            if (historyManager.getHistoryCount() == 0) {
                Toast.makeText(this, "暂无浏览记录", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AlertDialog.Builder(this)
                .setTitle("清除浏览历史")
                .setMessage("确定要清除所有浏览记录吗？")
                .setPositiveButton("确定") { _, _ ->
                    historyManager.clearAllHistories()
                    updateStats()
                    Toast.makeText(this, "浏览记录已清除", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("取消", null)
                .show()
        }

        binding.btnClearFavorites.setOnClickListener {
            if (favoriteManager.getFavoriteCount() == 0) {
                Toast.makeText(this, "暂无收藏", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AlertDialog.Builder(this)
                .setTitle("清除收藏")
                .setMessage("确定要清除所有收藏吗？")
                .setPositiveButton("确定") { _, _ ->
                    while (favoriteManager.getFavoriteCount() > 0) {
                        favoriteManager.getAllFavorites().forEach {
                            favoriteManager.removeFavorite(it.id)
                        }
                    }
                    updateStats()
                    Toast.makeText(this, "收藏已清除", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("取消", null)
                .show()
        }

        binding.btnAbout.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("关于 Noir")
                .setMessage("Noir 浏览器\n版本: 1.0\n\n一款简洁、快速的Android浏览器")
                .setPositiveButton("确定", null)
                .show()
        }
    }

    private fun clearCache() {
        val cacheDir = cacheDir
        if (cacheDir.exists()) {
            deleteDir(cacheDir)
        }
    }

    private fun deleteDir(dir: File): Boolean {
        if (dir.isDirectory) {
            dir.listFiles()?.forEach { file ->
                deleteDir(file)
            }
        }
        return dir.delete()
    }
}