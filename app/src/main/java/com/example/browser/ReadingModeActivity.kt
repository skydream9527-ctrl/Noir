package com.example.browser

import android.os.Bundle
import android.text.Html
import android.util.TypedValue
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.SeekBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.browser.databinding.ActivityReadingModeBinding

class ReadingModeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityReadingModeBinding
    private lateinit var settingsManager: ReadingSettingsManager
    private lateinit var settings: ReadingSettings
    
    private var article: Article? = null

    companion object {
        const val EXTRA_HTML = "html"
        const val EXTRA_URL = "url"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityReadingModeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        settingsManager = ReadingSettingsManager(this)
        settings = settingsManager.getSettings()

        parseArticle()
        setupViews()
        applySettings()
    }

    private fun parseArticle() {
        val html = intent.getStringExtra(EXTRA_HTML) ?: ""
        val url = intent.getStringExtra(EXTRA_URL) ?: ""

        if (html.isNotEmpty()) {
            val parser = ArticleParser()
            article = parser.parse(html, url)
        }
    }

    private fun setupViews() {
        binding.ivClose.setOnClickListener { finish() }

        article?.let { article ->
            binding.tvTitle.text = article.title
            binding.tvSource.text = article.sourceUrl
            binding.tvContent.text = Html.fromHtml(article.content, Html.FROM_HTML_MODE_COMPACT)
        }

        setupFontSizeControls()
        setupThemeButtons()
        setupSettingsPanel()
    }

    private fun setupFontSizeControls() {
        binding.tvFontSize.text = "${settings.fontSize}sp"
        
        binding.ivFontDecrease.setOnClickListener {
            if (settings.fontSize > 12) {
                settings.fontSize--
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        }
        
        binding.ivFontIncrease.setOnClickListener {
            if (settings.fontSize < 24) {
                settings.fontSize++
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        }
    }

    private fun setupThemeButtons() {
        val themeButtons = listOf(
            binding.ivThemeWhite to ReadingTheme.WHITE,
            binding.ivThemeLight to ReadingTheme.LIGHT,
            binding.ivThemeDark to ReadingTheme.DARK,
            binding.ivThemeSepia to ReadingTheme.SEPIA
        )
        
        themeButtons.forEach { (button, theme) ->
            button.setOnClickListener {
                settings.theme = theme
                settingsManager.setTheme(theme)
                applySettings()
            }
        }
        
        updateThemeButtonSelection()
    }

    private fun updateThemeButtonSelection() {
        val activeColor = ContextCompat.getColor(this, R.color.accent)
        val inactiveColor = ContextCompat.getColor(this, R.color.icon_inactive)
        
        binding.ivThemeWhite.setColorFilter(
            if (settings.theme == ReadingTheme.WHITE) activeColor else inactiveColor
        )
        binding.ivThemeLight.setColorFilter(
            if (settings.theme == ReadingTheme.LIGHT) activeColor else inactiveColor
        )
        binding.ivThemeDark.setColorFilter(
            if (settings.theme == ReadingTheme.DARK) activeColor else inactiveColor
        )
        binding.ivThemeSepia.setColorFilter(
            if (settings.theme == ReadingTheme.SEPIA) activeColor else inactiveColor
        )
    }

    private fun setupSettingsPanel() {
        binding.ivExpandSettings.setOnClickListener {
            val isVisible = binding.settingsPanel.visibility == View.VISIBLE
            binding.settingsPanel.visibility = if (isVisible) View.GONE else View.VISIBLE
        }

        val fontFamilies = listOf("跟随系统", "微软雅黑", "宋体", "Serif")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, fontFamilies)
        binding.spFontFamily.adapter = adapter

        binding.spFontFamily.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                settings.fontFamily = if (position == 0) "" else fontFamilies[position]
                settingsManager.setFontFamily(settings.fontFamily)
                applySettings()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        binding.sbFontSize.max = 24 - 12
        binding.sbFontSize.progress = settings.fontSize - 12
        binding.sbFontSize.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.fontSize = progress + 12
                binding.tvFontSizeLabel.text = "${settings.fontSize}sp"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setFontSize(settings.fontSize)
                applySettings()
            }
        })

        binding.sbLineHeight.max = 25 - 10
        binding.sbLineHeight.progress = (settings.lineHeight * 10).toInt() - 10
        binding.sbLineHeight.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.lineHeight = (progress + 10) / 10f
                binding.tvLineHeightLabel.text = String.format("%.1f", settings.lineHeight)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setLineHeight(settings.lineHeight)
                applySettings()
            }
        })

        binding.sbLetterSpacing.max = 10
        binding.sbLetterSpacing.progress = settings.letterSpacing
        binding.sbLetterSpacing.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                settings.letterSpacing = progress
                binding.tvLetterSpacingLabel.text = "${progress}dp"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                settingsManager.setLetterSpacing(settings.letterSpacing)
                applySettings()
            }
        })

        binding.tvFontSizeLabel.text = "${settings.fontSize}sp"
        binding.tvLineHeightLabel.text = String.format("%.1f", settings.lineHeight)
        binding.tvLetterSpacingLabel.text = "${settings.letterSpacing}dp"
    }

    private fun applySettings() {
        binding.tvFontSize.text = "${settings.fontSize}sp"

        binding.tvTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, settings.fontSize + 4f)
        binding.tvContent.setTextSize(TypedValue.COMPLEX_UNIT_SP, settings.fontSize.toFloat())
        binding.tvContent.setLineSpacing(0f, settings.lineHeight)
        
        if (settings.letterSpacing > 0) {
            binding.tvContent.letterSpacing = settings.letterSpacing / 10f
        }

        if (settings.fontFamily.isNotEmpty()) {
            try {
                binding.tvContent.typeface = android.graphics.Typeface.create(settings.fontFamily, android.graphics.Typeface.NORMAL)
            } catch (e: Exception) {
                // 字体不存在，使用默认
            }
        }

        applyTheme()
        updateThemeButtonSelection()
    }

    private fun applyTheme() {
        val (bgColor, textColor) = when (settings.theme) {
            ReadingTheme.WHITE -> R.color.reading_white_bg to R.color.reading_white_text
            ReadingTheme.LIGHT -> R.color.reading_light_bg to R.color.reading_light_text
            ReadingTheme.DARK -> R.color.reading_dark_bg to R.color.reading_dark_text
            ReadingTheme.SEPIA -> R.color.reading_sepia_bg to R.color.reading_sepia_text
        }

        binding.contentContainer.setBackgroundColor(ContextCompat.getColor(this, bgColor))
        binding.tvTitle.setTextColor(ContextCompat.getColor(this, textColor))
        binding.tvContent.setTextColor(ContextCompat.getColor(this, textColor))
        binding.tvSource.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
    }
}
