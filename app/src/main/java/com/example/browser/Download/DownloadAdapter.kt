package com.example.browser.Download

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DownloadAdapter(
    private val onOpenClick: (DownloadItem) -> Unit,
    private val onShareClick: (DownloadItem) -> Unit,
    private val onDeleteClick: (DownloadItem) -> Unit
) : ListAdapter<DownloadItem, DownloadAdapter.ViewHolder>(DownloadDiffCallback()) {
    
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivIcon: ImageView = view.findViewById(R.id.ivIcon)
        val tvFileName: TextView = view.findViewById(R.id.tvFileName)
        val tvFileSize: TextView = view.findViewById(R.id.tvFileSize)
        val progressBar: ProgressBar = view.findViewById(R.id.progressBar)
        val btnOpen: Button = view.findViewById(R.id.btnOpen)
        val btnShare: Button = view.findViewById(R.id.btnShare)
        val btnDelete: Button = view.findViewById(R.id.btnDelete)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_download, parent, false)
        return ViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = getItem(position)
        
        holder.tvFileName.text = item.fileName
        holder.tvFileSize.text = formatFileInfo(item)
        
        when (item.status) {
            DownloadStatus.DOWNLOADING -> {
                holder.progressBar.visibility = View.VISIBLE
                val progress = if (item.fileSize > 0) {
                    (item.downloadedSize * 100 / item.fileSize).toInt()
                } else 0
                holder.progressBar.progress = progress
            }
            DownloadStatus.PAUSED -> {
                holder.progressBar.visibility = View.VISIBLE
                holder.progressBar.progress = 0
            }
            else -> {
                holder.progressBar.visibility = View.GONE
            }
        }
        
        holder.btnOpen.setOnClickListener { onOpenClick(item) }
        holder.btnShare.setOnClickListener { onShareClick(item) }
        holder.btnDelete.setOnClickListener { onDeleteClick(item) }
    }
    
    private fun formatFileInfo(item: DownloadItem): String {
        val size = formatFileSize(item.fileSize)
        val date = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
            .format(Date(item.createTime))
        return "$size | $date"
    }
    
    private fun formatFileSize(size: Long): String {
        return when {
            size < 1024 -> "$size B"
            size < 1024 * 1024 -> "${size / 1024} KB"
            size < 1024 * 1024 * 1024 -> "${size / (1024 * 1024)} MB"
            else -> "${size / (1024 * 1024 * 1024)} GB"
        }
    }
    
    class DownloadDiffCallback : DiffUtil.ItemCallback<DownloadItem>() {
        override fun areItemsTheSame(oldItem: DownloadItem, newItem: DownloadItem): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: DownloadItem, newItem: DownloadItem): Boolean {
            return oldItem == newItem
        }
    }
}