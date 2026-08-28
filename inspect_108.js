const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

console.log("Around index 108687:");
console.log(body.substring(108500, 108900));
