/**
 * BOSO — додаткові послуги (модель як у azhunebi + baseFee для тварин).
 * Підключається в адмінці та на сайті бронювання.
 */
(function (global) {
  'use strict';

  var SERVICE_TOKEN = /🛎️#(\d+):\s*([^|]+)/g;
  var SERVICE_PENDING_TOKEN = /🛎️#(\d+)⏳:\s*([^|]+)/g;

  /** Дефолтний каталог — міграція зі старих захардкоджених полів */
  var DEFAULT_CUSTOM_SERVICES = [
    {
      id: 1001,
      kind: 'pets',
      name: 'Тварини',
      rooms: 'Всі',
      price: 200,
      baseFee: 500,
      perDay: 'Так',
      perGuest: 'Ні',
      perBooking: 'Ні',
      active: true,
      inputType: 'toggle',
      description: '500 ₴ фікс + 200 ₴ за кожну ніч'
    },
    {
      id: 1002,
      kind: 'dayGuests',
      name: 'Денні гості',
      rooms: 'Всі',
      price: 500,
      perDay: 'Ні',
      perGuest: 'Ні',
      perBooking: 'Так',
      active: true,
      inputType: 'counter',
      maxQuantity: 20,
      description: '500 ₴ за кожного денного гостя'
    },
    {
      id: 1003,
      kind: 'crib',
      name: 'Дитяче ліжечко',
      rooms: 'Всі',
      price: 500,
      perDay: 'Ні',
      perGuest: 'Ні',
      perBooking: 'Так',
      active: true,
      inputType: 'toggle',
      description: '500 ₴ за бронь'
    },
    {
      id: 1004,
      kind: 'chan',
      name: 'Чан',
      rooms: 'Всі',
      price: 0,
      onSite: true,
      perDay: 'Ні',
      perGuest: 'Ні',
      perBooking: 'Так',
      active: true,
      inputType: 'toggle',
      description: 'Оплата на місці після прогріву'
    }
  ];

  function serviceIsOnSite(service) {
    if (!service) return false;
    if (service.onSite === true) return true;
    return service.onSite !== false && Math.max(0, Number(service.price) || 0) === 0 && !(Number(service.baseFee) > 0);
  }

  function serviceIsHourly(service) {
    return service && service.perHour === 'Так';
  }

  function serviceInputType(service) {
    if (serviceIsHourly(service)) return 'counter';
    return service && service.inputType === 'counter' ? 'counter' : 'toggle';
  }

  function getServiceQty(map, serviceId) {
    if (!map) return 0;
    return Math.max(0, Number(map[String(serviceId)]) || 0);
  }

  function serviceAppliesToRoom(service, room) {
    if (!service || service.active === false) return false;
    if (!room) return true;
    if (Array.isArray(service.roomIds) && service.roomIds.length) {
      return service.roomIds.map(Number).indexOf(Number(room.id)) !== -1;
    }
    var label = String(service.rooms || '').trim();
    if (!label || label === 'Всі' || label === 'Всі котеджі' || label === 'Всі будинки') return true;
    var roomName = String(room.name || '').trim();
    var roomShort = String(room.short || '').trim();
    return label.split(',').map(function (p) { return p.trim(); }).filter(Boolean).some(function (part) {
      return part === roomName || (roomShort && part === roomShort);
    });
  }

  function listServicesForRoom(services, room) {
    return (services || []).filter(function (s) { return serviceAppliesToRoom(s, room); });
  }

  function findServiceByKind(services, kind) {
    return (services || []).find(function (s) { return s.kind === kind; }) || null;
  }

  function findServiceByNameHint(services, kind) {
    var byKind = findServiceByKind(services, kind);
    if (byKind) return byKind;
    if (kind === 'chan') return (services || []).find(function (s) { return /чан/i.test(s.name); }) || null;
    if (kind === 'dayGuests') return (services || []).find(function (s) { return /денн/i.test(s.name) && /гост/i.test(s.name); }) || null;
    if (kind === 'crib') return (services || []).find(function (s) { return /ліжеч/i.test(s.name) || /crib/i.test(s.name); }) || null;
    if (kind === 'pets') return (services || []).find(function (s) { return /тварин/i.test(s.name) || /pets?/i.test(s.name); }) || null;
    return null;
  }

  /**
   * Ціна послуги.
   * baseFee + price×nights (тварини): baseFee=500, price=200, perDay=Так → 500+200×nights
   */
  function calculateServiceFee(service, quantity, opts) {
    var qty = Math.max(0, Number(quantity) || 0);
    if (qty <= 0 || !service) return 0;
    if (serviceIsOnSite(service)) return 0;

    var unit = Math.max(0, Number(service.price) || 0);
    var base = Math.max(0, Number(service.baseFee) || 0);
    var nights = Math.max(1, Number(opts && opts.nights) || 1);
    var guests = Math.max(1, Number(opts && opts.adults) || 0) + Math.max(0, Number(opts && opts.children) || 0);
    if (guests < 1) guests = 1;

    if (serviceIsHourly(service)) return (base + unit * qty);

    if (base > 0) {
      var variable = unit;
      if (service.perDay === 'Так') variable = unit * nights;
      else if (service.perGuest === 'Так') variable = unit * guests;
      return qty * (base + variable);
    }

    var multiplier = 1;
    if (service.perDay === 'Так') multiplier *= nights;
    if (service.perGuest === 'Так') multiplier *= guests;
    return unit * multiplier * qty;
  }

  function calculateSelectedServicesTotal(services, selectedServices, opts) {
    return (services || []).reduce(function (sum, service) {
      return sum + calculateServiceFee(service, getServiceQty(selectedServices, service.id), opts || {});
    }, 0);
  }

  function buildServiceLines(services, selectedServices, opts) {
    return (services || []).map(function (service) {
      var quantity = getServiceQty(selectedServices, service.id);
      var fee = calculateServiceFee(service, quantity, opts || {});
      var onSite = serviceIsOnSite(service);
      return {
        id: service.id,
        kind: service.kind || '',
        name: service.name,
        quantity: quantity,
        fee: fee,
        onSite: onSite,
        selected: quantity > 0
      };
    }).filter(function (line) { return line.selected; });
  }

  function formatServicePriceHint(service) {
    if (serviceIsOnSite(service)) return 'Оплата на місці';
    var price = Math.max(0, Number(service.price) || 0);
    var base = Math.max(0, Number(service.baseFee) || 0);
    var parts = [];
    if (base > 0) parts.push(base.toLocaleString('uk-UA') + ' ₴ фікс');
    if (price > 0 || base === 0) {
      var unitParts = [];
      if (serviceIsHourly(service)) unitParts.push('год');
      else {
        var perBooking = service.perBooking === 'Так' ||
          (service.perBooking !== 'Ні' && service.perDay !== 'Так' && service.perGuest !== 'Так' && !serviceIsHourly(service));
        if (perBooking && service.perDay !== 'Так' && service.perGuest !== 'Так') unitParts.push('бронь');
        if (service.perDay === 'Так') unitParts.push('ніч');
        if (service.perGuest === 'Так') unitParts.push('гість');
      }
      parts.push(price.toLocaleString('uk-UA') + ' ₴' + (unitParts.length ? ' / ' + unitParts.join(' · ') : ''));
    }
    return parts.join(' + ') || '0 ₴';
  }

  function ingestServiceTokenMatch(result, id, rawValue) {
    var value = String(rawValue || '').trim();
    if (!value || value === 'Ні' || /^ni$/i.test(value) || /^no$/i.test(value)) return;
    if (value === 'Так' || value.indexOf('Так') === 0 || /^tak$/i.test(value) || /^yes$/i.test(value)) {
      result[String(id)] = 1;
      return;
    }
    var qty = parseInt(value, 10);
    if (isFinite(qty) && qty > 0) result[String(id)] = qty;
  }

  function parseSelectedServicesFromComment(raw) {
    var result = {};
    var text = String(raw || '');
    var re1 = new RegExp(SERVICE_TOKEN.source, 'g');
    var re2 = new RegExp(SERVICE_PENDING_TOKEN.source, 'g');
    var re3 = /(?:^|[|\s\n])(?:[A-Za-z])?#(\d+)(?:⏳)?:\s*([^|\n]+)/g;
    var match;
    while ((match = re1.exec(text))) ingestServiceTokenMatch(result, match[1], match[2]);
    while ((match = re2.exec(text))) ingestServiceTokenMatch(result, match[1], match[2]);
    while ((match = re3.exec(text))) {
      if (result[match[1]]) continue; // вже з нормального токена
      ingestServiceTokenMatch(result, match[1], match[2]);
    }
    return result;
  }

  function stripServiceTokensFromComment(raw) {
    return String(raw || '')
      .replace(new RegExp(SERVICE_TOKEN.source, 'g'), '')
      .replace(new RegExp(SERVICE_PENDING_TOKEN.source, 'g'), '')
      // мангелені / без emoji: A#1001:Tak, #1002: 2
      .replace(/(?:^|[|\s\n])(?:[A-Za-z])?#\d+(?:⏳)?:\s*[^|\n]+/g, ' ')
      .replace(/\|\s*\|\s*/g, ' | ')
      .replace(/^\|\s*/, '')
      .replace(/\|\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function stripScheduleFlagsFromComment(raw) {
    return String(raw || '')
      .replace(/🕒\s*Ранній заїзд:[^|]*/g, '')
      .replace(/🕒\s*Пізній виїзд:[^|]*/g, '')
      .replace(/🇺🇦\s*УБД:\s*Так\s*(\|\s*)?/g, '')
      .replace(/\|\s*\|\s*/g, ' | ')
      .replace(/^\|\s*/, '')
      .replace(/\|\s*$/, '')
      .trim();
  }

  /** Лише видимий текст гостя — без системних токенів послуг/прапорців */
  function getGuestVisibleComment(raw) {
    var text = String(raw || '');
    if (!text || text === 'undefined' || text === 'null') return '';

    var guestMatch = text.match(/Коментар гостя:\s*([\s\S]*)/i);
    if (guestMatch) {
      text = String(guestMatch[1] || '').trim();
    } else {
      text = stripServiceTokensFromComment(text);
      text = stripLegacyServiceFlagsFromComment(text);
      text = stripScheduleFlagsFromComment(text);
    }

    // на випадок, якщо токени просочились у секцію гостя
    text = stripServiceTokensFromComment(text);
    text = stripLegacyServiceFlagsFromComment(text);
    text = stripScheduleFlagsFromComment(text);
    text = text
      .replace(/Коментар гостя:/gi, '')
      .replace(/\|?\s*\|/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!text || text === 'undefined' || text === 'null' || text === 'Немає') return '';
    // якщо лишилось лише сміття на кшталт "#1001" / "A#1001:Tak"
    if (/^(?:[A-Za-z])?#\d+(?:⏳)?:?\s*(?:Так|Tak|Ні|Ni|\d+)?$/i.test(text)) return '';
    return text;
  }

  function stripLegacyServiceFlagsFromComment(raw) {
    return String(raw || '')
      .replace(/👥\s*Денні гості:\s*\d+\s*(\|\s*)?/g, '')
      .replace(/🛏️\s*Дитяче ліжечко:\s*Так\s*(\|\s*)?/g, '')
      .replace(/♨️\s*Чан:\s*Так\s*(\|\s*)?/g, '')
      .replace(/\|\s*\|\s*/g, ' | ')
      .replace(/^\|\s*/, '')
      .replace(/\|\s*$/, '')
      .trim();
  }

  function buildServiceCommentTokens(selectedServices, servicesById) {
    return Object.keys(selectedServices || {}).filter(function (id) {
      return getServiceQty(selectedServices, id) > 0;
    }).map(function (id) {
      var qty = getServiceQty(selectedServices, id);
      return qty > 1 ? ('🛎️#' + id + ': ' + qty) : ('🛎️#' + id + ': Так');
    });
  }

  function migrateLegacyServiceSelection(services, legacy) {
    var selected = {};
    legacy = legacy || {};
    if (legacy.vat === 'Так' || legacy.hasVat === true) {
      var chan = findServiceByNameHint(services, 'chan');
      if (chan) selected[String(chan.id)] = 1;
    }
    var dayGuests = Number(legacy.dayGuests) || 0;
    if (dayGuests > 0) {
      var dg = findServiceByNameHint(services, 'dayGuests');
      if (dg) selected[String(dg.id)] = dayGuests;
    }
    if (legacy.crib === 'Так' || legacy.hasCrib === true) {
      var crib = findServiceByNameHint(services, 'crib');
      if (crib) selected[String(crib.id)] = 1;
    }
    if (legacy.pets === 'Так' || legacy.hasPets === true) {
      var pets = findServiceByNameHint(services, 'pets');
      if (pets) selected[String(pets.id)] = 1;
    }
    return selected;
  }

  function parseLegacyFlagsFromComment(raw) {
    var text = String(raw || '');
    var dayMatch = text.match(/👥\s*Денні гості:\s*(\d+)/);
    return {
      vat: text.indexOf('♨️ Чан: Так') !== -1 ? 'Так' : 'Ні',
      hasVat: text.indexOf('♨️ Чан: Так') !== -1,
      crib: text.indexOf('🛏️ Дитяче ліжечко') !== -1 ? 'Так' : 'Ні',
      hasCrib: text.indexOf('🛏️ Дитяче ліжечко') !== -1,
      dayGuests: dayMatch ? (parseInt(dayMatch[1], 10) || 0) : 0
    };
  }

  /** Злити збережений вибір: спочатку токени 🛎️, інакше legacy-прапорці */
  function resolveSelectedServices(services, comment, legacyExtras) {
    var fromTokens = parseSelectedServicesFromComment(comment);
    if (Object.keys(fromTokens).length) return fromTokens;
    var legacy = Object.assign({}, parseLegacyFlagsFromComment(comment), legacyExtras || {});
    return migrateLegacyServiceSelection(services, legacy);
  }

  function ensureDefaultCustomServices(list) {
    var arr = Array.isArray(list) ? list.slice() : [];
    var byKind = {};
    arr.forEach(function (s) {
      if (s && s.kind) byKind[s.kind] = true;
    });
    // Якщо список порожній — ставимо повний дефолт
    if (!arr.length) return DEFAULT_CUSTOM_SERVICES.map(function (s) { return Object.assign({}, s); });

    // Додаємо відсутні kind-и (не затираємо кастомні)
    DEFAULT_CUSTOM_SERVICES.forEach(function (def) {
      if (byKind[def.kind]) return;
      var existsByName = findServiceByNameHint(arr, def.kind);
      if (existsByName) {
        if (!existsByName.kind) existsByName.kind = def.kind;
        if (def.kind === 'pets' && existsByName.baseFee == null) {
          existsByName.baseFee = def.baseFee;
          if (!Number(existsByName.price)) existsByName.price = def.price;
          if (existsByName.perDay !== 'Так') existsByName.perDay = 'Так';
        }
        if (def.kind === 'chan') existsByName.onSite = true;
        if (!existsByName.inputType) existsByName.inputType = def.inputType;
        return;
      }
      arr.push(Object.assign({}, def));
    });
    return arr;
  }

  function roomsLabelForIds(roomIds, roomsList) {
    if (!roomIds || !roomIds.length) return 'Всі';
    var names = roomIds.map(function (id) {
      var room = (roomsList || []).find(function (r) { return Number(r.id) === Number(id); });
      return room ? room.name : '';
    }).filter(Boolean);
    return names.length ? names.join(', ') : 'Всі';
  }

  function syncLegacyFieldsFromSelection(services, selectedServices) {
    var petsSvc = findServiceByNameHint(services, 'pets');
    var cribSvc = findServiceByNameHint(services, 'crib');
    var chanSvc = findServiceByNameHint(services, 'chan');
    var daySvc = findServiceByNameHint(services, 'dayGuests');
    return {
      pets: petsSvc && getServiceQty(selectedServices, petsSvc.id) > 0 ? 'Так' : 'Ні',
      crib: cribSvc && getServiceQty(selectedServices, cribSvc.id) > 0 ? 'Так' : 'Ні',
      vat: chanSvc && getServiceQty(selectedServices, chanSvc.id) > 0 ? 'Так' : 'Ні',
      dayGuests: daySvc ? getServiceQty(selectedServices, daySvc.id) : 0
    };
  }

  function attributeBookingServiceFees(booking, services, nights) {
    var comment = String(booking && booking.comment || '');
    var selected = resolveSelectedServices(services, comment, {
      pets: booking && booking.pets,
      dayGuests: 0,
      crib: '',
      vat: ''
    });
    var opts = {
      nights: Math.max(1, Number(nights) || 1),
      adults: Math.max(1, parseInt(booking && booking.guests, 10) || 2),
      children: 0
    };
    var lines = buildServiceLines(services, selected, opts);
    var hasTokens = Object.keys(parseSelectedServicesFromComment(comment)).length > 0;

    var attributed = lines.map(function (l) {
      var amount = l.onSite ? 0 : l.fee;
      if (hasTokens && !l.onSite) {
        if (l.kind === 'pets' && booking && booking.petFee !== undefined && booking.petFee !== '') {
          amount = Number(booking.petFee) || amount;
        } else if (l.kind === 'crib' && booking && booking.cribFee !== undefined && booking.cribFee !== '') {
          amount = Number(booking.cribFee) || amount;
        }
      }
      return {
        id: l.id,
        kind: l.kind,
        name: l.name,
        quantity: l.quantity,
        onSite: l.onSite,
        amount: Math.round(amount)
      };
    });

    // Масштаб «інших» послуг під dayGuestFee
    var otherCalc = attributed.reduce(function (s, l) {
      if (l.onSite || l.kind === 'pets' || l.kind === 'crib') return s;
      return s + l.amount;
    }, 0);
    var storedOther = Number(booking && booking.dayGuestFee);
    if (hasTokens && isFinite(storedOther) && storedOther >= 0 && otherCalc > 0 && Math.abs(storedOther - otherCalc) > 1) {
      var ratio = storedOther / otherCalc;
      attributed = attributed.map(function (l) {
        if (l.onSite || l.kind === 'pets' || l.kind === 'crib') return l;
        return Object.assign({}, l, { amount: Math.round(l.amount * ratio) });
      });
    }

    var sumOther = attributed.reduce(function (s, l) {
      if (l.onSite || l.kind === 'pets' || l.kind === 'crib') return s;
      return s + l.amount;
    }, 0);
    var leftoverOther = 0;
    if (hasTokens && isFinite(storedOther) && storedOther > sumOther) {
      leftoverOther = Math.round(storedOther - sumOther);
    }
    return { lines: attributed, leftoverOther: leftoverOther, selected: selected };
  }

  global.BosoServices = {
    DEFAULT_CUSTOM_SERVICES: DEFAULT_CUSTOM_SERVICES,
    serviceIsOnSite: serviceIsOnSite,
    serviceIsHourly: serviceIsHourly,
    serviceInputType: serviceInputType,
    getServiceQty: getServiceQty,
    serviceAppliesToRoom: serviceAppliesToRoom,
    listServicesForRoom: listServicesForRoom,
    findServiceByKind: findServiceByKind,
    findServiceByNameHint: findServiceByNameHint,
    calculateServiceFee: calculateServiceFee,
    calculateSelectedServicesTotal: calculateSelectedServicesTotal,
    buildServiceLines: buildServiceLines,
    formatServicePriceHint: formatServicePriceHint,
    parseSelectedServicesFromComment: parseSelectedServicesFromComment,
    stripServiceTokensFromComment: stripServiceTokensFromComment,
    stripLegacyServiceFlagsFromComment: stripLegacyServiceFlagsFromComment,
    stripScheduleFlagsFromComment: stripScheduleFlagsFromComment,
    getGuestVisibleComment: getGuestVisibleComment,
    buildServiceCommentTokens: buildServiceCommentTokens,
    migrateLegacyServiceSelection: migrateLegacyServiceSelection,
    parseLegacyFlagsFromComment: parseLegacyFlagsFromComment,
    resolveSelectedServices: resolveSelectedServices,
    ensureDefaultCustomServices: ensureDefaultCustomServices,
    roomsLabelForIds: roomsLabelForIds,
    syncLegacyFieldsFromSelection: syncLegacyFieldsFromSelection,
    attributeBookingServiceFees: attributeBookingServiceFees
  };
})(typeof window !== 'undefined' ? window : this);
