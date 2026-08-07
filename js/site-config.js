/* ==========================================================================
   2026 神盾盃國際邀請賽暨國防 AI 競賽 — 集中設定檔
   --------------------------------------------------------------------------
   依 0806 網站規劃：所有仍待主辦單位確認的數值一律集中在此，
   不散落於各頁 HTML／JS。值為 null 代表「待確認」，前端應顯示
   待確認提示，且不得自行套用任何舊 demo 的限制（ZIP、300MB、10 檔等）。

   正式後台建置後，本檔內容應改由後台設定管理（0806 規劃 §12.1）。
   ========================================================================== */
window.SITE_CONFIG = {

  /* ---- 活動基本資訊 ------------------------------------------------ */
  event: {
    title: '2026 神盾盃國際邀請賽暨國防 AI 競賽',
    finalDateText: '2026.11.07—08',
    finalVenue: '國立成功大學',
    siteUpdatedAt: '2026-08-07'
  },

  /* ---- 獎金 --------------------------------------------------------
     2026-08-07 改依競賽辦法 V3：總獎金 182 萬（65＋20＋32＋65）。
     注意：V3 內文矛盾——飛行員名次加總 28 萬≠總額 20 萬、
     國防AI名次加總 90 萬≠總額 65 萬，該兩項僅公布總額，明細待主辦確認。
     分項金額依修正版辦法附件填入（100／90／32／33 萬）；
     若主辦正式公告有異動，更新此處即可全站生效。
     （歷史紀錄：0806 網站規劃 179 萬；前版辦法草案 250 萬） --------- */
  prizes: {
    basis: '競賽辦法 V3（1150804 策略會版，2026-08-07 收）',
    conflict: false,
    conflictNote: '分項獎金與得獎名額以主辦單位正式公告為準。',
    totalText: '182 萬元',
    items: {
      shieldCup: { name: '神盾盃資安競賽', totalText: '65 萬元' },
      defenseAi: { name: '國防 AI 競賽及陳展', totalText: '65 萬元' },
      aiSeminar: { name: 'AI 研討會', totalText: '32 萬元' },
      aiPilot: { name: 'AI 飛行員擂台賽', totalText: '20 萬元' }
    }
  },

  /* ---- 報名平台路由（0806 規劃 §8.1） -------------------------------
     url 為 null 代表正式網址尚未提供：前端顯示「待設定」提示，
     不得放假網址。external: true 的項目導向站外，需外連提示。
     2026-08-07：神盾盃 SurveyCake 報名網址由主辦提供，已上線。 --------- */
  registrationRoutes: {
    shieldCup: {
      name: '神盾盃資安競賽',
      platform: 'SurveyCake',
      external: true,
      url: 'https://www.surveycake.com/s/beeyx'
    },
    shipOsr: {
      name: 'AI 研討會｜開放集船舶目標識別',
      platform: 'Kaggle（2026-08-06 主辦指示）',
      external: true,
      url: null,
      pendingMessage: '開放集船舶目標識別的 Kaggle 報名頁面網址尚待主辦單位提供。'
    },
    shipXai: {
      name: 'AI 研討會｜船舶影像辨識可解釋 AI',
      platform: 'Kaggle（2026-08-06 主辦指示）',
      external: true,
      url: null,
      pendingMessage: '船舶影像辨識可解釋 AI 的 Kaggle 報名頁面網址尚待主辦單位提供。'
    },
    llm: {
      name: 'AI 研討會｜輕量化 LLM 國防知識應用',
      platform: '活動官網',
      external: false,
      url: 'portal.html#profile'
    },
    aiPilot: {
      name: 'AI 飛行員擂台賽',
      platform: '活動官網',
      external: false,
      url: 'portal.html#profile'
    },
    defenseAi: {
      name: '國防 AI 競賽及陳展',
      platform: '活動官網',
      external: false,
      url: 'portal.html#profile'
    }
  },

  /* ---- 上傳規則（全部待確認） ---------------------------------------
     0806 規劃明定：不得沿用舊 demo 的 ZIP／300MB／10 檔限制，
     也不得將 DOCX 內「PDF、10 MB (?)」當成正式規格。
     null＝尚未確認：前端僅記錄檔案資訊，不做格式／容量攔截。 ---------- */
  uploadRules: {
    allowedExtensions: null,   // 待確認：允許的副檔名清單
    maxFileSizeMB: null,       // 待確認：單檔容量上限
    maxTotalFiles: null,       // 待確認：檔案數量上限
    packaging: null,           // 待確認：是否採 ZIP／7z 等封裝
    noteText: '上傳檔案的格式、容量與數量規範尚待主辦單位確認，確認後將於本頁與參賽者專區公告。'
  },

  /* ---- 聯絡資訊（競賽辦法草案，發布前需確認） ----------------------- */
  contacts: {
    status: 'draft',
    statusNote: '以下窗口出自競賽辦法草案，發布前仍需主辦單位確認是否適用所有類別。',
    email: 'AICompetitionInDefence@ncsist.org.tw',
    phone: '(03) 471-2201 #353228',
    persons: '陳先生、洪小姐'
  },

  /* ---- 相關單位（2026-08-07 中科院來函：資策會由執行單位改列協辦單位） ---- */
  organizers: {
    host: '國家中山科學研究院',
    coOrganizers: ['財團法人資訊工業策進會', '奧義科技股份有限公司', '國家資通安全研究院', '國立成功大學'],
    coOrganizersText: '財團法人資訊工業策進會、奧義科技股份有限公司、國家資通安全研究院、國立成功大學',
    advisorNote: '指導、合作與贊助單位名單、Logo 與排序待主辦單位確認。'
  }
};

/* --------------------------------------------------------------------------
   設定套用：
   1. [data-config="path.to.value"] 之元素以設定值覆寫文字內容。
   2. [data-register-route="key"] 之按鈕依路由設定轉為外連連結或待設定提示。
   -------------------------------------------------------------------------- */
(function () {
  'use strict';

  function get(path) {
    return path.split('.').reduce(function (node, key) {
      return node && typeof node === 'object' ? node[key] : undefined;
    }, window.SITE_CONFIG);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-config]').forEach(function (el) {
      var value = get(el.getAttribute('data-config'));
      if (typeof value === 'string' && value) el.textContent = value;
    });

    document.querySelectorAll('[data-register-route]').forEach(function (el) {
      var route = window.SITE_CONFIG.registrationRoutes[el.getAttribute('data-register-route')];
      if (!route) return;

      if (route.url && !route.external) {
        el.setAttribute('href', route.url);
        el.removeAttribute('data-unavailable');
      } else if (route.url && route.external) {
        el.setAttribute('href', route.url);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
        el.removeAttribute('data-unavailable');
      } else {
        // 正式網址尚未提供：保留入口但改為待設定提示
        el.setAttribute('href', '#');
        el.setAttribute('data-unavailable', route.pendingMessage || '報名網址尚待主辦單位提供。');
      }
    });
  });
})();
