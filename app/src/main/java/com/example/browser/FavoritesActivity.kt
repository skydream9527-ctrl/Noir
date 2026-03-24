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
import com.example.browser.data.Favorite
import com.example.browser.data.FavoriteManager
import com.example.browser.databinding.ActivityFavoritesBinding
import android.widget.Toast
import java.net.URL

class FavoritesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFavoritesBinding
    private lateinit var favoriteManager: FavoriteManager
    private lateinit var adapter: FavoritesAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFavoritesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        favoriteManager = FavoriteManager(this)

        setupToolbar()
        setupRecyclerView()
        loadFavorites()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
        
        binding.btnClearAll.setOnClickListener {
            if (favoriteManager.getFavoriteCount() == 0) {
                Toast.makeText(this, "暂无收藏", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AlertDialog.Builder(this)
                .setTitle("清空收藏")
                .setMessage("确定要清空所有收藏吗？")
                .setPositiveButton("清空") { _, _ ->
                    while (favoriteManager.getFavoriteCount() > 0) {
                        favoriteManager.getAllFavorites().forEach {
                            favoriteManager.removeFavorite(it.id)
                        }
                    }
                    loadFavorites()
                    Toast.makeText(this, "收藏已清空", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("取消", null)
                .show()
        }
    }

    private fun setupRecyclerView() {
        adapter = FavoritesAdapter(
            favorites = favoriteManager.getAllFavorites(),
            onItemClick = { favorite ->
                openUrl(favorite.url)
            },
            onDeleteClick = { favorite ->
                showDeleteDialog(favorite)
            }
        )
        binding.recyclerFavorites.layoutManager = LinearLayoutManager(this)
        binding.recyclerFavorites.adapter = adapter
    }

    private fun loadFavorites() {
        val favorites = favoriteManager.getAllFavorites()
        adapter.updateFavorites(favorites)
        
        if (favorites.isEmpty()) {
            binding.recyclerFavorites.visibility = View.GONE
            binding.tvEmptyHint.visibility = View.VISIBLE
        } else {
            binding.recyclerFavorites.visibility = View.VISIBLE
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

    private fun showDeleteDialog(favorite: Favorite) {
        AlertDialog.Builder(this)
            .setTitle("删除收藏")
            .setMessage("确定要删除 \"${favorite.title}\" 吗？")
            .setPositiveButton("删除") { _, _ ->
                favoriteManager.removeFavorite(favorite.id)
                loadFavorites()
            }
            .setNegativeButton("取消", null)
            .show()
    }

    inner class FavoritesAdapter(
        private var favorites: List<Favorite>,
        private val onItemClick: (Favorite) -> Unit,
        private val onDeleteClick: (Favorite) -> Unit
    ) : RecyclerView.Adapter<FavoritesAdapter.FavoriteViewHolder>() {

        inner class FavoriteViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val ivFavicon: ImageView = itemView.findViewById(R.id.ivFavicon)
            val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)
            val tvUrl: TextView = itemView.findViewById(R.id.tvUrl)
            val btnDelete: View = itemView.findViewById(R.id.btnDelete)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FavoriteViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_favorite, parent, false)
            return FavoriteViewHolder(view)
        }

        override fun onBindViewHolder(holder: FavoriteViewHolder, position: Int) {
            val favorite = favorites[position]
            
            holder.tvTitle.text = favorite.title
            holder.tvUrl.text = try {
                URL(favorite.url).host
            } catch (e: Exception) {
                favorite.url
            }
            
            holder.itemView.setOnClickListener {
                onItemClick(favorite)
            }
            
            holder.btnDelete.setOnClickListener {
                onDeleteClick(favorite)
            }
        }

        override fun getItemCount(): Int = favorites.size

        fun updateFavorites(newFavorites: List<Favorite>) {
            favorites = newFavorites
            notifyDataSetChanged()
        }
    }
}