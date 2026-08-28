const fs = require('fs');
let body = fs.readFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\unpacked_body.js', 'utf8');

// Let's see what happens after HokjZtC declaration
const idx = body.indexOf('FYiinY(');
console.log(body.substring(idx, idx + 1500));
