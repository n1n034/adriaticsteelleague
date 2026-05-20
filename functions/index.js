const functions = require('firebase-functions');
const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1GHLwE5t65qbz7HhQ4V2e2x-DfpuI39d3wJfMkDdhUZc';

function setCORS(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });
}

exports.getLeagueData = functions.https.onRequest(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const result = [];
    const rangesToFetch = [
      'Najbolji u ligi',
      ...groupLetters.map(letter => `Grupa ${letter}!Q2:AB11`)
    ];
    let valueRanges = [];
    try {
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: rangesToFetch,
        valueRenderOption: 'FORMATTED_VALUE'
      });
      valueRanges = response.data.valueRanges || [];
    } catch (e) {
      res.status(500).json({ error: "BatchGet greška: " + e.message });
      return;
    }
    const specialData = valueRanges[0];
    const specialValues = specialData && specialData.values ? specialData.values : [];
    
    if (specialValues.length === 0) {
      result.push({ name: 'Najbolji u ligi', headers: [], rows: [], error: 'Sheet je prazan ili ne postoji.' });
    } else {
      result.push({ name: 'Najbolji u ligi', headers: specialValues[0], rows: specialValues.slice(1), error: null });
    }
    groupLetters.forEach((letter, index) => {
      const sheetName = `Grupa ${letter}`;
      const groupData = valueRanges[index + 1]; // +1 jer je na indeksu 0 'Najbolji u ligi'
      const values = groupData && groupData.values ? groupData.values : [];

      if (values.length === 0) {
        result.push({ name: sheetName, headers: [], rows: [], error: 'Sheet je prazan ili ne postoji.' });
      } else {
        result.push({ name: sheetName, headers: values[0], rows: values.slice(1), error: null });
      }
    });
    res.json(result);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

exports.getBracketData = functions.https.onRequest(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gornji ždrijeb',
    });
    res.json(response.data.values || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

exports.getDonjiBracketData = functions.https.onRequest(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Donji ždrijeb',
    });
    res.json(response.data.values || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

exports.getLastUpdated = functions.https.onRequest(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  try {
    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.get({
      fileId: SPREADSHEET_ID,
      fields: 'modifiedTime'
    });
    const date = new Date(response.data.modifiedTime);
    res.json({ time: date.toLocaleString('hr-HR', { timeZone: 'Europe/Zagreb' }) });
  } catch (e) {
    res.json({ time: new Date().toLocaleString('hr-HR', { timeZone: 'Europe/Zagreb' }) });
  }
});