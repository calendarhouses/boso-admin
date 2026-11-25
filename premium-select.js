/**
 * BOSO PremiumSelect — custom dropdown inspired by GIRISPORT PremiumSelect.
 * Desktop: floating menu. Mobile: bottom sheet.
 */
(function (global) {
  'use strict';

  var STYLE_ID = 'boso-premium-select-css';
  var OPEN_Z = 5200;
  var instances = [];

  var MONTHS_UA = [
    { value: '1', label: 'Січень' },
    { value: '2', label: 'Лютий' },
    { value: '3', label: 'Березень' },
    { value: '4', label: 'Квітень' },
    { value: '5', label: 'Травень' },
    { value: '6', label: 'Червень' },
    { value: '7', label: 'Липень' },
    { value: '8', label: 'Серпень' },
    { value: '9', label: 'Вересень' },
    { value: '10', label: 'Жовтень' },
    { value: '11', label: 'Листопад' },
    { value: '12', label: 'Грудень' }
  ];

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.boso-pselect{position:relative;width:100%;}',
      '.boso-pselect__native{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;margin:0!important;padding:0!important;border:0!important;clip:rect(0,0,0,0)!important;}',
      '.boso-pselect__btn{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;height:52px;padding:0 16px;border:1.5px solid #E5E7EB;border-radius:16px;background:#F8FAFC;color:#111827;font:inherit;font-size:15px;font-weight:500;text-align:left;cursor:pointer;outline:none;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease;}',
      '.boso-pselect__btn:hover{border-color:#D1D5DB;background:#fff;}',
      '.boso-pselect__btn.is-open{border-color:var(--accent,#556B2F);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb, var(--accent,#556B2F) 14%, transparent);}',
      '.boso-pselect__btn:disabled{opacity:.6;cursor:not-allowed;}',
      '.boso-pselect__label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.boso-pselect__label.is-placeholder{color:#9CA3AF;font-weight:500;}',
      '.boso-pselect__chevron{width:16px;height:16px;flex-shrink:0;color:#9CA3AF;transition:transform .2s ease,color .2s ease;}',
      '.boso-pselect__btn.is-open .boso-pselect__chevron{transform:rotate(180deg);color:var(--accent,#556B2F);}',
      '.boso-pselect__menu{position:fixed;z-index:' + OPEN_Z + ';overflow:auto;border:1px solid #F3F4F6;border-radius:16px;background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.16);padding:6px;opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .16s ease,transform .16s ease;}',
      '.boso-pselect__menu.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}',
      '.boso-pselect__menu.is-top{transform:translateY(6px) scale(.98);}',
      '.boso-pselect__menu.is-top.is-open{transform:translateY(0) scale(1);}',
      '.boso-pselect__opt{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:12px 14px;border:0;border-radius:12px;background:transparent;color:#374151;font:inherit;font-size:14px;text-align:left;cursor:pointer;transition:background .15s ease,color .15s ease;}',
      '.boso-pselect__opt:hover{background:#F9FAFB;}',
      '.boso-pselect__opt.is-active{background:color-mix(in srgb, var(--accent,#556B2F) 12%, #fff);color:var(--accent,#556B2F);font-weight:700;}',
      '.boso-pselect__check{width:16px;height:16px;flex-shrink:0;opacity:0;}',
      '.boso-pselect__opt.is-active .boso-pselect__check{opacity:1;}',
      '.boso-pselect-sheet{position:fixed;inset:0;z-index:' + (OPEN_Z + 10) + ';display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s ease;}',
      '.boso-pselect-sheet.is-open{opacity:1;pointer-events:auto;}',
      '.boso-pselect-sheet__backdrop{position:absolute;inset:0;background:rgba(15,23,42,.42);}',
      '.boso-pselect-sheet__panel{position:relative;width:100%;max-width:560px;max-height:min(70dvh,480px);display:flex;flex-direction:column;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -12px 40px rgba(15,23,42,.18);transform:translateY(110%);transition:transform .28s cubic-bezier(.22,1,.36,1);}',
      '.boso-pselect-sheet.is-open .boso-pselect-sheet__panel{transform:translateY(0);}',
      '.boso-pselect-sheet__handle{display:flex;justify-content:center;padding:12px 0 6px;}',
      '.boso-pselect-sheet__handle span{width:44px;height:5px;border-radius:999px;background:#D1D5DB;}',
      '.boso-pselect-sheet__head{padding:4px 20px 12px;border-bottom:1px solid #F3F4F6;}',
      '.boso-pselect-sheet__eyebrow{margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9CA3AF;}',
      '.boso-pselect-sheet__title{margin:4px 0 0;font-size:17px;font-weight:800;color:#111827;}',
      '.boso-pselect-sheet__list{overflow:auto;padding:10px 12px calc(16px + env(safe-area-inset-bottom,0px));}',
      '.boso-pselect-row{display:grid;grid-template-columns:1fr 1.35fr;gap:10px;width:100%;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function chevronSvg() {
    return '<svg class="boso-pselect__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  }

  function checkSvg() {
    return '<svg class="boso-pselect__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 720px)').matches;
  }

  function readOptionsFromSelect(selectEl) {
    var opts = [];
    Array.prototype.forEach.call(selectEl.options || [], function (opt) {
      if (!opt.value) return;
      opts.push({ value: String(opt.value), label: String(opt.textContent || opt.value).trim() });
    });
    return opts;
  }

  function closeAll(except) {
    instances.forEach(function (inst) {
      if (inst !== except) inst.close();
    });
  }

  function createController(selectEl, config) {
    config = config || {};
    injectCss();

    if (selectEl._bosoPremium) {
      selectEl._bosoPremium.refresh();
      return selectEl._bosoPremium;
    }

    selectEl.classList.add('boso-pselect__native');
    selectEl.setAttribute('tabindex', '-1');
    selectEl.setAttribute('aria-hidden', 'true');

    var root = document.createElement('div');
    root.className = 'boso-pselect';
    selectEl.parentNode.insertBefore(root, selectEl);
    root.appendChild(selectEl);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'boso-pselect__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (selectEl.id) btn.id = selectEl.id + '__btn';
    btn.innerHTML = '<span class="boso-pselect__label is-placeholder"></span>' + chevronSvg();
    root.insertBefore(btn, selectEl);

    var labelEl = btn.querySelector('.boso-pselect__label');
    var placeholder = config.placeholder || selectEl.getAttribute('aria-label') || 'Оберіть…';
    var options = readOptionsFromSelect(selectEl);
    var open = false;
    var menuEl = null;
    var sheetEl = null;

    function selectedOption() {
      var val = String(selectEl.value || '');
      for (var i = 0; i < options.length; i++) {
        if (options[i].value === val) return options[i];
      }
      return null;
    }

    function syncLabel() {
      var sel = selectedOption();
      if (sel) {
        labelEl.textContent = sel.label;
        labelEl.classList.remove('is-placeholder');
      } else {
        labelEl.textContent = placeholder;
        labelEl.classList.add('is-placeholder');
      }
    }

    function buildOptionButton(opt) {
      var active = String(selectEl.value || '') === opt.value;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boso-pselect__opt' + (active ? ' is-active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', active ? 'true' : 'false');
      b.innerHTML = '<span>' + opt.label.replace(/</g, '&lt;') + '</span>' + checkSvg();
      b.addEventListener('click', function () {
        pick(opt.value);
      });
      return b;
    }

    function fillList(container) {
      container.innerHTML = '';
      options.forEach(function (opt) {
        container.appendChild(buildOptionButton(opt));
      });
    }

    function pick(value) {
      selectEl.value = value;
      try {
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {
        var ev = document.createEvent('HTMLEvents');
        ev.initEvent('change', true, false);
        selectEl.dispatchEvent(ev);
      }
      syncLabel();
      close();
      if (typeof config.onChange === 'function') config.onChange(value);
    }

    function ensureMenu() {
      if (menuEl) return menuEl;
      menuEl = document.createElement('div');
      menuEl.className = 'boso-pselect__menu';
      menuEl.setAttribute('role', 'listbox');
      document.body.appendChild(menuEl);
      return menuEl;
    }

    function positionMenu() {
      var menu = ensureMenu();
      var rect = btn.getBoundingClientRect();
      var pad = 12;
      var gap = 8;
      var maxH = 320;
      var spaceBelow = window.innerHeight - rect.bottom - pad;
      var spaceAbove = rect.top - pad;
      var placeTop = spaceBelow < 220 && spaceAbove > spaceBelow;
      var available = placeTop ? spaceAbove : spaceBelow;
      var height = Math.max(160, Math.min(maxH, available - gap));
      var left = Math.min(Math.max(pad, rect.left), Math.max(pad, window.innerWidth - rect.width - pad));

      menu.style.width = rect.width + 'px';
      menu.style.maxHeight = height + 'px';
      menu.style.left = left + 'px';
      menu.classList.toggle('is-top', placeTop);
      if (placeTop) {
        menu.style.top = 'auto';
        menu.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
      } else {
        menu.style.bottom = 'auto';
        menu.style.top = (rect.bottom + gap) + 'px';
      }
    }

    function openDesktop() {
      var menu = ensureMenu();
      fillList(menu);
      positionMenu();
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
      });
    }

    function openSheet() {
      if (sheetEl) sheetEl.remove();
      sheetEl = document.createElement('div');
      sheetEl.className = 'boso-pselect-sheet';
      sheetEl.innerHTML =
        '<div class="boso-pselect-sheet__backdrop" data-close="1"></div>' +
        '<div class="boso-pselect-sheet__panel" role="dialog" aria-modal="true">' +
          '<div class="boso-pselect-sheet__handle"><span></span></div>' +
          '<div class="boso-pselect-sheet__head">' +
            '<p class="boso-pselect-sheet__eyebrow">Вибір</p>' +
            '<p class="boso-pselect-sheet__title"></p>' +
          '</div>' +
          '<div class="boso-pselect-sheet__list"></div>' +
        '</div>';
      sheetEl.querySelector('.boso-pselect-sheet__title').textContent = placeholder;
      fillList(sheetEl.querySelector('.boso-pselect-sheet__list'));
      sheetEl.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-close') === '1') close();
      });
      document.body.appendChild(sheetEl);
      requestAnimationFrame(function () {
        sheetEl.classList.add('is-open');
      });
    }

    function onDocDown(e) {
      if (!open) return;
      if (root.contains(e.target)) return;
      if (menuEl && menuEl.contains(e.target)) return;
      if (sheetEl && sheetEl.contains(e.target)) return;
      close();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    function onReposition() {
      if (open && menuEl && !isMobileViewport()) positionMenu();
    }

    function openMenu() {
      if (selectEl.disabled) return;
      closeAll(api);
      open = true;
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (isMobileViewport()) openSheet();
      else openDesktop();
      document.addEventListener('mousedown', onDocDown, true);
      document.addEventListener('touchstart', onDocDown, true);
      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', onReposition);
      window.addEventListener('scroll', onReposition, true);
    }

    function close() {
      if (!open) return;
      open = false;
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (menuEl) {
        menuEl.classList.remove('is-open');
      }
      if (sheetEl) {
        sheetEl.classList.remove('is-open');
        var toRemove = sheetEl;
        setTimeout(function () {
          if (toRemove && toRemove.parentNode) toRemove.parentNode.removeChild(toRemove);
        }, 220);
        sheetEl = null;
      }
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('touchstart', onDocDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    }

    btn.addEventListener('click', function () {
      if (open) close();
      else openMenu();
    });

    selectEl.addEventListener('change', syncLabel);

    var api = {
      refresh: function () {
        options = readOptionsFromSelect(selectEl);
        syncLabel();
        if (open) {
          if (sheetEl) fillList(sheetEl.querySelector('.boso-pselect-sheet__list'));
          else if (menuEl) fillList(menuEl);
        }
      },
      setValue: function (v) {
        selectEl.value = v == null ? '' : String(v);
        syncLabel();
      },
      getValue: function () {
        return String(selectEl.value || '');
      },
      close: close,
      destroy: function () {
        close();
        instances = instances.filter(function (x) { return x !== api; });
        delete selectEl._bosoPremium;
      }
    };

    syncLabel();
    instances.push(api);
    selectEl._bosoPremium = api;
    return api;
  }

  function enhanceNativeSelect(selectEl, config) {
    if (!selectEl) return null;
    return createController(selectEl, config || {});
  }

  function ensureMonthOptions(selectEl) {
    if (!selectEl) return;
    if (selectEl.options.length > 1) return;
    selectEl.innerHTML = '<option value="">Місяць</option>';
    MONTHS_UA.forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      selectEl.appendChild(opt);
    });
  }

  function ensureDayOptions(selectEl, monthValue) {
    if (!selectEl) return;
    var current = String(selectEl.value || '');
    var max = 31;
    var m = parseInt(monthValue, 10);
    if (m >= 1 && m <= 12) {
      max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
    }
    selectEl.innerHTML = '<option value="">День</option>';
    for (var d = 1; d <= max; d++) {
      var opt = document.createElement('option');
      opt.value = String(d);
      opt.textContent = String(d);
      selectEl.appendChild(opt);
    }
    if (current && Number(current) <= max) selectEl.value = current;
    else selectEl.value = '';
  }

  function mountBirthdayPair(daySelect, monthSelect) {
    if (!daySelect || !monthSelect) return null;
    ensureMonthOptions(monthSelect);
    ensureDayOptions(daySelect, monthSelect.value);
    var dayCtl = enhanceNativeSelect(daySelect, { placeholder: 'День' });
    var monthCtl = enhanceNativeSelect(monthSelect, {
      placeholder: 'Місяць',
      onChange: function () {
        ensureDayOptions(daySelect, monthSelect.value);
        if (dayCtl) dayCtl.refresh();
      }
    });
    // Wrap row if not already
    var parent = daySelect.closest('.boso-pselect') && daySelect.closest('.boso-pselect').parentNode;
    if (parent && !parent.classList.contains('boso-pselect-row')) {
      var dayWrap = daySelect.closest('.boso-pselect');
      var monthWrap = monthSelect.closest('.boso-pselect');
      if (dayWrap && monthWrap && dayWrap.parentNode === monthWrap.parentNode) {
        var row = document.createElement('div');
        row.className = 'boso-pselect-row';
        dayWrap.parentNode.insertBefore(row, dayWrap);
        row.appendChild(dayWrap);
        row.appendChild(monthWrap);
      }
    }
    return { day: dayCtl, month: monthCtl };
  }

  global.BosoPremiumSelect = {
    enhanceNativeSelect: enhanceNativeSelect,
    mountBirthdayPair: mountBirthdayPair,
    ensureDayOptions: ensureDayOptions,
    ensureMonthOptions: ensureMonthOptions,
    MONTHS_UA: MONTHS_UA
  };
})(window);
