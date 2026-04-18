function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');

  return template
    .evaluate()
    .setTitle('ADRIATIC STEEL LEAGUE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getLastUpdated() {
  const spreadsheetId = '1H--KLRWZh2MFJ6Z134dC_foirh0DYa3TGm5WsewFs_Q';
  const file = DriveApp.getFileById(spreadsheetId);
  return file.getLastUpdated().toLocaleString('hr-HR');
}

function getDonjiZdrijeb() {
  const spreadsheetId = '1H--KLRWZh2MFJ6Z134dC_foirh0DYa3TGm5WsewFs_Q';
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName('Donji ždrijeb');
  const values = sheet.getDataRange().getDisplayValues();
  return values;
}

function getGornjiZdrijeb() {
  const spreadsheetId = '1H--KLRWZh2MFJ6Z134dC_foirh0DYa3TGm5WsewFs_Q';
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName('Gornji ždrijeb');
  const values = sheet.getDataRange().getDisplayValues();
  return values;
}

function getLeagueData() {
  const spreadsheetId = '1H--KLRWZh2MFJ6Z134dC_foirh0DYa3TGm5WsewFs_Q';
  const wantedSheets = [
    'Najbolji u ligi',
    'Grupa A Tablica',
    'Grupa B Tablica',
    'Grupa C Tablica',
    'Grupa D Tablica',
    'Grupa E Tablica',
    'Grupa F Tablica',
    'Grupa G Tablica',
    'Grupa H Tablica'
  ];


  const ss = SpreadsheetApp.openById(spreadsheetId);
  const result = [];

  wantedSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      result.push({
        name: sheetName,
        headers: [],
        rows: [],
        error: 'Sheet nije pronađen.'
      });
      return;
    }

    const values = sheet.getDataRange().getDisplayValues();

    if (!values || values.length === 0) {
      result.push({
        name: sheetName,
        headers: [],
        rows: [],
        error: 'Sheet je prazan.'
      });
      return;
    }

    result.push({
      name: sheetName,
      headers: values[0],
      rows: values.slice(1),
      error: null
    });
  });

  return result;
}