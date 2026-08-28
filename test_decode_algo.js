const fs = require('fs');

let body = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

// Let's hook the generator switch-case state machines inside the script!
// In obfuscator.io with control-flow flattening:
// Each function has a `while(true) switch(state)` or generator `function*`.
// Let's extract the string table decoding algorithm directly!

// Look at function qfiQA0:
// qfiQA0 decodes base85/custom alphabet string!
// Alphabet: 4hB&()$wA^CxgS_Q+%~n}`D{k]l*jR"@[E,G|#HFMLi.:9mo;T/?I=><UJ7r!KWVNXZO083YapPyb1q2tzedfuscv56

const alphabet = '4hB&()$wA^CxgS_Q+%~n}`D{k]l*jR"@[E,G|#HFMLi.:9mo;T/?I=><UJ7r!KWVNXZO083YapPyb1q2tzedfuscv56';

function decodeCustom(str) {
  if (!str) return '';
  const len = str.length;
  const out = [];
  let num = 0;
  let bits = 0;
  let acc = -1;
  
  for (let i = 0; i < len; i++) {
    const idx = alphabet.indexOf(str[i]);
    if (idx === -1) continue;
    
    if (acc < 0) {
      acc = idx;
    } else {
      acc += idx * 91; // 0x5b = 91
      num |= acc << bits;
      bits += (acc & 8191) > 88 ? 13 : 14; // 0x1fff = 8191, 0x58 = 88, 0xd = 13, 0xe = 14
      do {
        out.push(num & 255); // 0xff = 255
        num >>= 8;
        bits -= 8;
      } while (bits > 7);
      acc = -1;
    }
  }
  if (acc > -1) {
    out.push((num | (acc << bits)) & 255);
  }
  return Buffer.from(out).toString('utf-8');
}

// Let's test decodeCustom on the strings extracted earlier!
const testStrings = [
  '_Sf,4N6rF?',
  'eOg.[sV',
  '|L>Kx!LAD/jIwcK~',
  'AmqyU',
  '>L$.^s]DfDknR$',
  '((f`Pyh[(kyj8s6~',
  '_m0JW65_*kscx#?~',
  'IT*N@wi9<kCv_H`G.%',
  'gLyhHQNd',
  'a$b/FGCkIS_2Pl0k84',
  '#>kT2PzSvS_KE+!">XL>(a|kP}]at|;lsrK@CJFw]},;OevD6x*[g',
  'MR>Ie8FJ"rnejr)niW^?WPikZgqP>HZ|8#d=r3OSRZ&y]|@%8im<%Hv0(',
  'A[T>LK9yLX!T{e9n?@<p]qt$V!%8lTX%w>i?kobmr}ith)'
];

testStrings.forEach(s => {
  try {
    console.log(s, "===>", JSON.stringify(decodeCustom(s)));
  } catch(e) {
    console.log(s, "===> ERROR:", e.message);
  }
});
