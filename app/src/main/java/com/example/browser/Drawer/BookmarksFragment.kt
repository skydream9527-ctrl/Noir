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
import com.example.browser.data.Favorite
import com.example.browser.data.FavoriteManager

class BookmarksFragment(
    private val favoriteManager: FavoriteManager,
    private val onFavoriteClick: (Favorite) -> Unit
) : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: BookmarkAdapter

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
        adapter = BookmarkAdapter(favoriteManager.getAllFavorites(), onFavoriteClick)
        recyclerView.adapter = adapter
    }

    fun refresh() {
        adapter.update(favoriteManager.getAllFavorites())
    }
}

class BookmarkAdapter(
    private var bookmarks: List<Favorite>,
    private val onClick: (Favorite) -> Unit
) : RecyclerView.Adapter<BookmarkAdapter.ViewHolder>() {

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
        val bookmark = bookmarks[position]
        holder.tvTitle.text = bookmark.title
        holder.tvUrl.text = bookmark.url
        holder.itemView.setOnClickListener { onClick(bookmark) }
    }

    override fun getItemCount() = bookmarks.size

    fun update(newBookmarks: List<Favorite>) {
        bookmarks = newBookmarks
        notifyDataSetChanged()
    }
}
