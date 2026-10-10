'use strict';

/* Shared scene construction is independent of the DOM and can be verified directly. */
function createIlaydaSculpture(T, mode) {
  const group = new T.Group();
  const glass = new T.MeshPhysicalMaterial({
    color: mode === 'breath' ? '#dac8a8' : mode === 'service' ? '#e0c9b0' : '#d8b9a0',
    metalness: .12,
    roughness: .16,
    transmission: 0,
    opacity: .88,
    transparent: true,
    ior: 1.3,
    clearcoat: .8,
    clearcoatRoughness: .08,
    envMapIntensity: 1.8
  });
  const gold = new T.MeshStandardMaterial({ color: '#d8bb90', metalness: .85, roughness: .23 });
  const pearl = new T.MeshPhysicalMaterial({ color: '#e5d0ad', metalness: .12, roughness: .16, clearcoat: 1, transmission: .2, thickness: .5 });
  const main = new T.Mesh(mode === 'breath' ? new T.SphereGeometry(1.02, 56, 40) : new T.TorusKnotGeometry(1.02, .255, 96, 16, 2, 3), glass);
  main.name = 'glass-core';
  main.rotation.set(mode === 'breath' ? 0 : .6, .3, -.3);
  group.add(main);
  const ring = new T.Mesh(new T.TorusGeometry(mode === 'breath' ? 1.31 : 1.91, mode === 'breath' ? .012 : .023, 10, 180), gold);
  ring.rotation.set(1.14, -.35, .4); ring.name = 'gold-orbit'; group.add(ring);
  if (mode !== 'breath') {
    for (let i = 0; i < 3; i++) {
      const sphere = new T.Mesh(new T.SphereGeometry(.09 + i * .035, 24, 16), i === 1 ? gold : pearl);
      const a = i * 2.1 + .4;
      sphere.position.set(Math.cos(a) * 1.85, Math.sin(a) * 1.45, i * .27 - .3);
      sphere.name = 'pearl-' + i; group.add(sphere);
    }
  } else {
    glass.onBeforeCompile = shader => {
      shader.uniforms.uMotionTime = { value: 0 };
      shader.vertexShader = 'uniform float uMotionTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * (sin(position.y*4.0+uMotionTime)*sin(position.x*3.0-uMotionTime*0.7))*0.035;');
      glass.userData.shader = shader;
    };
    glass.customProgramCacheKey = () => 'ilayda-soft-glass-v1';
  }
  return group;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createIlaydaSculpture };
} else {
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = motionPreference.matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, pageX: -100, pageY: -100, active: false };
  const scenes = [];
  let raf = 0, lastRender = -100, scrollTarget = 0, smoothScroll = 0, quoteWords = [];
  const aura = $('#pointer-aura');
  const hero = $('#top'), visual = $('#hero-visual'), approach = $('#yaklasim');
  const cards = $$('.process-step');
  const tilts = $$('.service-row, .about-photo, .contact-form-card, .service-spotlight');

  function makeEnvironment(T, renderer) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#f5ebe0'); g.addColorStop(.38, '#faf7ed'); g.addColorStop(.62, '#dcc3a8'); g.addColorStop(1, '#4a3528');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#fffefa'; ctx.fillRect(95, 42, 90, 240); ctx.fillRect(390, 75, 150, 110); ctx.fillRect(760, 0, 160, 200);
    const gold = ctx.createLinearGradient(0, 0, 1024, 0);
    gold.addColorStop(0, '#8a6a50'); gold.addColorStop(.3, '#ddc6a0'); gold.addColorStop(.56, '#fff9ed'); gold.addColorStop(.8, '#b8977a'); gold.addColorStop(1, '#e6cda3');
    ctx.fillStyle = gold; ctx.fillRect(0, 270, 1024, 40);
    const texture = new T.CanvasTexture(canvas); texture.mapping = T.EquirectangularReflectionMapping; texture.colorSpace = T.SRGBColorSpace;
    const generator = new T.PMREMGenerator(renderer); const environment = generator.fromEquirectangular(texture);
    texture.dispose(); generator.dispose(); return environment;
  }

  function createScene(id, mode) {
    if (!window.THREE) return;
    const T = window.THREE, canvas = document.getElementById(id), root = canvas.parentElement;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: window.innerWidth > 740, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 740 ? 1 : 1.4));
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
      const scene = new T.Scene();
      scene.background = new T.Color(mode === 'service' || mode === 'breath' ? '#2e231e' : '#f6efe6');
      const camera = new T.PerspectiveCamera(mode === 'breath' ? 37 : 35, 1, .1, 30);
      camera.position.set(0, 0, mode === 'breath' ? 4.15 : mode === 'service' ? 6.4 : 7.5);
      const environment = makeEnvironment(T, renderer); scene.environment = environment.texture;
      scene.add(new T.HemisphereLight('#fff9e8', '#4a3528', 2.5));
      const key = new T.DirectionalLight('#ffffff', 3.7); key.position.set(-3, 4, 4); scene.add(key);
      const rim = new T.DirectionalLight('#e7c893', 3); rim.position.set(4, -1, -2); scene.add(rim);
      const green = new T.PointLight('#f0d2c0', 10, 15); green.position.set(-3, -2, 3); scene.add(green);
      const sculpture = createIlaydaSculpture(T, mode); scene.add(sculpture);
      const entry = { mode, canvas, root, renderer, scene, camera, sculpture, visible: true, selection: 0, environment };
      function resize() {
        const rect = root.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
        camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
        if (reduced) renderer.render(scene, camera);
      }
      resize(); renderer.render(scene, camera); root.classList.add('has-webgl');
      if (mode === 'hero') visual.classList.add('has-webgl');
      scenes.push(entry);
      if (window.ResizeObserver) { const ro = new ResizeObserver(resize); ro.observe(root); entry.resizeObserver = ro; }
      else window.addEventListener('resize', resize, { passive: true });
      if (window.IntersectionObserver) {
        const io = new IntersectionObserver(entries => { entry.visible = entries[0].isIntersecting; }, { rootMargin: '80px' });
        io.observe(mode === 'hero' ? hero : mode === 'service' ? $('#hizmetler') : $('#mola')); entry.visibilityObserver = io;
      }
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); entry.visible = false; root.classList.remove('has-webgl'); if (mode === 'hero') visual.classList.remove('has-webgl'); });
      canvas.addEventListener('webglcontextrestored', () => { entry.visible = true; root.classList.add('has-webgl'); if (mode === 'hero') visual.classList.add('has-webgl'); });
    } catch (error) {
      renderer?.dispose(); root.classList.remove('has-webgl');
      console.warn('3D scene fallback:', mode, error.message);
    }
  }

  function splitHeading(element, quote = false) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      (node.textContent.match(/\S+|\s+/g) || []).forEach(text => {
        if (!text.trim()) { fragment.append(document.createTextNode(text)); return; }
        const span = document.createElement('span'); span.textContent = text;
        if (quote) { span.className = 'quote-word'; quoteWords.push(span); fragment.append(span); }
        else {
          const clip = document.createElement('span'); clip.className = 'motion-word-clip'; span.className = 'motion-word';
          span.style.setProperty('--word-index', String(index++)); clip.append(span); fragment.append(clip);
        }
      });
      node.replaceWith(fragment);
    });
  }
  if (!reduced && window.IntersectionObserver) {
    const titleObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('title-in'); titleObserver.unobserve(entry.target); }
    }), { threshold: .25 });
    $$('h2').forEach(title => { if (title.classList.contains('scroll-quote')) splitHeading(title, true); else if (title.id !== 'contact-title') { splitHeading(title); titleObserver.observe(title); } });
    const copyObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('copy-in'); copyObserver.unobserve(entry.target); }
    }), { threshold: .15 });
    $$('main p').forEach(paragraph => {
      if (paragraph.id || paragraph.closest('.hero-note,.about-label,.form-note') || paragraph.textContent.trim().split(/\s+/).length < 5) return;
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT), textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      let index = 0;
      textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        (node.textContent.match(/\S+|\s+/g) || []).forEach(text => {
          if (!text.trim()) { fragment.append(document.createTextNode(text)); return; }
          const word = document.createElement('span'); word.className = 'copy-word'; word.textContent = text;
          word.style.setProperty('--copy-index', String(Math.min(index++, 30))); fragment.append(word);
        });
        node.replaceWith(fragment);
      });
      paragraph.classList.add('animated-copy'); copyObserver.observe(paragraph);
    });
  }

  cards.forEach((card, index) => card.style.setProperty('--stack-index', String(index)));
  tilts.forEach(element => {
    if (!fine || reduced) return;
    element.addEventListener('pointermove', event => {
      const r = element.getBoundingClientRect(), x = (event.clientX - r.left) / r.width, y = (event.clientY - r.top) / r.height;
      element.style.setProperty('--tilt-x', `${(y - .5) * -5}deg`); element.style.setProperty('--tilt-y', `${(x - .5) * 6}deg`);
      element.style.setProperty('--shine-x', `${x * 100}%`); element.style.setProperty('--shine-y', `${y * 100}%`);
    });
    element.addEventListener('pointerleave', () => { element.style.setProperty('--tilt-x', '0deg'); element.style.setProperty('--tilt-y', '0deg'); });
  });
  $$('.button, .spotlight-link, .back-top').forEach(button => {
    if (!fine || reduced) return;
    button.addEventListener('pointermove', event => {
      const r = button.getBoundingClientRect(), x = event.clientX - r.left, y = event.clientY - r.top;
      button.style.setProperty('--magnet-x', `${(x - r.width / 2) * .08}px`); button.style.setProperty('--magnet-y', `${(y - r.height / 2) * .18}px`);
      button.style.setProperty('--shine-x', `${x / r.width * 100}%`); button.style.setProperty('--shine-y', `${y / r.height * 100}%`);
    });
    button.addEventListener('pointerleave', () => { button.style.setProperty('--magnet-x', '0px'); button.style.setProperty('--magnet-y', '0px'); });
    button.addEventListener('pointerdown', event => {
      const r = button.getBoundingClientRect(), ripple = document.createElement('span'); ripple.className = 'click-ripple';
      ripple.style.left = `${event.clientX - r.left - 8}px`; ripple.style.top = `${event.clientY - r.top - 8}px`; button.append(ripple);
      window.setTimeout(() => ripple.remove(), 750);
    });
  });
  $$('.service-row').forEach((row, index) => row.addEventListener('toggle', () => {
    if (row.open) { const entry = scenes.find(scene => scene.mode === 'service'); if (entry) entry.selection = index; }
  }));
  let targetPortraitRx = 0, targetPortraitRy = 0, currentPortraitRx = 0, currentPortraitRy = 0;
  let visualHovered = false;
  if (visual) {
    visual.addEventListener('pointerenter', () => { visualHovered = true; }, { passive: true });
    visual.addEventListener('pointerleave', () => { visualHovered = false; targetPortraitRx = 0; targetPortraitRy = 0; }, { passive: true });
  }
  if (fine && !reduced) {
    document.addEventListener('pointermove', event => {
      pointer.pageX = event.clientX; pointer.pageY = event.clientY; pointer.active = true;
      pointer.targetX = (event.clientX / window.innerWidth - .5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - .5) * 2;
      aura.classList.add('is-active'); aura.classList.toggle('over-link', !!event.target.closest('a,button,summary'));
      if (visualHovered) {
        targetPortraitRx = -pointer.targetY * 5;
        targetPortraitRy = pointer.targetX * 8;
      }
      approach.style.setProperty('--aura-x', `${event.clientX / window.innerWidth * 100}%`);
      approach.style.setProperty('--aura-y', `${event.clientY / window.innerHeight * 100}%`);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.active = false; pointer.targetX = pointer.targetY = 0; aura.classList.remove('is-active'); targetPortraitRx = 0; targetPortraitRy = 0; });
  }

  function updateScroll() {
    scrollTarget = window.scrollY;
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(400, rect.height));
    hero.style.setProperty('--hero-scroll', reduced ? '0' : progress.toFixed(4));
    if (reduced) return;
    const a = approach.getBoundingClientRect(), p = clamp((window.innerHeight * .76 - a.top) / (a.height * .7 + window.innerHeight * .2));
    quoteWords.forEach((word, index) => {
      const strength = clamp((p - index / Math.max(1, quoteWords.length) * .68) / .26);
      word.style.opacity = String(.18 + strength * .82); word.style.filter = `blur(${(1 - strength) * 1.2}px)`;
    });
    cards.forEach((card, index) => {
      const r = card.getBoundingClientRect(), travel = clamp((window.innerHeight * .35 - r.top) / window.innerHeight);
      card.style.setProperty('--stack-scale', String(1 - travel * .045 * (cards.length - index)));
      card.style.setProperty('--stack-tilt', `${travel * -2.4}deg`);
    });
    const photo = $('.about-photo'), pr = photo.getBoundingClientRect();
    const parallax = clamp((window.innerHeight * .5 - pr.top) / window.innerHeight, -1, 1);
    photo.style.setProperty('--photo-parallax', `${-4 + parallax * 2}%`);
    $('.about-label').style.setProperty('--label-parallax', `${parallax * -17}px`);
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; updateScroll(); }); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true }); updateScroll();

  function animate(now) {
    if (document.hidden) { raf = 0; return; }
    raf = requestAnimationFrame(animate);
    if (now - lastRender < 30) return;
    lastRender = now;
    pointer.x += (pointer.targetX - pointer.x) * .07; pointer.y += (pointer.targetY - pointer.y) * .07;
    smoothScroll += (scrollTarget - smoothScroll) * .07;
    if (visual) {
      currentPortraitRx += (targetPortraitRx - currentPortraitRx) * .08;
      currentPortraitRy += (targetPortraitRy - currentPortraitRy) * .08;
      if (Math.abs(currentPortraitRx) > 0.01 || Math.abs(currentPortraitRy) > 0.01 || visualHovered) {
        visual.style.setProperty('--portrait-rx', currentPortraitRx.toFixed(2) + 'deg');
        visual.style.setProperty('--portrait-ry', currentPortraitRy.toFixed(2) + 'deg');
      }
    }
    if (fine && pointer.active && aura) {
      const size = aura.classList.contains('over-link') ? 70 : 42;
      aura.style.transform = `translate3d(${pointer.pageX - size / 2}px,${pointer.pageY - size / 2}px,0)`;
    }
    const t = reduced ? 0 : now / 1000;
    scenes.forEach(entry => {
      if (!entry.visible) return;
      const { sculpture, mode, renderer, scene, camera } = entry;
      const heroTravel = mode === 'hero' ? Math.min(1, smoothScroll / 850) : 0;
      const sceneTime = t;
      const scenePointerX = mode === 'breath' ? 0 : pointer.x, scenePointerY = mode === 'breath' ? 0 : pointer.y;
      sculpture.rotation.x = -.1 + scenePointerY * .13 + heroTravel * .65 + Math.sin(sceneTime * .18) * .07;
      sculpture.rotation.y = sceneTime * (mode === 'breath' ? .12 : .095) + scenePointerX * .38 + heroTravel * 1.8 + entry.selection * .38;
      sculpture.rotation.z = -.16 + Math.sin(sceneTime * .16) * .12;
      sculpture.position.y = Math.sin(sceneTime * .6) * .06;
      if (mode === 'breath') {
        const glassCore = sculpture.getObjectByName('glass-core');
        const shader = glassCore?.material?.userData?.shader;
        if (shader) shader.uniforms.uMotionTime.value = sceneTime * .75;
        const orbEl = document.getElementById('breath-orb');
        if (orbEl && orbEl.dataset.state === 'running') {
          const sVal = parseFloat(orbEl.style.getPropertyValue('--breath-scale')) || 1;
          sculpture.scale.setScalar(sVal);
        } else {
          sculpture.scale.setScalar(1 + Math.sin(sceneTime * 1.05) * 0.05);
        }
      }
      camera.position.x = scenePointerX * .13; camera.position.y = -scenePointerY * .1; camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    });
    if (reduced) { cancelAnimationFrame(raf); raf = 0; }
  }
  function start() { if (!raf && !document.hidden) raf = requestAnimationFrame(animate); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start(); });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); raf = 0; });
  window.addEventListener('pageshow', start);
  createScene('hero-gl', 'hero'); createScene('service-gl', 'service'); createScene('breath-gl', 'breath'); start();
})();
}
