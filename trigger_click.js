const fs = require('fs');
const vm = require('vm');

let raw = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\obfuscated.js', 'utf8');

// Let's hook the browser DOM and trigger the click on verify button to see where it redirects or what it loads!
let iframeSrc = '';
let fetchCalls = [];

const fakeDoc = {
  getElementById: (id) => {
    return {
      id,
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: (evt, cb) => {
        if (id === 'verify' && evt === 'click') {
          console.log("Attached click listener to #verify! Invoking it now...");
          // Invoke the verify callback!
          try {
            cb({ preventDefault: () => {}, stopPropagation: () => {} });
          } catch(e) {
            console.log("Error invoking click:", e.message);
          }
        }
      },
      setAttribute: (k, v) => {
        console.log(`[SET ATTRIBUTE on ${id}]`, k, v);
        if (id === 'verificationFrame' && k === 'src') {
          iframeSrc = v;
        }
      },
      getAttribute: (k) => '',
      value: 'TargetRobloxUser'
    };
  },
  querySelector: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (t) => ({ style: {}, classList: { add: () => {} }, setAttribute: () => {}, appendChild: () => {} }),
  body: { appendChild: () => {} },
  location: { href: 'https://bloxlink.win/verify?server=4191421542448922', search: '?server=4191421542448922' }
};

const fakeWin = {
  document: fakeDoc,
  location: fakeDoc.location,
  fetch: (url, opts) => {
    console.log(">>> [FETCH CALLED]", url, opts);
    fetchCalls.push({ url, opts });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    });
  },
  navigator: { userAgent: 'Mozilla/5.0' },
  screen: { width: 1920, height: 1080 },
  addEventListener: () => {},
  setTimeout: (fn, ms) => { fn(); return 1; },
  setInterval: () => 1,
  btoa: s => Buffer.from(s).toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString(),
  console: console
};

const ctx = vm.createContext({
  window: fakeWin,
  document: fakeDoc,
  location: fakeDoc.location,
  navigator: fakeWin.navigator,
  fetch: fakeWin.fetch,
  setTimeout: fakeWin.setTimeout,
  setInterval: fakeWin.setInterval,
  btoa: fakeWin.btoa,
  atob: fakeWin.atob,
  console: fakeWin.console
});

try {
  vm.runInContext(raw, ctx);
} catch (e) {
  console.log("VM error:", e);
}

console.log("Final captured iframeSrc:", iframeSrc);
console.log("Final captured fetchCalls:", fetchCalls);
