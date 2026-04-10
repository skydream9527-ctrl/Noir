package com.example.browser.SpeedUp

data class SpeedUpSettings(
    val enabled: Boolean = true,
    val dataCompression: DataCompressionSettings = DataCompressionSettings(),
    val webAcceleration: WebAccelerationSettings = WebAccelerationSettings()
)

data class DataCompressionSettings(
    val enabled: Boolean = true,
    val imageQuality: Int = 80,  // 0-100
    val minifyJsCss: Boolean = false
)

data class WebAccelerationSettings(
    val dnsPrefetch: Boolean = true,
    val preloadResources: Boolean = true,
    val connectionReuse: Boolean = true
)
