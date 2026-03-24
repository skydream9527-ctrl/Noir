package com.example.browser

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.data.History
import com.example.browser.data.HistoryManager
import com.example.browser.databinding.ActivityHistoryBinding
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding
    private lateinit var historyManager: HistoryManager
    private lateinit var adapter: HistoryAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        historyManager = HistoryManager(this)

        setupToolbar()
        setupRecyclerView()
        loadHistories()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        adapter = HistoryAdapter(
            histories = historyManager.getAllHistories(),
            onItemClick = { history ->
                openUrl(history.url)
            },
            onDeleteClick = { history ->
                showDeleteDialog(history)
            }
        )
        binding.recyclerHistory.layoutManager = LinearLayoutManager(this)
        binding.recyclerHistory.adapter = adapter
    }

    private fun loadHistories() {
        val histories = historyManager.getAllHistories()
        adapter.updateHistories(histories)
        
        if (histories.isEmpty()) {
            binding.recyclerHistory.visibility = View.GONE
            binding.tvEmptyHint.visibility = View.VISIBLE
        } else {
            binding.recyclerHistory.visibility = View.VISIBLE
            binding.tvEmptyHint.visibility = View.GONE
        }
    }

    private fun openUrl(url: String) {
        val intent = Intent(this, MultiWindowBrowserActivity::class.java).apply {
            putExtra("url", url)
        }
        startActivity(intent)
        finish()
    }

    private fun showDeleteDialog(history: History) {
        AlertDialog.Builder(this)
            .setTitle("删除记录")
            .setMessage("确定要删除此浏览记录吗？")
            .setPositiveButton("删除") { _, _ ->
                historyManager.removeHistory(history.id)
                loadHistories()
            }
            .setNegativeButton("取消", null)
            .show()
    }

    inner class HistoryAdapter(
        private var histories: List<History>,
        private val onItemClick: (History) -> Unit,
        private val onDeleteClick: (History) -> Unit
    ) : RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {

        inner class HistoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val ivFavicon: ImageView = itemView.findViewById(R.id.ivFavicon)
            val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)
            val tvUrl: TextView = itemView.findViewById(R.id.tvUrl)
            val tvTime: TextView = itemView.findViewById(R.id.tvTime)
            val btnDelete: View = itemView.findViewById(R.id.btnDelete)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_history, parent, false)
            return HistoryViewHolder(view)
        }

        override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
            val history = histories[position]
            
            holder.tvTitle.text = history.title
            holder.tvUrl.text = try {
                URL(history.url).host
            } catch (e: Exception) {
                history.url
            }
            
            val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
            holder.tvTime.text = dateFormat.format(Date(history.visitedAt))
            
            holder.itemView.setOnClickListener {
                onItemClick(history)
            }
            
            holder.btnDelete.setOnClickListener {
                onDeleteClick(history)
            }
        }

        override fun getItemCount(): Int = histories.size

        fun updateHistories(newHistories: List<History>) {
            histories = newHistories
            notifyDataSetChanged()
        }
    }
}