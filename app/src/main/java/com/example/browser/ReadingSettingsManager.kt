package com.example.browser

import android.content.Context
import android.content.SharedPreferences

class ReadingSettingsManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "reading_settings"
        private const val KEY_FONT_SIZE = "font_size"
        private const val KEY_LINE_HEIGHT = "line_height"
        private const val KEY_LETTER_SPACING = "letter_spacing"
        private const val KEY_FONT_FAMILY = "font_family"
        private const val KEY_THEME = "theme"

        private const val DEFAULT_FONT_SIZE = 16
        private const val DEFAULT_LINE_HEIGHT = 1.8f
        private const val DEFAULT_LETTER_SPACING = 2
        private const val DEFAULT_FONT_FAMILY = ""
        private const val DEFAULT_THEME = "WHITE"
    }

    fun getSettings(): ReadingSettings {
        return ReadingSettings(
            fontSize = prefs.getInt(KEY_FONT_SIZE, DEFAULT_FONT_SIZE),
            lineHeight = prefs.getFloat(KEY_LINE_HEIGHT, DEFAULT_LINE_HEIGHT),
            letterSpacing = prefs.getInt(KEY_LETTER_SPACING, DEFAULT_LETTER_SPACING),
            fontFamily = prefs.getString(KEY_FONT_FAMILY, DEFAULT_FONT_FAMILY) ?: DEFAULT_FONT_FAMILY,
            theme = ReadingTheme.valueOf(prefs.getString(KEY_THEME, DEFAULT_THEME) ?: DEFAULT_THEME)
        )
    }

    fun saveSettings(settings: ReadingSettings) {
        prefs.edit().apply {
            putInt(KEY_FONT_SIZE, settings.fontSize)
            putFloat(KEY_LINE_HEIGHT, settings.lineHeight)
            putInt(KEY_LETTER_SPACING, settings.letterSpacing)
            putString(KEY_FONT_FAMILY, settings.fontFamily)
            putString(KEY_THEME, settings.theme.name)
            apply()
        }
    }

    fun getFontSize(): Int = prefs.getInt(KEY_FONT_SIZE, DEFAULT_FONT_SIZE)

    fun setFontSize(size: Int) {
        prefs.edit().putInt(KEY_FONT_SIZE, size).apply()
    }

    fun getLineHeight(): Float = prefs.getFloat(KEY_LINE_HEIGHT, DEFAULT_LINE_HEIGHT)

    fun setLineHeight(height: Float) {
        prefs.edit().putFloat(KEY_LINE_HEIGHT, height).apply()
    }

    fun getLetterSpacing(): Int = prefs.getInt(KEY_LETTER_SPACING, DEFAULT_LETTER_SPACING)

    fun setLetterSpacing(spacing: Int) {
        prefs.edit().putInt(KEY_LETTER_SPACING, spacing).apply()
    }

    fun getFontFamily(): String = prefs.getString(KEY_FONT_FAMILY, DEFAULT_FONT_FAMILY) ?: DEFAULT_FONT_FAMILY

    fun setFontFamily(family: String) {
        prefs.edit().putString(KEY_FONT_FAMILY, family).apply()
    }

    fun getTheme(): ReadingTheme {
        val themeName = prefs.getString(KEY_THEME, DEFAULT_THEME) ?: DEFAULT_THEME
        return try {
            ReadingTheme.valueOf(themeName)
        } catch (e: Exception) {
            ReadingTheme.WHITE
        }
    }

    fun setTheme(theme: ReadingTheme) {
        prefs.edit().putString(KEY_THEME, theme.name).apply()
    }
}
