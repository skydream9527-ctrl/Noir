package com.example.browser.Download

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class DownloadListFragment : Fragment() {
    
    private lateinit var downloadManager: DownloadManager
    private lateinit var adapter: DownloadAdapter
    
    private lateinit var tabLayout: TabLayout
    private lateinit var rvDownloads: RecyclerView
    private lateinit var tvEmpty: TextView
    
    private var currentCategory: DownloadCategory? = null
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_download_list, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        downloadManager = DownloadManager(requireContext())
        
        initViews(view)
        setupRecyclerView()
        setupTabs()
        observeDownloads()
    }
    
    private fun initViews(view: View) {
        tabLayout = view.findViewById(R.id.tabLayout)
        rvDownloads = view.findViewById(R.id.rvDownloads)
        tvEmpty = view.findViewById(R.id.tvEmpty)
    }
    
    private fun setupRecyclerView() {
        adapter = DownloadAdapter(
            onOpenClick = { item -> downloadManager.openFile(item.id) },
            onShareClick = { item -> downloadManager.shareFile(item.id) },
            onDeleteClick = { item -> downloadManager.delete(item.id) }
        )
        
        rvDownloads.layoutManager = LinearLayoutManager(context)
        rvDownloads.adapter = adapter
    }
    
    private fun setupTabs() {
        tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                currentCategory = when (tab?.position) {
                    1 -> DownloadCategory.IMAGE
                    2 -> DownloadCategory.VIDEO
                    3 -> DownloadCategory.DOCUMENT
                    else -> null
                }
                observeDownloads()
            }
            
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }
    
    private fun observeDownloads() {
        viewLifecycleOwner.lifecycleScope.launch {
            val flow = if (currentCategory != null) {
                downloadManager.getDownloadsByCategory(currentCategory!!)
            } else {
                downloadManager.getAllDownloads()
            }
            
            flow.collectLatest { downloads ->
                adapter.submitList(downloads)
                tvEmpty.visibility = if (downloads.isEmpty()) View.VISIBLE else View.GONE
                rvDownloads.visibility = if (downloads.isEmpty()) View.GONE else View.VISIBLE
            }
        }
    }
}