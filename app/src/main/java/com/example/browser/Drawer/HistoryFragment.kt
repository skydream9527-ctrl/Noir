package com.example.browser.Drawer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.example.browser.data.History
import com.example.browser.data.HistoryManager

class HistoryFragment(
    private val historyManager: HistoryManager,
    private val onHistoryClick: (History) -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: HistoryAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        recyclerView = RecyclerView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            layoutManager = LinearLayoutManager(context)
        }
        return recyclerView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        adapter = HistoryAdapter(historyManager.getAllHistories().take(50), onHistoryClick)
        recyclerView.adapter = adapter
    }

    fun refresh() {
        adapter.update(historyManager.getAllHistories().take(50))
    }
}

class HistoryAdapter(
    private var history: List<History>,
    private val onClick: (History) -> Unit
) : RecyclerView.Adapter<HistoryAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTitle: TextView = view.findViewById(R.id.tvTitle)
        val tvUrl: TextView = view.findViewById(R.id.tvUrl)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_bookmark, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = history[position]
        holder.tvTitle.text = item.title
        holder.tvUrl.text = item.url
        holder.itemView.setOnClickListener { onClick(item) }
    }

    override fun getItemCount() = history.size

    fun update(newHistory: List<History>) {
        history = newHistory
        notifyDataSetChanged()
    }
}
