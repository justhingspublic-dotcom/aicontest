/* ==========================================================================
   2026 神盾盃參賽專區 — 靜態前台互動
   僅以 localStorage 保存欄位與檔案中繼資料，不會上傳實際檔案。
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'aicontestParticipantDemoV1';
  var MAX_FILE_SIZE = 300 * 1024 * 1024;
  var MAX_FILE_COUNT = 10;
  var REQUIRED_DOCUMENTS = [
    'registrationForm',
    'consentForm',
    'workIntro',
    'aiSchedule',
    'apiSpec'
  ];
  var DOCUMENT_LABELS = {
    registrationForm: '報名表',
    consentForm: '個資同意書',
    workIntro: '作品介紹／提案簡報',
    aiSchedule: 'AI 評測時間預約單',
    apiSpec: 'API 介面規格說明書',
    supportingFiles: '其他審查資料'
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
  updateInterface();

  function defaultState() {
    return {
      profile: null,
      documents: {},
      submitted: false,
      submittedAt: null
    };
  }

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        return Object.assign(defaultState(), saved, {
          documents: saved.documents || {}
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
        taxId: clean(data.get('taxId')),
        contactName: clean(data.get('contactName')),
        contactPhone: clean(data.get('contactPhone')),
        contactEmail: clean(data.get('contactEmail')),
        profileConfirm: data.get('profileConfirm') === 'on',
        updatedAt: new Date().toISOString()
      };

      saveState();
      updateInterface();
      document.getElementById('profile-status').textContent = '團隊資料已儲存。';
      showAlert('團隊資料已儲存，下一步請上傳必繳文件。', 'success');
    });
  }

  function bindDocumentInputs() {
    document.querySelectorAll('[data-document-input]').forEach(function (input) {
      input.addEventListener('change', function () {
        var documentId = input.getAttribute('data-document-input');
        var files = Array.from(input.files || []);
        if (!files.length) return;

        var currentCount = totalFileCount(documentId);
        if (currentCount + files.length > MAX_FILE_COUNT) {
          input.value = '';
          showAlert('全部檔案合計最多 10 個，請減少選擇的檔案數量。', 'error');
          return;
        }

        var oversized = files.find(function (file) { return file.size > MAX_FILE_SIZE; });
        if (oversized) {
          input.value = '';
          showAlert('「' + oversized.name + '」超過單檔 300MB 上限。', 'error');
          return;
        }

        if (documentId !== 'supportingFiles') {
          var invalidPdf = files.find(function (file) {
            return !file.name.toLowerCase().endsWith('.pdf');
          });
          if (invalidPdf) {
            input.value = '';
            showAlert('「' + DOCUMENT_LABELS[documentId] + '」必須使用 PDF 格式。', 'error');
            return;
          }
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
        state.submitted = false;
        state.submittedAt = null;
        saveState();
        updateInterface();
        showAlert('尚未完成：' + missing.join('、') + '。', 'error');
        var firstTarget = !profileComplete() ? document.getElementById('profile') : document.getElementById('documents');
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        firstTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }

      state.submitted = true;
      state.submittedAt = new Date().toISOString();
      saveState();
      updateInterface();
      showAlert('報名已送出，目前狀態為「書面審查中」。', 'success');
      document.getElementById('submission-message').textContent = '送出成功，系統已記錄時間。';
    });
  }

  function updateInterface() {
    updateWelcome();
    updateDocumentRows();
    updateCompletion();
    updateSubmissionChecks();
    updateSubmissionState();
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

      if (input && state.submitted && (documentId === 'registrationForm' || documentId === 'consentForm')) {
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
    if (state.submitted) {
      status.textContent = '已送出';
      tag.textContent = '書面審查中';
      tag.classList.add('tag--result');
      result.textContent = '書面審查中';
      note.textContent = '報名已完成，正式結果公告後將更新此頁並寄送 Email 通知。';
      submitButton.textContent = '更新送出紀錄';
    } else {
      status.textContent = '尚未送出';
      tag.textContent = '待完成';
      tag.classList.add('tag--urgent');
      result.textContent = '尚未公告';
      note.textContent = '完成並送出報名後，系統將顯示「審查中」；正式結果由活動管理者公告。';
      submitButton.textContent = '確認送出報名';
    }
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
})();
