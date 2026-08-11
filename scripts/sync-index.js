const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'index.html');
const dest = path.join(__dirname, '..', 'functions', 'public', 'index.html');

fs.copyFileSync(src, dest);
console.log('Synced index.html -> functions/public/index.html');
