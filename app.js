'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const splash = $('#splash');
  let introDone = false;
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    document.documentElement.classList.add('intro-ready');
    splash?.classList.add('is-leaving');
    try { sessionStorage.setItem('ilayda-intro', 'seen'); } catch {}
    window.setTimeout(() => splash?.remove(), reduced ? 30 : 1250);
  }
  let seenIntro = false;
  try { seenIntro = sessionStorage.getItem('ilayda-intro') === 'seen'; } catch {}
  window.setTimeout(finishIntro, reduced || seenIntro ? 30 : 1500);
  $('#splash-skip')?.addEventListener('click', finishIntro);
  document.addEventListener('keydown', event => { if (event.key === 'Tab' || event.key === 'Escape') finishIntro(); });

  function initMenu() {
    const menu = $('#mobile-menu'), toggle = $('#menu-toggle');
    function closeMenu() {
      menu.close();
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    toggle.addEventListener('click', () => {
      menu.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    });
    $('#menu-close').addEventListener('click', closeMenu);
    menu.addEventListener('close', () => {
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
    menu.addEventListener('click', event => {
      if (event.target === menu) {
        const r = menu.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeMenu();
      }
    });
    $$('#mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 980 && menu.open) closeMenu(); }, { passive: true });
  }

  function initScroll() {
    const header = $('#header'), progress = $('#reading-progress'), floating = $('#floating-cta');
    let scheduled = false;
    function update() {
      scheduled = false;
      const y = window.scrollY, height = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 16);
      progress.style.transform = `scaleX(${height > 0 ? Math.min(1, y / height) : 0})`;
      const contactRect = $('#iletisim').getBoundingClientRect();
      floating.classList.toggle('is-visible', y > 650 && contactRect.top > window.innerHeight * .55);
    }
    window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          if (entry.target.id === 'process-steps') entry.target.classList.add('is-seen');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    $$('[data-reveal]').forEach((element, index) => {
      if (!reduced && element.getBoundingClientRect().top > window.innerHeight) element.classList.add('will-reveal');
      element.style.transitionDelay = `${index % 2 * 75}ms`;
      observer.observe(element);
    });
    const pSteps = $('#process-steps');
    if (pSteps) observer.observe(pSteps);
    const navLinks = $$('.desktop-nav a');
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    ['hakkimda', 'hizmetler', 'ofis', 'sss', 'iletisim'].forEach(id => {
      const el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  function initServices() {
    const rows = $$('.service-row');
    const presentation = {
      child: ['BÜYÜRKEN, KENDİ HIZINDA', 'Çocukların ve gençlerin dünyasına, onların ihtiyaçlarından bakmak.'],
      play: ['OYUNUN DİLİNDE BULUŞALIM', 'Çocukların duygularını kendi ifade yollarıyla paylaşabilmesi için.'],
      parent: ['EBEVEYNLİK YOLCULUĞUNUZDA', 'Çocuğunuzu anlamak ve sorularınıza birlikte bakmak.'],
      individual: ['KENDİNİZLE BİR BULUŞMA', 'Duygularınıza ve düşüncelerinize, sizin hikâyenizden bakmak.'],
      family: ['BİRBİRİNİZE YER AÇIN', 'Aile içinde her sesin duyulabildiği bir çalışma alanı.'],
      online: ['MESAFELERİN ÖTESİNDE', 'Bulunduğunuz yerden bir araya gelebileceğimiz bir görüşme alanı.']
    };
    function selectRow(row) {
      const [category, text] = presentation[row.dataset.service] || ['GÖRÜŞME ALANI', 'Sizin için güvenli bir alan.'];
      const title = $('h3', row).textContent;
      rows.forEach(other => { if (other !== row) other.open = false; });
      $('#spotlight-number').textContent = `${$('.service-no', row).textContent} / 06`;
      $('#spotlight-category').textContent = category;
      $('#spotlight-title').textContent = title;
      $('#spotlight-text').textContent = text;
      const link = $('#spotlight-link');
      if (link) {
        link.dataset.topic = $('[data-topic]', row)?.dataset.topic || '';
        link.setAttribute('aria-label', `${title} için randevu talebi`);
      }
    }
    rows.forEach(row => row.addEventListener('toggle', () => { if (row.open) selectRow(row); }));
    $$('#service-filters button').forEach(button => button.addEventListener('click', () => {
      $$('#service-filters button').forEach(other => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      const filter = button.dataset.filter;
      rows.forEach(row => { row.hidden = filter !== 'all' && !row.dataset.category.split(' ').includes(filter); });
      const visible = rows.filter(row => !row.hidden);
      if (!visible.some(row => row.open)) { visible[0].open = true; selectRow(visible[0]); }
    }));
    $$('[data-topic]').forEach(link => link.addEventListener('click', () => {
      $('#topic').value = link.dataset.topic;
      if (link.dataset.topic === 'Online terapi') $('input[name="mode"][value="Online"]').checked = true;
    }));
  }

  function initBreathing() {
    const start = $('#breath-start'), reset = $('#breath-reset'), instruction = $('#breath-instruction');
    const orb = $('#breath-orb'), word = $('#orb-word'), seconds = $('#breath-seconds'), cycle = $('#breath-cycle');
    const circle = $('#breath-progress-circle'), label = $('#breath-button-text'), icon = $('#breath-icon use');
    const duration = 60000, circumference = 2 * Math.PI * 157;
    let running = false, elapsed = 0, startedAt = 0, frame = 0, lastPhase = '';
    function setButton(text, symbol) { label.textContent = text; icon.setAttribute('href', symbol); }
    function paint(time) {
      const done = time >= duration;
      const local = (time / 1000) % 12;
      const phase = local < 4 ? 'inhale' : local < 6 ? 'hold' : 'exhale';
      const phaseText = { inhale: '4 saniye boyunca nefes alın.', hold: '2 saniye tutun.', exhale: '6 saniyede yavaşça nefes verin.' };
      const phaseWord = { inhale: 'Nefes alın', hold: 'Tutun', exhale: 'Nefes verin' };
      orb.dataset.state = done ? 'complete' : 'running';
      orb.dataset.elapsed = String(Math.min(duration, time));
      $('#mola').dataset.breathState = orb.dataset.state;
      if (done) {
        instruction.textContent = 'Bir dakikalık molanız tamamlandı.';
        word.textContent = 'Tamamlandı';
        lastPhase = 'done';
      } else if (lastPhase !== phase) {
        instruction.textContent = phaseText[phase]; word.textContent = phaseWord[phase]; lastPhase = phase;
      }
      const eased = p => (1 - Math.cos(Math.PI * p)) / 2;
      const scale = local < 4 ? .91 + .23 * eased(local / 4) : local < 6 ? 1.14 : 1.14 - .23 * eased((local - 6) / 6);
      orb.style.setProperty('--breath-scale', String(done ? 1 : scale));
      seconds.textContent = String(Math.max(0, Math.ceil((duration - time) / 1000)));
      cycle.textContent = `${done ? 5 : Math.min(5, Math.floor(time / 12000) + 1)} / 5`;
      circle.style.strokeDashoffset = String(circumference * (1 - Math.min(1, time / duration)));
    }
    function tick(now) {
      if (!running) return;
      const time = Math.min(duration, elapsed + now - startedAt);
      paint(time);
      if (time >= duration) {
        running = false;
        elapsed = duration;
        setButton('Yeniden başlat', '#play');
        start.setAttribute('aria-pressed', 'false');
        instruction.textContent = 'Bir dakikalık molanız tamamlandı. Nefesinize huzurla devam edebilirsiniz.';
        word.textContent = 'Huzurla';
        orb.dataset.state = 'complete';
        $('#mola').dataset.breathState = 'complete';
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    function pause() {
      if (!running) return;
      elapsed = Math.min(duration, elapsed + performance.now() - startedAt);
      running = false; cancelAnimationFrame(frame);
      paint(elapsed);
      if (elapsed >= duration) { setButton('Yeniden başlat', '#play'); start.setAttribute('aria-pressed', 'false'); return; }
      orb.dataset.state = 'paused';
      $('#mola').dataset.breathState = 'paused';
      word.textContent = 'Duraklatıldı';
      setButton('Devam et', '#play'); instruction.textContent = 'Hazır olduğunuzda devam edin.';
      lastPhase = ''; start.setAttribute('aria-pressed', 'false');
    }
    orb.dataset.state = 'idle';
    $('#mola').dataset.breathState = 'idle';
    start.setAttribute('aria-pressed', 'false');
    start.addEventListener('click', () => {
      if (running) { pause(); return; }
      if (elapsed >= duration) elapsed = 0;
      running = true; startedAt = performance.now(); reset.hidden = false;
      setButton('Duraklat', '#pause'); start.setAttribute('aria-pressed', 'true');
      paint(elapsed); frame = requestAnimationFrame(tick);
    });
    reset.addEventListener('click', () => {
      running = false; cancelAnimationFrame(frame); elapsed = 0; lastPhase = '';
      setButton('Molayı başlat', '#play'); start.setAttribute('aria-pressed', 'false'); reset.hidden = true;
      instruction.textContent = 'Hazır olduğunuzda.'; word.textContent = 'bir nefes.';
      orb.dataset.state = 'idle'; orb.dataset.elapsed = '0';
      $('#mola').dataset.breathState = 'idle';
      seconds.textContent = '60'; cycle.textContent = '0 / 5'; circle.style.strokeDashoffset = String(circumference); orb.style.setProperty('--breath-scale', '1');
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('pagehide', pause);
  }

  function initContact() {
    const form = $('#appointment-form'), dialog = $('#request-dialog');
    if (!form || !dialog) return;
    let draft = '', waText = '';

    function getFormData() {
      const name = ($('#full-name')?.value || '').trim();
      const phone = ($('#phone')?.value || '').trim();
      const mode = $('input[name="mode"]:checked')?.value || 'Kartal Ofisi (Yüz yüze)';
      const topic = $('#topic')?.value || 'Genel Görüşme';
      const note = ($('#message')?.value || '').trim();
      return { name, phone, mode, topic, note };
    }

    function buildMessages(data) {
      const { name, phone, mode, topic, note } = data;
      const displayName = name || (phone ? `Danışan (${phone})` : 'Danışan');
      const displayPhone = phone || 'Belirtilmedi';

      const emailBody = `Merhaba İlayda Hanım,\n\nBir görüşme hakkında iletişime geçmek istiyorum.\n\nAd Soyad: ${displayName}\nTelefon: ${displayPhone}\nÇalışma alanı: ${topic}\nGörüşme tercihi: ${mode}\n\n${note || 'Uygun görüşme zamanları hakkında bilgi alabilir miyim?'}\n\nTeşekkür ederim.`;
      const emailSubject = `Görüşme talebi · ${displayName.replace(/[\r\n]/g, ' ')} · ${topic}`;

      const whatsappMessage = `Merhaba İlayda Hanım,\nRandevu ve ön bilgi almak istiyorum.\n\n• Ad Soyad: ${displayName}\n• Telefon: ${displayPhone}\n• Destek Alanı: ${topic}\n• Tercih: ${mode}${note ? `\n• Not: ${note}` : ''}\n\nTeşekkür ederim.`;

      return { emailBody, emailSubject, whatsappMessage };
    }

    function showFormError(message) {
      const errorEl = $('#full-name-error');
      const nameInput = $('#full-name');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
      if (nameInput) {
        nameInput.style.borderColor = '#c24b38';
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function clearFormError() {
      const errorEl = $('#full-name-error');
      const nameInput = $('#full-name');
      if (errorEl) errorEl.style.display = 'none';
      if (nameInput) nameInput.style.borderColor = '';
    }

    $('#full-name')?.addEventListener('input', clearFormError);
    $('#phone')?.addEventListener('input', clearFormError);

    // Direct WhatsApp Button on Form
    $('#form-wa-direct-btn')?.addEventListener('click', () => {
      const data = getFormData();
      const { whatsappMessage } = buildMessages(data);
      const waUrl = `https://wa.me/905425941943?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });

    // Form Submit (Opens modal with WhatsApp, Email & Copy options)
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = getFormData();
      if (!data.name && !data.phone) {
        showFormError('Lütfen adınızı veya telefon numaranızı girin.');
        return;
      }
      clearFormError();

      const { emailBody, emailSubject, whatsappMessage } = buildMessages(data);
      draft = `Alıcı: ilayda.akyil@gmail.com\nKonu: ${emailSubject}\n\n${emailBody}`;
      waText = whatsappMessage;

      $('#draft-preview').textContent = whatsappMessage;

      const waLink = $('#draft-whatsapp');
      if (waLink) {
        waLink.href = `https://wa.me/905425941943?text=${encodeURIComponent(whatsappMessage)}`;
      }

      const mailLink = $('#draft-send');
      if (mailLink) {
        mailLink.href = `mailto:ilayda.akyil@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      }

      $('#draft-status').textContent = '';

      if (typeof dialog.showModal === 'function') {
        try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
      } else {
        dialog.setAttribute('open', '');
      }
    });

    $('#request-close')?.addEventListener('click', () => {
      if (typeof dialog.close === 'function') {
        try { dialog.close(); } catch { dialog.removeAttribute('open'); }
      } else {
        dialog.removeAttribute('open');
      }
    });

    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) {
          if (typeof dialog.close === 'function') {
            try { dialog.close(); } catch { dialog.removeAttribute('open'); }
          } else {
            dialog.removeAttribute('open');
          }
        }
      }
    });

    $('#copy-draft')?.addEventListener('click', async () => {
      try {
        const textToCopy = waText || draft;
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(textToCopy);
        else {
          const text = document.createElement('textarea');
          text.value = textToCopy;
          text.style.cssText = 'position:fixed;opacity:0';
          dialog.append(text);
          text.select();
          const copied = document.execCommand('copy');
          text.remove();
          if (!copied) throw new Error('Clipboard unavailable');
        }
        $('#draft-status').textContent = 'Taslak metni kopyalandı.';
      } catch {
        $('#draft-status').textContent = 'Metni seçerek kopyalayabilirsiniz.';
        const range = document.createRange();
        range.selectNodeContents($('#draft-preview'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });

    $('#draft-send')?.addEventListener('click', () => {
      $('#draft-status').textContent = 'E-posta uygulamanız açılıyor...';
    });

    $('#draft-whatsapp')?.addEventListener('click', () => {
      $('#draft-status').textContent = 'WhatsApp açılıyor...';
    });
  }

  function initTraining() {
    const training = $('.training');
    if (!training) return;
    const summary = $('summary', training);
    if (!summary) return;
    summary.addEventListener('click', e => {
      e.stopPropagation();
    });
  }

  [initMenu, initScroll, initServices, initTraining, initBreathing, initContact].forEach(init => {
    try { init(); } catch (error) { console.error('Interface initialization:', error); }
  });
})();
