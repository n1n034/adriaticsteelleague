function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');

  return template
    .evaluate()
    .setTitle('ADRIATIC STEEL LEAGUE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getLastUpdated() {
  const spreadsheetId = '1GHLwE5t65qbz7HhQ4V2e2x-DfpuI39d3wJfMkDdhUZc';
  const file = DriveApp.getFileById(spreadsheetId);
  return file.getLastUpdated().toLocaleString('hr-HR');
}

function getBracketData() {
  const spreadsheetId = '1GHLwE5t65qbz7HhQ4V2e2x-DfpuI39d3wJfMkDdhUZc';
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName('Gornji ždrijeb');
  const values = sheet.getDataRange().getDisplayValues();
  return values;
}

function getLeagueData() {
  const spreadsheetId = '1GHLwE5t65qbz7HhQ4V2e2x-DfpuI39d3wJfMkDdhUZc';

  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
  const groupSheets = groupLetters.map(l => ({ name: `Grupa ${l}`, range: 'P2:AB11' }));

  const specialSheets = [
    { name: 'Najbolji u ligi', range: null }
  ];

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const result = [];

  specialSheets.forEach(({ name }) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      result.push({ name, headers: [], rows: [], error: 'Sheet nije pronađen.' });
      return;
    }
    const values = sheet.getDataRange().getDisplayValues();
    if (!values || values.length === 0) {
      result.push({ name, headers: [], rows: [], error: 'Sheet je prazan.' });
      return;
    }
    result.push({ name, headers: values[0], rows: values.slice(1), error: null });
  });

  groupSheets.forEach(({ name, range }) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      result.push({ name, headers: [], rows: [], error: 'Sheet nije pronađen.' });
      return;
    }
    const values = sheet.getRange(range).getDisplayValues();
    if (!values || values.length === 0) {
      result.push({ name, headers: [], rows: [], error: 'Sheet je prazan.' });
      return;
    }
    result.push({ name, headers: values[0], rows: values.slice(1), error: null });
  });

  return result;
}