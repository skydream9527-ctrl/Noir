package com.example.browser.SpeedUp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.appcompat.widget.SwitchCompat
import com.example.browser.R

class SpeedUpSettingsFragment : Fragment() {
    
    private lateinit var speedUpManager: SpeedUpManager
    
    private lateinit var switchSpeedUp: SwitchCompat
    private lateinit var switchImageCompression: SwitchCompat
    private lateinit var switchDnsPrefetch: SwitchCompat
    private lateinit var switchPreload: SwitchCompat
    private lateinit var switchConnectionReuse: SwitchCompat
    private lateinit var tvSavings: TextView
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_speed_up_settings, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        speedUpManager = SpeedUpManager(requireContext())
        
        initViews(view)
        setupListeners()
        updateUI()
    }
    
    private fun initViews(view: View) {
        switchSpeedUp = view.findViewById(R.id.switchSpeedUp)
        switchImageCompression = view.findViewById(R.id.switchImageCompression)
        switchDnsPrefetch = view.findViewById(R.id.switchDnsPrefetch)
        switchPreload = view.findViewById(R.id.switchPreload)
        switchConnectionReuse = view.findViewById(R.id.switchConnectionReuse)
        tvSavings = view.findViewById(R.id.tvSavings)
    }
    
    private fun setupListeners() {
        switchSpeedUp.setOnCheckedChangeListener { _, isChecked ->
            speedUpManager.setEnabled(isChecked)
            updateUI()
        }
        
        switchImageCompression.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchDnsPrefetch.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchPreload.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
        
        switchConnectionReuse.setOnCheckedChangeListener { _, _ ->
            saveSettings()
        }
    }
    
    private fun updateUI() {
        val settings = speedUpManager.getSettings()
        
        switchSpeedUp.isChecked = settings.enabled
        switchImageCompression.isChecked = settings.dataCompression.enabled
        switchDnsPrefetch.isChecked = settings.webAcceleration.dnsPrefetch
        switchPreload.isChecked = settings.webAcceleration.preloadResources
        switchConnectionReuse.isChecked = settings.webAcceleration.connectionReuse
        
        val savings = calculateSavings(settings)
        tvSavings.text = "预计节省流量：$savings%"
    }
    
    private fun saveSettings() {
        val settings = SpeedUpSettings(
            enabled = switchSpeedUp.isChecked,
            dataCompression = DataCompressionSettings(
                enabled = switchImageCompression.isChecked,
                imageQuality = if (switchImageCompression.isChecked) 70 else 100,
                minifyJsCss = false
            ),
            webAcceleration = WebAccelerationSettings(
                dnsPrefetch = switchDnsPrefetch.isChecked,
                preloadResources = switchPreload.isChecked,
                connectionReuse = switchConnectionReuse.isChecked
            )
        )
        speedUpManager.saveSettings(settings)
        updateUI()
    }
    
    private fun calculateSavings(settings: SpeedUpSettings): Int {
        var savings = 0
        if (settings.dataCompression.enabled) savings += 20
        if (settings.webAcceleration.dnsPrefetch) savings += 5
        if (settings.webAcceleration.preloadResources) savings += 5
        return savings
    }
}
