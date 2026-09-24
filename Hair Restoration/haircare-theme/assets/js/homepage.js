/**
 * Haircare Theme - Homepage Script
 * Before/After slider + button tactile effects
 */
(function () {
    'use strict';

    // Button tactile effect
    document.querySelectorAll('button, .hero-cta').forEach(function (btn) {
        btn.addEventListener('mousedown', function () {
            btn.style.transform = 'translateY(1px)';
        });
        btn.addEventListener('mouseup', function () {
            btn.style.transform = 'translateY(0px)';
        });
    });

    // Before/After Slider
    var slider = document.getElementById('baSlider');
    if (!slider) return;

    var before = document.getElementById('baBefore');
    var handle = document.getElementById('baHandle');
    var isDragging = false;

    function setPosition(x) {
        var rect = slider.getBoundingClientRect();
        var pos = ((x - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        before.style.width = pos + '%';
        handle.style.left = pos + '%';
    }

    slider.addEventListener('mousedown', function (e) {
        isDragging = true;
        setPosition(e.clientX);
    });

    window.addEventListener('mousemove', function (e) {
        if (isDragging) setPosition(e.clientX);
    });

    window.addEventListener('mouseup', function () {
        isDragging = false;
    });

    slider.addEventListener('touchstart', function (e) {
        isDragging = true;
        setPosition(e.touches[0].clientX);
    });

    slider.addEventListener('touchmove', function (e) {
        if (isDragging) {
            e.preventDefault();
            setPosition(e.touches[0].clientX);
        }
    });

    slider.addEventListener('touchend', function () {
        isDragging = false;
    });

    // YouTube Shorts inline play
    document.querySelectorAll('.short-card').forEach(function (card) {
        card.addEventListener('click', function () {
            var videoId = this.dataset.videoId;
            if (!videoId) return;

            var wrapper = document.createElement('div');
            wrapper.className = 'short-embed';

            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
            iframe.setAttribute('allow', 'autoplay; encrypted-media');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('title', this.querySelector('.short-title').textContent);

            wrapper.appendChild(iframe);
            this.querySelector('.short-thumb').replaceWith(wrapper);

            var overlay = this.querySelector('.short-overlay');
            if (overlay) overlay.style.display = 'none';
        });
    });
})();
