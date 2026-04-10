package com.example.browser

import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import org.jsoup.select.Elements

class ArticleParser {

    fun parse(html: String, baseUrl: String): Article? {
        return try {
            val document: Document = Jsoup.parse(html, baseUrl)
            
            val title = extractTitle(document)
            val content = extractContent(document)
            val images = extractImages(document, baseUrl)
            
            if (content.isNotEmpty()) {
                Article(
                    title = title,
                    content = content,
                    images = images,
                    sourceUrl = baseUrl
                )
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun extractTitle(document: Document): String {
        val h1 = document.selectFirst("h1")
        if (!h1?.text().isNullOrEmpty()) {
            return h1?.text() ?: ""
        }
        
        val h2 = document.selectFirst("h2")
        if (!h2?.text().isNullOrEmpty()) {
            return h2?.text() ?: ""
        }
        
        val ogTitle = document.selectFirst("meta[property=og:title]")
        if (ogTitle != null) {
            return ogTitle.attr("content")
        }
        
        return document.title()
    }

    private fun extractContent(document: Document): String {
        removeNoiseElements(document)
        
        val article = findMainContent(document)
        
        if (article != null) {
            return cleanContent(article)
        }
        
        val paragraphs = document.select("p")
        if (paragraphs.size >= 3) {
            val sb = StringBuilder()
            paragraphs.forEach { p ->
                val text = p.text().trim()
                if (text.length > 50) {
                    sb.append("<p>").append(text).append("</p>")
                }
            }
            return sb.toString()
        }
        
        return ""
    }

    private fun removeNoiseElements(document: Document) {
        val noiseSelectors = listOf(
            "script", "style", "nav", "header", "footer",
            "aside", ".sidebar", ".advertisement", ".ad",
            ".comments", ".comment", ".social", ".share",
            ".navigation", ".menu", ".related"
        )
        
        noiseSelectors.forEach { selector ->
            document.select(selector).remove()
        }
    }

    private fun findMainContent(document: Document): Element? {
        val contentSelectors = listOf(
            "article",
            "[class*='content']",
            "[class*='article']",
            "[class*='post']",
            "[class*='entry']",
            "[id*='content']",
            "[id*='article']",
            "[id*='post']",
            "main"
        )
        
        for (selector in contentSelectors) {
            val element = document.selectFirst(selector)
            if (element != null && element.text().length > 200) {
                return element
            }
        }
        
        val divs = document.select("div")
        var maxLength = 0
        var bestDiv: Element? = null
        
        divs.forEach { div ->
            val text = div.text()
            if (text.length > maxLength) {
                maxLength = text.length
                bestDiv = div
            }
        }
        
        return bestDiv
    }

    private fun cleanContent(element: Element): String {
        val pElements = element.select("p")
        if (pElements.size >= 2) {
            val sb = StringBuilder()
            pElements.forEach { p ->
                val text = p.text().trim()
                if (text.length > 10) {
                    sb.append("<p>").append(text).append("</p>")
                }
            }
            return sb.toString()
        }
        
        return element.html()
    }

    private fun extractImages(document: Document, baseUrl: String): List<String> {
        val images = mutableListOf<String>()
        val imgElements = document.select("img")
        
        imgElements.forEach { img ->
            var src = img.attr("src")
            if (src.isEmpty()) {
                src = img.attr("data-src")
            }
            if (src.isEmpty()) {
                src = img.attr("data-lazy-src")
            }
            
            if (src.isNotEmpty()) {
                if (!src.startsWith("http")) {
                    if (src.startsWith("//")) {
                        src = "https:$src"
                    } else if (src.startsWith("/")) {
                        val baseUri = java.net.URI(baseUrl)
                        src = "${baseUri.scheme}://${baseUri.host}$src"
                    } else {
                        src = "$baseUrl/$src"
                    }
                }
                images.add(src)
            }
        }
        
        return images
    }
}
