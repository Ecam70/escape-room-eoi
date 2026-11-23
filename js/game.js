/* Lógica del juego: cámara, interacción, puzzles, inventario y pistas de Vicenta */
(function () {
  const ER = window.ER, $ = id => document.getElementById(id), PI = Math.PI;
  let renderer, scene, camera, composer, outline, R, uvSpot, envBase = .4;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(0, 0), HOME = new THREE.Vector3(0, 1.62, 1.35);
  const LIMIT = 35 * 60, LBKEY = 'er_leaderboard_v1', keys = {};
  const S = ER.S = {
    started: false, over: false, t0: 0, hints: 0, zone: 'home', inv: [], sel: null, uv: false, uvK: 0,
    clock: 190, solved: {}, stack: [], colors: [5, 3, 0, 2], dials: [0, 0, 0], placed: {}, flags: {}, hintLvl: {}, cardIn: false, coffee: 0
  };
  let yaw = 0, pitch = -.05, camBusy = false, zoneCamCur = null, ov = null, hoverIt = null, mouseMoved = true;
  const par = new THREE.Vector2();

  /* ---------- utilidades ---------- */
  const tweens = [], eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eout = t => 1 - Math.pow(1 - t, 3);
  const tw = (dur, fn, done, ease) => tweens.push({ t: 0, dur, fn, done, ease: ease || eio });
  const later = (ms, fn) => setTimeout(fn, ms);
  const has = id => S.inv.includes(id);
  const visibleChain = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };

  /* ---------- sonido (sintetizado) ---------- */
  let AC = null, master = null, muted = false;
  function audioInit() {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination);
      const pad = AC.createGain(); pad.gain.value = .028; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; pad.connect(lp); lp.connect(master);
      [110, 164.8, 220.4, 246.9, 329.2].forEach((f, i) => { const o = AC.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; const g = AC.createGain(); g.gain.value = .5; const l = AC.createOscillator(); l.frequency.value = .05 + i * .023; const lg = AC.createGain(); lg.gain.value = .45; l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(pad); o.start(); l.start(); });
    } catch (e) { AC = null; }
  }
  function tone(f, d, type, vol, at, slide) {
    if (!AC) return; const t = AC.currentTime + (at || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .2, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05);
  }
  const sfx = {
    click: () => tone(620, .06, 'triangle', .12), tick: () => tone(1500, .03, 'square', .05),
    pick: () => { tone(660, .1, 'sine', .18); tone(990, .16, 'sine', .16, .07); },
    ok: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .32, 'triangle', .17, i * .09)),
    err: () => { tone(160, .22, 'sawtooth', .12); tone(120, .28, 'sawtooth', .1, .1); },
    open: () => { tone(220, .5, 'sine', .14, 0, 90); tone(880, .08, 'square', .05); },
    page: () => tone(300, .12, 'triangle', .06, 0, 900), uv: () => tone(90, .6, 'sine', .2, 0, 240),
    win: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .7, 'triangle', .18, i * .13))
  };

  /* ---------- mensajes ---------- */
  let capT = 0;
  function say(t, ms) { const c = $('caption'); c.textContent = t; c.classList.add('on'); clearTimeout(capT); capT = setTimeout(() => c.classList.remove('on'), ms || Math.max(3800, t.length * 62)); }
  let vicT = 0, talkUntil = 0;
  function vicSay(text, btns, sticky) {
    $('vicbubble').classList.remove('hidden'); $('victext').textContent = text; talkUntil = performance.now() + Math.min(4200, 900 + text.length * 22);
    const bb = $('vicbtns'); bb.innerHTML = '';
    (btns || []).forEach(b => { const e = document.createElement('button'); e.textContent = b[0]; if (b[2]) e.className = 'pri'; e.onclick = ev => { ev.stopPropagation(); sfx.click(); b[1](); }; bb.appendChild(e); });
    clearTimeout(vicT); if (!sticky) vicT = setTimeout(vicHide, Math.max(7000, text.length * 85));
  }
  function vicHide() { $('vicbubble').classList.add('hidden'); clearTimeout(vicT); }

  /* ---------- pistas ---------- */
  const HINTS = {
    clock: ['Sobre la mesa hay una nota de Mabel con su plan Pomodoro. Y el reloj de la pared lleva parado toda la tarde… ¿casualidad?', 'Suma desde las 9:00: cuatro bloques de 25 minutos de foco y, entre ellos, solo tres descansos de 5.', 'Solución: 25+5+25+5+25+5+25 son 115 minutos. Pon el reloj a las 10:55.'],
    lockerMabel: ['Esa llave pequeña lleva una etiqueta con un nombre. ¿Te has fijado en las taquillas de la pared de ladrillo?', 'La llave abre la taquilla que lleva el mismo nombre que la etiqueta.', 'Solución: acércate a las taquillas y haz clic en la de «Mabel C.». Dentro hay dos cosas: llévate las dos.'],
    lego: ['Eva Seguido nos enseñó a pensar con las manos. Lee la tarjeta que hay junto a la caja de piezas: una pieza por fase, y lo primero, abajo.', 'Los colores de cada fase están en el póster de Design Thinking, encima de la cafetera. El orden de las fases lo cuenta un libro de la estantería.', 'Solución, de abajo arriba: roja (empatizar), amarilla (definir), verde (idear), naranja (prototipar) y azul (testear).'],
    hats: ['El cajón de María no tiene cerradura: tiene cuatro botones de colores. Su nota habla de un orden… y de sombreros.', 'En la estantería hay un libro sobre los seis sombreros para pensar. Cada color es una forma de pensar: traduce «hechos, emociones, riesgos, ideas nuevas».', 'Solución: blanco, rojo, negro y verde, de izquierda a derecha.'],
    laptop: ['El portátil pide una contraseña de cuatro letras y te enseña cuatro fechas. ¿Dónde has visto un calendario de talleres?', 'Busca en el programa de talleres (junto a la puerta) quién ocupó la sala en cada una de esas fechas, en ese orden. Quédate con la inicial de su apellido.', 'Solución: Conde, Inglés, Martín y Arjona. La contraseña es CIMA.'],
    lockerMireia: ['En la hoja de cálculo de Mireia hay una celda sin resolver: el punto de equilibrio. Esa cifra abre su taquilla.', 'Punto de equilibrio = costes fijos ÷ (precio − coste variable). Si dudas, hay un libro de finanzas en la estantería.', 'Solución: 1.820 ÷ (19 − 5) = 130. Marca 1-3-0 en las ruedas de la taquilla de Mireia.'],
    canvas: ['El Lean Canvas de la pizarra tiene bloques vacíos. Hay cuatro pósits repartidos por la sala: uno asoma entre las hojas de la planta; los otros están en una taquilla, en la caja de piezas y en un cajón.', 'Selecciona un pósit en el inventario y pégalo en su bloque. Pregúntate a qué responde cada uno: ¿a quién vendo?, ¿cómo cobro?, ¿en qué gasto?, ¿qué mido?', 'Solución: «Autónomos y micropymes» va en Segmentos de clientes; «Suscripción» en Flujos de ingresos; «Servidores, IA y marketing» en Estructura de costes; «Altas, CAC y churn» en Métricas clave.'],
    code: ['La puerta pide un código de cuatro cifras, y el lienzo ya está completo. En esta sala hay cosas que solo se ven con otra luz…', 'Enciende la linterna ultravioleta (clic en el inventario) y mira los pósits de la pizarra. Las cifras se leen en el orden en que se rellena un Lean Canvas: rebusca en la papelera.', 'Solución: Segmentos (2.º), Ingresos (6.º), Costes (7.º) y Métricas (8.º). El código es 3816.'],
    door: ['Para salir necesitas dos cosas: una tarjeta de coworker y un código de cuatro cifras.', 'Pasa la tarjeta por el lector del teclado y después teclea el código que esconden los pósits del Lean Canvas.', 'Solución: tarjeta, 3816 y pulsa ✓.']
  };
  function topic() {
    const s = S.solved, z = S.zone;
    if (ov === 'laptop') return s.laptop ? (s.lockerMireia ? null : 'lockerMireia') : 'laptop';
    if (z === 'clock' && !s.clock) return 'clock';
    if (z === 'lego' && !s.lego) return 'lego';
    if (z === 'drawer' && !s.hats) return 'hats';
    if (z === 'lockerMireia' && !s.lockerMireia) return 'lockerMireia';
    if (z === 'board') return s.canvas ? 'code' : 'canvas';
    if (z === 'door' || ov === 'keypad') return s.canvas && s.hats ? 'door' : null;
    return null;
  }
  function nextTopic() {
    const s = S.solved;
    if (!s.clock) return 'clock'; if (!s.lockerMabel) return 'lockerMabel'; if (!s.laptop) return 'laptop'; if (!s.lockerMireia) return 'lockerMireia';
    if (!s.lego) return 'lego'; if (!s.hats) return 'hats'; if (!s.canvas) return 'canvas'; if (!S.flags.codeSeen) return 'code'; return 'door';
  }
  function prereq(t) {
    const s = S.solved;
    if (t === 'lego' && !s.lockerMabel) return 'A esa torre le falta una pieza: alguien la guardó bajo llave. Yo empezaría por el reloj parado y la nota de Mabel.';
    if (t === 'hats' && !S.flags.maria) return 'Para ese cajón necesitas una nota de María que todavía no tienes. Está guardada en la caja de piezas de la mesa.';
    if (t === 'lockerMireia' && !s.laptop) return 'La combinación de esa taquilla está dentro del portátil de la mesa. Primero tendrás que desbloquearlo.';
    if (t === 'code' && !s.lockerMireia) return 'Te falta una herramienta para ver lo invisible. Está en la taquilla de Mireia.';
    return null;
  }
  function vicMenu() {
    if (!S.started || S.over) return; sfx.click();
    vicSay('¿Te has atascado? Te oriento sin destriparte la solución… salvo que me la pidas.', [['Dame una pista', giveHint, 1], ['Ahora no', vicHide]], true);
  }
  function giveHint() {
    let t = topic() || nextTopic(); const p = prereq(t);
    S.hints++; $('hintcount').textContent = S.hints;
    if (p) return vicSay(p, [['Gracias', vicHide, 1]], true);
    const lvl = Math.min(S.hintLvl[t] || 0, 2); S.hintLvl[t] = lvl + 1;
    const b = [['Gracias', vicHide, 1]]; if (lvl < 2) b.unshift([lvl === 1 ? 'Dime la solución' : 'Otra pista más', giveHint]);
    vicSay(HINTS[t][lvl], b, true);
  }

  /* ---------- inventario ---------- */
  const svg = s => `<svg viewBox="0 0 48 48">${s}</svg>`;
  const ITEMS = {
    key: { name: 'Llave pequeña', desc: 'Lleva una etiqueta: «Mabel C.». Se usará sola donde encaje.', icon: svg('<circle cx="15" cy="17" r="8" fill="none" stroke="#e2b64a" stroke-width="4"/><path d="M21 22 38 39M31 32l5-5M35 36l4-4" stroke="#e2b64a" stroke-width="4" stroke-linecap="round"/>') },
    brick: { name: 'Pieza azul', desc: 'Una pieza de construcción. Alguien la apartó de su caja.', icon: svg('<rect x="6" y="20" width="36" height="18" rx="2" fill="#2e6fd8"/><rect x="10" y="14" width="8" height="6" rx="1" fill="#2e6fd8"/><rect x="20" y="14" width="8" height="6" rx="1" fill="#2e6fd8"/><rect x="30" y="14" width="8" height="6" rx="1" fill="#2e6fd8"/>') },
    paper: { name: 'Papel arrugado', desc: 'Apuntes rescatados de la papelera. Clic para leer.', doc: 'bin', icon: svg('<path d="M10 8l10-3 9 4 9-2 3 14-4 10 3 9-12 3-10-3-9 2-2-13 3-11z" fill="#efece4" stroke="#b8b2a4" stroke-width="1.5"/><path d="M16 18h16M15 25h18M17 32h12" stroke="#9aa2b4" stroke-width="2"/>') },
    noteMaria: { name: 'Nota de María', desc: 'Una nota doblada. Clic para leer.', doc: 'maria', icon: svg('<rect x="9" y="7" width="30" height="34" rx="2" fill="#fdf3e3" stroke="#d6c7a8" stroke-width="1.5"/><path d="M14 16h20M14 22h20M14 28h14" stroke="#1d3f8f" stroke-width="2"/><path d="M26 36h9" stroke="#b3261e" stroke-width="2"/>') },
    uv: { name: 'Linterna ultravioleta', desc: 'Clic para encenderla o apagarla. Revela tintas invisibles.', icon: svg('<rect x="8" y="20" width="22" height="9" rx="3" fill="#2a2d35"/><path d="M30 18l9-4v21l-9-4z" fill="#8d939c"/><circle cx="40" cy="24.500" r="3.500" fill="#a16bff"/><path d="M44 17l3-2M45 24.500h3M44 32l3 2" stroke="#a16bff" stroke-width="2" stroke-linecap="round"/>') },
    card: { name: 'Tarjeta de coworker', desc: 'Tarjeta de acceso del Coworking EOI. Sirve para el lector de la puerta.', icon: svg('<rect x="5" y="12" width="38" height="25" rx="3" fill="#fafafa"/><rect x="5" y="17" width="38" height="6" fill="#ff5a4e"/><rect x="10" y="28" width="14" height="3" fill="#9aa2b4"/><text x="29" y="33" font-size="7" font-weight="800" fill="#1b2130">EOI</text>') }
  };
  for (const k in ER.POSTITS) ITEMS[k] = { name: ER.POSTITS[k].name, desc: '«' + ER.POSTITS[k].text + '». Selecciónalo y pégalo donde corresponda.', postit: true };
  function give(id, quiet) { if (has(id)) return; S.inv.push(id); renderInv(); if (!quiet) sfx.pick(); }
  function drop(id) { S.inv = S.inv.filter(i => i !== id); if (S.sel === id) S.sel = null; renderInv(); }
  function renderInv() {
    const el = $('inv'); el.innerHTML = '';
    S.inv.forEach(id => {
      const it = ITEMS[id], d = document.createElement('div'); d.className = 'slot' + (S.sel === id ? ' sel' : '') + (id === 'uv' && S.uv ? ' uvon' : '');
      d.innerHTML = it.postit ? `<div class="pi" style="background:${ER.POSTITS[id].color}">${ER.POSTITS[id].text}</div>` : it.icon;
      d.onmouseenter = () => { const i = $('invinfo'); i.innerHTML = `<b>${it.name}</b> · ${it.desc}`; i.classList.add('on'); };
      d.onmouseleave = () => $('invinfo').classList.remove('on');
      d.onclick = e => { e.stopPropagation(); invClick(id); };
      el.appendChild(d);
    });
  }
  function invClick(id) {
    const it = ITEMS[id]; sfx.click();
    if (it.doc) return showDoc(it.doc);
    if (id === 'uv') return toggleUV();
    if (it.postit) { S.sel = S.sel === id ? null : id; renderInv(); if (S.sel && S.zone !== 'board') say('Pósit seleccionado. Acércate a la pizarra para pegarlo en un bloque del Lean Canvas.'); return; }
    say(it.name + ': ' + it.desc);
  }
  function toggleUV() {
    S.uv = !S.uv; sfx.uv(); renderInv(); $('uvvig').classList.toggle('on', S.uv);
    const a = S.uvK, b = S.uv ? 1 : 0; tw(.7, t => { S.uvK = a + (b - a) * t; applyDim(); });
    if (S.uv && !S.flags.uvFirst) { S.flags.uvFirst = 1; vicSay('¡Luz ultravioleta! Con ella aparecen tintas que a simple vista no existen. Pasea el haz por la sala: mueve el ratón.'); }
  }
  function applyDim() {
    const k = 1 - S.uvK * .9;
    ER.lights.forEach(l => l.intensity = l.userData.base * k); scene.environmentIntensity = envBase * k;
    ER.glows.forEach(g => g.m.color.copy(g.base).multiplyScalar(Math.max(k, .12)));
    uvSpot.intensity = 11 * S.uvK;
  }

  /* ---------- overlays ---------- */
  function openOv(kind, node, onClose) { ov = kind; const b = $('ovbox'); b.innerHTML = ''; b.appendChild(node); $('overlay').classList.remove('hidden'); $('overlay')._close = onClose; hover(null); }
  function closeOv() { if (!ov) return; const c = $('overlay')._close; ov = null; $('overlay').classList.add('hidden'); $('ovbox').innerHTML = ''; if (c) c(); }
  function showDoc(id) {
    const d = ER.docs[id], w = document.createElement('div'); w.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';
    d.c.className = 'doc'; w.appendChild(d.c); const cap = document.createElement('div'); cap.className = 'doccap'; cap.textContent = d.cap + ' · clic fuera para cerrar'; w.appendChild(cap);
    sfx.page(); openOv('doc', w);
  }
  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };

  // --- portátil ---
  let ltPw = '';
  function openLaptop() {
    const box = el('<div class="laptop"></div>'); openOv('laptop', box); renderLaptop(box);
  }
  function renderLaptop(box) {
    box = box || document.querySelector('.laptop'); if (!box) return;
    if (!S.solved.laptop) {
      ltPw = '';
      box.innerHTML = `<div class="lt-login"><div class="lt-user">F</div><div class="lt-name">Coworker · proyecto FacturIA</div>
        <div class="lt-pass" id="ltp"><div></div><div></div><div></div><div></div></div>
        <div class="lt-hint">Pista de contraseña: <b>«Cuatro tardes, cuatro ponentes. De cada uno, la inicial de su APELLIDO.»</b></div>
        <div class="lt-dates"><div><i>ABR</i>29</div><div><i>JUN</i>11</div><div><i>ABR</i>16</div><div><i>JUL</i>02</div></div>
        <div class="kb" id="ltkb"></div></div>`;
      const kb = box.querySelector('#ltkb');
      ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM⌫'].forEach(r => { const row = document.createElement('div'); [...r].forEach(ch => { const b = document.createElement('button'); b.textContent = ch; if (ch === '⌫') b.className = 'w'; b.onclick = () => ltKey(ch); row.appendChild(b); }); kb.appendChild(row); });
    } else {
      box.innerHTML = `<div class="lt-desk"><div class="lt-tabs"><button class="on" data-t="x">Finanzas_FacturIA.xlsx</button><button data-t="a">Agente IA del proyecto</button></div><div class="lt-body" id="ltb"></div></div>`;
      const tabs = box.querySelectorAll('.lt-tabs button'), body = box.querySelector('#ltb');
      const show = t => {
        tabs.forEach(b => b.classList.toggle('on', b.dataset.t === t));
        body.innerHTML = t === 'x' ? `<table class="sheet"><tr><th></th><th>A</th><th>B</th></tr>
          <tr class="h"><th>1</th><td>FacturIA · modelo de suscripción</td><td>Valor</td></tr>
          <tr><th>2</th><td>Precio de la suscripción (por cliente y mes)</td><td class="n">19 €</td></tr>
          <tr><th>3</th><td>Coste variable (por cliente y mes)</td><td class="n">5 €</td></tr>
          <tr><th>4</th><td>Costes fijos (al mes)</td><td class="n">1.820 €</td></tr>
          <tr><th>5</th><td><b>Punto de equilibrio (clientes al mes)</b></td><td class="q">¿ ? ? ?</td></tr>
          <tr><th>6</th><td colspan="2" class="note">Taller 10 · «Si no sabéis cuántos clientes necesitáis para no perder dinero, no tenéis un negocio: tenéis un hobby caro. Calculadlo. Por cierto: esa cifra es también la combinación de mi taquilla.» — Mireia B.</td></tr></table>`
          : `<div class="chat"><small>Agente configurado en el taller 6 · «IA aplicada a la gestión del proyecto» (Pedro Martín)</small>
          <div class="u">Resume lo que me falta para el Demo Day.</div>
          <div class="a">1) El Lean Canvas de la pizarra tiene cuatro bloques vacíos. 2) El pitch está listo. 3) La sala se bloquea a las 22:30: para salir hacen falta la tarjeta de coworker y un código.</div>
          <div class="u">¿Y cuál es el código?</div>
          <div class="a">No lo tengo. Solo consta que alguien lo dejó escrito «donde todos lo miran y nadie lo ve». Mi hipótesis: hace falta otra luz. En la taquilla de Mireia había algo que podría servir.</div></div>`;
      };
      tabs.forEach(b => b.onclick = () => { sfx.click(); show(b.dataset.t); }); show('x');
    }
  }
  function ltKey(ch) {
    if (S.solved.laptop || ov !== 'laptop') return; const p = $('ltp'); if (!p || p.classList.contains('err')) return;
    if (ch === '⌫') ltPw = ltPw.slice(0, -1); else if (ltPw.length < 4) ltPw += ch; sfx.tick();
    [...p.children].forEach((d, i) => d.textContent = ltPw[i] || '');
    if (ltPw.length === 4) {
      if (ltPw === 'CIMA') { solve('laptop'); ER.drawLaptop(true); later(350, () => renderLaptop()); later(900, () => vicSay('¡Contraseña correcta! «Cima»… muy apropiado. Echa un ojo a esa hoja de cálculo y al agente de IA.')); }
      else { sfx.err(); p.classList.add('err'); later(550, () => { ltPw = ''; p.classList.remove('err'); [...p.children].forEach(d => d.textContent = ''); }); }
    }
  }

  // --- teclado de la puerta ---
  let kpCode = '';
  function openKeypad() {
    kpCode = '';
    const k = el(`<div class="keypad"><div class="kp-disp sm" id="kpd"></div><button class="kp-card" id="kpc"><b></b><span></span></button><div class="kp-grid" id="kpg"></div></div>`);
    openOv('keypad', k);
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].forEach(ch => { const b = document.createElement('button'); b.textContent = ch; if (ch === 'C') b.className = 'c'; if (ch === '✓') b.className = 'ok'; b.onclick = () => kpKey(ch); $('kpg').appendChild(b); });
    $('kpc').onclick = () => {
      if (S.cardIn) return; if (!has('card')) { sfx.err(); return say('El lector espera una tarjeta de coworker. No llevas ninguna encima.'); }
      S.cardIn = true; drop('card'); sfx.ok(); kpDraw();
    };
    kpDraw();
  }
  function kpDraw(msg, err) {
    const d = $('kpd'); if (!d) return; d.classList.toggle('err', !!err);
    if (msg) { d.classList.add('sm'); d.textContent = msg; }
    else if (!S.cardIn) { d.classList.add('sm'); d.textContent = 'ACERQUE SU TARJETA'; }
    else { d.classList.remove('sm'); d.textContent = (kpCode + '----').slice(0, 4).split('').join(' '); }
    const c = $('kpc'); c.classList.toggle('ok', S.cardIn); c.querySelector('span').textContent = S.cardIn ? 'Tarjeta de coworker validada' : 'Lector de tarjetas · haz clic para pasar la tuya';
  }
  function kpKey(ch) {
    if (S.over) return;
    if (!S.cardIn) { sfx.err(); kpDraw('TARJETA NO DETECTADA', true); later(900, () => kpDraw()); return; }
    if (ch === 'C') { kpCode = ''; sfx.tick(); return kpDraw(); }
    if (ch === '✓') {
      if (kpCode === '3816') return win();
      sfx.err(); kpCode = ''; kpDraw('CÓDIGO INCORRECTO', true); later(1000, () => kpDraw()); return;
    }
    if (kpCode.length < 4) { kpCode += ch; sfx.tick(); kpDraw(); }
  }

  /* ---------- progreso ---------- */
  function solve(k) { S.solved[k] = true; sfx.ok(); $('progress').textContent = Object.keys(S.solved).length + '/8'; }
  function collect(id, mesh, msg) { mesh.visible = false; give(id); hover(null); if (msg) say(msg); }

  /* ---------- puzzles ---------- */
  function setClock(animate) {
    const m = S.clock, a = -(m % 60) / 60 * 2 * PI, b = -(m % 720) / 720 * 2 * PI;
    R.mHand.rotation.z = a; R.hHand.rotation.z = b;
    const h = Math.floor(m / 60) % 12 || 12; $('clockread').textContent = h + ':' + String(m % 60).padStart(2, '0');
  }
  let clockT = 0;
  function clockStep(d) {
    if (S.solved.clock) return; S.clock = ((S.clock + d) % 720 + 720) % 720; sfx.tick(); setClock();
    clearTimeout(clockT); if (S.clock === 655) clockT = setTimeout(() => {
      if (S.clock !== 655 || S.solved.clock) return; solve('clock'); $('clockctrl').classList.add('hidden'); sfx.open();
      tw(1.4, t => R.clockHinge.rotation.y = PI - 1.75 * t, () => { R.items.key.visible = true; say('El reloj gira sobre una bisagra. Detrás hay un hueco… y una llave colgada.'); });
    }, 650);
  }
  function moveBrick(b, pos, ry, dur) {
    const g = b.g, a = g.position.clone(), r0 = g.rotation.y, lift = .16;
    tw(dur || .45, t => { g.position.lerpVectors(a, pos, t); g.position.y += Math.sin(t * PI) * lift; g.rotation.y = r0 + (ry - r0) * t; }, null, eout);
  }
  const ORDER = ['red', 'yellow', 'green', 'orange', 'blue'];
  function brickClick(k) {
    if (S.solved.lego || S.flags.legoBusy) return; const i = S.stack.indexOf(k);
    if (i >= 0) { S.stack.splice(i).forEach(n => moveBrick(R.bricks[n], R.bricks[n].home, R.bricks[n].ry)); sfx.click(); return; }
    S.stack.push(k); sfx.click();
    moveBrick(R.bricks[k], R.stackBase.clone().add(new THREE.Vector3(0, (S.stack.length - 1) * R.BH, 0)), 0);
    if (S.stack.length === 5) {
      S.flags.legoBusy = 1;
      later(700, () => {
        S.flags.legoBusy = 0;
        if (S.stack.join() === ORDER.join()) {
          solve('lego'); sfx.open(); R.items.pi_cost.visible = R.items.noteMaria.visible = true;
          tw(.9, t => R.legoDrawer.position.z = .141 + .21 * t, () => vicSay('¡Empatizar, definir, idear, prototipar y testear! La caja ha soltado un cajoncito: mira lo que hay dentro.'));
        } else { sfx.err(); S.stack.splice(0).forEach(n => moveBrick(R.bricks[n], R.bricks[n].home, R.bricks[n].ry, .6)); say('La torre se tambalea y se desmonta. Ese no es el orden del proceso.'); }
      });
    }
  }
  function paintBtns() { R.cbtns.forEach((b, i) => b.material.color.setHex(R.COLORS[S.colors[i]])); }
  function cbtn(i) {
    if (S.solved.hats) return; S.colors[i] = (S.colors[i] + 1) % 6; paintBtns(); sfx.tick();
    const b = R.cbtns[i]; tw(.15, t => b.position.z = .018 - Math.sin(t * PI) * .008);
    if (S.colors.join() === '0,1,2,4') later(350, () => {
      if (S.solved.hats || S.colors.join() !== '0,1,2,4') return; solve('hats'); sfx.open(); R.items.card.visible = R.items.pi_ing.visible = true;
      tw(1.0, t => R.drawer.position.z = .455 + .34 * t, () => say('Clic. El cajón de María se desliza: dentro hay una tarjeta y un pósit.'));
    });
  }
  function dial(i) {
    if (S.solved.lockerMireia) return; S.dials[i] = (S.dials[i] + 1) % 10; R.dials[i].material.map = ER.T.digits[S.dials[i]]; R.dials[i].material.needsUpdate = true; sfx.tick();
    if (S.dials.join('') === '130') later(450, () => {
      if (S.solved.lockerMireia || S.dials.join('') !== '130') return; solve('lockerMireia'); sfx.open(); R.items.uv.visible = true;
      tw(1.1, t => R.lockerDoors[3].rotation.y = -1.95 * t, () => say('130 clientes: el punto de equilibrio. La taquilla de Mireia se abre.'));
    });
  }
  function locker(i) {
    const n = ['María', 'Mabel', 'Carol', 'Mireia', 'Raquel', 'Ramón'][i];
    if (i === 3) return enterZone('lockerMireia');
    if (i === 1) {
      if (S.solved.lockerMabel) return;
      if (!has('key')) { sfx.err(); return say('La taquilla de Mabel está cerrada con una cerradura de llave pequeña.'); }
      drop('key'); solve('lockerMabel'); sfx.open(); R.items.brick.visible = R.items.pi_met.visible = true;
      return tw(1.1, t => R.lockerDoors[1].rotation.y = -1.95 * t, () => say('La llave gira. Dentro hay una pieza azul y un pósit rosa.'));
    }
    sfx.err(); say('La taquilla de ' + n + ' está cerrada. No parece que te haga falta.');
  }
  function blockClick(k) {
    const name = ER.BOARD.blocks[k].t;
    const sel = S.sel && ITEMS[S.sel].postit ? S.sel : null;
    if (!sel) return say(S.inv.some(i => ITEMS[i].postit) ? 'Bloque «' + name + '». Selecciona primero un pósit del inventario.' : 'Bloque «' + name + '» del Lean Canvas.');
    if (S.placed[k]) { sfx.err(); return say('Ese bloque ya tiene un pósit pegado.'); }
    const m = R.postits[sel]; S.placed[k] = sel; drop(sel); m.position.copy(R.slots[k]); m.rotation.z = (Math.random() - .5) * .16; m.visible = true; sfx.pick();
    tw(.3, t => m.scale.setScalar(.5 + .5 * t), null, eout);
    const P = ER.POSTITS, ok = Object.keys(P).every(id => S.placed[P[id].block] === id);
    if (ok) { solve('canvas'); later(600, () => vicSay('¡Lienzo completo! Clientes, ingresos, costes y métricas, cada cosa en su bloque. Pero el código de la puerta sigue sin aparecer… y aquí hay algo que no se ve a simple vista.')); }
    else if (Object.keys(S.placed).length === 4) later(400, () => say('Los cuatro pósits están pegados, pero algo no encaja. Haz clic en uno para despegarlo.'));
  }
  function postitClick(id) {
    if (S.solved.canvas) return say(S.uv ? 'La tinta ultravioleta marca una cifra en cada pósit.' : '«' + ER.POSTITS[id].text + '». Está en su sitio.');
    for (const k in S.placed) if (S.placed[k] === id) delete S.placed[k];
    R.postits[id].visible = false; give(id);
  }
  function coffee() {
    S.coffee++; tone(180, 1.2, 'sawtooth', .04, 0, 140); tone(2400, .9, 'sine', .015, .2);
    say(['Te preparas un café. Con cafeína se piensa mejor… aunque la salida no está en la cafetera.', 'Segundo café. Mabel diría que esto no cuenta como descanso del pomodoro.', 'Tercer café. Quizá sea mejor pedirle una pista a Vicenta.'][Math.min(S.coffee - 1, 2)]);
  }

  /* ---------- acciones por objeto ---------- */
  function act(it) {
    const id = it.id, p = id.split(':');
    switch (p[0]) {
      case 'tv': return vicMenu();
      case 'board': case 'lockers': case 'clock': case 'door': case 'shelf': case 'lego': return enterZone(id);
      case 'sideboard': return enterZone('drawer');
      case 'window': return say('Madrid de noche. Las cuatro torres al fondo… y tú aquí, encerrado con tu pitch.');
      case 'coffee': return coffee();
      case 'dtposter': return showDoc('dt');
      case 'program': return showDoc('program');
      case 'talks': return showDoc('talks');
      case 'note': return showDoc('mabel');
      case 'legocard': return showDoc('legocard');
      case 'book': return showDoc('b_' + p[1]);
      case 'hats': return say('Seis sombreros: amarillo, negro, azul, blanco, verde y rojo. María Calvo los usó en su taller de creatividad.');
      case 'laptop': sfx.click(); return openLaptop();
      case 'bin': if (S.flags.bin) return say('Solo quedan vasos de café y un borrador de pitch muy mejorable.'); S.flags.bin = 1; R.binPaper.visible = false; give('paper'); return showDoc('bin');
      case 'plant': if (S.flags.plant) return say('Una planta muy bien cuidada. Ya no esconde nada.'); S.flags.plant = 1; R.plantPostit.visible = false; give('pi_seg'); return say('Entre las hojas había un pósit amarillo: «Autónomos y micropymes».');
      case 'blk': return blockClick(p[1]);
      case 'postit': return postitClick(p[1]);
      case 'locker': return locker(+p[1]);
      case 'dial': return dial(+p[1]);
      case 'brick': return brickClick(p[1]);
      case 'cbtn': return cbtn(+p[1]);
      case 'keypad': sfx.click(); return openKeypad();
      case 'doorleaf': sfx.err(); return say('Cerrada. La cerradura la controla el teclado electrónico que hay junto al marco.');
      case 'item': {
        const k = p[1], m = R.items[k];
        if (k === 'noteMaria') { S.flags.maria = 1; collect(k, m); return showDoc('maria'); }
        const msg = { key: 'Una llave pequeña con una etiqueta: «Mabel C.».', brick: 'Una pieza azul. A la caja de la mesa le faltaba una…', uv: 'Una linterna de luz ultravioleta. Enciéndela desde el inventario.', card: 'Una tarjeta de coworker del Coworking EOI. Justo lo que pide la puerta.' }[k];
        return collect(k, m, msg || 'Pósit: «' + ER.POSTITS[k].text + '».');
      }
    }
  }

  /* ---------- cámara y zonas ---------- */
  function zoneCam(z) {
    const Zd = ER.zones[z]; if (Zd.pos) return { pos: Zd.pos.clone(), look: Zd.look.clone() };
    const vf = THREE.MathUtils.degToRad(55) / 2, dist = Math.min(6.5, Math.max(Zd.h / 2 / Math.tan(vf), Zd.w / 2 / (Math.tan(vf) * camera.aspect)) * 1.16);
    const pos = Zd.c.clone().addScaledVector(Zd.n, dist); pos.y += Zd.elev || 0; return { pos, look: Zd.c.clone() };
  }
  const qTmp = new THREE.Object3D();
  function flyTo(pos, look, quat, done) {
    camBusy = true; hover(null);
    const p0 = camera.position.clone(), q0 = camera.quaternion.clone(), f0 = camera.fov; let q1 = quat;
    if (!q1) { qTmp.position.copy(pos); qTmp.up.set(0, 1, 0); qTmp.lookAt(look); qTmp.rotateY(PI); q1 = qTmp.quaternion.clone(); }
    tw(.95, t => { camera.position.lerpVectors(p0, pos, t); camera.quaternion.slerpQuaternions(q0, q1, t); camera.fov = f0 + (55 - f0) * t; camera.updateProjectionMatrix(); }, () => { camBusy = false; mouseMoved = true; if (done) done(); });
  }
  function enterZone(z) {
    if (camBusy) return; sfx.click(); S.zone = z; zoneCamCur = null; const c = zoneCam(z); par.set(0, 0);
    $('back').classList.add('on'); $('clockctrl').classList.toggle('hidden', !(z === 'clock' && !S.solved.clock));
    flyTo(c.pos, c.look, null, () => {
      zoneCamCur = c;
      if (z === 'lego' && has('brick')) { drop('brick'); R.bricks.blue.g.visible = true; sfx.pick(); say('Dejas la pieza azul sobre la mesa, con las demás.'); }
      if (z === 'board' && S.solved.canvas && S.uv) S.flags.codeSeen = 1;
    });
  }
  function exitZone() {
    if (camBusy || S.zone === 'home') return; const Zd = ER.zones[S.zone];
    if (Zd.parent) return enterZone(Zd.parent);
    const look = zoneCamCur ? zoneCamCur.look : new THREE.Vector3(0, 1.4, -4); sfx.click();
    const d = look.clone().sub(HOME); yaw = Math.atan2(-d.x, -d.z); pitch = THREE.MathUtils.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -.45, .35);
    S.zone = 'home'; zoneCamCur = null; $('back').classList.remove('on'); $('clockctrl').classList.add('hidden');
    flyTo(HOME, null, new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')));
  }

  /* ---------- selección con el ratón ---------- */
  function pick() {
    if (ov || camBusy || !S.started || S.over) return null;
    ray.setFromCamera(mouse, camera);
    for (const h of ray.intersectObjects(ER.clickables, true)) {
      if (!visibleChain(h.object)) continue; let o = h.object;
      while (o) { const it = o.userData.it; if (it && it.zone === S.zone) return it; o = o.parent; }
    }
    return null;
  }
  function hover(it) {
    if (it === hoverIt) return; hoverIt = it; const cv = $('gl'), tt = $('tooltip');
    cv.classList.toggle('hot', !!it); outline.selectedObjects = it ? [it.obj] : [];
    if (it) { tt.textContent = it.label; tt.style.opacity = 1; } else tt.style.opacity = 0;
  }
  function bindInput() {
    const cv = $('gl'); let down = null, moved = 0;
    const setM = e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; mouseMoved = true; const tt = $('tooltip'); tt.style.left = Math.min(e.clientX + 16, innerWidth - 240) + 'px'; tt.style.top = e.clientY + 18 + 'px'; };
    cv.addEventListener('pointerdown', e => { if (e.button !== 0) return; down = { x: e.clientX, y: e.clientY }; moved = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      setM(e);
      if (down) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y; moved += Math.abs(dx) + Math.abs(dy); down.x = e.clientX; down.y = e.clientY;
        if (moved > 6 && S.zone === 'home' && !camBusy && S.started) { cv.classList.add('drag'); yaw += dx * .0034; pitch = THREE.MathUtils.clamp(pitch + dy * .0034, -1.0, .75); hover(null); }
      }
    });
    cv.addEventListener('pointerup', e => {
      cv.classList.remove('drag'); if (!down) return; down = null; setM(e);
      if (moved <= 6) { const it = pick(); if (it) act(it); }
    });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); exitZone(); });
    cv.addEventListener('wheel', e => { if (S.zone !== 'home' || camBusy) return; camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * .03, 32, 60); camera.updateProjectionMatrix(); }, { passive: true });
    addEventListener('keydown', e => {
      if (MOVE.includes(e.code) && !ov && S.started && !S.over && e.target.tagName !== 'INPUT') { keys[e.code] = true; e.preventDefault(); return; }
      if (e.key === 'Escape') { if (ov) closeOv(); else exitZone(); return; }
      if (ov === 'laptop' && !S.solved.laptop) { const k = e.key.toUpperCase(); if (/^[A-ZÑ]$/.test(k)) ltKey(k); else if (e.key === 'Backspace') ltKey('⌫'); }
      if (ov === 'keypad') { if (/^[0-9]$/.test(e.key)) kpKey(e.key); else if (e.key === 'Enter') kpKey('✓'); else if (e.key === 'Backspace') kpKey('C'); }
    });
    addEventListener('keyup', e => { delete keys[e.code]; });
    addEventListener('blur', () => { for (const k in keys) delete keys[k]; });
    $('back').onclick = exitZone;
    $('overlay').addEventListener('pointerdown', e => { if (e.target === $('overlay') || e.target === $('ovclose') || (ov === 'doc')) closeOv(); });
    $('vicbtn').onclick = vicMenu;
    document.querySelectorAll('#clockctrl button').forEach(b => b.onclick = () => clockStep(+b.dataset.d));
    $('btn-sound').onclick = () => { muted = !muted; if (master) master.gain.value = muted ? 0 : .5; $('btn-sound').classList.toggle('off', muted); };
    $('btn-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); };
    $('btn-help').onclick = () => openOv('help', el(`<div class="help"><h3>Cómo se juega</h3><ul>
      <li><b>Arrastra</b> para mirar la sala. La <b>rueda</b> acerca la vista.</li><li>Con las <b>flechas</b> (o W, A, S, D) caminas por la sala: ↑ y ↓ avanzan y retroceden, ← y → giran.</li><li><b>Clic</b> en un objeto resaltado para acercarte o usarlo. <b>Volver</b> (o clic derecho) te devuelve a donde estabas.</li>
      <li>Tienes <b>35 minutos</b> para salir: el contador de arriba marca lo que te queda.</li>
      <li>Los objetos que recoges van al <b>inventario</b>. Los pósits se seleccionan y se pegan; las notas se leen con un clic; la linterna se enciende y se apaga.</li>
      <li><b>Vicenta</b> (abajo a la derecha, o en la pantalla de la pared) da pistas en tres niveles: orientación, empujón y solución.</li></ul></div>`));
    $('again').onclick = () => location.reload();
    addEventListener('resize', resize);
  }
  function resize() {
    const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h);
    if (S.zone !== 'home' && zoneCamCur && !camBusy) { zoneCamCur = zoneCam(S.zone); camera.position.copy(zoneCamCur.pos); }
  }

  /* ---------- final ---------- */
  function win() {
    S.over = true; solve('door'); closeOv(); vicHide(); hover(null); sfx.win();
    const secs = Math.min(LIMIT, Math.floor((performance.now() - S.t0) / 1000));
    const mine = lbAdd(S.name, secs);
    if (S.uv) toggleUV();
    R.corridor.visible = true;
    tw(2.6, t => { R.doorPivot.rotation.y = 1.4 * t; R.corrLight.intensity = 90 * t; });
    later(1500, () => $('fade').classList.add('on'));
    later(3400, () => {
      $('hud').classList.add('hidden'); $('end').classList.remove('hidden'); $('fade').classList.remove('on');
      $('endtime').textContent = fmt(secs); $('endhints').textContent = S.hints;
      const stars = S.hints <= 1 && secs < 1800 ? 3 : S.hints <= 5 && secs < 3000 ? 2 : 1; $('endrank').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      ER.drawVicenta($('endavatar').getContext('2d'), 0, 0, 160, {});
      $('endmsg').textContent = '«' + ['Has salido, que no es poco. Mañana, en el Demo Day, confía en lo que has aprendido: sabes más de lo que crees.', 'Muy bien resuelto. Gestionas el tiempo, ordenas las ideas y haces números: tu proyecto está en buenas manos.', '¡Impecable! Ni Mabel habría gestionado mejor el tiempo. Mañana el Demo Day es tuyo.'][stars - 1] + '» — Vicenta';
      lbRender(mine);
    });
  }
  function timeout() {
    S.over = true; closeOv(); vicHide(); hover(null); sfx.err(); if (S.uv) toggleUV();
    const mine = lbAdd(S.name, null);
    later(700, () => {
      $('hud').classList.add('hidden'); $('end').classList.remove('hidden');
      $('endkicker').textContent = 'Se acabó el tiempo'; $('endtitle').innerHTML = 'La sala sigue <em>cerrada</em>';
      $('endtime').textContent = fmt(LIMIT); $('endhints').textContent = S.hints; $('endrank').textContent = '☆☆☆';
      ER.drawVicenta($('endavatar').getContext('2d'), 0, 0, 160, {});
      $('endmsg').textContent = '«Han pasado los 35 minutos y la puerta no se ha abierto. No pasa nada: ya conoces la sala. Vuelve a intentarlo: seguro que la próxima vez sales a tiempo.» — Vicenta';
      lbRender(mine);
    });
  }

  /* ---------- clasificación (compartida vía Supabase si está configurada en config.js; si no, la de este navegador) ---------- */
  const LB = window.ER_LEADERBOARD || {}, lbRemote = !!(LB.url && LB.key), lbUrl = String(LB.url || '').replace(/\/+$/, '') + '/rest/v1/scores';
  const lbHead = { apikey: LB.key, Authorization: 'Bearer ' + LB.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  const lbValid = a => Array.isArray(a) ? a.filter(e => e && typeof e.name === 'string' && (e.secs === null || Number.isFinite(e.secs))) : [];   // secs null = no superado
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  function lbLoad() { try { return lbValid(JSON.parse(localStorage.getItem(LBKEY))); } catch (e) { return []; } }
  const lbFetch = (opts) => fetch(lbUrl + (opts ? '' : '?select=id,name,secs&order=secs.asc&limit=5000'), Object.assign({ headers: lbHead, cache: 'no-store' }, opts)).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  // guarda el resultado en este navegador y, si hay clasificación compartida, también en ella
  function lbAdd(name, secs) {
    const row = { id: uuid(), name, secs }, a = lbLoad(); a.push(row);
    try { localStorage.setItem(LBKEY, JSON.stringify(a)); } catch (e) { }
    const sent = lbRemote ? lbFetch({ method: 'POST', body: JSON.stringify(row) }).catch(e => { console.warn('Clasificación: no se pudo enviar el tiempo', e); }) : Promise.resolve();
    return { id: row.id, sent };
  }
  async function lbRender(mine) {
    const body = $('lbbody'), note = $('lbnote'), msg = t => body.innerHTML = '<tr><td colspan="3" class="empty">' + t + '</td></tr>';
    let rows = null; note.textContent = '';
    if (lbRemote) {
      msg('Cargando la clasificación…');
      try { if (mine) await mine.sent; rows = lbValid(await (await lbFetch()).json()); if (mine && !rows.some(r => r.id === mine.id)) throw new Error('sin fila propia'); }
      catch (e) { console.warn('Clasificación: no se pudo cargar', e); rows = null; note.textContent = 'No se ha podido conectar con la clasificación común. Se muestran solo las partidas de este navegador.'; }
    }
    const T = r => r.secs === null ? LIMIT + 1 : r.secs;   // los no superados van al final
    rows = (rows || lbLoad()).sort((a, b) => T(a) - T(b) || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })); body.innerHTML = '';
    if (!rows.length) return msg('Todavía no ha jugado nadie.');
    let pos = 0, me = null;
    rows.forEach((r, i) => {
      if (!i || T(r) !== T(rows[i - 1])) pos = i + 1;   // mismo tiempo = misma posición
      const tr = document.createElement('tr'); [r.secs === null ? '–' : pos + '.º', r.name, r.secs === null ? 'No superado' : fmt(r.secs)].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      if (mine && r.id === mine.id) { tr.className = 'me'; me = tr; } body.appendChild(tr);
    });
    if (me) me.scrollIntoView({ block: 'center' });
  }

  /* ---------- caminar por la sala ---------- */
  const MOVE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
  // muebles que no se pueden atravesar: [x0, x1, z0, z1], ya con el margen del jugador
  const BLOCKS = [[-2, 2, -1.9, .1], [-5.5, -4.7, -3.95, -1.75], [-5.5, -4.6, 0, 2.7], [-5.35, -2.45, 3.2, 4.5], [4.8, 5.5, 1.2, 3.8], [4.7, 5.5, -2.95, -.25], [4.1, 5.5, -4.5, -3.1]];
  const free = (x, z) => Math.abs(x) <= 5.1 && Math.abs(z) <= 4.1 && !BLOCKS.some(b => x > b[0] && x < b[1] && z > b[2] && z < b[3]);
  function walk(dt) {
    const f = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), r = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
    if (!f && !s && !r) return; yaw += r * 1.7 * dt; mouseMoved = true;
    if (!f && !s) return;
    const sn = Math.sin(yaw), cs = Math.cos(yaw), k = 2.3 * dt / Math.hypot(f, s), dx = (-sn * f + cs * s) * k, dz = (-cs * f - sn * s) * k;
    if (free(HOME.x + dx, HOME.z)) HOME.x += dx; if (free(HOME.x, HOME.z + dz)) HOME.z += dz;
  }
  const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

  /* ---------- bucle ---------- */
  const tmpV = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpR = new THREE.Vector3(), clock = new THREE.Clock();
  let blinkAt = 3, tvState = '', lastSec = -1;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05), now = performance.now();
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(w.ease(k)); if (k >= 1) { tweens.splice(i, 1); if (w.done) w.done(); } }
    if (!camBusy) {
      if (S.zone === 'home') { if (!S.started) yaw += dt * .06; else if (!ov && !S.over) walk(dt); camera.position.copy(HOME); camera.rotation.set(pitch, yaw, 0, 'YXZ'); }
      else if (zoneCamCur) {
        par.x += (mouse.x - par.x) * .06; par.y += (mouse.y - par.y) * .06;
        const d = zoneCamCur.pos.distanceTo(zoneCamCur.look) * .05; tmpD.copy(zoneCamCur.look).sub(zoneCamCur.pos).normalize(); tmpR.crossVectors(tmpD, camera.up).normalize();
        camera.position.copy(zoneCamCur.pos); tmpV.copy(zoneCamCur.look).addScaledVector(tmpR, par.x * d); tmpV.y += par.y * d * .6; camera.lookAt(tmpV);
      }
    }
    if (mouseMoved && !camBusy) { mouseMoved = false; hover(pick()); }
    // luz ultravioleta
    if (S.uvK > .01) {
      ray.setFromCamera(mouse, camera); tmpD.copy(ray.ray.direction); uvSpot.position.copy(camera.position); uvSpot.target.position.copy(camera.position).addScaledVector(tmpD, 4);
      for (const m of ER.uvMeshes) {
        m.visible = true; m.getWorldPosition(tmpV).sub(camera.position).normalize(); const ang = Math.acos(THREE.MathUtils.clamp(tmpV.dot(tmpD), -1, 1)), c = m.userData.cone;
        m.material.opacity = S.uvK * (1 - THREE.MathUtils.smoothstep(ang, c * .55, c));
      }
      if (S.zone === 'board' && S.solved.canvas) S.flags.codeSeen = 1;
    } else for (const m of ER.uvMeshes) m.visible = false;
    // Vicenta en la pantalla
    const t = now / 1000; let st = now < talkUntil ? (Math.floor(now / 160) % 2 ? 'talk' : '') : '';
    if (t > blinkAt) { st += 'blink'; if (t > blinkAt + .14) blinkAt = t + 2.5 + Math.random() * 3; }
    if (st !== tvState) { tvState = st; ER.drawTV({ blink: st.includes('blink'), talk: st.includes('talk') }); }
    if (S.started && !S.over) {
      const s = Math.floor((now - S.t0) / 1000), left = Math.max(0, LIMIT - s);
      if (s !== lastSec) {
        lastSec = s; $('timer').textContent = fmt(left); $('timerbox').classList.toggle('low', left <= 300);
        if (left <= 300 && left > 60 && !S.flags.warn5) { S.flags.warn5 = 1; vicSay('Quedan cinco minutos. Si estás atascado, pídeme una pista: ahora no es momento de orgullos.'); }
        if (left <= 60 && left > 0 && !S.flags.warn1) { S.flags.warn1 = 1; vicSay('¡Último minuto! Tarjeta, código y a la puerta.'); }
        if (!left) timeout();
      }
    }
    composer.render();
  }

  /* ---------- arranque ---------- */
  ER.boot = async function () {
    try { await Promise.race([Promise.all(['700 20px Outfit', '800 20px Outfit', '400 20px Outfit', '500 20px Caveat', '700 20px Caveat'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 3500))]); } catch (e) { }
    const cv = $('gl');
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x07090f);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new ADDONS.RoomEnvironment(), .04).texture; scene.environmentIntensity = envBase;
    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .05, 60); camera.position.copy(HOME); scene.add(camera);
    ER.makeTextures(); ER.buildWorld(scene); R = ER.refs;
    uvSpot = new THREE.SpotLight(0x8a4dff, 0, 14, .24, .85, 1.0); scene.add(uvSpot); scene.add(uvSpot.target);
    const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 });
    composer = new ADDONS.EffectComposer(renderer, rt); composer.setPixelRatio(Math.min(devicePixelRatio, 2)); composer.setSize(innerWidth, innerHeight);
    composer.addPass(new ADDONS.RenderPass(scene, camera));
    outline = new ADDONS.OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera); outline.edgeStrength = 3.2; outline.edgeGlow = .5; outline.edgeThickness = 1.6;
    outline.visibleEdgeColor.set(0xffffff); outline.hiddenEdgeColor.set(0x19c3b1); composer.addPass(outline);
    composer.addPass(new ADDONS.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .28, .6, 1.0));
    composer.addPass(new ADDONS.OutputPass());
    setClock(); paintBtns(); renderInv(); bindInput();
    ER.drawVicenta($('vicavatar').getContext('2d'), 0, 0, 160, {});
    ER.dbg = { scene, camera, renderer, act, win, HOME, enterZone, exitZone, give, S, look: (y, p) => { yaw = y; pitch = p; }, flush: () => { let n = 0; while (tweens.length && n++ < 50) { const w = tweens.shift(); w.fn(1); if (w.done) w.done(); } } };
    frame();
    const sb = $('start'); sb.disabled = false; sb.textContent = 'Entrar en la sala';
    const pn = $('playername'), pbox = $('player');
    try { pn.value = localStorage.getItem('er_player') || ''; } catch (e) { }
    pn.addEventListener('input', () => { $('playermsg').textContent = ''; pbox.classList.remove('err'); });
    pn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sb.click(); });
    sb.onclick = () => {
      const name = pn.value.replace(/\s+/g, ' ').trim();
      if (!name) { $('playermsg').textContent = 'Escribe tu nombre o nick para entrar.'; pbox.classList.remove('err'); void pbox.offsetWidth; pbox.classList.add('err'); pn.focus(); return; }
      S.name = name; try { localStorage.setItem('er_player', name); } catch (e) { }
      pn.blur(); audioInit(); S.started = true; S.t0 = performance.now(); $('intro').style.opacity = 0; later(900, () => $('intro').classList.add('hidden')); $('hud').classList.remove('hidden');
      yaw = ((yaw + PI) % (2 * PI)) - PI; const y0 = yaw, p0 = pitch; tw(1.6, t => { yaw = y0 * (1 - t) - .32 * t; pitch = p0 + (-.02 - p0) * t; });
      later(1900, () => vicSay('¡Hola! Soy Vicenta, la Directora del Programa. El sistema ha bloqueado la puerta, pero tranquilidad: todo lo que necesitas lo vimos en los talleres. Mira bien a tu alrededor y, si te atascas, haz clic en mi pantalla o en mi foto.', [['¡Vamos allá!', vicHide, 1]], true));
    };
  };
})();
