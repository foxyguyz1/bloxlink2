const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Notice: each decoder function has an RC4 / XOR / multi-layer key!
// Let's inspect the entire function s1tpCf and its caller to see the key:
const s1Idx = body.indexOf('function s1tpCf');
console.log(body.substring(s1Idx - 500, s1Idx + 1500));
