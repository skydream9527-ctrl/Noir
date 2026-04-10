package com.example.browser.SpeedUp

class WebAccelerator {
    
    fun getDnsPrefetchScript(): String {
        return """
            (function() {
                var links = document.querySelectorAll('a[href]');
                var domains = [];
                links.forEach(function(link) {
                    try {
                        var url = new URL(link.href);
                        if (url.hostname && domains.indexOf(url.hostname) === -1) {
                            domains.push(url.hostname);
                        }
                    } catch (e) {}
                });
                domains.forEach(function(domain) {
                    var dns = document.createElement('link');
                    dns.rel = 'dns-prefetch';
                    dns.href = '//' + domain;
                    document.head.appendChild(dns);
                });
            })();
        """.trimIndent()
    }
    
    fun getPreloadScript(): String {
        return """
            (function() {
                var resources = [];
                var scripts = document.querySelectorAll('script[src]');
                var styles = document.querySelectorAll('link[rel="stylesheet"]');
                var images = document.querySelectorAll('img[src]');
                
                scripts.forEach(function(script) {
                    if (script.src && resources.indexOf(script.src) === -1) {
                        resources.push(script.src);
                    }
                });
                styles.forEach(function(style) {
                    if (style.href && resources.indexOf(style.href) === -1) {
                        resources.push(style.href);
                    }
                });
                
                resources.forEach(function(url) {
                    var link = document.createElement('link');
                    link.rel = 'preload';
                    link.href = url;
                    document.head.appendChild(link);
                });
            })();
        """.trimIndent()
    }
    
    fun shouldAccelerate(): Boolean = true
}
