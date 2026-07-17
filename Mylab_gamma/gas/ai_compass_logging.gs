const SHEET_NAME = 'ai_compass_logs';

function doPost(e) {
  const sheet = getLogSheet_();
  const payload = parsePayload_(e);
  sheet.appendRow([
    new Date(),
    payload.event_type || '',
    payload.site_id || '',
    payload.log_id || '',
    payload.timestamp || '',
    payload.page_url || '',
    payload.input_text || '',
    payload.extracted_tags || '',
    payload.unknown_terms || '',
    payload.displayed_labs || '',
    payload.clicked_lab || '',
    payload.feedback || '',
    payload.user_agent || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, app: 'My Lab AI Compass logging' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  try {
    return JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return {};
  }
}

function getLogSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'received_at',
      'event_type',
      'site_id',
      'log_id',
      'timestamp',
      'page_url',
      'input_text',
      'extracted_tags',
      'unknown_terms',
      'displayed_labs',
      'clicked_lab',
      'feedback',
      'user_agent'
    ]);
  }
  return sheet;
}
