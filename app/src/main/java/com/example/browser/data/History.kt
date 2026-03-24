package com.example.browser.data

import java.util.UUID

data class History(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var url: String,
    var favicon: String? = null,
    val visitedAt: Long = System.currentTimeMillis()
)