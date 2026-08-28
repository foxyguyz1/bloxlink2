const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's find all string literals in the file that match base64 or encoded characters
const strMatches = body.match(/"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g) || [];
console.log("Total string literals in code:", strMatches.length);

// Let's filter out strings longer than 10 characters
const longStrs = strMatches.map(s => {
  try { return JSON.parse(s); } catch(e) { return s.slice(1, -1); }
}).filter(s => s.length > 8);

console.log("Sample long strings in script:");
console.log(longStrs.slice(0, 40));
