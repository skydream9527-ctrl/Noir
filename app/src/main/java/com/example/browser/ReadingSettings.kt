package com.example.browser

enum class ReadingTheme {
    WHITE,
    LIGHT,
    DARK,
    SEPIA
}

data class ReadingSettings(
    var fontSize: Int = 16,
    var lineHeight: Float = 1.8f,
    var letterSpacing: Int = 2,
    var fontFamily: String = "",
    var theme: ReadingTheme = ReadingTheme.WHITE
)
