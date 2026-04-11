package com.example.browser.SpeedUp

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import okio.BufferedSource
import java.io.IOException

class DataCompressor(
    private val imageQuality: Int = 80
) {
    
    private val compressibleTypes = listOf(
        "text/html",
        "text/css",
        "application/javascript",
        "application/json",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    )
    
    fun isCompressionEnabled(): Boolean = imageQuality > 0 && imageQuality < 100
    
    fun shouldCompress(contentType: String?): Boolean {
        if (contentType == null) return false
        return compressibleTypes.any { contentType.contains(it, ignoreCase = true) }
    }
    
    fun getCompressedBody(originalBody: ResponseBody, contentType: String?): ResponseBody {
        if (!shouldCompress(contentType)) return originalBody
        
        val content = try {
            val source: BufferedSource = originalBody.source()
            val buffer = Buffer()
            source.readAll(buffer)
            buffer.readUtf8()
        } catch (e: IOException) {
            return originalBody
        }
        
        val compressedContent = when {
            contentType?.contains("javascript", ignoreCase = true) == true -> minifyJs(content)
            contentType?.contains("json", ignoreCase = true) == true -> minifyJson(content)
            else -> content
        }
        
        return compressedContent.toResponseBody(contentType?.toMediaType())
    }
    
    private fun minifyJs(js: String): String {
        return js
            .replace(Regex("/\\*.*?\\*/", RegexOption.DOT_MATCHES_ALL), "")
            .replace(Regex("//.*?$", RegexOption.MULTILINE), "")
            .replace(Regex("\\s+"), " ")
            .trim()
    }
    
    private fun minifyJson(json: String): String {
        return json
            .replace(Regex("\\s+"), "")
            .trim()
    }
}
