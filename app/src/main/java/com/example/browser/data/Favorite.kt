package com.example.browser.data

import java.util.UUID

data class Favorite(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var url: String,
    var favicon: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)