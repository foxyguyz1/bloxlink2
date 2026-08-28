const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Notice: SWLYcEk is the UTF-8 from char codes converter!
const swIdx = body.indexOf('function SWLYcEk');
console.log(body.substring(swIdx, swIdx + 400));
