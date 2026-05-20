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

const { google } = require('googleapis');

async function getLeagueData(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1GHLwE5t65qbz7HhQ4V2e2x-DfpuI39d3wJfMkDdhUZc';
  const result = [];
  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
  const rangesToFetch = [
    'Najbolji u ligi', 
    ...groupLetters.map(l => `Grupa ${l}!P2:AB11`)
  ];

  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId,
      ranges: rangesToFetch,
      valueRenderOption: 'FORMATTED_VALUE'
    });

    const valueRanges = response.data.valueRanges;
    const specialData = valueRanges[0];
    const specialValues = specialData && specialData.values ? specialData.values : [];
    
    if (specialValues.length === 0) {
      result.push({ name: 'Najbolji u ligi', headers: [], rows: [], error: 'Sheet je prazan.' });
    } else {
      result.push({ name: 'Najbolji u ligi', headers: specialValues[0], rows: specialValues.slice(1), error: null });
    }
    groupLetters.forEach((l, index) => {
      const name = `Grupa ${l}`;
      const groupData = valueRanges[index + 1]; 
      const values = groupData && groupData.values ? groupData.values : [];

      if (values.length === 0) {
        result.push({ name, headers: [], rows: [], error: 'Sheet je prazan.' });
        return;
      }

      result.push({ 
        name, 
        headers: values[0], 
        rows: values.slice(1), 
        error: null 
      });
    });

  } catch (error) {
    console.error('Greška u getLeagueData:', error);
  }
  return result;
}

