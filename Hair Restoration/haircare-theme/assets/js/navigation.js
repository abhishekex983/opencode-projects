/**
 * Haircare Theme - Navigation Script
 * Handles mobile menu toggle
 */
(function () {
    'use strict';

    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');

    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        links.classList.toggle('active');

        // Swap icon between menu and close
        var icon = toggle.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = expanded ? 'menu' : 'close';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !links.contains(e.target)) {
            toggle.setAttribute('aria-expanded', 'false');
            links.classList.remove('active');
            var icon = toggle.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = 'menu';
            }
        }
    });

    // Reading progress bar (for single posts)
    var progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        window.addEventListener('scroll', function () {
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var scrolled = window.scrollY;
            var progress = (scrolled / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }
})();
