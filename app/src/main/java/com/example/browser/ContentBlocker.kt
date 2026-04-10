package com.example.browser

class ContentBlocker(private val rulesManager: AdBlockRulesManager) {
    
    fun getBlockingScript(): String {
        return rulesManager.getContentBlockerScript()
    }
    
    fun shouldInjectScript(): Boolean {
        return rulesManager.getContentRulesCount() > 0
    }
}
