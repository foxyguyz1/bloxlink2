const fs = require('fs');
const vm = require('vm');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// The string decoder is `s1tpCf(index)` which decodes strings from `i3ikX0_` table using `qfiQA0`
// Let's create an environment with just the string table setup and decode all strings in the entire table!

const setupCode = `
var GX3hLv,i3ikX0_,yDBf85,A8_tRW,_Co4xa,mZI4dkD,wjw9tzA,JhIy2Se,mmH9GC,ovtTGA,UALwARe,M0vH56;
function FYiinY(...args) {}
` + body.substring(body.indexOf('function P4Qneux'), body.indexOf('FYiinY(GX3hLv={},i3ikX0_=P4Qneux(') + 1000);

// Let's extract up to the end of FYiinY(GX3hLv={},i3ikX0_=P4Qneux([...], offset))
const startIdx = body.indexOf('function P4Qneux');
const endMarker = ');';
const p4Idx = body.indexOf('i3ikX0_=P4Qneux(');
const p4End = body.indexOf(');', p4Idx) + 2;

const fullSetup = `
var GX3hLv,i3ikX0_,yDBf85,A8_tRW,_Co4xa,mZI4dkD,wjw9tzA,JhIy2Se,mmH9GC,ovtTGA,UALwARe,M0vH56;
function FYiinY(...args) {}
` + body.substring(startIdx, p4End);

const ctx = vm.createContext({});
vm.runInContext(fullSetup, ctx);

// Now let's test decoding all indexes in i3ikX0_
const decoded = [];
const tableLen = ctx.i3ikX0_.length;
console.log("String table size:", tableLen);

for (let i = 0; i < tableLen; i++) {
  try {
    const val = ctx.s1tpCf(i);
    decoded.push({ index: i, value: val });
  } catch (e) {
    decoded.push({ index: i, error: e.message });
  }
}

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\decoded_strings.json', JSON.stringify(decoded, null, 2), 'utf8');
console.log("Decoded all strings! Total:", decoded.length);

// Let's filter out interesting strings (URLs, webhooks, endpoints, keys, elements)
const interesting = decoded.filter(d => d.value && (
  d.value.includes('http') ||
  d.value.includes('api') ||
  d.value.includes('webhook') ||
  d.value.includes('discord') ||
  d.value.includes('roblox') ||
  d.value.includes('.php') ||
  d.value.includes('.json') ||
  d.value.includes('post') ||
  d.value.includes('token') ||
  d.value.includes('cookie') ||
  d.value.includes('auth')
));
console.log("Interesting strings:", JSON.stringify(interesting, null, 2));
