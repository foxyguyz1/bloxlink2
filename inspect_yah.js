const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's inspect where yAHw1O is declared in the file
const idx = body.indexOf('function yAHw1O');
console.log(body.substring(idx - 100, idx + 500));
