const fs = require('fs');
const vm = require('vm');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// We know the script executes s1tpCf(n) to get strings.
// Let's hook the string decoder during a full script parse or intercept `s1tpCf`
// Let's wrap the code by injecting a hook right inside the body!

// Find the position right after `FYiinY(GX3hLv={},i3ikX0_=P4Qneux(`
const p4Idx = body.indexOf('i3ikX0_=P4Qneux(');
const p4End = body.indexOf(');', p4Idx) + 2;

// Everything up to p4End defines the string table and decoder functions
const decoderCode = body.substring(0, p4End);

const testScript = decoderCode + `
;const results = [];
for (let i = 0; i < i3ikX0_.length; i++) {
  try {
    results.push({ i, s: s1tpCf(i) });
  } catch(e) {
    results.push({ i, err: e.message });
  }
}
fs.writeFileSync('C:\\\\Users\\\\gabriel\\\\.gemini\\\\antigravity\\\\scratch\\\\bloxlink2-main\\\\decoded_strings.json', JSON.stringify(results, null, 2));
console.log('Decoded ' + results.length + ' strings!');
`;

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\run_decoder.js', testScript, 'utf8');
