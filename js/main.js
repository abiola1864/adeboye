// THE ADEBOYE REVIEW — SHARED JS
(function () {

  // ── Sticky header shadow
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // ── Reading progress bar
  var bar = document.getElementById('progress-bar');
  if (bar) {
    window.addEventListener('scroll', function () {
      var doc = document.documentElement;
      var scrolled = doc.scrollTop || document.body.scrollTop;
      var total = doc.scrollHeight - doc.clientHeight;
      bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
    });
  }

  // ── Back to top
  var backTop = document.getElementById('back-top');
  if (backTop) {
    window.addEventListener('scroll', function () {
      backTop.classList.toggle('visible', window.scrollY > 400);
    });
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Hamburger menu
  var hbg = document.getElementById('hamburger');
  var mobMenu = document.getElementById('mob-menu');
  if (hbg && mobMenu) {
    hbg.addEventListener('click', function () {
      hbg.classList.toggle('open');
      mobMenu.classList.toggle('open');
    });
    mobMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        hbg.classList.remove('open');
        mobMenu.classList.remove('open');
      });
    });
  }

  // ── Fade-up on scroll (intersection observer)
  var fadeEls = document.querySelectorAll('.reveal');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
      io.observe(el);
    });
  }

  // ── Newsletter form feedback
  var nlBtns = document.querySelectorAll('.nl-card button, .nl-btn');
  nlBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var form = btn.closest('.nl-card') || btn.closest('.nl-section');
      var email = form ? form.querySelector('input[type=email]') : null;
      if (email && email.value.includes('@')) {
        btn.textContent = '✓ Subscribed!';
        btn.style.background = '#27ae60';
        btn.disabled = true;
      } else if (email) {
        email.style.borderColor = 'rgba(255,100,100,.6)';
        email.focus();
      }
    });
  });

  // ── Set active nav link based on current page
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mob-menu a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

})();
