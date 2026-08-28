const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's find all functions that call A8_tRW, ovtTGA, etc.
const regex = /function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{[^}]*return\s+([a-zA-Z0-9_$]+)\[[a-zA-Z0-9_$]+\]\s*=\s*([a-zA-Z0-9_$]+)\([a-zA-Z0-9_$]+\[/g;
let m;
const decoders = [];
while ((m = regex.exec(body)) !== null) {
  decoders.push({ fn: m[1], target: m[3] });
}
console.log("Decoder mappings:", decoders);
