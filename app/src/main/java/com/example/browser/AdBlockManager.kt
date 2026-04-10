package com.example.browser

import android.content.Context
import android.content.SharedPreferences

class AdBlockManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val rulesManager = AdBlockRulesManager(context)
    private val dnsBlocker = DnsBlocker(rulesManager)
    private val contentBlocker = ContentBlocker(rulesManager)
    
    companion object {
        private const val PREFS_NAME = "ad_block_settings"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_TRUSTED_SITES = "trusted_sites"
        private const val KEY_LAST_UPDATE = "last_update"
    }
    
    fun isEnabled(): Boolean = prefs.getBoolean(KEY_ENABLED, true)
    
    fun setEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    fun isSiteBlocked(site: String): Boolean {
        val trustedSites = getTrustedSites()
        return site !in trustedSites
    }
    
    fun getTrustedSites(): Set<String> {
        return prefs.getStringSet(KEY_TRUSTED_SITES, emptySet()) ?: emptySet()
    }
    
    fun addTrustedSite(site: String) {
        val sites = getTrustedSites().toMutableSet()
        sites.add(site)
        prefs.edit().putStringSet(KEY_TRUSTED_SITES, sites).apply()
    }
    
    fun removeTrustedSite(site: String) {
        val sites = getTrustedSites().toMutableSet()
        sites.remove(site)
        prefs.edit().putStringSet(KEY_TRUSTED_SITES, sites).apply()
    }
    
    fun shouldBlockRequest(url: String): Boolean {
        if (!isEnabled()) return false
        val host = try {
            java.net.URL(url).host
        } catch (e: Exception) {
            return false
        }
        if (!isSiteBlocked(host)) return false
        return dnsBlocker.shouldBlockUrl(url)
    }
    
    fun getContentBlockerScript(): String {
        if (!isEnabled()) return ""
        return contentBlocker.getBlockingScript()
    }
    
    fun shouldInjectContentScript(): Boolean {
        return isEnabled() && contentBlocker.shouldInjectScript()
    }
    
    fun getRulesCount(): Pair<Int, Int> {
        return Pair(rulesManager.getDnsRulesCount(), rulesManager.getContentRulesCount())
    }
    
    fun getLastUpdateTime(): Long = prefs.getLong(KEY_LAST_UPDATE, 0)
    
    fun updateRules() {
        prefs.edit().putLong(KEY_LAST_UPDATE, System.currentTimeMillis()).apply()
    }
}