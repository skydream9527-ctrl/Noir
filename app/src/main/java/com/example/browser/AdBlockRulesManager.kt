package com.example.browser

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader

class AdBlockRulesManager(private val context: Context) {
    
    private var dnsRules: Set<String> = emptySet()
    private var contentRules: List<String> = emptyList()
    
    init {
        loadRules()
    }
    
    private fun loadRules() {
        dnsRules = loadDnsRules()
        contentRules = loadContentRules()
    }
    
    private fun loadDnsRules(): Set<String> {
        return try {
            context.assets.open("adblock/dns_rules.txt").use { inputStream ->
                BufferedReader(InputStreamReader(inputStream)).use { reader ->
                    reader.lineSequence()
                        .filter { it.isNotBlank() && !it.startsWith("!") && !it.startsWith("[") }
                        .map { it.trim() }
                        .toSet()
                }
            }
        } catch (e: Exception) {
            emptySet()
        }
    }
    
    private fun loadContentRules(): List<String> {
        return try {
            context.assets.open("adblock/content_rules.txt").use { inputStream ->
                BufferedReader(InputStreamReader(inputStream)).use { reader ->
                    reader.lineSequence()
                        .filter { it.isNotBlank() && !it.startsWith("!") && !it.startsWith("[") }
                        .map { it.trim() }
                        .toList()
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun getDnsRulesCount(): Int = dnsRules.size
    
    fun getContentRulesCount(): Int = contentRules.size
    
    fun matchesDnsRule(url: String): Boolean {
        val host = try {
            java.net.URL(url).host
        } catch (e: Exception) {
            return false
        }
        return dnsRules.any { rule ->
            val pattern = rule.removePrefix("||").removeSuffix("^")
            host == pattern || host.endsWith(".$pattern")
        }
    }
    
    fun getContentBlockerScript(): String {
        if (contentRules.isEmpty()) return ""
        
        val selectors = contentRules
            .mapNotNull { rule ->
                when {
                    rule.startsWith("##") -> rule.removePrefix("##")
                    rule.startsWith("###") -> rule.removePrefix("###")
                    else -> null
                }
            }
            .filter { it.isNotEmpty() }
            .joinToString(",\n")
        
        if (selectors.isEmpty()) return ""
        
        return """
            (function() {
                var style = document.createElement('style');
                style.innerHTML = '$selectors { display: none !important; visibility: hidden !important; }';
                document.head.appendChild(style);
            })();
        """.trimIndent()
    }
}
