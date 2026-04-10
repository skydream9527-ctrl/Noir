package com.example.browser

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.example.browser.data.FavoriteManager
import com.example.browser.data.HistoryManager
import com.example.browser.data.TabManager
import com.example.browser.Drawer.BookmarksFragment
import com.example.browser.Drawer.HistoryFragment
import com.example.browser.Drawer.TabsFragment

class DrawerController(
    private val activity: FragmentActivity,
    private val tabContainer: View,
    private val contentContainer: FrameLayout,
    private val ivBookmark: ImageView,
    private val ivHistory: ImageView,
    private val ivTabs: ImageView,
    private val onNavigate: (String) -> Unit
) {
    
    private val favoriteManager = FavoriteManager(activity)
    private val historyManager = HistoryManager(activity)
    private val tabManager = TabManager(activity)
    
    private var currentTab = Tab.BOOKMARKS
    private var currentFragment: androidx.fragment.app.Fragment? = null
    
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
        
        val fragment = when (tab) {
            Tab.BOOKMARKS -> BookmarksFragment(favoriteManager) { favorite ->
                onNavigate(favorite.url)
            }
            Tab.HISTORY -> HistoryFragment(historyManager) { history ->
                onNavigate(history.url)
            }
            Tab.TABS -> TabsFragment(
                tabManager,
                onTabClick = { tab ->
                    tabManager.switchToTab(tab.id)
                    onNavigate(tab.url)
                },
                onTabClose = { tabId ->
                    tabManager.removeTab(tabId)
                    refresh()
                },
                onNewTabClick = {
                    tabManager.createNewTab()
                    refresh()
                }
            )
        }
        
        currentFragment = fragment
        activity.supportFragmentManager.beginTransaction()
            .replace(contentContainer.id, fragment)
            .commit()
    }
    
    private fun updateTabIcons() {
        val activeColor = ContextCompat.getColor(activity, R.color.icon_active)
        val inactiveColor = ContextCompat.getColor(activity, R.color.icon_inactive)
        
        ivBookmark.setColorFilter(if (currentTab == Tab.BOOKMARKS) activeColor else inactiveColor)
        ivHistory.setColorFilter(if (currentTab == Tab.HISTORY) activeColor else inactiveColor)
        ivTabs.setColorFilter(if (currentTab == Tab.TABS) activeColor else inactiveColor)
    }
    
    fun refresh() {
        (currentFragment as? TabsFragment)?.refresh()
        (currentFragment as? BookmarksFragment)?.refresh()
        (currentFragment as? HistoryFragment)?.refresh()
    }
}