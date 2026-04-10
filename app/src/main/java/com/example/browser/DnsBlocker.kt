package com.example.browser

class DnsBlocker(private val rulesManager: AdBlockRulesManager) {
    
    fun shouldBlockUrl(url: String): Boolean {
        return rulesManager.matchesDnsRule(url)
    }
}
