package com.example.browser

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.content.ContextCompat
import com.example.browser.data.FavoriteManager
import com.example.browser.data.HistoryManager
import com.example.browser.data.TabManager

class DrawerController(
    private val context: Context,
    private val tabContainer: View,
    private val contentContainer: FrameLayout,
    private val ivBookmark: ImageView,
    private val ivHistory: ImageView,
    private val ivTabs: ImageView
) {
    
    private val bookmarkManager = FavoriteManager(context)
    private val historyManager = HistoryManager(context)
    private val tabManager = TabManager(context)
    
    private var currentTab = Tab.BOOKMARKS
    
    enum class Tab { BOOKMARKS, HISTORY, TABS }
    
    init {
        setupTabClicks()
        showTab(Tab.BOOKMARKS)
    }
    
    private fun setupTabClicks() {
        ivBookmark.setOnClickListener { showTab(Tab.BOOKMARKS) }
        ivHistory.setOnClickListener { showTab(Tab.HISTORY) }
        ivTabs.setOnClickListener { showTab(Tab.TABS) }
    }
    
    private fun showTab(tab: Tab) {
        currentTab = tab
        updateTabIcons()
        updateContent()
    }
    
    private fun updateTabIcons() {
        val activeColor = ContextCompat.getColor(context, R.color.icon_active)
        val inactiveColor = ContextCompat.getColor(context, R.color.icon_inactive)
        
        ivBookmark.setColorFilter(if (currentTab == Tab.BOOKMARKS) activeColor else inactiveColor)
        ivHistory.setColorFilter(if (currentTab == Tab.HISTORY) activeColor else inactiveColor)
        ivTabs.setColorFilter(if (currentTab == Tab.TABS) activeColor else inactiveColor)
    }
    
    private fun updateContent() {
    }
}
