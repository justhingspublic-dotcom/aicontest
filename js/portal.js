/* ==========================================================================
   2026 神盾盃參賽者專區 — 靜態前台互動（展示模式）
   --------------------------------------------------------------------------
   - 僅以 localStorage 保存欄位與檔案中繼資料，不會上傳實際檔案。
   - 上傳格式／容量／數量規範待主辦確認：一律讀取 SITE_CONFIG.uploadRules，
     未設定（null）時不做攔截，不得寫死 ZIP／300MB／10 檔等舊限制。
   - 比賽檔案上傳依 0806 規劃 §8.5 條件開放：完成報名＋通過資格檢核＋繳交期間內。
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'aicontestParticipantDemoV2';
  var CONFIG = window.SITE_CONFIG || {};
  var UPLOAD_RULES = CONFIG.uploadRules || {};

  var REQUIRED_DOCUMENTS = [
    'teamRoster',
    'eligibilityProof',
    'participationConsent',
    'consentForm'
  ];
  var DOCUMENT_LABELS = {
    teamRoster: '團隊名冊',
    eligibilityProof: '資格證明',
    participationConsent: '參賽同意書',
    consentForm: '個人資料運用同意書',
    cooperationConsent: '合作單位同意文件',
    otherDocs: '其他指定文件'
  };

  var profileForm = document.getElementById('team-profile-form');
  var alertBox = document.getElementById('portal-alert');
  var submitButton = document.getElementById('submit-application');

  if (!profileForm || !submitButton) return;

  var state = loadState();
  restoreProfile();
  bindProfileForm();
  bindDocumentInputs();
  bindSubmission();
  bindDemoControls();
  bindCompetitionUpload();
  updateInterface();

  function defaultState() {
    return {
      profile: null,
      documents: {},
      submitted: false,
      submittedAt: null,
      /* 資格檢核：none｜reviewing｜passed（展示模式由按鈕模擬，正式由後台作業） */
      qualification: 'none',
      /* 比賽檔案版本紀錄 */
      submissions: []
    };
  }

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        return Object.assign(defaultState(), saved, {
          documents: saved.documents || {},
          submissions: saved.submissions || []
        });
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return defaultState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function restoreProfile() {
    var profile = state.profile || {};
    Object.keys(profile).forEach(function (key) {
      var field = profileForm.elements.namedItem(key);
      if (!field) return;
      if (field.type === 'checkbox') {
        field.checked = Boolean(profile[key]);
      } else {
        field.value = profile[key];
      }
    });
  }

  function bindProfileForm() {
    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;

      var data = new FormData(profileForm);
      state.profile = {
        teamName: clean(data.get('teamName')),
        track: clean(data.get('track')),
        organizationType: clean(data.get('organizationType')),
        organizationName: clean(data.get('organizationName')),
        proposalName: clean(data.get('proposalName')),
        advisorName: clean(data.get('advisorName')),
        partnerName: clean(data.get('partnerName')),
        contactName: clean(data.get('contactName')),
        contactPhone: clean(data.get('contactPhone')),
        contactEmail: clean(data.get('contactEmail')),
        profileConfirm: data.get('profileConfirm') === 'on',
        updatedAt: new Date().toISOString()
      };

      saveState();
      updateInterface();
      document.getElementById('profile-status').textContent = '團隊資料已儲存（草稿）。';
      showAlert('團隊資料已儲存，下一步請上傳必繳文件。', 'success');
    });
  }

  /* ---- 檔案驗證：僅在設定檔已定義規則時攔截 --------------------------- */
  function validateFiles(files, currentTotal) {
    if (UPLOAD_RULES.maxTotalFiles != null &&
        currentTotal + files.length > UPLOAD_RULES.maxTotalFiles) {
      return '檔案數量超過目前設定的上限（' + UPLOAD_RULES.maxTotalFiles + ' 個）。';
    }

    if (UPLOAD_RULES.maxFileSizeMB != null) {
      var limitBytes = UPLOAD_RULES.maxFileSizeMB * 1024 * 1024;
      var oversized = files.find(function (file) { return file.size > limitBytes; });
      if (oversized) {
        return '「' + oversized.name + '」超過目前設定的單檔上限（' + UPLOAD_RULES.maxFileSizeMB + ' MB）。';
      }
    }

    if (Array.isArray(UPLOAD_RULES.allowedExtensions) && UPLOAD_RULES.allowedExtensions.length) {
      var invalid = files.find(function (file) {
        var name = file.name.toLowerCase();
        return !UPLOAD_RULES.allowedExtensions.some(function (ext) {
          return name.endsWith(String(ext).toLowerCase());
        });
      });
      if (invalid) {
        return '「' + invalid.name + '」不在目前允許的檔案格式內（' + UPLOAD_RULES.allowedExtensions.join('、') + '）。';
      }
    }

    return null;
  }

  function bindDocumentInputs() {
    document.querySelectorAll('[data-document-input]').forEach(function (input) {
      input.addEventListener('change', function () {
        var documentId = input.getAttribute('data-document-input');
        var files = Array.from(input.files || []);
        if (!files.length) return;

        var problem = validateFiles(files, totalFileCount(documentId));
        if (problem) {
          input.value = '';
          showAlert(problem, 'error');
          return;
        }

        state.documents[documentId] = {
          files: files.map(function (file) {
            return {
              name: file.name,
              size: file.size,
              type: file.type || 'unknown',
              updatedAt: new Date().toISOString()
            };
          }),
          updatedAt: new Date().toISOString()
        };

        saveState();
        updateInterface();
        showAlert('已選擇「' + DOCUMENT_LABELS[documentId] + '」，並記錄檔案資訊。', 'success');
      });
    });
  }

  function bindSubmission() {
    submitButton.addEventListener('click', function () {
      var missing = getMissingItems();
      if (missing.length) {
        showAlert('尚未完成：' + missing.join('、') + '。', 'error');
        var firstTarget = !profileComplete() ? document.getElementById('profile') : document.getElementById('documents');
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        firstTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }

      state.submitted = true;
      state.submittedAt = new Date().toISOString();
      if (state.qualification === 'none') state.qualification = 'reviewing';
      saveState();
      updateInterface();
      showAlert('報名已送出，目前狀態為「審查中」。', 'success');
      document.getElementById('submission-message').textContent = '送出成功，系統已記錄時間。';
    });
  }

  /* ---- 展示模式：模擬資格檢核結果（正式系統由主辦後台作業） ----------- */
  function bindDemoControls() {
    var approveBtn = document.getElementById('demo-approve');
    var resetBtn = document.getElementById('demo-reset');

    if (approveBtn) {
      approveBtn.addEventListener('click', function () {
        if (!state.submitted) {
          showAlert('請先完成並送出報名，才能模擬資格檢核結果。', 'error');
          return;
        }
        state.qualification = 'passed';
        saveState();
        updateInterface();
        showAlert('（展示模式）資格檢核已通過，比賽檔案上傳已開放。', 'success');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        state = defaultState();
        profileForm.reset();
        document.querySelectorAll('[data-document-input]').forEach(function (input) {
          input.value = '';
        });
        updateInterface();
        showAlert('（展示模式）已重設所有展示資料。', 'success');
      });
    }
  }

  /* ---- 比賽檔案上傳：完成報名＋資格通過＋繳交期間內才開放 ------------- */
  function submissionOpen() {
    // 正式繳交期間待公告；展示模式在資格通過後視為期間內
    return state.submitted && state.qualification === 'passed';
  }

  function bindCompetitionUpload() {
    var uploadBtn = document.getElementById('submission-upload');
    if (!uploadBtn) return;

    uploadBtn.addEventListener('click', function () {
      if (!submissionOpen()) return;

      var noteInput = document.getElementById('submission-note');
      var fileInput = document.getElementById('submission-file');
      var files = Array.from(fileInput.files || []);
      var note = clean(noteInput.value);

      if (!note) {
        showAlert('請填寫本次繳交的版本說明。', 'error');
        noteInput.focus();
        return;
      }
      if (!files.length) {
        showAlert('請選擇要繳交的檔案。', 'error');
        return;
      }

      var problem = validateFiles(files, 0);
      if (problem) {
        showAlert(problem, 'error');
        return;
      }

      state.submissions.push({
        note: note,
        files: files.map(function (file) {
          return { name: file.name, size: file.size };
        }),
        uploadedAt: new Date().toISOString()
      });

      saveState();
      noteInput.value = '';
      fileInput.value = '';
      updateInterface();
      document.getElementById('submission-upload-status').textContent = '已記錄本次繳交版本。';
      showAlert('比賽檔案已記錄，版本紀錄已更新。', 'success');
    });
  }

  /* ---- 介面更新 ------------------------------------------------------ */
  function updateInterface() {
    updateWelcome();
    updateDocumentRows();
    updateCompletion();
    updateSubmissionChecks();
    updateSubmissionState();
    updateGate();
    updateSubmissionHistory();
  }

  function updateWelcome() {
    var welcome = document.getElementById('welcome-message');
    if (state.profile && state.profile.teamName) {
      welcome.textContent = state.profile.teamName + '｜' + state.profile.proposalName;
    } else {
      welcome.textContent = '尚未建立團隊資料，請從第一步開始。';
    }
  }

  function updateDocumentRows() {
    Object.keys(DOCUMENT_LABELS).forEach(function (documentId) {
      var row = document.querySelector('[data-document="' + documentId + '"]');
      var status = document.querySelector('[data-document-status="' + documentId + '"]');
      var input = document.querySelector('[data-document-input="' + documentId + '"]');
      if (!row || !status) return;
      var record = state.documents[documentId];
      var picker = input ? input.closest('.file-picker') : null;

      if (picker && !picker.getAttribute('data-default-label')) {
        picker.setAttribute('data-default-label', picker.firstChild.nodeValue.trim());
      }

      if (record && record.files && record.files.length) {
        row.classList.add('is-complete');
        status.textContent = record.files.map(function (file) {
          return file.name + '（' + formatBytes(file.size) + '）';
        }).join('、');
      } else {
        row.classList.remove('is-complete');
        status.textContent = '尚未選擇檔案';
      }

      /* 送出後鎖定同意書類文件；可否替換之正式規則待主辦確認 */
      if (input && state.submitted &&
          (documentId === 'participationConsent' || documentId === 'consentForm')) {
        input.disabled = true;
        picker.classList.add('is-locked');
        picker.firstChild.nodeValue = '送出後鎖定';
      } else if (input) {
        input.disabled = false;
        picker.classList.remove('is-locked');
        picker.firstChild.nodeValue = picker.getAttribute('data-default-label');
      }
    });
  }

  function updateCompletion() {
    var completedSteps = (profileComplete() ? 1 : 0) + REQUIRED_DOCUMENTS.filter(documentComplete).length;
    var percentage = Math.round((completedSteps / (REQUIRED_DOCUMENTS.length + 1)) * 100);
    document.getElementById('completion-value').textContent = percentage;
    document.getElementById('completion-progress').value = percentage;
    document.getElementById('completion-progress').textContent = percentage + '%';
  }

  function updateSubmissionChecks() {
    var profileItem = document.querySelector('[data-check="profile"]');
    var documentsItem = document.querySelector('[data-check="documents"]');
    setCheckState(profileItem, profileComplete(), '團隊基本資料已完成', '團隊基本資料尚未完成');
    setCheckState(documentsItem, REQUIRED_DOCUMENTS.every(documentComplete), '必繳文件已完整', '必繳文件尚未完整');
  }

  function updateSubmissionState() {
    var status = document.getElementById('submission-status');
    var tag = document.getElementById('submission-tag');
    var result = document.getElementById('review-result');
    var note = document.getElementById('review-result-note');

    tag.className = 'tag';
    if (state.qualification === 'passed') {
      status.textContent = '通過';
      tag.textContent = '資格檢核通過';
      tag.classList.add('tag--result');
      result.textContent = '資格檢核通過';
      note.textContent = '已通過資格檢核，可於繳交期間內上傳比賽檔案（正式期間以公告為準）。';
      submitButton.textContent = '更新送出紀錄';
    } else if (state.submitted) {
      status.textContent = '已送出';
      tag.textContent = '審查中';
      tag.classList.add('tag--result');
      result.textContent = '審查中';
      note.textContent = '報名已送出，資格審查結果公告後將更新此頁並寄送 Email 通知。';
      submitButton.textContent = '更新送出紀錄';
    } else if (state.profile) {
      status.textContent = '草稿';
      tag.textContent = '尚未送出';
      tag.classList.add('tag--urgent');
      result.textContent = '尚未送出';
      note.textContent = '完成並送出報名後，狀態將顯示「審查中」；正式結果由主辦單位公告。';
      submitButton.textContent = '確認送出報名';
    } else {
      status.textContent = '草稿';
      tag.textContent = '待完成';
      tag.classList.add('tag--urgent');
      result.textContent = '尚未送出';
      note.textContent = '完成並送出報名後，狀態將顯示「審查中」；正式結果由主辦單位公告。';
      submitButton.textContent = '確認送出報名';
    }
  }

  function updateGate() {
    var lockedPanel = document.getElementById('submission-locked');
    var openPanel = document.getElementById('submission-open');
    if (!lockedPanel || !openPanel) return;

    var open = submissionOpen();
    lockedPanel.hidden = open;
    openPanel.hidden = !open;

    setGateState('submitted', state.submitted, '已完成報名並送出', '尚未完成報名送出');
    setGateState('qualified', state.qualification === 'passed', '已通過資格檢核', '尚未通過資格檢核');
    setGateState('window', open, '位於繳交期間內（展示模式）', '繳交期間待公告');
  }

  function setGateState(gateId, complete, completeText, pendingText) {
    var element = document.querySelector('[data-gate="' + gateId + '"]');
    if (!element) return;
    element.classList.toggle('is-complete', complete);
    element.textContent = complete ? completeText : pendingText;
  }

  function updateSubmissionHistory() {
    var list = document.getElementById('submission-history');
    if (!list) return;

    if (!state.submissions.length) {
      list.innerHTML = '<li>尚無繳交紀錄。</li>';
      return;
    }

    list.innerHTML = '';
    state.submissions.forEach(function (record, index) {
      var item = document.createElement('li');
      item.classList.add('is-complete');
      var names = record.files.map(function (file) {
        return file.name + '（' + formatBytes(file.size) + '）';
      }).join('、');
      item.textContent = '版本 ' + (index + 1) + '｜' + record.note + '｜' + names +
        '｜' + formatDateTime(record.uploadedAt);
      list.appendChild(item);
    });
  }

  function setCheckState(element, complete, completeText, pendingText) {
    element.classList.toggle('is-complete', complete);
    element.textContent = complete ? completeText : pendingText;
  }

  function getMissingItems() {
    var missing = [];
    if (!profileComplete()) missing.push('團隊資料');
    REQUIRED_DOCUMENTS.forEach(function (documentId) {
      if (!documentComplete(documentId)) missing.push(DOCUMENT_LABELS[documentId]);
    });
    return missing;
  }

  function profileComplete() {
    if (!state.profile) return false;
    var required = [
      'teamName', 'track', 'organizationType', 'organizationName',
      'proposalName', 'contactName', 'contactPhone', 'contactEmail'
    ];
    return required.every(function (key) { return Boolean(state.profile[key]); }) && state.profile.profileConfirm;
  }

  function documentComplete(documentId) {
    var record = state.documents[documentId];
    return Boolean(record && record.files && record.files.length);
  }

  function totalFileCount(excludingDocumentId) {
    return Object.keys(state.documents).reduce(function (total, key) {
      if (key === excludingDocumentId) return total;
      var files = state.documents[key] && state.documents[key].files;
      return total + (files ? files.length : 0);
    }, 0);
  }

  function showAlert(message, type) {
    alertBox.hidden = false;
    alertBox.className = 'portal-alert portal-alert--' + type;
    alertBox.textContent = message;
  }

  function clean(value) {
    return String(value || '').trim();
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function formatDateTime(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
})();
