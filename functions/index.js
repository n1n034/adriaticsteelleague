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

  const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const result = [];

    // Najbolji u ligi - čita cijeli sheet
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Najbolji u ligi',
      });
      const values = response.data.values || [];
      result.push({ name: 'Najbolji u ligi', headers: values[0] || [], rows: values.slice(1), error: null });
    } catch (e) {
      result.push({ name: 'Najbolji u ligi', headers: [], rows: [], error: e.message });
    }

    // Grupe A–P, raspon O2:AA10
    for (const letter of groupLetters) {
      const sheetName = `Grupa ${letter}`;
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!Q2:AB11`,
        });
        const values = response.data.values || [];
        result.push({ name: sheetName, headers: values[0] || [], rows: values.slice(1), error: null });
      } catch (e) {
        result.push({ name: sheetName, headers: [], rows: [], error: e.message });
      }
    }

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