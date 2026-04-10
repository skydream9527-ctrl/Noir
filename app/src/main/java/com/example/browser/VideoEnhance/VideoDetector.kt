package com.example.browser.VideoEnhance

import org.json.JSONArray

class VideoDetector {
    
    data class VideoInfo(
        val url: String,
        val title: String?,
        val isPlaying: Boolean,
        val duration: Long
    )
    
    fun getDetectVideoScript(): String {
        return """
            (function() {
                var videos = document.querySelectorAll('video');
                var result = [];
                videos.forEach(function(video) {
                    if (video && video.src) {
                        result.push({
                            url: video.src,
                            title: document.title,
                            isPlaying: !video.paused && !video.ended,
                            duration: video.duration || 0
                        });
                    }
                });
                return JSON.stringify(result);
            })();
        """.trimIndent()
    }
    
    fun parseVideoInfo(jsonResult: String): List<VideoInfo> {
        if (jsonResult.isEmpty()) return emptyList()
        
        return try {
            val jsonArray = JSONArray(jsonResult)
            (0 until jsonArray.length()).map { index ->
                val obj = jsonArray.getJSONObject(index)
                VideoInfo(
                    url = obj.optString("url", ""),
                    title = obj.optString("title", null),
                    isPlaying = obj.optBoolean("isPlaying", false),
                    duration = obj.optLong("duration", 0)
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun getHasPlayingVideoScript(): String {
        return """
            (function() {
                var videos = document.querySelectorAll('video');
                for (var i = 0; i < videos.length; i++) {
                    var video = videos[i];
                    if (!video.paused && !video.ended && video.offsetWidth > 0) {
                        return 'true';
                    }
                }
                return 'false';
            })();
        """.trimIndent()
    }
}