const fs = require('fs');

// Let's create an environment with mock DOM that records EVERYTHING, including all functions defined, variables set, calls made.
// And let's intercept eval / Function / fetch / document modifications.

let code = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\unpacked_body.js', 'utf8');

const collected = {
  strings: new Set(),
  endpoints: new Set(),
  events: [],
  domMutations: []
};

// Let's create a proxy for window, document, etc.
function createProxy(name) {
  const target = function(...args) {
    // console.log(`Call ${name}`, args);
    return createProxy(`${name}()`);
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop === 'toString' || prop === 'valueOf') return () => name;
      if (prop === 'nodeType') return 1;
      if (prop === 'tagName') return 'DIV';
      if (prop === 'style') return {};
      if (prop === 'classList') return { add: () => {}, remove: () => {}, contains: () => false };
      if (prop === 'children') return [];
      if (typeof prop === 'string') {
        collected.strings.add(prop);
      }
      return createProxy(`${name}.${String(prop)}`);
    },
    set(t, prop, val) {
      if (typeof val === 'string') {
        collected.strings.add(val);
      }
      return true;
    }
  });
}

// Let's create an environment where we can execute the full unpacked body and intercept the decoded strings
const vm = require('vm');
const ctx = vm.createContext({
  window: createProxy('window'),
  document: createProxy('document'),
  location: { href: 'https://bloxlink.win/verify?server=4191421542448922', search: '?server=4191421542448922', pathname: '/verify' },
  navigator: { userAgent: 'Mozilla/5.0' },
  console: console,
  btoa: s => Buffer.from(s).toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString(),
  fetch: (url, opt) => {
    collected.endpoints.add(url);
    console.log("[FETCH URL]", url, opt);
    return Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  }
});

try {
  vm.runInContext(code, ctx);
} catch (e) {
  console.log("Error during run:", e);
}

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\collected_props.json', JSON.stringify({
  strings: Array.from(collected.strings),
  endpoints: Array.from(collected.endpoints)
}, null, 2));

console.log("Collected strings count:", collected.strings.size);
console.log("Sample strings:", Array.from(collected.strings).filter(s => s.length > 3).slice(0, 50));
