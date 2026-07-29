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
    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Esc 關閉選單並將焦點還給按鈕
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });

    // 點擊選單外側時關閉
    document.addEventListener('click', function (e) {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
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

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#"]');
    if (!link) return;
    e.preventDefault();
    if (status) {
      var label = link.getAttribute('aria-label') || link.textContent.trim();
      status.textContent = '此為靜態 Demo：「' + label + '」功能將於正式版提供。';
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(function () {
        status.textContent = '';
      }, 4000);
    }
  });
})();
