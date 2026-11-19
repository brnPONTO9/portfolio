(function () {
  'use strict';

  var root = document.documentElement;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('ano').textContent = new Date().getFullYear();

  /* QR do BOT-FULL: reproduz a página /qr do bot (padrão decorativo, não é um QR real) */
  var qr = document.getElementById('qr');
  var N = 25, cells = [], seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function finder(r, c) {
    if (r < 0 || r > 6 || c < 0 || c > 6) return null;
    return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  }
  for (var r = 0; r < N; r++) {
    for (var c = 0; c < N; c++) {
      var i = document.createElement('i');
      var on = finder(r, c);
      if (on === null) on = finder(r, c - (N - 7));
      if (on === null) on = finder(r - (N - 7), c);
      if (on === null) on = ((r < 8 && (c < 8 || c > N - 9)) || (r > N - 9 && c < 8)) ? false : rnd() > 0.5;
      if (on) i.className = 'on';
      qr.appendChild(i);
      cells.push(i);
    }
  }

  if (typeof gsap === 'undefined' || reduce) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Rolagem suave, sincronizada com o ScrollTrigger */
  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  var releaseHook = null, projectsEntry = null;
  function scrollToY(y) { if (releaseHook) releaseHook(); if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }); else window.scrollTo({ top: y, behavior: 'smooth' }); }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var isProj = a.getAttribute('href') === '#projetos';
      if (isProj && projectsEntry && projectsEntry()) return;
      var y = isProj ? stageStart() : target.getBoundingClientRect().top + window.scrollY;
      scrollToY(y);
    });
  });

  var stageST = null;
  function stageStart() {
    if (stageST) return stageST.start;
    return document.getElementById('projetos').getBoundingClientRect().top + window.scrollY;
  }

  /* Entrada da página: uma única sequência */
  var nav = document.getElementById('nav');
  gsap.set(nav, { autoAlpha: 0 });
  var meta = document.querySelectorAll('.hero__name, .hero__row, .hero__meta > div');
  var heroLines = document.querySelectorAll('.display .ln > span');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(meta, { autoAlpha: 0, y: 18 });
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to(heroLines, { yPercent: 0, duration: 1.5, stagger: 0.13, delay: 0.1 })
    .to(meta, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, '-=0.7')
    .to(nav, { autoAlpha: 1, duration: 0.8 }, '-=0.9');

  /* Profundidade: o início recua enquanto a vitrine sobe por cima */
  gsap.to('.hero__in', {
    yPercent: 16, scale: 0.95, opacity: 0.25, ease: 'none', transformOrigin: '50% 100%',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* Barra de navegação: some assim que você desce, volta ao subir, com fundo para não cobrir o conteúdo */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('is-hidden', self.direction === 1 && y > 8);
      nav.classList.toggle('is-solid', y > 8);
    }
  });

  /* Habilidades: linhas se desenham ao entrar */
  document.querySelectorAll('.rows > li').forEach(function (li) {
    var v = li.querySelector('.tech'), k = li.querySelector('.rows__k');
    gsap.set(li, { '--l': 0 });
    gsap.fromTo(li, { '--l': 0 }, { '--l': 1, duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: li, start: 'top 88%', once: true } });
    gsap.from([k, v], { y: 22, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: li, start: 'top 88%', once: true } });
  });
  var style = document.createElement('style');
  style.textContent = '.rows > li::before { transform: scaleX(var(--l, 1)); }';
  document.head.appendChild(style);

  /* Contato */
  gsap.from('.contact__grid > *', { y: 22, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.contact', start: 'top 60%', once: true } });

  /* Projetos: dois comportamentos, conforme o tamanho da tela */
  var mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', function () {
    var stage = document.getElementById('projetos');
    var arts = gsap.utils.toArray('.proj');
    var buttons = gsap.utils.toArray('#index button');
    var n = arts.length;
    root.classList.add('stage-on');

    arts.forEach(function (a, i) { if (i > 0) gsap.set(a, { autoAlpha: 0 }); });
    gsap.set(arts[0].querySelector('.proj__title .ln > span'), { yPercent: 110 });
    gsap.set(arts[0].querySelector('.frame'), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(arts[0].querySelector('.proj__body'), { autoAlpha: 0, y: 24 });

    /* Entrada do primeiro projeto: imagem, título e descrição juntos */
    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 85%', once: true } })
      .to(arts[0].querySelector('.frame'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', onComplete: function () { gsap.set(arts[0].querySelector('.frame'), { clearProps: 'clipPath' }); } }, 0)
      .to(arts[0].querySelector('.proj__title .ln > span'), { yPercent: 0, duration: 1.1, ease: 'power4.out' }, 0)
      .to(arts[0].querySelector('.proj__body'), { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.08);

    /* A folha da vitrine "assenta" quando chega ao topo */
    gsap.fromTo(stage, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }, {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top top', scrub: true }
    });

    /* Linha do tempo: 1 unidade entre cada projeto. Um gesto de rolagem toca uma transição inteira. */
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    tl.to({}, { duration: n - 1 }, 0);
    for (var i = 1; i < n; i++) {
      (function (i) {
        var o = arts[i - 1], c = arts[i], s = (i - 1) + 0.04;
        var oTitle = o.querySelector('.proj__title .ln > span'), cTitle = c.querySelector('.proj__title .ln > span');
        var oBody = o.querySelector('.proj__body'), cBody = c.querySelector('.proj__body');
        var oFrame = o.querySelector('.frame'), cFrame = c.querySelector('.frame');
        tl.fromTo(oTitle, { yPercent: 0 }, { yPercent: -110, duration: 0.3, ease: 'power3.in', immediateRender: false }, s)
          .fromTo(oBody, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -20, duration: 0.25, immediateRender: false }, s)
          .fromTo(oFrame, { scale: 1, yPercent: 0, autoAlpha: 1 }, { scale: 0.94, yPercent: -4, autoAlpha: 0, duration: 0.5, immediateRender: false }, s)
          .set(c, { autoAlpha: 1 }, s + 0.12)
          .fromTo(cFrame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5 }, s + 0.12)
          .fromTo(cFrame.querySelector('img') || cFrame.querySelector('.botpage'), { scale: 1.18 }, { scale: 1, duration: 0.5 }, s + 0.12)
          .fromTo(cTitle, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: 'power3.out' }, s + 0.14)
          .fromTo(cBody, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4 }, s + 0.16)
          .set(o, { autoAlpha: 0 }, s + 0.5);
      })(i);
    }

    /* QR monta ao revelar o BOT-FULL */
    gsap.set(cells, { scale: 0 });
    var qrIn = gsap.to(cells, { scale: 1, duration: 0.5, ease: 'back.out(1.8)', stagger: { grid: [N, N], from: 'center', amount: 0.9 }, paused: true });
    tl.add(function () { qrIn.play(); }, (n - 2) + 0.04 + 0.2);

    var idx = 0, docked = false, busy = false, lockUntil = 0, pending = null, releasing = false;
    function setActive(k) { buttons.forEach(function (b, j) { b.classList.toggle('is-active', j === k); }); }
    setActive(0);

    function lock() { if (lenis) lenis.stop(); else root.style.overflow = 'hidden'; }
    function unlock() { if (lenis) lenis.start(); else root.style.overflow = ''; }

    function dock(k, y, smooth) {
      docked = true; busy = false; idx = k;
      tl.time(k); setActive(k);
      lock();
      if (lenis) lenis.scrollTo(y, { immediate: !smooth, force: true, duration: 0.9, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      else window.scrollTo(0, y);
    }
    function release(dir) {
      docked = false; releasing = true;
      unlock();
      if (dir) scrollToY(dir > 0 ? stageST.end + 4 : stageST.start - window.innerHeight);
    }
    releaseHook = function () { if (docked) release(0); };

    function goTo(k) {
      if (k === idx || busy) return;
      busy = true;
      var d = Math.abs(k - idx);
      idx = k; setActive(k);
      tl.tweenTo(k, { duration: 1.15 + 0.45 * (d - 1), ease: 'none', onComplete: function () { busy = false; lockUntil = performance.now() + 450; } });
    }
    function step(dir) {
      if (!docked || busy || performance.now() < lockUntil) return;
      var next = idx + dir;
      if (next < 0 || next > n - 1) { release(dir); return; }
      goTo(next);
    }

    stageST = ScrollTrigger.create({
      trigger: stage, start: 'top top', end: 'bottom top',
      onEnter: function (self) { if (releasing) return; var k = pending !== null ? pending : 0; pending = null; dock(k, self.start, false); },
      onEnterBack: function (self) { if (releasing) return; var k = pending !== null ? pending : n - 1; pending = null; dock(k, self.start, true); },
      onLeave: function () { releasing = false; },
      onLeaveBack: function () { releasing = false; }
    });

    function onWheel(e) { if (docked && Math.abs(e.deltaY) >= 12) step(e.deltaY > 0 ? 1 : -1); }
    function onKey(e) {
      if (!docked) return;
      var dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
      if (!dir) return;
      e.preventDefault(); step(dir);
    }
    var ty = null;
    function onTouchStart(e) { ty = e.touches[0].clientY; }
    function onTouchEnd(e) {
      if (ty === null || !docked) return;
      var dy = ty - e.changedTouches[0].clientY; ty = null;
      if (Math.abs(dy) > 40) step(dy > 0 ? 1 : -1);
    }
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = parseInt(b.getAttribute('data-i'), 10);
        if (docked) { goTo(k); return; }
        pending = k;
        scrollToY(stageST.start);
      });
    });

    projectsEntry = function () { if (docked) { goTo(0); return true; } pending = 0; return false; };

    return function () {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (docked) { docked = false; unlock(); }
      releaseHook = null; projectsEntry = null; stageST = null;
      root.classList.remove('stage-on'); qrIn.kill(); gsap.set(cells, { clearProps: 'all' });
    };
  });

  mm.add('(max-width: 899px)', function () {
    gsap.utils.toArray('.proj').forEach(function (a) {
      var title = a.querySelector('.proj__title .ln > span');
      var frame = a.querySelector('.frame');
      var body = a.querySelector('.proj__body');
      gsap.from(title, { yPercent: 110, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: a, start: 'top 80%', once: true } });
      gsap.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 85%', once: true }, onComplete: function () { gsap.set(frame, { clearProps: 'clipPath' }); } });
      gsap.from(body, { autoAlpha: 0, y: 24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: body, start: 'top 88%', once: true } });
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
