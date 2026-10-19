/**
 * NOC VAULT CONTROL - Google Apps Script API
 * 1) Buka Extensions > Apps Script dari spreadsheet database.
 * 2) Tempel file ini, Save.
 * 3) Deploy > New deployment > Web app.
 * 4) Execute as: Me. Akses: sesuai kebijakan organisasi.
 *
 * Untuk produksi, tambahkan autentikasi dan pembatasan akses sebelum dipakai.
 * Jangan simpan CAC/hash atau data sensitif dalam response publik.
 */
const CONFIG = {
  SPREADSHEET_ID: 'PASTE_GOOGLE_SPREADSHEET_ID_HERE',
  ALLOWED_SHEETS: [
    'SITE_MASTER','VENDOR_MASTER','SITE_REGULER_DOWN','HUB_MASTER','CAC_DATABASE',
    'RCA_DATABASE','UPDATE_TEMPLATE','LOG_SWAB_MODEM','LOG_PERGANTIAN_MODEM',
    'DAILY_CHECKLIST','EDDUCATION_ASSET','USER_ACCESS'
  ]
};

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'health';
  if (action === 'health') return output({ok:true, service:'NOC Vault Control API', timestamp:new Date().toISOString()});
  if (action === 'list') {
    const sheetName = String(e.parameter.sheet || '');
    assertSheet_(sheetName);
    const sheet = getSheet_(sheetName);
    const values = sheet.getDataRange().getDisplayValues();
    if (!values.length) return output({ok:true, sheet:sheetName, rows:[]});
    const headers = values.shift();
    const rows = values.filter(row => row.some(cell => cell !== '')).map(row => {
      const obj = {};
      headers.forEach((header,i) => obj[header || ('FIELD_'+(i+1))] = row[i] || '');
      return obj;
    });
    return output({ok:true, sheet:sheetName, rows:rows});
  }
  return output({ok:false,error:'Unknown action'});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    const sheetName = String(body.sheet || '');
    assertSheet_(sheetName);
    if (action !== 'create') throw new Error('Action not supported');
    const sheet = getSheet_(sheetName);
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
    const row = body.row || {};
    const values = headers.map(header => row[header] == null ? '' : row[header]);
    sheet.appendRow(values);
    return output({ok:true, action:'create', sheet:sheetName, rowNumber:sheet.getLastRow()});
  } catch (err) {
    return output({ok:false,error:String(err.message || err)});
  }
}

function assertSheet_(name) {
  if (!CONFIG.ALLOWED_SHEETS.includes(name)) throw new Error('Sheet is not allowed');
}
function getSheet_(name) {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.indexOf('PASTE_') === 0) {
    throw new Error('Set CONFIG.SPREADSHEET_ID first');
  }
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}
function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}