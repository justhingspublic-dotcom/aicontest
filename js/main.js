/* ==========================================================================
   AI 競賽活動網站 — 共用互動
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     導覽列：滾動後加上半透明背景與細邊框
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');

  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     行動版選單
     ------------------------------------------------------------------ */
  var navToggle = document.querySelector('.nav-toggle');

  if (header && navToggle) {
    var navToggleLabel = navToggle.querySelector('.sr-only');

    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (navToggleLabel) navToggleLabel.textContent = open ? '關閉主選單' : '開啟主選單';
    });

    // Esc 關閉選單並將焦點還給按鈕
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navToggleLabel) navToggleLabel.textContent = '開啟主選單';
        navToggle.focus();
      }
    });

    // 點擊選單外側時關閉
    document.addEventListener('click', function (e) {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navToggleLabel) navToggleLabel.textContent = '開啟主選單';
      }
    });
  }

  /* ------------------------------------------------------------------
     滾動進場（reduced motion 時不啟用）
     ------------------------------------------------------------------ */
  var revealTargets = document.querySelectorAll('.reveal');

  if (revealTargets.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add('is-visible');
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      );

      revealTargets.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  /* ------------------------------------------------------------------
     Demo 用：攔截尚未實作的連結（href="#"）並提示
     ------------------------------------------------------------------ */
  var status = document.getElementById('demo-status');
  var statusTimer = null;

  var showDemoStatus = function (message) {
    if (!status) return;
    status.textContent = message;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      status.textContent = '';
    }, 5000);
  };

  document.addEventListener('click', function (e) {
    var unavailable = e.target.closest('[data-unavailable]');
    if (unavailable) {
      e.preventDefault();
      showDemoStatus(unavailable.getAttribute('data-unavailable'));
      return;
    }

    var link = e.target.closest('a[href="#"]');
    if (!link) return;
    e.preventDefault();
    var label = link.getAttribute('aria-label') || link.textContent.trim();
    showDemoStatus('「' + label + '」內容尚待主辦單位提供。');
  });

})();
