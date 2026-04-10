package com.example.browser.AdBlock

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.browser.R

class TrustedSiteAdapter(
    private var sites: List<String>,
    private val onRemoveClick: (String) -> Unit
) : RecyclerView.Adapter<TrustedSiteAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvSite: TextView = view.findViewById(R.id.tvSite)
        val btnRemove: ImageButton = view.findViewById(R.id.btnRemove)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_trusted_site, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val site = sites[position]
        holder.tvSite.text = site
        holder.btnRemove.setOnClickListener { onRemoveClick(site) }
    }

    override fun getItemCount(): Int = sites.size

    fun updateData(newSites: List<String>) {
        sites = newSites
        notifyDataSetChanged()
    }
}