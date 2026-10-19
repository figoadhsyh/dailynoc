
/**
 * NOC VAULT CONTROL API
 * Mendukung health, sheets, list, create, update, checklist.
 *
 * GET:
 *   ?action=health
 *   ?action=sheets
 *   ?action=list&sheet=SITE_MASTER&limit=100&offset=0&search=
 *
 * POST:
 *   {"action":"create","sheet":"LOG_SWAB_MODEM","row":{...},"secret":"..."}
 *   {"action":"update","sheet":"DAILY_CHECKLIST","idColumn":"ID",
 *    "idValue":"...","row":{...},"secret":"..."}
 *
 * Jangan menaruh secret API di kode frontend publik.
 */

const CONFIG = {
  SPREADSHEET_ID: '1F0E0rxqc8pIxuzytDdBeeoEAaLzkuWo0krlG9r9uxPY',
  HEADER_ROW: 1,
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500,

  SENSITIVE_SHEETS: [
    'CAC_DATABASE',
    'USER_ACCESS'
  ],

  WRITE_ALLOWED_SHEETS: [
    'UPDATE_TEMPLATE',
    'LOG_SWAB_MODEM',
    'LOG_PERGANTIAN_MODEM',
    'DAILY_CHECKLIST',
    'CHECKLIST_HARIAN',
    'RCA_DATABASE',
    'SITE_MASTER',
    'SITE_REGULER_DOWN',
    'HUB_MASTER',
    'VENDOR_MASTER',
    'EDDUCATION_ASSET',
    'MATERI_EDUKASI'
  ]
};

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'health').toLowerCase();

    if (action === 'health') {
      return json({
        ok: true,
        service: 'NOC VAULT CONTROL API',
        version: '1.0'
      });
    }

    if (action === 'sheets') {
      const sheets = getSpreadsheet().getSheets()
        .map(s => s.getName())
        .filter(name => !isSensitive(name));

      return json({ ok: true, sheets });
    }

    if (action === 'list') {
      return json(listRows(p));
    }

    return json({
      ok: false,
      error: 'Action tidak dikenal.'
    });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(
      e && e.postData && e.postData.contents
        ? e.postData.contents
        : '{}'
    );

    const action = String(body.action || '').toLowerCase();

    if (action === 'health') {
      return json({ ok: true, service: 'NOC VAULT CONTROL API' });
    }

    verifySecret(body.secret);

    if (action === 'list') {
      return json(listRows(body));
    }

    if (action === 'create') {
      return json(createRow(body.sheet, body.row || {}));
    }

    if (action === 'update' || action === 'checklist') {
      if (body.idValue !== undefined && body.idValue !== '') {
        return json(updateRow(body));
      }

      if (action === 'checklist') {
        return json(createRow(
          body.sheet || 'DAILY_CHECKLIST',
          body.row || {}
        ));
      }

      throw new Error('idValue wajib diisi untuk update.');
    }

    return json({
      ok: false,
      error: 'Action tidak dikenal.'
    });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  }
}

function getSpreadsheet() {
  const id = PropertiesService.getScriptProperties()
    .getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;

  return SpreadsheetApp.openById(id);
}

function getSheet(name) {
  if (!name) throw new Error('Nama sheet wajib diisi.');

  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);

  return sheet;
}

function getHeaders(sheet) {
  if (sheet.getLastColumn() < 1) return [];

  return sheet
    .getRange(CONFIG.HEADER_ROW, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(h => String(h || '').trim());
}

function isSensitive(name) {
  return CONFIG.SENSITIVE_SHEETS.indexOf(
    String(name || '').trim().toUpperCase()
  ) !== -1;
}

function verifySecret(secret) {
  const expected = PropertiesService.getScriptProperties()
    .getProperty('NOC_API_SECRET');

  if (!expected) {
    throw new Error('NOC_API_SECRET belum disetel di Script Properties.');
  }

  if (!secret || String(secret) !== expected) {
    throw new Error('Unauthorized: secret API tidak valid.');
  }
}

function listRows(options) {
  const name = String(options.sheet || '').trim();

  if (!name) throw new Error('Parameter sheet wajib diisi.');
  if (isSensitive(name)) {
    throw new Error('Akses ke sheet sensitif ditolak.');
  }

  const sheet = getSheet(name);
  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow <= CONFIG.HEADER_ROW) {
    return {
      ok: true, sheet: name, headers, rows: [],
      total: 0, limit: 0, offset: 0
    };
  }

  const values = sheet.getRange(
    CONFIG.HEADER_ROW + 1,
    1,
    lastRow - CONFIG.HEADER_ROW,
    headers.length
  ).getValues();

  const search = String(options.search || '').toLowerCase().trim();
  const searchColumn = String(options.searchColumn || '').trim();

  let rows = values.map((valuesRow, i) => {
    const obj = {};

    headers.forEach((header, col) => {
      if (header) {
        const value = valuesRow[col];
        obj[header] = value instanceof Date
          ? Utilities.formatDate(
              value,
              Session.getScriptTimeZone(),
              "yyyy-MM-dd'T'HH:mm:ss"
            )
          : value;
      }
    });

    obj.__rowNumber = CONFIG.HEADER_ROW + 1 + i;
    return obj;
  });

  if (search) {
    rows = rows.filter(row => {
      if (searchColumn && headers.indexOf(searchColumn) !== -1) {
        return String(row[searchColumn] || '')
          .toLowerCase().includes(search);
      }

      return headers.some(header =>
        header &&
        String(row[header] == null ? '' : row[header])
          .toLowerCase().includes(search)
      );
    });
  }

  const total = rows.length;
  const limit = Math.max(1, Math.min(
    parseInt(options.limit, 10) || CONFIG.DEFAULT_LIMIT,
    CONFIG.MAX_LIMIT
  ));
  const offset = Math.max(0, parseInt(options.offset, 10) || 0);

  return {
    ok: true,
    sheet: name,
    headers,
    rows: rows.slice(offset, offset + limit),
    total,
    limit,
    offset
  };
}

function createRow(sheetName, row) {
  validateWritableSheet(sheetName);

  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error('row harus berupa object.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet = getSheet(sheetName);
    const headers = getHeaders(sheet);

    if (!headers.length) {
      throw new Error('Header sheet kosong.');
    }

    const values = headers.map(header => {
      if (!header) return '';
      return Object.prototype.hasOwnProperty.call(row, header)
        ? safeValue(row[header])
        : '';
    });

    // Isi metadata hanya jika kolomnya memang tersedia.
    setIfPresent(headers, values, '_record_id', Utilities.getUuid());
    setIfPresent(headers, values, '_updated_at', new Date());
    setIfPresent(headers, values, '_version', 1);

    sheet.appendRow(values);

    return {
      ok: true,
      action: 'create',
      sheet: sheetName,
      rowNumber: sheet.getLastRow(),
      message: 'Data berhasil ditambahkan.'
    };
  } finally {
    lock.releaseLock();
  }
}

function updateRow(body) {
  const name = String(body.sheet || '').trim();
  validateWritableSheet(name);

  const idColumn = String(body.idColumn || '').trim();
  const idValue = String(body.idValue == null ? '' : body.idValue);
  const patch = body.row || {};

  if (!idColumn || !idValue) {
    throw new Error('idColumn dan idValue wajib diisi.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet = getSheet(name);
    const headers = getHeaders(sheet);
    const idIndex = headers.indexOf(idColumn);

    if (idIndex === -1) {
      throw new Error('Kolom ID tidak ditemukan: ' + idColumn);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= CONFIG.HEADER_ROW) {
      throw new Error('Data belum tersedia.');
    }

    const ids = sheet.getRange(
      CONFIG.HEADER_ROW + 1,
      idIndex + 1,
      lastRow - CONFIG.HEADER_ROW,
      1
    ).getDisplayValues();

    let targetRow = -1;

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === idValue.trim()) {
        targetRow = CONFIG.HEADER_ROW + 1 + i;
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error('Data dengan ID tersebut tidak ditemukan.');
    }

    Object.keys(patch).forEach(key => {
      const col = headers.indexOf(key);

      // Kolom yang tidak dikenal diabaikan.
      // Kolom ID tidak dapat diubah melalui patch.
      if (col >= 0 && key !== idColumn) {
        sheet.getRange(targetRow, col + 1)
          .setValue(safeValue(patch[key]));
      }
    });

    const updatedAt = headers.indexOf('_updated_at');
    if (updatedAt >= 0) {
      sheet.getRange(targetRow, updatedAt + 1).setValue(new Date());
    }

    const version = headers.indexOf('_version');
    if (version >= 0) {
      const cell = sheet.getRange(targetRow, version + 1);
      cell.setValue((Number(cell.getValue()) || 0) + 1);
    }

    return {
      ok: true,
      action: 'update',
      sheet: name,
      rowNumber: targetRow,
      message: 'Data berhasil diperbarui.'
    };
  } finally {
    lock.releaseLock();
  }
}

function validateWritableSheet(name) {
  if (isSensitive(name)) {
    throw new Error('Sheet sensitif tidak boleh ditulis melalui API.');
  }

  if (CONFIG.WRITE_ALLOWED_SHEETS.indexOf(name) === -1) {
    throw new Error('Sheet ini tidak diizinkan untuk ditulis: ' + name);
  }

  getSheet(name);
}

function setIfPresent(headers, values, header, value) {
  const index = headers.indexOf(header);

  if (index >= 0 && (values[index] === '' || values[index] == null)) {
    values[index] = value;
  }
}

function safeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }

  // Cegah input teks menjadi formula spreadsheet.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return "'" + value;
  }

  return value;
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan manual untuk mengecek koneksi spreadsheet. */
function testConnection() {
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log('Sheets: ' + ss.getSheets().map(s => s.getName()).join(', '));
}

/** Jalankan sekali untuk menyiapkan Script Properties. */
function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();

  props.setProperty('SPREADSHEET_ID', CONFIG.SPREADSHEET_ID);

  if (!props.getProperty('NOC_API_SECRET')) {
    props.setProperty(
      'NOC_API_SECRET',
      Utilities.getUuid() + Utilities.getUuid()
    );
  }

  Logger.log('Properti berhasil disiapkan.');
  Logger.log('Lihat Project Settings > Script Properties untuk secret.');
}
