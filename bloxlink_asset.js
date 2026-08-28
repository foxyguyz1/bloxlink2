window.addEventListener('load', () => {

  const verify = document.getElementById('verify');
  const username = document.getElementById('username');
  
  verify.addEventListener('click', () => {

    verify.disabled = true;
    username.disabled = true;

    verify.classList.add('opacity-60', 'cursor-not-allowed');
    username.classList.add('opacity-60', 'cursor-not-allowed');

  /**
   * run shit here: or just make a function else where and call it
   * eg run()
   * 
   * function run() {
   * console.log("ok")}
   */

      console.log("Jew")

  });

});


/**
 * ignore, logic for /prices
 */

window.addEventListener('load', () => {

  const c = document.querySelector('.flex.flex-col.gap-8');
  if (!c) return;

  const b = c.querySelectorAll('button[variant]');
  const p = c.querySelectorAll('.relative.bg-secondary-background');

  const prices = {
    m: { b: 5.99, p: 9.99, s: '/month' },
    y: { b: 59.99, p: 99.99, s: '/year' },
    l: { b: 99.99, p: 149.99, s: '/lifetime' }
  };

  const yeupdate = mode => {

    p.forEach(x => {
      const n = x.querySelector('p.text-3xl')?.textContent.trim().toLowerCase();
      const v = x.querySelector('.text-5xl');
      const thisone = x.querySelector('p[class*="text-"][class*="10px"]');
      if (!n || !v || !thisone) return;
      if (n.includes('basic premium')) {
        v.textContent = `$${prices[mode].b.toFixed(2)}`;
        thisone.textContent = prices[mode].s;
      } else if (n.includes('bloxlink pro')) {
        v.textContent = `$${prices[mode].p.toFixed(2)}`;
        thisone.textContent = prices[mode].s;
      }
    });

  };

  b.forEach(runner => {

    runner.addEventListener('click', () => {
      b.forEach(z => {
        z.classList.remove('bg-indigo-600','hover:bg-indigo-700','text-white');
        z.classList.add('bg-secondary-background','hover:bg-secondary-background/60','text-white');
      });
      runner.classList.add('bg-indigo-600','hover:bg-indigo-700','text-white');
      runner.classList.remove('bg-secondary-background','hover:bg-secondary-background/60');
      const t = runner.textContent.toLowerCase();
      yeupdate(t.includes('year') ? 'y' : t.includes('life') ? 'l' : 'm');

    });

  });

});
