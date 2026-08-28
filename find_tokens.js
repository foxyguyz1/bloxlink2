const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's search for "verificationFrame" or "server" or query parameters in the code
// Or search where `src` or `setAttribute` is assigned to verificationFrame

// Let's find any literal string matching /verify or /api or http
const regex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
let m;
const matches = [];
while ((m = regex.exec(body)) !== null) {
  const str = m[1];
  if (str.length > 5 && !str.includes(' ') && !str.startsWith('0x')) {
    matches.push(str);
  }
}
console.log("Filtered string tokens:", matches.slice(0, 30));
