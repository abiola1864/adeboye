// THE ADEBOYE REVIEW — main.js

(function () {
  // Sticky header
  var header = document.querySelector('.site-header');
  if (header) window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Progress bar
  var bar = document.getElementById('progress-bar');
  if (bar) window.addEventListener('scroll', function () {
    var d = document.documentElement;
    var pct = (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  });

  // Back to top
  var btt = document.getElementById('back-top');
  if (btt) {
    window.addEventListener('scroll', function () { btt.classList.toggle('visible', window.scrollY > 400); });
    btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Hamburger
  var hbg = document.getElementById('hamburger');
  var mob = document.getElementById('mob-menu');
  if (hbg && mob) {
    hbg.addEventListener('click', function () {
      hbg.classList.toggle('open'); mob.classList.toggle('open');
    });
    mob.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        hbg.classList.remove('open'); mob.classList.remove('open');
      });
    });
  }

  // Scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      io.observe(el);
    });
  }
})();

// ── API helpers ───────────────────────────────────────────────────
var API = {
  getPosts: function (params) {
    var q = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetch('/api/posts' + q).then(function (r) { return r.json(); });
  },
  getPost: function (slug) {
    return fetch('/api/posts/' + slug).then(function (r) { return r.json(); });
  },
  subscribe: function (name, email) {
    return fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email })
    }).then(function (r) { return r.json(); });
  },
  contact: function (data) {
    return fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }
};

// ── Newsletter forms ──────────────────────────────────────────────
document.querySelectorAll('.nl-form').forEach(function (form) {
  var btn = form.querySelector('button');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var nameEl  = form.querySelector('input[type=text]');
    var emailEl = form.querySelector('input[type=email]');
    var email   = emailEl ? emailEl.value.trim() : '';
    var name    = nameEl  ? nameEl.value.trim()  : '';
    if (!email || !email.includes('@')) {
      if (emailEl) { emailEl.style.borderColor = 'rgba(255,100,100,.7)'; emailEl.focus(); }
      return;
    }
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
    API.subscribe(name, email).then(function (res) {
      if (res.success) {
        btn.textContent = '✓ Subscribed!';
        btn.style.background = '#27ae60';
        if (nameEl) nameEl.value = '';
        if (emailEl) emailEl.value = '';
      } else {
        btn.textContent = 'Try again';
        btn.disabled = false;
      }
    }).catch(function () {
      btn.textContent = 'Try again';
      btn.disabled = false;
    });
  });
});

// ── Format date ───────────────────────────────────────────────────
function formatDate(str) {
  var d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Build essay list item HTML ────────────────────────────────────
function essayItemHTML(post) {
  var img = post.image_url
    ? '<img src="' + post.image_url + '" alt="' + esc(post.title) + '"/>'
    : '<div class="essay-thumb-icon"><svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>';
  var badge = post.is_new ? '<span class="badge badge-new">New</span>' : '';
  return '<a href="/article.html?slug=' + post.slug + '" class="essay-item">'
    + '<div class="essay-thumb">' + img + '</div>'
    + '<div><div class="essay-meta"><span class="essay-tag">' + esc(post.category) + '</span>' + badge + '</div>'
    + '<div class="essay-title">' + esc(post.title) + '</div>'
    + '<div class="essay-teaser">' + esc(post.excerpt || '') + '</div>'
    + '<div class="essay-footer"><span class="essay-date">' + formatDate(post.created_at) + ' &middot; ' + esc(post.read_time || '') + '</span>'
    + '<span class="read-link">Read Essay &rarr;</span></div></div></a>';
}

// ── Build article card HTML ───────────────────────────────────────
function articleCardHTML(post) {
  var badge = post.is_new ? '<span class="badge badge-new">New</span>' : '';
  var img = post.image_url
    ? '<img src="' + post.image_url + '" alt=""/>'
    : '<div class="ac-img-placeholder"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg></div>';
  return '<a href="/article.html?slug=' + post.slug + '" class="article-card">'
    + '<div class="ac-img">' + img + '</div>'
    + '<div class="ac-body">'
    + '<div class="ac-meta"><span class="ac-tag">' + esc(post.category) + '</span>' + badge + '</div>'
    + '<div class="ac-title">' + esc(post.title) + '</div>'
    + '<div class="ac-teaser">' + esc(post.excerpt || '') + '</div>'
    + '<div class="ac-footer"><span class="ac-date">' + formatDate(post.created_at) + ' &middot; ' + esc(post.read_time || '') + '</span>'
    + '<span class="ac-readmore">Read &rarr;</span></div></div></a>';
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
