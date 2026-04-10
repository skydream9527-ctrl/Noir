package com.example.browser

data class AdBlockSettings(
    val enabled: Boolean = true,
    val trustedSites: Set<String> = emptySet(),
    val lastUpdateTime: Long = 0
)

data class SiteSettings(
    val site: String,
    val adBlockEnabled: Boolean = true
)
