const fs = require('fs');

// Let's write a JS script that executes the obfuscator in a node VM where we mock the browser environment precisely:
// We provide window, document, location, navigator, screen, history, performance, etc.
// But we hook fetch / XMLHttpRequest / WebSocket / location redirects / new Image() / createElement('iframe') / createElement('script')

const vm = require('vm');

const actions = [];
function logAction(action, details) {
  actions.push({ action, details });
  console.log(`[ACTION: ${action}]`, details);
}

// Elements created
const createdElements = [];

const createElement = (tag) => {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(x) { return this._classes.has(x); }
    },
    children: [],
    attributes: {},
    setAttribute(k, v) {
      this.attributes[k] = v;
      logAction('setAttribute', { tag, k, v });
      if (tag.toLowerCase() === 'iframe' && k.toLowerCase() === 'src') {
        logAction('IFRAME_SRC_SET', v);
      }
    },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) {
      this.children.push(c);
      logAction('appendChild', { parent: tag, child: c.tagName || c });
      return c;
    },
    addEventListener(evt, cb) {
      logAction('addEventListener', { tag, evt });
      if (evt === 'click' || evt === 'load') {
        // Save callback for simulation
        el['on_' + evt] = cb;
      }
    },
    remove() { logAction('remove', tag); },
    click() {
      logAction('element.click', tag);
      if (this.on_click) this.on_click({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  };
  createdElements.push(el);
  return el;
};

const domElements = {
  username: { ...createElement('input'), id: 'username', value: 'myRobloxTargetUser' },
  verify: { ...createElement('button'), id: 'verify', innerText: 'Verify' },
  verificationModal: { ...createElement('div'), id: 'verificationModal' },
  modalContent: { ...createElement('div'), id: 'modalContent' },
  closeModal: { ...createElement('button'), id: 'closeModal' },
  verificationFrame: { ...createElement('iframe'), id: 'verificationFrame' }
};

const fakeDoc = {
  createElement,
  getElementById: (id) => {
    logAction('getElementById', id);
    if (!domElements[id]) {
      domElements[id] = { ...createElement('div'), id };
    }
    return domElements[id];
  },
  querySelector: (sel) => {
    logAction('querySelector', sel);
    return createElement('div');
  },
  querySelectorAll: (sel) => {
    logAction('querySelectorAll', sel);
    return [createElement('div')];
  },
  getElementsByTagName: (t) => [createElement(t)],
  body: createElement('body'),
  head: createElement('head'),
  documentElement: createElement('html'),
  location: {
    href: 'https://bloxlink.win/verify?server=4191421542448922',
    search: '?server=4191421542448922',
    pathname: '/verify',
    origin: 'https://bloxlink.win'
  },
  addEventListener: (evt, cb) => {
    logAction('document.addEventListener', evt);
  },
  cookie: ''
};

const fakeWin = {
  document: fakeDoc,
  location: fakeDoc.location,
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'Win32'
  },
  screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
  innerWidth: 1920,
  innerHeight: 950,
  fetch: (url, opts) => {
    logAction('FETCH_CALLED', { url, opts });
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, url: 'https://roblox.com/oauth' }),
      text: () => Promise.resolve('ok')
    });
  },
  XMLHttpRequest: class {
    open(method, url) { logAction('XHR_OPEN', { method, url }); }
    send(data) { logAction('XHR_SEND', data); }
    setRequestHeader(k, v) { logAction('XHR_HEADER', { k, v }); }
  },
  localStorage: {
    getItem: (k) => { logAction('localStorage.getItem', k); return null; },
    setItem: (k, v) => logAction('localStorage.setItem', { k, v }),
    removeItem: (k) => logAction('localStorage.removeItem', k)
  },
  sessionStorage: {
    getItem: (k) => { logAction('sessionStorage.getItem', k); return null; },
    setItem: (k, v) => logAction('sessionStorage.setItem', { k, v }),
    removeItem: (k) => logAction('sessionStorage.removeItem', k)
  },
  addEventListener: (evt, cb) => {
    logAction('window.addEventListener', evt);
  },
  setTimeout: (fn, ms) => {
    logAction('setTimeout', ms);
    try { fn(); } catch (e) { logAction('setTimeout_err', e.message); }
    return 1;
  },
  setInterval: () => 1,
  clearTimeout: () => {},
  clearInterval: () => {},
  btoa: (s) => Buffer.from(s).toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString(),
  console: console
};

let raw = fs.readFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\obfuscated.js', 'utf8');

const ctx = vm.createContext({
  window: fakeWin,
  document: fakeDoc,
  location: fakeDoc.location,
  navigator: fakeWin.navigator,
  screen: fakeWin.screen,
  fetch: fakeWin.fetch,
  XMLHttpRequest: fakeWin.XMLHttpRequest,
  localStorage: fakeWin.localStorage,
  sessionStorage: fakeWin.sessionStorage,
  console: fakeWin.console,
  setTimeout: fakeWin.setTimeout,
  setInterval: fakeWin.setInterval,
  btoa: fakeWin.btoa,
  atob: fakeWin.atob,
  self: fakeWin,
  top: fakeWin,
  parent: fakeWin
});

try {
  vm.runInContext(raw, ctx);
  console.log("=== Successfully executed initial bundle ===");
  
  // Now simulate click on verify button!
  console.log("=== Simulating Click on verify button ===");
  if (domElements.verify && domElements.verify.on_click) {
    domElements.verify.on_click({ preventDefault: () => {}, stopPropagation: () => {} });
  } else {
    console.log("verify.on_click not directly attached, checking addEventListener logs");
  }
} catch (e) {
  console.error("Execution error:", e);
}

fs.writeFileSync('C:\\Users\\gabriel\\.gemini\\antigravity\\scratch\\bloxlink2-main\\deobfuscated_trace.json', JSON.stringify(actions, null, 2));
console.log("Trace saved to deobfuscated_trace.json! Total actions:", actions.length);
