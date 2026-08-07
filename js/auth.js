/* ==========================================================================
   2026 神盾盃 — 會員帳號（展示模式）
   --------------------------------------------------------------------------
   流程依 2026-08-07 主辦確認：
   1. 需先「註冊帳號」，註冊完成後「重新登入」，登入後才能報名。
   2. 登入身分分為：參賽者（報名的人）、管理者、評審。
      管理者與評審帳號由主辦單位開通，其工作區屬後台系統建置範圍；
      展示版提供參賽者流程。
   展示版僅以 localStorage 模擬帳號與登入狀態，不做真實驗證與加密；
   密碼政策、Email 驗證、忘記密碼等正式機制待主辦確認，不在此寫死。
   ========================================================================== */
(function () {
  'use strict';

  var ACCOUNTS_KEY = 'aicontestDemoAccountsV1';
  var SESSION_KEY = 'aicontestDemoSessionV1';

  function readJSON(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  var DemoAuth = {
    accounts: function () {
      var list = readJSON(ACCOUNTS_KEY, []);
      return Array.isArray(list) ? list : [];
    },
    findAccount: function (email) {
      var normalized = String(email || '').trim().toLowerCase();
      return this.accounts().find(function (account) {
        return account.email === normalized;
      }) || null;
    },
    register: function (email, password) {
      var normalized = String(email || '').trim().toLowerCase();
      if (this.findAccount(normalized)) return { ok: false, error: 'exists' };
      var accounts = this.accounts();
      accounts.push({ email: normalized, password: password, createdAt: new Date().toISOString() });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      return { ok: true };
    },
    login: function (email, password) {
      var account = this.findAccount(email);
      if (!account) return { ok: false, error: 'notfound' };
      if (account.password !== password) return { ok: false, error: 'password' };
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        email: account.email,
        role: 'participant',
        loginAt: new Date().toISOString()
      }));
      return { ok: true };
    },
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
    },
    session: function () {
      var session = readJSON(SESSION_KEY, null);
      return session && session.email ? session : null;
    }
  };

  window.DemoAuth = DemoAuth;

  /* ------------------------------------------------------------------
     導覽列入口：未登入顯示「登入」，登入後改為進入參賽者專區
     ------------------------------------------------------------------ */
  function updateNavEntry() {
    var entry = document.querySelector('[data-auth-entry]');
    if (!entry) return;
    var session = DemoAuth.session();
    if (session) {
      entry.textContent = '參賽者專區';
      entry.setAttribute('href', 'portal.html#profile');
      entry.setAttribute('title', '已登入：' + session.email);
    } else {
      entry.textContent = '登入';
      entry.setAttribute('href', 'account.html');
      entry.removeAttribute('title');
    }
  }

  /* ------------------------------------------------------------------
     報名入口攔截：標記 data-auth-required 的連結需登入後才可進入
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (event) {
    var jump = event.target.closest('[data-tab-jump]');
    if (jump) {
      var tab = document.getElementById(jump.getAttribute('data-tab-jump'));
      if (tab) tab.click();
      return;
    }

    var link = event.target.closest('[data-auth-required]');
    if (!link || DemoAuth.session()) return;
    event.preventDefault();
    var next = link.getAttribute('href') || 'portal.html#profile';
    window.location.href = 'account.html?reason=login-required&next=' + encodeURIComponent(next);
  });

  /* ------------------------------------------------------------------
     參賽者專區關卡：未登入時顯示登入提示、隱藏報名內容
     ------------------------------------------------------------------ */
  function applyPortalGate() {
    var gate = document.getElementById('portal-auth-gate');
    if (!gate) return;

    var session = DemoAuth.session();
    gate.hidden = Boolean(session);
    document.querySelectorAll('[data-requires-auth]').forEach(function (sectionEl) {
      sectionEl.hidden = !session;
    });

    var chip = document.getElementById('portal-session');
    var email = document.getElementById('portal-session-email');
    if (chip && email) {
      chip.hidden = !session;
      email.textContent = session ? '已登入｜' + session.email : '';
    }

    var logoutButton = document.getElementById('portal-logout');
    if (logoutButton && !logoutButton.hasAttribute('data-bound')) {
      logoutButton.setAttribute('data-bound', 'true');
      logoutButton.addEventListener('click', function () {
        DemoAuth.logout();
        window.location.href = 'account.html';
      });
    }
  }

  /* ------------------------------------------------------------------
     帳號頁（account.html）：登入／註冊表單
     ------------------------------------------------------------------ */
  function setupAccountPage() {
    var loginForm = document.getElementById('login-form');
    var signupForm = document.getElementById('signup-form');
    if (!loginForm && !signupForm) return;

    var params = new URLSearchParams(window.location.search);
    var nextTarget = params.get('next') || '';
    // 只允許導回站內參賽者專區，避免奇怪的轉址
    if (!/^portal\.html(#[\w-]*)?$/.test(nextTarget)) nextTarget = 'portal.html#profile';

    var pageAlert = document.getElementById('account-alert');

    function showPageAlert(message, type) {
      if (!pageAlert) return;
      pageAlert.hidden = false;
      pageAlert.className = 'portal-alert portal-alert--' + (type || 'success');
      pageAlert.textContent = message;
    }

    if (params.get('reason') === 'login-required') {
      showPageAlert('由活動官網報名之項目需先登入帳號；尚未註冊請先完成註冊，再重新登入。', 'error');
    }

    /* 已登入狀態 */
    var sessionPanel = document.getElementById('account-session');
    var session = DemoAuth.session();
    if (sessionPanel) {
      sessionPanel.hidden = !session;
      if (session) {
        var emailSlot = document.getElementById('account-session-email');
        if (emailSlot) emailSlot.textContent = session.email;
      }
    }
    var accountLogout = document.getElementById('account-logout');
    if (accountLogout) {
      accountLogout.addEventListener('click', function () {
        DemoAuth.logout();
        window.location.reload();
      });
    }

    /* 登入 */
    if (loginForm) {
      var loginStatus = document.getElementById('login-status');
      var roleSelect = document.getElementById('login-role');
      var roleHint = document.getElementById('login-role-hint');
      var ROLE_HINTS = {
        participant: '參賽者可自行註冊帳號；登入後於參賽者專區完成報名與繳件。',
        judge: '評審委員帳號由主辦單位開通，不開放自行註冊；其閱卷工作區屬後台系統建置範圍。',
        admin: '活動管理者帳號由主辦單位設定；後台管理介面屬後台系統建置範圍。'
      };

      if (roleSelect && roleHint) {
        roleSelect.addEventListener('change', function () {
          roleHint.textContent = ROLE_HINTS[roleSelect.value] || '';
        });
      }

      loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;

        var role = roleSelect ? roleSelect.value : 'participant';
        if (role !== 'participant') {
          loginStatus.textContent = '評審委員與活動管理者帳號由主辦單位開通，請由對應的後台系統登入。';
          return;
        }

        var data = new FormData(loginForm);
        var result = DemoAuth.login(data.get('email'), data.get('password'));
        if (result.ok) {
          window.location.href = nextTarget;
          return;
        }
        loginStatus.textContent = result.error === 'notfound'
          ? '查無此帳號，請先完成註冊後再重新登入。'
          : '密碼不正確，請再試一次。';
      });
    }

    /* 註冊：完成後回到登入分頁，請使用者重新登入（主辦確認流程） */
    if (signupForm) {
      var signupStatus = document.getElementById('signup-status');

      signupForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!signupForm.reportValidity()) return;

        var data = new FormData(signupForm);
        var email = String(data.get('email') || '').trim();
        var password = String(data.get('password') || '');
        var confirm = String(data.get('passwordConfirm') || '');

        if (password !== confirm) {
          signupStatus.textContent = '兩次輸入的密碼不一致，請再確認。';
          return;
        }

        var result = DemoAuth.register(email, password);
        if (!result.ok) {
          signupStatus.textContent = '此 Email 已註冊過，請直接登入。';
          return;
        }

        signupForm.reset();
        var loginTab = document.getElementById('tab-login');
        if (loginTab) loginTab.click();
        var emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.value = email.toLowerCase();
        showPageAlert('註冊完成！請以剛建立的帳號重新登入。', 'success');
        var loginStatusSlot = document.getElementById('login-status');
        if (loginStatusSlot) loginStatusSlot.textContent = '註冊完成，請重新登入。';
      });
    }
  }

  updateNavEntry();
  applyPortalGate();
  setupAccountPage();
})();
