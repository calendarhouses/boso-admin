/**
 * BOSO — преміум каталог додаткових послуг (патерн azhunebi).
 * Очікує глобалі: customServicesList, roomsList, saveSettingsToCloud, showToast, openCustomConfirm
 */
(function (global) {
  'use strict';

  var SVG = {
    plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    pencil: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    sparkles: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    banknote: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"/></svg>',
    users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    hash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    sun: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    house: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'
  };

  var SERVICE_TEMPLATES = [
    {
      id: 'bike',
      label: 'Велосипед',
      kind: 'bike',
      form: {
        name: 'Прокат велосипеда',
        price: '1000',
        perDay: false,
        perGuest: false,
        perBooking: false,
        perRentalDay: true,
        onSite: false,
        description: '1000 ₴ за добу · оберіть кількість і дні',
        inputType: 'counter',
        maxQuantity: 5,
        maxDays: 14,
        active: true
      }
    },
    {
      id: 'chan',
      label: 'Чан',
      kind: 'chan',
      form: { name: 'Чан', price: '0', perDay: false, perGuest: false, perBooking: true, onSite: true, description: 'Оплата на місці після прогріву', inputType: 'toggle', active: true }
    },
    {
      id: 'firewood',
      label: 'Дрова',
      form: { name: 'Дрова', price: '250', perDay: false, perGuest: false, perBooking: true, onSite: false, description: 'Пакунок дров до мангалу', inputType: 'counter', maxQuantity: 10, active: true }
    },
    {
      id: 'transfer',
      label: 'Трансфер',
      form: { name: 'Трансфер', price: '500', perDay: false, perGuest: false, perBooking: true, description: 'Вкажіть час прибуття в коментарі', inputType: 'toggle', active: true }
    }
  ];

  var editId = null;
  var formState = defaultForm();

  function defaultForm() {
    return {
      name: '',
      price: '',
      baseFee: '',
      description: '',
      active: true,
      perBooking: true,
      perDay: false,
      perGuest: false,
      perHour: false,
      perRentalDay: false,
      onSite: false,
      inputType: 'toggle',
      maxQuantity: 10,
      maxDays: 14,
      roomIds: [],
      kind: ''
    };
  }

  function yesNo(v) { return v ? 'Так' : 'Ні'; }

  function formFromService(s) {
    var rental = s.perRentalDay === 'Так' || s.perRentalDay === true;
    var perBooking = !rental && (s.perBooking === 'Так' || (s.perBooking !== 'Ні' && s.perDay !== 'Так' && s.perGuest !== 'Так' && s.perHour !== 'Так'));
    return {
      name: s.name || '',
      price: String(s.price != null ? s.price : ''),
      baseFee: String(s.baseFee != null ? s.baseFee : ''),
      description: s.description || '',
      active: s.active !== false,
      perBooking: !!perBooking,
      perDay: !rental && s.perDay === 'Так',
      perGuest: !rental && s.perGuest === 'Так',
      perHour: !rental && s.perHour === 'Так',
      perRentalDay: !!rental,
      onSite: !!s.onSite || (typeof BosoServices !== 'undefined' && BosoServices.serviceIsOnSite(s)),
      inputType: (rental || s.inputType === 'counter') ? 'counter' : 'toggle',
      maxQuantity: Math.max(1, Number(s.maxQuantity) || 10),
      maxDays: Math.max(1, Number(s.maxDays) || 14),
      roomIds: Array.isArray(s.roomIds) ? s.roomIds.map(Number) : [],
      kind: s.kind || ''
    };
  }

  function pricingLabels(s) {
    var labels = [];
    if (s.perRentalDay === 'Так' || s.perRentalDay === true) {
      labels.push('За добу');
      return labels;
    }
    if (s.perHour === 'Так') labels.push('За годину');
    else {
      var perBooking = s.perBooking === 'Так' || (s.perBooking !== 'Ні' && s.perDay !== 'Так' && s.perGuest !== 'Так');
      if (perBooking) labels.push('За бронь');
      if (s.perDay === 'Так') labels.push('За ніч');
      if (s.perGuest === 'Так') labels.push('За гостя');
    }
    return labels.length ? labels : ['За бронь'];
  }

  function pricingIconSvg(s) {
    if (s.perRentalDay === 'Так' || s.perRentalDay === true) return SVG.sun;
    if (s.perGuest === 'Так') return SVG.users;
    if (s.perDay === 'Так') return SVG.moon;
    if (s.perHour === 'Так') return SVG.clock;
    return SVG.hash;
  }

  function roomsLabel(service) {
    if (typeof BosoServices !== 'undefined' && Array.isArray(service.roomIds) && service.roomIds.length) {
      return BosoServices.roomsLabelForIds(service.roomIds, roomsList) || service.rooms || 'Обрані котеджі';
    }
    return service.rooms || 'Всі котеджі';
  }

  function priceHint(service) {
    if (typeof BosoServices !== 'undefined') return BosoServices.formatServicePriceHint(service);
    return (service.price || 0) + ' грн';
  }

  function previewFee(form) {
    if (form.onSite) return 'Оплата на місці';
    var price = Math.max(0, Number(form.price) || 0);
    var base = Math.max(0, Number(form.baseFee) || 0);
    var qty = 2;
    var nights = 3;
    var guests = 2;
    var amount = base + price;
    if (form.perRentalDay) {
      amount = base + price * qty * 1;
      return Math.round(amount).toLocaleString('uk-UA') + ' ₴ · ' + qty + ' шт × 1 доба';
    }
    if (form.perHour) amount = price * qty;
    else {
      amount = base;
      var unit = price;
      if (form.perDay) unit *= nights;
      if (form.perGuest) unit *= guests;
      if (!form.perDay && !form.perGuest) unit = price;
      amount += unit * qty;
      if (!form.perBooking && !form.perDay && !form.perGuest && !form.perHour) amount = base + price;
    }
    return Math.round(amount).toLocaleString('uk-UA') + ' ₴';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureDrawerDom() {
    if (document.getElementById('serviceEditorOverlay')) return;
    var wrap = document.createElement('div');
    wrap.id = 'serviceEditorOverlay';
    wrap.className = 'admin-side-drawer-overlay';
    wrap.onclick = function (e) {
      if (e.target === wrap) closeServiceEditor();
    };
    wrap.innerHTML =
      '<div class="admin-side-drawer" role="dialog" aria-modal="true" onclick="event.stopPropagation()">' +
      '  <div class="admin-side-drawer__header">' +
      '    <div><p class="admin-side-drawer__eyebrow">Послуга для гостей</p><h2 id="serviceEditorTitle">Нова послуга</h2></div>' +
      '    <button type="button" class="admin-side-drawer__close" onclick="BosoServicesUI.closeServiceEditor()" aria-label="Закрити">' + SVG.x + '</button>' +
      '  </div>' +
      '  <div class="admin-side-drawer__body" id="serviceEditorBody"></div>' +
      '  <div class="admin-side-drawer__footer">' +
      '    <button type="button" class="btn-secondary" onclick="BosoServicesUI.closeServiceEditor()">Скасувати</button>' +
      '    <button type="button" class="btn-primary" id="serviceEditorSaveBtn" onclick="BosoServicesUI.saveServiceEditor()">Зберегти</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  function renderEditorBody() {
    var body = document.getElementById('serviceEditorBody');
    if (!body) return;
    var f = formState;
    var rooms = (typeof roomsList !== 'undefined' ? roomsList : []) || [];
    var roomsHtml = rooms.map(function (r) {
      var active = f.roomIds.map(Number).indexOf(Number(r.id)) !== -1;
      return '<button type="button" class="svc-room-chip' + (active ? ' is-active' : '') + '" onclick="BosoServicesUI.toggleEditorRoom(' + r.id + ')">' +
        SVG.house + ' ' + escapeHtml(r.name || r.short || ('#' + r.id)) + '</button>';
    }).join('');

    var pricing = [
      { key: 'perBooking', label: 'За бронь', hint: 'базова', icon: SVG.hash },
      { key: 'perDay', label: 'За ніч', hint: '× ночі броні', icon: SVG.moon },
      { key: 'perRentalDay', label: 'За добу', hint: 'гість обирає шт × доби', icon: SVG.sun },
      { key: 'perGuest', label: 'За гостя', hint: '× гості', icon: SVG.users },
      { key: 'perHour', label: 'За годину', hint: '× години', icon: SVG.clock }
    ].map(function (opt) {
      return '<button type="button" class="svc-pricing-card' + (f[opt.key] ? ' is-active' : '') + '" onclick="BosoServicesUI.togglePricing(\'' + opt.key + '\')">' +
        '<span class="svc-pricing-card__icon">' + opt.icon + '</span>' +
        '<span class="svc-pricing-card__text"><strong>' + opt.label + '</strong><small>' + opt.hint + '</small></span></button>';
    }).join('');

    body.innerHTML =
      '<div class="svc-drawer-block">' +
      '  <h3 class="svc-drawer-block__title">' + SVG.sparkles.replace('26', '15').replace('26', '15') + ' Основне</h3>' +
      '  <div class="svc-form-grid svc-form-grid--2">' +
      '    <label class="svc-field svc-field--span-2"><span class="svc-field__label">Назва послуги</span>' +
      '      <input class="svc-field__input" type="text" id="svcEditName" value="' + escapeHtml(f.name) + '" placeholder="Наприклад, Чан" oninput="BosoServicesUI.patchForm({name:this.value})"></label>' +
      '    <label class="svc-field"><span class="svc-field__label">Ціна</span><div class="svc-field__suffix-wrap">' +
      '      <input class="svc-field__input" type="number" min="0" id="svcEditPrice" value="' + escapeHtml(f.price) + '" placeholder="0" oninput="BosoServicesUI.patchForm({price:this.value});BosoServicesUI.refreshPreview()">' +
      '      <span class="svc-field__suffix">₴</span></div></label>' +
      '    <label class="svc-field"><span class="svc-field__label">Фікс. частина</span><div class="svc-field__suffix-wrap">' +
      '      <input class="svc-field__input" type="number" min="0" id="svcEditBaseFee" value="' + escapeHtml(f.baseFee) + '" placeholder="0" oninput="BosoServicesUI.patchForm({baseFee:this.value});BosoServicesUI.refreshPreview()">' +
      '      <span class="svc-field__suffix">₴</span></div></label>' +
      '    <label class="svc-field svc-field--span-2"><span class="svc-field__label">Статус</span>' +
      '      <button type="button" class="svc-status-pill' + (f.active ? ' is-on' : '') + '" onclick="BosoServicesUI.patchForm({active:!' + f.active + '});BosoServicesUI.renderEditorBody()">' +
      '        <span class="svc-switch svc-switch--sm' + (f.active ? ' is-on' : '') + '" aria-hidden><span></span></span>' +
      (f.active ? 'Увімкнена' : 'Вимкнена') + '</button></label>' +
      '    <label class="svc-field svc-field--span-2"><span class="svc-field__label">Опис для гостя</span>' +
      '      <textarea class="svc-field__textarea" rows="2" placeholder="Коротка підказка на сайті та в броні" oninput="BosoServicesUI.patchForm({description:this.value})">' + escapeHtml(f.description) + '</textarea></label>' +
      '  </div></div>' +

      '<div class="svc-drawer-block">' +
      '  <h3 class="svc-drawer-block__title">Тип нарахування</h3>' +
      '  <p class="svc-drawer-block__caption">Можна обрати кілька — ціна множиться на параметри</p>' +
      '  <div class="svc-pricing-grid">' + pricing + '</div></div>' +

      '<div class="svc-drawer-block">' +
      '  <h3 class="svc-drawer-block__title">Поведінка</h3>' +
      '  <div class="svc-options-stack">' +
      '    <button type="button" class="svc-option-card' + (f.onSite ? ' is-active' : '') + '" onclick="BosoServicesUI.patchForm({onSite:!' + f.onSite + '});BosoServicesUI.renderEditorBody()">' +
      '      <span class="svc-option-card__icon svc-option-card__icon--stone">' + SVG.banknote.replace('14', '18').replace('14', '18') + '</span>' +
      '      <span class="svc-option-card__body"><strong>Оплата на місці</strong><small>Не входить у онлайн-розрахунок</small></span>' +
      '      <span class="svc-switch svc-switch--sm' + (f.onSite ? ' is-on' : '') + '" aria-hidden><span></span></span></button>' +
      '  </div>' +
      '  <div class="svc-field"><span class="svc-field__label">Як гість обирає</span>' +
      '    <div class="svc-segmented">' +
      '      <button type="button" class="svc-segmented__btn' + (f.inputType === 'toggle' && !f.perRentalDay ? ' is-active' : '') + '" onclick="BosoServicesUI.patchForm({inputType:\'toggle\'});BosoServicesUI.renderEditorBody()" ' + (f.perRentalDay ? 'disabled style="opacity:.45"' : '') + '>Так / Ні</button>' +
      '      <button type="button" class="svc-segmented__btn' + (f.inputType === 'counter' || f.perRentalDay ? ' is-active' : '') + '" onclick="BosoServicesUI.patchForm({inputType:\'counter\'});BosoServicesUI.renderEditorBody()">Лічильник</button>' +
      '    </div></div>' +
      (f.inputType === 'counter' || f.perRentalDay
        ? '<div class="svc-form-grid svc-form-grid--2">' +
          '<label class="svc-field"><span class="svc-field__label">Максимум, шт.</span><input class="svc-field__input" type="number" min="1" max="99" value="' + f.maxQuantity + '" oninput="BosoServicesUI.patchForm({maxQuantity:Math.max(1,Number(this.value)||1)})"></label>' +
          (f.perRentalDay
            ? '<label class="svc-field"><span class="svc-field__label">Макс. діб</span><input class="svc-field__input" type="number" min="1" max="60" value="' + f.maxDays + '" oninput="BosoServicesUI.patchForm({maxDays:Math.max(1,Number(this.value)||1)})"></label>'
            : '') +
          '</div>'
        : '') +
      '</div>' +

      '<div class="svc-drawer-block">' +
      '  <h3 class="svc-drawer-block__title">Котеджі</h3>' +
      '  <p class="svc-drawer-block__caption">Якщо нічого не обрано — послуга для всіх котеджів.</p>' +
      '  <div class="svc-rooms-grid">' + (roomsHtml || '<span class="svc-field__caption">Спочатку додайте котеджі</span>') + '</div></div>' +

      '<div class="svc-drawer-preview" id="svcEditPreview">' +
      '  <div class="svc-drawer-preview__text"><span class="svc-drawer-preview__label">Сума для гостя</span>' +
      '  <span class="svc-drawer-preview__hint">' + (f.perRentalDay ? '2 шт · 1 доба' : '3 ночі · 2 гості · 1 послуга') + '</span></div>' +
      '  <strong>' + escapeHtml(previewFee(f)) + '</strong></div>';
  }

  function refreshPreview() {
    var el = document.querySelector('#svcEditPreview strong');
    if (el) el.textContent = previewFee(formState);
  }

  function openServiceEditor(id, templateForm) {
    ensureDrawerDom();
    editId = id != null ? id : null;
    if (templateForm) {
      formState = Object.assign(defaultForm(), templateForm);
    } else if (id != null) {
      var s = (customServicesList || []).find(function (x) { return x.id === id; });
      formState = s ? formFromService(s) : defaultForm();
    } else {
      formState = defaultForm();
    }
    document.getElementById('serviceEditorTitle').textContent = editId != null ? 'Редагувати послугу' : 'Нова послуга';
    renderEditorBody();
    document.getElementById('serviceEditorOverlay').classList.add('active');
  }

  function closeServiceEditor() {
    var ov = document.getElementById('serviceEditorOverlay');
    if (ov) ov.classList.remove('active');
  }

  function patchForm(partial) {
    Object.keys(partial || {}).forEach(function (k) { formState[k] = partial[k]; });
  }

  function togglePricing(key) {
    var next = !formState[key];
    if (key === 'perRentalDay' && next) {
      formState.perRentalDay = true;
      formState.perBooking = false;
      formState.perDay = false;
      formState.perGuest = false;
      formState.perHour = false;
      formState.inputType = 'counter';
      if (!formState.maxDays) formState.maxDays = 14;
    } else if (key === 'perHour' && next) {
      formState.perHour = true;
      formState.perBooking = false;
      formState.perDay = false;
      formState.perGuest = false;
      formState.perRentalDay = false;
      formState.inputType = 'counter';
    } else if (key !== 'perHour' && key !== 'perRentalDay' && next) {
      formState[key] = true;
      formState.perHour = false;
      formState.perRentalDay = false;
    } else {
      formState[key] = next;
    }
    renderEditorBody();
  }

  function toggleEditorRoom(roomId) {
    roomId = Number(roomId);
    var idx = formState.roomIds.map(Number).indexOf(roomId);
    if (idx >= 0) formState.roomIds.splice(idx, 1);
    else formState.roomIds.push(roomId);
    renderEditorBody();
  }

  function saveServiceEditor() {
    var name = String(formState.name || '').trim();
    if (!name) {
      if (typeof showToast === 'function') showToast('Вкажи назву послуги');
      return;
    }
    var roomIds = (formState.roomIds || []).map(Number).filter(Boolean);
    var rooms = (typeof BosoServices !== 'undefined')
      ? BosoServices.roomsLabelForIds(roomIds, roomsList)
      : (roomIds.length ? roomIds.join(',') : 'Всі');
    var payload = {
      name: name,
      price: Math.max(0, Number(formState.price) || 0),
      baseFee: Math.max(0, Number(formState.baseFee) || 0),
      description: String(formState.description || '').trim(),
      active: !!formState.active,
      perDay: yesNo(formState.perDay && !formState.perRentalDay),
      perGuest: yesNo(formState.perGuest && !formState.perRentalDay),
      perBooking: yesNo(formState.perRentalDay ? false : (formState.perBooking || (!formState.perDay && !formState.perGuest && !formState.perHour))),
      perHour: yesNo(formState.perHour && !formState.perRentalDay),
      perRentalDay: yesNo(formState.perRentalDay),
      onSite: !!formState.onSite,
      inputType: (formState.perRentalDay || formState.inputType === 'counter') ? 'counter' : 'toggle',
      maxQuantity: Math.max(1, Number(formState.maxQuantity) || 10),
      maxDays: Math.max(1, Number(formState.maxDays) || 14),
      rooms: rooms,
      roomIds: roomIds
    };
    var inferredKind = formState.kind
      || (/велосипед/i.test(name) ? 'bike' : '')
      || (/чан/i.test(name) ? 'chan' : '');
    if (inferredKind) payload.kind = inferredKind;
    if (editId != null) {
      var existing = customServicesList.find(function (x) { return x.id === editId; });
      if (existing) {
        var prevKind = existing.kind;
        Object.assign(existing, payload);
        if (!inferredKind && prevKind) existing.kind = prevKind;
        delete existing.requiresApproval;
      }
    } else {
      customServicesList.push(Object.assign({ id: Date.now() }, payload));
    }
    closeServiceEditor();
    renderSettingsServices();
    if (typeof renderDynamicServiceCards === 'function') renderDynamicServiceCards();
    if (typeof saveSettingsToCloud === 'function') saveSettingsToCloud();
    if (typeof showToast === 'function') showToast(editId != null ? 'Послугу оновлено' : 'Послугу додано');
  }

  function toggleServiceActive(id) {
    var s = (customServicesList || []).find(function (x) { return x.id === id; });
    if (!s) return;
    s.active = !(s.active !== false);
    renderSettingsServices();
    if (typeof renderDynamicServiceCards === 'function') renderDynamicServiceCards();
    if (typeof saveSettingsToCloud === 'function') saveSettingsToCloud();
  }

  function replaceServicesList(next) {
    if (!Array.isArray(customServicesList)) return;
    customServicesList.splice(0, customServicesList.length);
    (next || []).forEach(function (s) { customServicesList.push(s); });
  }

  function deleteService(id) {
    function doDelete() {
      if (typeof closeCustomConfirm === 'function') closeCustomConfirm();
      replaceServicesList((customServicesList || []).filter(function (x) { return x.id !== id; }));
      renderSettingsServices();
      if (typeof renderDynamicServiceCards === 'function') renderDynamicServiceCards();
      if (typeof saveSettingsToCloud === 'function') saveSettingsToCloud();
      if (typeof showToast === 'function') showToast('Послугу видалено');
    }
    if (typeof openCustomConfirm === 'function') {
      openCustomConfirm('Видалити послугу?', 'Цю дію неможливо скасувати.', doDelete);
      return;
    }
    doDelete();
  }

  function openFromTemplate(templateId) {
    var t = SERVICE_TEMPLATES.find(function (x) { return x.id === templateId; });
    if (!t) return;
    openServiceEditor(null, Object.assign({}, t.form, { kind: t.kind || '' }));
  }

  function renderSettingsServices() {
    var mount = document.getElementById('servicesCatalogMount');
    if (!mount) return;
    var list = (customServicesList || []).slice().sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''), 'uk');
    });

    var templatesHtml = SERVICE_TEMPLATES.map(function (t) {
      return '<button type="button" class="svc-template-chip" onclick="BosoServicesUI.openFromTemplate(\'' + t.id + '\')">' +
        SVG.plus.replace('17', '14').replace('17', '14') + ' ' + escapeHtml(t.label) + '</button>';
    }).join('');

    var cardsHtml;
    if (!list.length) {
      cardsHtml =
        '<div class="svc-empty">' +
        '  <div class="svc-empty__icon" aria-hidden>' + SVG.sparkles + '</div>' +
        '  <h3>Поки немає послуг</h3>' +
        '  <p>Обери шаблон вище або створи власну послугу з ціною та котеджами.</p>' +
        '  <button type="button" class="btn-primary" onclick="BosoServicesUI.openServiceEditor()">' + SVG.plus + ' Додати послугу</button>' +
        '</div>';
    } else {
      cardsHtml = '<div class="svc-grid">' + list.map(function (s) {
        var isActive = s.active !== false;
        var tags = pricingLabels(s).map(function (label) {
          return '<span class="svc-tag svc-tag--accent">' + pricingIconSvg(s) + ' ' + escapeHtml(label) + '</span>';
        }).join('') +
          '<span class="svc-tag">' + escapeHtml(roomsLabel(s)) + '</span>' +
          (s.onSite || (typeof BosoServices !== 'undefined' && BosoServices.serviceIsOnSite(s))
            ? '<span class="svc-tag svc-tag--muted">' + SVG.banknote + ' На місці</span>' : '') +
          (s.inputType === 'counter' ? '<span class="svc-tag svc-tag--muted">Лічильник</span>' : '');

        return '<article class="svc-card' + (isActive ? '' : ' is-off') + '">' +
          '  <div class="svc-card__top"><div class="svc-card__info">' +
          '    <h3 class="svc-card__name">' + escapeHtml(s.name) + '</h3>' +
          '    <p class="svc-card__price">' + escapeHtml(priceHint(s)) + '</p></div>' +
          '    <button type="button" class="svc-switch' + (isActive ? ' is-on' : '') + '" onclick="BosoServicesUI.toggleServiceActive(' + s.id + ')" aria-pressed="' + isActive + '"><span></span></button>' +
          '  </div>' +
          (s.description ? '<p class="svc-card__desc">' + escapeHtml(s.description) + '</p>' : '') +
          '  <div class="svc-card__tags">' + tags + '</div>' +
          '  <div class="svc-card__actions">' +
          '    <button type="button" class="svc-card__edit" onclick="BosoServicesUI.openServiceEditor(' + s.id + ')">' + SVG.pencil + ' Редагувати</button>' +
          '    <button type="button" class="svc-card__delete" onclick="BosoServicesUI.deleteService(' + s.id + ')" aria-label="Видалити">' + SVG.trash + '</button>' +
          '  </div></article>';
      }).join('') + '</div>';
    }

    mount.innerHTML =
      '<div class="svc-page">' +
      '  <p class="svc-page__intro">Налаштуй послуги для гостей — вони зʼявляться при бронюванні, у деталях броні та в звітах доходу.</p>' +
      '  <section class="svc-catalog">' +
      '    <div class="svc-catalog__toolbar"><div>' +
      '      <h2 class="svc-catalog__title">Каталог послуг</h2>' +
      '      <p class="svc-catalog__caption">Чан, трансфер, прокат — гість обере при бронюванні, ти побачиш у деталях броні.</p>' +
      '    </div>' +
      '    <button type="button" class="btn-primary svc-catalog__add" onclick="BosoServicesUI.openServiceEditor()">' + SVG.plus + ' Додати послугу</button></div>' +
      '    <div class="svc-templates"><span class="svc-templates__label">Швидкі шаблони</span>' +
      '      <div class="svc-templates__row">' + templatesHtml + '</div></div>' +
      cardsHtml +
      '  </section></div>';
  }

  global.BosoServicesUI = {
    SERVICE_TEMPLATES: SERVICE_TEMPLATES,
    renderSettingsServices: renderSettingsServices,
    openServiceEditor: openServiceEditor,
    closeServiceEditor: closeServiceEditor,
    saveServiceEditor: saveServiceEditor,
    openFromTemplate: openFromTemplate,
    toggleServiceActive: toggleServiceActive,
    deleteService: deleteService,
    patchForm: patchForm,
    togglePricing: togglePricing,
    toggleEditorRoom: toggleEditorRoom,
    renderEditorBody: renderEditorBody,
    refreshPreview: refreshPreview
  };

  // Alias used by existing admin code
  global.renderSettingsServices = renderSettingsServices;
})(typeof window !== 'undefined' ? window : this);
