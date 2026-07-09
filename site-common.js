/* site-common.js — Shared layout (navbar, social, footer) + page helpers */
(() => {
  /* --- Page reveal: body stays opacity:0 until content + assets are ready --- */
  let _loadFired = false, _contentReady = false;
  window.addEventListener('load', () => { _loadFired = true; _tryReveal(); });

  function _tryReveal() {
    if (!_loadFired || !_contentReady) return;
    requestAnimationFrame(() => document.body.classList.add('loaded'));
  }

  /** Pages call this after their fetch-driven content has rendered. */
  window.pageReady = () => { _contentReady = true; _tryReveal(); };

  /* Safety net — reveal after 4s even if pageReady() was never called */
  setTimeout(() => { _contentReady = true; _tryReveal(); }, 4000);

  /* --- Font Awesome (injected so pages don't need the <link>) --- */
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  fa.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
  fa.crossOrigin = 'anonymous';
  fa.referrerPolicy = 'no-referrer';
  document.head.appendChild(fa);

  /* --- Helpers (global for page scripts) --- */

  /** Parse KEY: VALUE text files. arrayKeys collects duplicate keys into arrays. */
  window.parseSettings = (text, arrayKeys) => {
    const arrSet = new Set((arrayKeys || []).map(k => k.toUpperCase()));
    const d = {};
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.charCodeAt(0) === 35 /* # */ || t.charCodeAt(0) === 61 /* = */ || t.charCodeAt(0) === 45 /* - */) continue;
      const i = t.indexOf(':');
      if (i === -1) continue;
      const k = t.substring(0, i).trim().toUpperCase(), v = t.substring(i + 1).trim();
      if (!k) continue;
      arrSet.has(k) ? (d[k] = d[k] || []).push(v) : d[k] = v;
    }
    return d;
  };

  /** Fetch + parse a settings file. */
  window.fetchSettings = (path, arrayKeys) =>
    fetch(path).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
               .then(t => parseSettings(t, arrayKeys));

  /** Parse TITLE/INTRO/OUTRO/SECTION/ITEM structured files (contract, payment). */
  window.parseSections = text => {
    const d = { title: '', intro: '', outro: '', sections: [] };
    let cur = null;
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.charCodeAt(0) === 35 || t.charCodeAt(0) === 45) continue;
      if (t.startsWith('TITLE:'))        d.title = t.substring(6).trim();
      else if (t.startsWith('INTRO:'))   d.intro = t.substring(6).trim();
      else if (t.startsWith('OUTRO:'))   d.outro = t.substring(6).trim();
      else if (t.startsWith('SECTION:')) { cur = { title: t.substring(8).trim(), items: [] }; d.sections.push(cur); }
      else if (t.startsWith('ITEM:') && cur) cur.items.push(t.substring(5).trim());
    }
    return d;
  };

  /** Render parsed sections into a terms-style layout (uses DocumentFragment). */
  window.renderSections = (data, containerId, opts) => {
    opts = opts || {};
    const el = id => document.getElementById(id);
    if (opts.titleId && data.title) el(opts.titleId).textContent = data.title;
    if (opts.outroId && data.outro) el(opts.outroId).textContent = data.outro;
    const c = el(containerId);
    const frag = document.createDocumentFragment();
    if (data.intro) {
      const p = document.createElement('p'); p.className = 'terms__intro'; p.textContent = data.intro;
      frag.appendChild(p);
    }
    for (const sec of data.sections) {
      const div = document.createElement('div'); div.className = 'terms__category';
      const h = document.createElement('h2'); h.className = 'terms__category-title'; h.textContent = sec.title;
      const list = document.createElement(opts.numbered ? 'ol' : 'ul');
      list.className = opts.numbered ? 'terms__list terms__list--numbered' : 'terms__list';
      for (const item of sec.items) { const li = document.createElement('li'); li.className = 'terms__item'; li.textContent = item; list.appendChild(li); }
      div.appendChild(h); div.appendChild(list); frag.appendChild(div);
    }
    c.textContent = '';
    c.appendChild(frag);
  };

  /** Bind a FormSubmit.co form to show a success message on submit. */
  window.handleFormSubmit = (formId, successId) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(r => {
          if (r.ok) { form.style.display = 'none'; document.getElementById(successId).style.display = 'block'; form.reset(); }
          else { alert('Something went wrong. Please try again or contact us directly.'); if (btn) { btn.disabled = false; btn.textContent = 'Submit'; } }
        })
        .catch(() => { alert('Network error. Please check your connection and try again.'); if (btn) { btn.disabled = false; btn.textContent = 'Submit'; } });
    });
  };

  /* --- Navbar (injected at top of <body>) --- */
  const nav = document.createElement('nav');
  nav.className = 'navbar'; nav.id = 'navbar';
  nav.innerHTML =
    '<a href="index.html" class="navbar__logo"><img src="Settings/Logo.png" alt="Desert Dobermans" class="navbar__logo-img" width="120" height="40"></a>' +
    '<ul class="navbar__links" id="navLinks">' +
      '<li><a href="index.html">Home</a></li>' +
      '<li><a href="reserve.html">Reserve</a></li>' +
      '<li><a href="litters.html">Litters</a></li>' +
      '<li><a href="about.html">About Us</a></li>' +
      '<li><a href="faq.html">FAQ</a></li>' +
      '<li><a href="services.html">Services</a></li>' +
    '</ul>' +
    '<button class="hamburger" id="hamburger" aria-label="Toggle navigation"><span></span><span></span><span></span></button>';
  document.body.prepend(nav);

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); });

  /* Event delegation — single listener on the nav list instead of one per link */
  navLinks.addEventListener('click', e => {
    if (e.target.tagName === 'A') { hamburger.classList.remove('open'); navLinks.classList.remove('open'); }
  });

  /* Throttled scroll listener — fires at most once per animation frame */
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
      scrollTicking = false;
    });
  }, { passive: true });

  /* --- Social + Footer (appended at end of <body>) --- */
  const social = document.createElement('section');
  social.className = 'social'; social.id = 'connect';
  social.innerHTML =
    '<h2 class="social__heading">Connect With Us</h2>' +
    '<div class="social__icons" style="display:none">' +
      '<a href="#" class="social__link" aria-label="Instagram" data-social><i class="fa-brands fa-instagram"></i></a>' +
      '<a href="#" class="social__link" aria-label="Facebook" data-social><i class="fa-brands fa-facebook-f"></i></a>' +
      '<a href="#" class="social__link" aria-label="TikTok" data-social><i class="fa-brands fa-tiktok"></i></a>' +
      '<a href="#" class="social__link" aria-label="X" data-social><i class="fa-brands fa-x-twitter"></i></a>' +
      '<a href="#" class="social__link" aria-label="YouTube" data-social><i class="fa-brands fa-youtube"></i></a>' +
      '<a href="#" class="social__link" aria-label="AKC" data-social><i class="fa-solid fa-paw"></i></a>' +
    '</div>';
  document.body.appendChild(social);

  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = '<p class="footer__text">Copyright \u00a9 2025 \u2014 All Rights Reserved.</p>';
  document.body.appendChild(footer);

  /* Load social links & footer text from Settings */
  const MAP = { INSTAGRAM: 'Instagram', FACEBOOK: 'Facebook', TIKTOK: 'TikTok', X: 'X', YOUTUBE: 'YouTube', AKC: 'AKC' };
  fetch('Settings/soical_footer.txt')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(text => {
      const d = parseSettings(text);
      const icons = social.querySelector('.social__icons');
      for (const el of icons.querySelectorAll('[data-social]')) {
        const key = Object.keys(MAP).find(k => MAP[k] === el.getAttribute('aria-label'));
        (key && d[key] && d[key] !== '#') ? el.href = d[key] : el.remove();
      }
      icons.style.display = '';
      if (d.FOOTER) footer.querySelector('.footer__text').textContent = d.FOOTER;
    })
    .catch(() => {});
})();
