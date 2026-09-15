/**
 * טבלת לקוחות – Google Apps Script
 * מקבל שם וטלפון מהטופס באתר ומוסיף שורה לגיליון "לקוחות".
 * הוראות התקנה: google-apps-script/README.md
 */

const SHEET_NAME = 'לקוחות';
const HEADERS = ['תאריך הרשמה', 'שם מלא', 'טלפון', 'מקור'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const params = (e && e.parameter) || {};

    // שדה מלכודת לבוטים – משתמש אמיתי לא ממלא אותו
    if (params.website) return json({ ok: true });

    const name = String(params.name || '').trim().slice(0, 80);
    const phone = normalizePhone(params.phone);

    if (name.length < 2) return json({ ok: false, error: 'invalid_name' });
    if (!phone) return json({ ok: false, error: 'invalid_phone' });

    const sheet = getSheet();
    const phones = sheet.getLastRow() > 1
      ? sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getDisplayValues().flat()
      : [];

    const existingIndex = phones.indexOf(phone);
    if (existingIndex !== -1) {
      // לקוח קיים – מעדכנים שם ותאריך במקום ליצור כפילות
      const row = existingIndex + 2;
      sheet.getRange(row, 1, 1, 2).setValues([[new Date(), name]]);
      return json({ ok: true, updated: true });
    }

    sheet.appendRow([new Date(), name, phone, String(params.source || 'אתר').slice(0, 40)]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, status: 'ready' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // בגיליון חדש משתמשים בלשונית הריקה הראשונה במקום להוסיף עוד אחת
    const first = ss.getSheets()[0];
    sheet = first.getLastRow() === 0 ? first.setName(SHEET_NAME) : ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#b55f3c')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
    sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
    sheet.getRange('C:C').setNumberFormat('@'); // טלפון כטקסט כדי לשמור על ה-0 בהתחלה
    sheet.setColumnWidths(1, HEADERS.length, 160);
  }

  return sheet;
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('972')) digits = '0' + digits.slice(3);
  return /^0(5\d|7\d|[2-489])\d{7}$/.test(digits) ? digits : '';
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
