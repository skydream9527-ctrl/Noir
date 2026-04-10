package com.example.browser

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import com.example.browser.databinding.LayoutBottomAddressBarBinding
import com.example.browser.data.SearchEngineManager

class BottomAddressBar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val binding: LayoutBottomAddressBarBinding
    private val searchEngineManager = SearchEngineManager(context)
    
    var onAddressSubmit: ((String) -> Unit)? = null
    var onMenuClick: (() -> Unit)? = null
    var onReadingModeClick: (() -> Unit)? = null
    
    init {
        binding = LayoutBottomAddressBarBinding.inflate(LayoutInflater.from(context), this, true)
        setupViews()
    }
    
    private fun setupViews() {
        binding.ivMenu.setOnClickListener { onMenuClick?.invoke() }
        
        binding.etAddress.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                val input = binding.etAddress.text.toString().trim()
                if (input.isNotEmpty()) {
                    onAddressSubmit?.invoke(processInput(input))
                }
                true
            } else false
        }
        
        binding.etAddress.onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
            binding.ivClear.visibility = if (hasFocus && binding.etAddress.text.isNotEmpty()) View.VISIBLE else View.GONE
        }
        
        binding.ivClear.setOnClickListener {
            binding.etAddress.text.clear()
            binding.ivClear.visibility = View.GONE
        }

        binding.ivReadingMode.setOnClickListener {
            onReadingModeClick?.invoke()
        }
    }
    
    private fun processInput(input: String): String {
        return when {
            input.startsWith("http://") || input.startsWith("https://") -> input
            input.contains(".") && !input.contains(" ") -> "https://$input"
            else -> {
                val engine = searchEngineManager.getDefaultEngine()
                val baseUrl = searchEngineManager.getSearchUrl(engine)
                "$baseUrl$input"
            }
        }
    }
    
    fun setAddress(url: String) {
        binding.etAddress.setText(url)
    }
    
    fun getAddress(): String = binding.etAddress.text.toString()
    
    fun showClearButton(show: Boolean) {
        binding.ivClear.visibility = if (show) View.VISIBLE else View.GONE
    }

    fun showReadingModeButton(show: Boolean) {
        binding.ivReadingMode.visibility = if (show) View.VISIBLE else View.GONE
    }
}
