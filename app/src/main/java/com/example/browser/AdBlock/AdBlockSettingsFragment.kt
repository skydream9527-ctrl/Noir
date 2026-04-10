package com.example.browser.AdBlock

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.appcompat.widget.SwitchCompat
import com.example.browser.AdBlockManager
import com.example.browser.R

class AdBlockSettingsFragment : Fragment() {
    
    private lateinit var adBlockManager: AdBlockManager
    private lateinit var adapter: TrustedSiteAdapter
    
    private lateinit var switchAdBlock: SwitchCompat
    private lateinit var tvRulesCount: TextView
    private lateinit var rvTrustedSites: RecyclerView
    private lateinit var btnAddTrustedSite: Button
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_ad_block_settings, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        adBlockManager = AdBlockManager(requireContext())
        
        switchAdBlock = view.findViewById(R.id.switchAdBlock)
        tvRulesCount = view.findViewById(R.id.tvRulesCount)
        rvTrustedSites = view.findViewById(R.id.rvTrustedSites)
        btnAddTrustedSite = view.findViewById(R.id.btnAddTrustedSite)
        
        setupViews()
        updateRulesCount()
        updateTrustedSitesList()
    }
    
    private fun setupViews() {
        switchAdBlock.isChecked = adBlockManager.isEnabled()
        switchAdBlock.setOnCheckedChangeListener { _, isChecked ->
            adBlockManager.setEnabled(isChecked)
        }
        
        rvTrustedSites.layoutManager = LinearLayoutManager(context)
        adapter = TrustedSiteAdapter(emptyList()) { site ->
            adBlockManager.removeTrustedSite(site)
            updateTrustedSitesList()
        }
        rvTrustedSites.adapter = adapter
        
        btnAddTrustedSite.setOnClickListener {
            showAddSiteDialog()
        }
    }
    
    private fun updateRulesCount() {
        val (dnsCount, contentCount) = adBlockManager.getRulesCount()
        tvRulesCount.text = "DNS 规则：$dnsCount | 内容规则：$contentCount"
    }
    
    private fun updateTrustedSitesList() {
        adapter.updateData(adBlockManager.getTrustedSites().toList())
    }
    
    private fun showAddSiteDialog() {
        val editText = EditText(requireContext()).apply {
            hint = "输入网站域名"
            setPadding(48, 32, 48, 32)
        }
        
        AlertDialog.Builder(requireContext())
            .setTitle("添加信任网站")
            .setView(editText)
            .setPositiveButton("添加") { _, _ ->
                val site = editText.text.toString().trim()
                if (site.isNotEmpty()) {
                    adBlockManager.addTrustedSite(site)
                    updateTrustedSitesList()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }
}