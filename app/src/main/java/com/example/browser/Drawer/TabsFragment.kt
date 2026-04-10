package com.example.browser.Drawer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.example.browser.data.Tab
import com.example.browser.data.TabManager

class TabsFragment(
    private val tabManager: TabManager,
    private val onTabClick: (Tab) -> Unit,
    private val onTabClose: (String) -> Unit,
    private val onNewTabClick: () -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var tvTabCount: TextView
    private lateinit var adapter: TabAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        val rootView = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setPadding(
                resources.getDimensionPixelSize(R.dimen.spacing_medium),
                resources.getDimensionPixelSize(R.dimen.spacing_medium),
                resources.getDimensionPixelSize(R.dimen.spacing_medium),
                resources.getDimensionPixelSize(R.dimen.spacing_medium)
            )
        }
        
        tvTabCount = TextView(requireContext()).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = resources.getDimensionPixelSize(R.dimen.spacing_medium)
            }
            setTextColor(resources.getColor(R.color.text_secondary, null))
            textSize = 14f
        }
        rootView.addView(tvTabCount)
        
        recyclerView = RecyclerView(requireContext()).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0
            )
            layoutManager = GridLayoutManager(context, 2)
        }
        rootView.addView(recyclerView)
        
        return rootView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        refresh()
    }

    fun refresh() {
        val tabs = tabManager.getAllTabs()
        tvTabCount.text = "标签页 (${tabs.size})"
        adapter = TabAdapter(tabs, onTabClick, onTabClose, onNewTabClick)
        recyclerView.adapter = adapter
    }
}

class TabAdapter(
    private var tabs: List<Tab>,
    private val onTabClick: (Tab) -> Unit,
    private val onTabClose: (String) -> Unit,
    private val onNewTabClick: () -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_TAB = 0
        private const val TYPE_NEW_TAB = 1
    }

    override fun getItemViewType(position: Int): Int {
        return if (position == tabs.size) TYPE_NEW_TAB else TYPE_TAB
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == TYPE_NEW_TAB) {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_tab_card, parent, false)
            NewTabViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_tab_card, parent, false)
            TabViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is TabViewHolder -> {
                val tab = tabs[position]
                holder.bind(tab)
                holder.itemView.setOnClickListener { onTabClick(tab) }
                holder.ivClose.setOnClickListener { onTabClose(tab.id) }
            }
            is NewTabViewHolder -> {
                holder.itemView.setOnClickListener { onNewTabClick() }
            }
        }
    }

    override fun getItemCount() = tabs.size + 1

    class TabViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvTabTitle: TextView = view.findViewById(R.id.tvTabTitle)
        val ivClose: ImageView = view.findViewById(R.id.ivClose)
        
        fun bind(tab: Tab) {
            tvTabTitle.text = tab.title.ifEmpty { "新标签页" }
        }
    }

    class NewTabViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvTabTitle: TextView = view.findViewById(R.id.tvTabTitle)
        private val ivClose: ImageView = view.findViewById(R.id.ivClose)
        
        init {
            tvTabTitle.text = "+ 新标签页"
            ivClose.visibility = View.GONE
            val preview: View = view.findViewById(R.id.tabPreview)
            preview.setBackgroundColor(view.context.resources.getColor(R.color.background_card, null))
        }
    }
}
