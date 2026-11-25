/**
 * BOSO PremiumSelect — custom dropdown inspired by GIRISPORT PremiumSelect.
 * Desktop:
 *   - Admin (.drawer-body / .form-group): absolute menu glued under the field
 *   - Booking site: fixed body portal (survives detail-drawer transform/overflow)
 * Mobile: bottom sheet + swipe-down dismiss.
 */
(function (global) {
  'use strict';

  var STYLE_ID = 'boso-premium-select-css-v5';
  var OPEN_Z = 10050;
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
    ['boso-premium-select-css', 'boso-premium-select-css-v3', 'boso-premium-select-css-v4'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old && old.parentNode) old.parentNode.removeChild(old);
    });
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.boso-pselect{position:relative;width:100%;z-index:1;}',
      '.boso-pselect.is-open{z-index:80;}',
      '.boso-pselect__native{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;margin:0!important;padding:0!important;border:0!important;clip:rect(0,0,0,0)!important;}',
      '.boso-pselect__btn{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:48px;box-sizing:border-box;padding:14px 16px;border:1.5px solid var(--border,#E5E2DC);border-radius:12px;background:#FAFAF8;color:var(--text,#1A1A1A);font:inherit;font-size:14px;font-weight:500;text-align:left;cursor:pointer;outline:none;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease;}',
      '.boso-pselect__btn:hover{border-color:#C9C4BB;background:#fff;}',
      '.boso-pselect__btn.is-open{border-color:var(--accent,#556B2F);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb, var(--accent,#556B2F) 14%, transparent);}',
      '.boso-pselect__btn:disabled{opacity:.6;cursor:not-allowed;}',
      '.form-group .boso-pselect__btn{height:48px;padding:0 16px;border:1px solid #D1D5DB;border-radius:10px;background:#F9FAFB;color:#111827;}',
      '.form-group .boso-pselect__btn:hover{border-color:#C4C9D1;background:#fff;}',
      '.boso-pselect__label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.boso-pselect__label.is-placeholder{color:#9CA3AF;font-weight:500;}',
      '.boso-pselect__chevron{width:16px;height:16px;flex-shrink:0;color:#6B7280;transition:transform .2s ease,color .2s ease;}',
      '.boso-pselect__btn.is-open .boso-pselect__chevron{transform:rotate(180deg);color:var(--accent,#556B2F);}',
      /* Default = portal (booking). .is-local = glued under field (admin). */
      '.boso-pselect__menu{position:fixed;z-index:' + OPEN_Z + ';max-height:240px;overflow:auto;border:1px solid #E5E7EB;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.14);padding:6px;opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease,transform .15s ease;box-sizing:border-box;}',
      '.boso-pselect__menu.is-local{position:absolute;left:0;right:0;top:calc(100% + 6px);bottom:auto;width:auto;z-index:90;}',
      '.boso-pselect__menu.is-local.is-top{top:auto;bottom:calc(100% + 6px);}',
      '.boso-pselect__menu.is-open{opacity:1;transform:translateY(0);pointer-events:auto;}',
      '.boso-pselect__menu.is-top{transform:translateY(4px);}',
      '.boso-pselect__menu.is-top.is-open{transform:translateY(0);}',
      '.boso-pselect__opt{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:11px 12px;border:0;border-radius:10px;background:transparent;color:#374151;font:inherit;font-size:14px;text-align:left;cursor:pointer;transition:background .15s ease,color .15s ease;}',
      '.boso-pselect__opt:hover{background:#F9FAFB;}',
      '.boso-pselect__opt.is-active{background:color-mix(in srgb, var(--accent,#556B2F) 12%, #fff);color:var(--accent,#556B2F);font-weight:700;}',
      '.boso-pselect__check{width:16px;height:16px;flex-shrink:0;opacity:0;}',
      '.boso-pselect__opt.is-active .boso-pselect__check{opacity:1;}',
      '.drawer-body .form-group:has(.boso-pselect.is-open),.drawer-body .boso-pselect-row:has(.boso-pselect.is-open){overflow:visible;position:relative;z-index:20;}',
      '.boso-pselect-sheet{position:fixed;inset:0;z-index:' + (OPEN_Z + 10) + ';display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s ease;}',
      '.boso-pselect-sheet.is-open{opacity:1;pointer-events:auto;}',
      '.boso-pselect-sheet__backdrop{position:absolute;inset:0;background:rgba(15,23,42,.42);}',
      '.boso-pselect-sheet__panel{position:relative;width:100%;max-width:560px;max-height:min(70dvh,480px);display:flex;flex-direction:column;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -12px 40px rgba(15,23,42,.18);transform:translateY(110%);transition:transform .28s cubic-bezier(.22,1,.36,1);will-change:transform;}',
      '.boso-pselect-sheet.is-open .boso-pselect-sheet__panel{transform:translateY(0);}',
      '.boso-pselect-sheet__panel.is-dragging{transition:none!important;}',
      '.boso-pselect-sheet__handle{display:flex;justify-content:center;padding:14px 0 8px;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;}',
      '.boso-pselect-sheet__handle span{width:44px;height:5px;border-radius:999px;background:#D1D5DB;}',
      '.boso-pselect-sheet__head{padding:4px 20px 12px;border-bottom:1px solid #F3F4F6;touch-action:none;-webkit-user-select:none;user-select:none;}',
      '.boso-pselect-sheet__eyebrow{margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9CA3AF;}',
      '.boso-pselect-sheet__title{margin:4px 0 0;font-size:17px;font-weight:800;color:#111827;}',
      '.boso-pselect-sheet__list{overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:10px 12px calc(16px + env(safe-area-inset-bottom,0px));touch-action:pan-y;}',
      '.boso-pselect-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px;width:100%;align-items:stretch;}'
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
    var unlockedScrollParents = [];
    /* Admin drawer: glue menu under field. Booking site: body portal. */
    var localMenu = !!(selectEl.closest('.drawer-body') || selectEl.closest('#bookingDrawer') || selectEl.closest('.form-group'));

    function unlockScrollParents() {
      unlockedScrollParents = [];
      if (!localMenu) return;
      var node = root.parentElement;
      while (node && node !== document.body) {
        var style = window.getComputedStyle(node);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
          unlockedScrollParents.push({ el: node, overflow: node.style.overflow, overflowY: node.style.overflowY });
          node.style.overflow = 'visible';
          node.style.overflowY = 'visible';
        }
        node = node.parentElement;
      }
    }

    function restoreScrollParents() {
      unlockedScrollParents.forEach(function (item) {
        item.el.style.overflow = item.overflow;
        item.el.style.overflowY = item.overflowY;
      });
      unlockedScrollParents = [];
    }

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
      if (menuEl && menuEl.parentNode) return menuEl;
      menuEl = document.createElement('div');
      menuEl.className = 'boso-pselect__menu' + (localMenu ? ' is-local' : '');
      menuEl.setAttribute('role', 'listbox');
      if (localMenu) root.appendChild(menuEl);
      else document.body.appendChild(menuEl);
      return menuEl;
    }

    function destroyMenu() {
      if (menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
      menuEl = null;
    }

    function positionMenu() {
      var menu = ensureMenu();
      var rect = btn.getBoundingClientRect();
      var gap = 6;
      var spaceBelow = window.innerHeight - rect.bottom - 12;
      var spaceAbove = rect.top - 12;
      var placeTop = spaceBelow < 180 && spaceAbove > spaceBelow;
      var available = placeTop ? spaceAbove : spaceBelow;
      var maxH = Math.max(140, Math.min(260, available - 8));
      menu.style.maxHeight = maxH + 'px';
      menu.classList.toggle('is-top', placeTop);

      if (localMenu) {
        menu.style.left = '';
        menu.style.right = '';
        menu.style.width = '';
        menu.style.top = '';
        menu.style.bottom = '';
        return;
      }

      menu.style.width = Math.max(rect.width, 120) + 'px';
      menu.style.left = Math.round(rect.left) + 'px';
      if (placeTop) {
        menu.style.top = 'auto';
        menu.style.bottom = Math.round(window.innerHeight - rect.top + gap) + 'px';
      } else {
        menu.style.bottom = 'auto';
        menu.style.top = Math.round(rect.bottom + gap) + 'px';
      }
    }

    function openDesktop() {
      if (localMenu) unlockScrollParents();
      var menu = ensureMenu();
      fillList(menu);
      positionMenu();
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
      });
    }

    function bindSheetSwipe(panel, listEl) {
      var startY = 0;
      var startX = 0;
      var lastY = 0;
      var lastT = 0;
      var dy = 0;
      var dragging = false;
      var fromChrome = false;
      var locked = false;

      function setOffset(y) {
        panel.style.transform = 'translateY(' + Math.max(0, y) + 'px)';
        if (sheetEl) {
          var fade = 1 - Math.min(1, Math.max(0, y) / 280);
          sheetEl.style.opacity = String(0.35 + fade * 0.65);
        }
      }

      function resetOffset() {
        panel.classList.remove('is-dragging');
        panel.style.transform = '';
        if (sheetEl) sheetEl.style.opacity = '';
      }

      function onStart(e) {
        if (!e.touches || e.touches.length !== 1) return;
        var t = e.touches[0];
        var target = e.target;
        var inList = listEl && listEl.contains(target);
        fromChrome = !inList;
        if (inList && listEl.scrollTop > 0) {
          locked = false;
          dragging = false;
          return;
        }
        startY = t.clientY;
        startX = t.clientX;
        lastY = startY;
        lastT = Date.now();
        dy = 0;
        dragging = false;
        locked = true;
      }

      function onMove(e) {
        if (!locked || !e.touches || e.touches.length !== 1) return;
        var t = e.touches[0];
        var moveY = t.clientY - startY;
        var moveX = t.clientX - startX;
        if (!dragging) {
          if (Math.abs(moveX) > Math.abs(moveY) && Math.abs(moveX) > 8) {
            locked = false;
            return;
          }
          if (moveY < 6) return;
          if (!fromChrome && listEl && listEl.scrollTop > 0) {
            locked = false;
            return;
          }
          dragging = true;
          panel.classList.add('is-dragging');
        }
        e.preventDefault();
        dy = moveY;
        lastY = t.clientY;
        lastT = Date.now();
        setOffset(dy);
      }

      function onEnd() {
        if (!locked && !dragging) return;
        var velocity = 0;
        var dt = Date.now() - lastT;
        if (dt > 0 && dt < 80) velocity = (lastY - startY) / Math.max(dt, 1);
        var shouldClose = dragging && (dy > 90 || velocity > 0.55);
        locked = false;
        if (shouldClose) {
          panel.classList.remove('is-dragging');
          panel.style.transform = 'translateY(110%)';
          if (sheetEl) sheetEl.style.opacity = '0';
          close();
          return;
        }
        if (dragging) resetOffset();
        dragging = false;
        dy = 0;
      }

      panel.addEventListener('touchstart', onStart, { passive: true });
      panel.addEventListener('touchmove', onMove, { passive: false });
      panel.addEventListener('touchend', onEnd);
      panel.addEventListener('touchcancel', onEnd);
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
      var listEl = sheetEl.querySelector('.boso-pselect-sheet__list');
      var panel = sheetEl.querySelector('.boso-pselect-sheet__panel');
      fillList(listEl);
      bindSheetSwipe(panel, listEl);
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
      root.classList.add('is-open');
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
      root.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (menuEl) menuEl.classList.remove('is-open');
      destroyMenu();
      restoreScrollParents();
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

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
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
    var dayWrap = daySelect.closest('.boso-pselect');
    var monthWrap = monthSelect.closest('.boso-pselect');
    if (dayWrap && monthWrap && dayWrap.parentNode === monthWrap.parentNode) {
      var parent = dayWrap.parentNode;
      if (!parent.classList.contains('boso-pselect-row')) {
        var row = document.createElement('div');
        row.className = 'boso-pselect-row';
        parent.insertBefore(row, dayWrap);
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
})(typeof window !== 'undefined' ? window : this);
