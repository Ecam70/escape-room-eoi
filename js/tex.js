/* Texturas procedurales y documentos del juego (todo dibujado en canvas) */
(function () {
  const ER = window.ER = window.ER || {};
  const F = "'Outfit','Helvetica Neue',Arial,sans-serif";
  const HW = "'Caveat','Bradley Hand','Comic Sans MS',cursive";
  ER.FONT = F; ER.HAND = HW;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  ER.mk = mk;
  ER.tex = (c, rep) => {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  ER.rng = rng;

  function wrap(ctx, text, x, y, maxW, lh) {
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t;
      }
      ctx.fillText(line, x, y); y += lh;
    }
    return y;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function noise(ctx, w, h, a, seed) { const r = rng(seed || 7); for (let i = 0; i < w * h / 90; i++) { ctx.fillStyle = `rgba(${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},${r() < .5 ? 0 : 255},${r() * a})`; ctx.fillRect(r() * w, r() * h, 2, 2); } }

  /* ============ VICENTA (retrato ilustrado) ============ */
  ER.drawVicenta = function (ctx, x, y, s, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 200, s / 200);
    if (o.bg !== false) {
      const g = ctx.createLinearGradient(0, 0, 200, 200); g.addColorStop(0, '#dfe5ea'); g.addColorStop(1, '#aab4bf');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'rgba(60,70,85,.25)'; ctx.fillRect(0, 0, 62, 70);
    }
    const E = (cx, cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); };
    // hombros (jersey claro)
    ctx.fillStyle = '#ece5d8'; ctx.beginPath(); ctx.moveTo(14, 200); ctx.quadraticCurveTo(18, 152, 68, 142); ctx.lineTo(132, 142); ctx.quadraticCurveTo(182, 152, 186, 200); ctx.closePath(); ctx.fill();
    // cuello
    ctx.fillStyle = '#d9a789'; ctx.fillRect(85, 120, 30, 30);
    // pelo (parte trasera)
    ctx.fillStyle = '#5a4132'; E(100, 76, 45, 46); ctx.fill();
    // orejas
    ctx.fillStyle = '#e2b295'; E(59, 94, 6, 10); ctx.fill(); E(141, 94, 6, 10); ctx.fill();
    // cara
    ctx.fillStyle = '#eec3a6'; ctx.beginPath(); ctx.moveTo(62, 84); ctx.quadraticCurveTo(60, 122, 82, 136); ctx.quadraticCurveTo(100, 144, 118, 136); ctx.quadraticCurveTo(140, 122, 138, 84); ctx.quadraticCurveTo(136, 44, 100, 44); ctx.quadraticCurveTo(64, 44, 62, 84); ctx.fill();
    // flequillo corto ladeado
    ctx.fillStyle = '#6b4c3a'; ctx.beginPath(); ctx.moveTo(58, 90); ctx.quadraticCurveTo(56, 34, 100, 32); ctx.quadraticCurveTo(146, 34, 143, 92);
    ctx.quadraticCurveTo(137, 66, 118, 60); ctx.quadraticCurveTo(96, 54, 78, 66); ctx.quadraticCurveTo(66, 74, 58, 90); ctx.fill();
    ctx.strokeStyle = 'rgba(160,120,95,.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    [[78, 44, 70, 62], [92, 38, 84, 58], [108, 38, 104, 54], [122, 42, 124, 58], [132, 52, 136, 68]].forEach(l => { ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.quadraticCurveTo((l[0] + l[2]) / 2 - 3, (l[1] + l[3]) / 2, l[2], l[3]); ctx.stroke(); });
    // mejillas
    ctx.fillStyle = 'rgba(226,120,110,.22)'; E(76, 110, 9, 6); ctx.fill(); E(124, 110, 9, 6); ctx.fill();
    // cejas
    ctx.strokeStyle = '#5a4132'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(73, 82); ctx.quadraticCurveTo(83, 77, 93, 81); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(107, 81); ctx.quadraticCurveTo(117, 77, 127, 82); ctx.stroke();
    // ojos
    if (o.blink) {
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(78, 94); ctx.quadraticCurveTo(84, 97, 90, 94); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(110, 94); ctx.quadraticCurveTo(116, 97, 122, 94); ctx.stroke();
    } else {
      ctx.fillStyle = '#fff'; E(84, 94, 5.6, 3.6); ctx.fill(); E(116, 94, 5.6, 3.6); ctx.fill();
      ctx.fillStyle = '#3a2a22'; E(84, 94, 2.9, 2.9); ctx.fill(); E(116, 94, 2.9, 2.9); ctx.fill();
      ctx.fillStyle = '#fff'; E(85, 93, .9, .9); ctx.fill(); E(117, 93, .9, .9); ctx.fill();
    }
    // gafas redondas de montura fina
    ctx.fillStyle = 'rgba(255,255,255,.14)'; E(83, 95, 14, 12); ctx.fill(); E(117, 95, 14, 12); ctx.fill();
    ctx.strokeStyle = '#8d939c'; ctx.lineWidth = 1.7; E(83, 95, 14, 12); ctx.stroke(); E(117, 95, 14, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(97, 93); ctx.quadraticCurveTo(100, 90, 103, 93); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(69, 93); ctx.lineTo(60, 90); ctx.moveTo(131, 93); ctx.lineTo(140, 90); ctx.stroke();
    // nariz y boca
    ctx.strokeStyle = 'rgba(170,110,90,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(100, 100); ctx.quadraticCurveTo(97, 111, 101, 113); ctx.stroke();
    if (o.talk) { ctx.fillStyle = '#8f3f3a'; E(100, 123, 6, 3.6); ctx.fill(); }
    else { ctx.strokeStyle = '#b05a52'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(89, 121); ctx.quadraticCurveTo(100, 128, 111, 121); ctx.stroke(); }
    // pañuelo de cuadros
    const scarf = () => { ctx.beginPath(); ctx.moveTo(62, 150); ctx.quadraticCurveTo(100, 122, 138, 150); ctx.lineTo(142, 170); ctx.quadraticCurveTo(100, 150, 58, 170); ctx.closePath(); };
    const tail = () => { ctx.beginPath(); ctx.moveTo(90, 160); ctx.lineTo(112, 158); ctx.lineTo(120, 200); ctx.lineTo(80, 200); ctx.closePath(); };
    [scarf, tail].forEach(shape => {
      ctx.save(); shape(); ctx.fillStyle = '#e9dcc2'; ctx.fill(); ctx.clip();
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(70,92,128,.75)';
      for (let i = -200; i < 400; i += 26) { ctx.beginPath(); ctx.moveTo(i, 110); ctx.lineTo(i + 90, 200); ctx.stroke(); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(40,48,66,.8)';
      for (let i = -200; i < 400; i += 26) { ctx.beginPath(); ctx.moveTo(i + 100, 110); ctx.lineTo(i + 10, 200); ctx.stroke(); }
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(214,170,90,.7)';
      for (let i = -187; i < 400; i += 52) { ctx.beginPath(); ctx.moveTo(i, 110); ctx.lineTo(i + 90, 200); ctx.stroke(); }
      ctx.restore();
    });
    ctx.fillStyle = '#d9cbb0'; rr(ctx, 90, 150, 22, 16, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(70,92,128,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(94, 152); ctx.lineTo(108, 164); ctx.stroke();
    ctx.restore();
  };

  /* ============ Superficies ============ */
  function floorTex() {
    const c = mk(1024, 1024), x = c.getContext('2d'), r = rng(11);
    const rows = 8, ph = 128;
    for (let i = 0; i < rows; i++) {
      let px = -r() * 300;
      while (px < 1024) {
        const len = 260 + r() * 260, l = 44 + r() * 14, hue = 28 + r() * 6;
        x.fillStyle = `hsl(${hue},${34 + r() * 8}%,${l}%)`; x.fillRect(px, i * ph, len, ph);
        for (let k = 0; k < 26; k++) { x.strokeStyle = `rgba(60,35,15,${.03 + r() * .06})`; x.lineWidth = 1 + r() * 1.5; const yy = i * ph + r() * ph; x.beginPath(); x.moveTo(px, yy); x.bezierCurveTo(px + len * .3, yy + r() * 8 - 4, px + len * .6, yy + r() * 8 - 4, px + len, yy + r() * 6 - 3); x.stroke(); }
        x.fillStyle = 'rgba(30,18,8,.55)'; x.fillRect(px + len - 2, i * ph, 2, ph);
        px += len;
      }
      x.fillStyle = 'rgba(30,18,8,.6)'; x.fillRect(0, i * ph, 1024, 2);
    }
    return ER.tex(c, [7, 5.7]);
  }
  function brickTex() {
    const c = mk(1024, 1024), x = c.getContext('2d'), r = rng(5);
    x.fillStyle = '#b9b4aa'; x.fillRect(0, 0, 1024, 1024);
    const bh = 64, bw = 170;
    for (let j = 0; j < 16; j++) for (let i = -1; i < 7; i++) {
      const ox = (j % 2) * bw / 2, l = 86 + r() * 8;
      x.fillStyle = `hsl(${32 + r() * 10},${8 + r() * 8}%,${l}%)`;
      rr(x, i * bw + ox + 4, j * bh + 4, bw - 8, bh - 8, 5); x.fill();
      x.fillStyle = `rgba(0,0,0,${r() * .05})`; x.fillRect(i * bw + ox + 4, j * bh + bh - 16, bw - 8, 10);
    }
    noise(x, 1024, 1024, .06, 3);
    return ER.tex(c, [3, 1.6]);
  }
  function plainTex(col, seed) {
    const c = mk(256, 256), x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 256, 256); noise(x, 256, 256, .035, seed);
    return ER.tex(c, [6, 3]);
  }
  function skyTex() {
    const c = mk(1024, 640), x = c.getContext('2d'), r = rng(21);
    const g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#070b22'); g.addColorStop(.55, '#1b2a5c'); g.addColorStop(.85, '#6a4a78'); g.addColorStop(1, '#e08a5a');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 640);
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${r() * .8})`; x.fillRect(r() * 1024, r() * 330, 1.5, 1.5); }
    x.fillStyle = '#f5f0dc'; x.beginPath(); x.arc(820, 110, 26, 0, 7); x.fill();
    x.fillStyle = '#0b1028'; x.beginPath(); x.arc(832, 102, 24, 0, 7); x.fill();
    const layer = (base, col, win, minH, maxH) => {
      let px = 0;
      while (px < 1024) {
        const w = 40 + r() * 70, h = minH + r() * (maxH - minH);
        x.fillStyle = col; x.fillRect(px, base - h, w, h + 400);
        for (let yy = base - h + 8; yy < 640; yy += 13) for (let xx = px + 5; xx < px + w - 6; xx += 10)
          if (r() < win) { x.fillStyle = r() < .8 ? `rgba(255,${200 + r() * 40},${120 + r() * 60},${.5 + r() * .5})` : 'rgba(170,220,255,.8)'; x.fillRect(xx, yy, 5, 7); }
        px += w + r() * 6;
      }
    };
    layer(470, '#141a3a', .16, 30, 120);
    // cuatro torres
    [[330, 250, 34], [390, 215, 30], [446, 228, 36], [506, 262, 30]].forEach(t => {
      x.fillStyle = '#0d1230'; x.fillRect(t[0], t[1], t[2], 420);
      for (let yy = t[1] + 8; yy < 520; yy += 11) for (let xx = t[0] + 4; xx < t[0] + t[2] - 5; xx += 8) if (r() < .34) { x.fillStyle = `rgba(255,225,150,${.4 + r() * .6})`; x.fillRect(xx, yy, 4, 6); }
      x.fillStyle = '#ff4d4d'; x.fillRect(t[0] + t[2] / 2 - 1.5, t[1] - 8, 3, 3);
    });
    layer(560, '#090c22', .22, 40, 150);
    return ER.tex(c);
  }
  function rugTex() {
    const c = mk(512, 512), x = c.getContext('2d'), r = rng(9);
    x.fillStyle = '#2f4a55'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${r() < .5 ? 255 : 0},${r() < .5 ? 255 : 0},${r() < .5 ? 255 : 0},.05)`; x.fillRect(r() * 512, r() * 512, 2, 4); }
    x.strokeStyle = '#e9dcc2'; x.lineWidth = 6; x.strokeRect(22, 22, 468, 468);
    x.strokeStyle = '#ff5a4e'; x.lineWidth = 3; x.strokeRect(38, 38, 436, 436);
    return ER.tex(c);
  }

  /* ============ Pizarra Lean Canvas ============ */
  const B = ER.BOARD = {
    w: 3.2, h: 1.9,
    blocks: {
      problema: { n: 1, r: [.02, .14, .212, .70], t: 'PROBLEMA', txt: 'Los autónomos pierden 6 h a la semana con las facturas' },
      solucion: { n: 4, r: [.212, .14, .404, .42], t: 'SOLUCIÓN', txt: 'Un agente de IA que factura por ti' },
      metricas: { n: 8, r: [.212, .42, .404, .70], t: 'MÉTRICAS CLAVE', txt: '' },
      valor: { n: 3, r: [.404, .14, .596, .70], t: 'PROPUESTA DE VALOR ÚNICA', txt: 'Tu papeleo, en piloto automático' },
      ventaja: { n: 9, r: [.596, .14, .788, .42], t: 'VENTAJA ESPECIAL', txt: 'La comunidad del Coworking EOI' },
      canales: { n: 5, r: [.596, .42, .788, .70], t: 'CANALES', txt: 'LinkedIn y boca a boca' },
      segmentos: { n: 2, r: [.788, .14, .98, .70], t: 'SEGMENTOS DE CLIENTES', txt: '' },
      costes: { n: 7, r: [.02, .70, .5, .97], t: 'ESTRUCTURA DE COSTES', txt: '' },
      ingresos: { n: 6, r: [.5, .70, .98, .97], t: 'FLUJOS DE INGRESOS', txt: '' }
    }
  };
  ER.POSTITS = {
    pi_seg: { text: 'Autónomos y micropymes', color: '#ffe46b', digit: 3, block: 'segmentos', name: 'Pósit amarillo' },
    pi_ing: { text: 'Suscripción 19 €/mes', color: '#ffb066', digit: 8, block: 'ingresos', name: 'Pósit naranja' },
    pi_cost: { text: 'Servidores, IA y marketing', color: '#a6e88a', digit: 1, block: 'costes', name: 'Pósit verde' },
    pi_met: { text: 'Altas, CAC y churn', color: '#ff9fc6', digit: 6, block: 'metricas', name: 'Pósit rosa' }
  };
  function boardTex() {
    const W = 2048, H = 1216, c = mk(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fbfcfd'); g.addColorStop(1, '#eef1f4'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#1b2130'; x.font = `800 74px ${F}`; x.textBaseline = 'middle'; x.fillText('LEAN CANVAS', 46, 88);
    x.fillStyle = '#ff5a4e'; x.fillRect(46, 134, 150, 8);
    x.fillStyle = '#1d4fa3'; x.font = `700 70px ${HW}`; x.fillText('Proyecto: FacturIA  —  ¡mañana, Demo Day!', 640, 92);
    x.strokeStyle = '#2b3242'; x.lineWidth = 5; x.lineJoin = 'round';
    for (const k in B.blocks) {
      const b = B.blocks[k], [x0, y0, x1, y1] = b.r, px = x0 * W, py = y0 * H, pw = (x1 - x0) * W, ph = (y1 - y0) * H;
      x.strokeRect(px, py, pw, ph);
      x.fillStyle = '#ff5a4e'; x.font = `700 27px ${F}`; x.textBaseline = 'top';
      let ty = wrap(x, b.t, px + 18, py + 16, pw - 30, 30);
      if (b.txt) { x.fillStyle = '#1d4fa3'; x.font = `700 46px ${HW}`; wrap(x, b.txt, px + 20, ty + 14, pw - 36, 46); }
    }
    return ER.tex(c);
  }
  function postitCanvas(p) {
    const c = mk(256, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, p.color); g.addColorStop(1, p.color); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 0, 256, 34);
    x.fillStyle = 'rgba(0,0,0,.06)'; x.beginPath(); x.moveTo(256, 256); x.lineTo(200, 256); x.lineTo(256, 205); x.fill();
    x.fillStyle = '#232a3a'; x.font = `700 50px ${HW}`; x.textAlign = 'center'; x.textBaseline = 'top';
    const words = p.text.split(' '); let lines = [], line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 220 && line) { lines.push(line); line = w; } else line = t; } lines.push(line);
    let y = 148 - lines.length * 26; lines.forEach(l => { x.fillText(l, 128, y); y += 52; });
    return c;
  }
  function glowText(text, w, h, font, color) {
    const c = mk(w, h), x = c.getContext('2d'); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = color; x.shadowBlur = h * .18; x.fillStyle = color; x.fillText(text, w / 2, h / 2); x.shadowBlur = 0; x.fillText(text, w / 2, h / 2);
    return c;
  }
  ER.glowText = glowText;

  /* ============ Documentos ============ */
  ER.WORKSHOPS = [
    [1, 'Creatividad y co-creación', 'María Calvo', '04 MAR'],
    [2, 'De la idea de negocio al plan de acción', 'Begoña Beviá', '12 MAR'],
    [3, 'Del Design Thinking al Lean Startup', 'Patricia R. Cimas', '19 MAR'],
    [4, 'Productividad y gestión del tiempo', 'Mabel Casares', '26 MAR'],
    [5, 'Marketing para la acción comercial: el plan de marketing', 'Ramón Arjona', '09 ABR'],
    [6, 'IA aplicada a la gestión del proyecto', 'Pedro Martín', '16 ABR'],
    [7, 'Social Media Marketing', 'Carol Sanz', '23 ABR'],
    [8, 'Compliance jurídico-fiscal', 'Wilma Conde', '29 ABR'],
    [9, 'Emprendimiento creativo con LEGO', 'Eva Seguido', '06 MAY'],
    [10, 'Finanzas esenciales y alternativas de financiación', 'Mireia Badía', '14 MAY'],
    [11, 'Ponencias de coworkers: Startup Wars · Branding · Agentes de IA', 'Gonzalo Oliveros · Javier García · Enrique Arias', '28 MAY'],
    [12, 'Copywriting estratégico', 'Raquel Barbadillo', '04 JUN'],
    [13, 'Aspectos básicos de los mecanismos de financiación', 'Francisco Inglés', '11 JUN'],
    [14, 'Presentaciones eficaces', 'María Calvo', '18 JUN'],
    [15, 'LinkedIn para ventas 360', 'Ramón Arjona', '02 JUL']
  ];
  function docProgram() {
    const W = 1000, H = 1414, c = mk(W, H), x = c.getContext('2d');
    x.fillStyle = '#faf8f3'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ff5a4e'; x.fillRect(0, 0, W, 200);
    x.fillStyle = '#fff'; x.font = `800 96px ${F}`; x.textBaseline = 'alphabetic'; x.fillText('EOI', 56, 122);
    x.font = `400 22px ${F}`; x.fillText('Escuela de Organización Industrial', 58, 162);
    x.textAlign = 'right'; x.font = `800 40px ${F}`; x.fillText('COWORKING MADRID 2026', W - 56, 100);
    x.font = `500 26px ${F}`; x.fillText('Programa de talleres', W - 56, 142);
    x.font = `400 20px ${F}`; x.fillText('Lanza tu proyecto con éxito', W - 56, 172);
    x.textAlign = 'left';
    let y = 226; const rh = 76;
    ER.WORKSHOPS.forEach((w, i) => {
      if (i % 2 === 0) { x.fillStyle = '#f0ece3'; x.fillRect(30, y, W - 60, rh); }
      x.fillStyle = '#1b2130'; x.beginPath(); x.arc(78, y + rh / 2, 25, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.font = `700 24px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(w[0], 78, y + rh / 2 + 1);
      x.textAlign = 'left'; x.fillStyle = '#1b2130'; x.font = `700 ${w[1].length > 52 ? 20 : 23}px ${F}`; x.fillText(w[1], 122, y + 26);
      x.fillStyle = '#5c6578'; x.font = `400 20px ${F}`; x.fillText(w[2], 122, y + 54);
      x.fillStyle = '#19a596'; rr(x, W - 172, y + 20, 120, 36, 18); x.fill();
      x.fillStyle = '#fff'; x.font = `700 20px ${F}`; x.textAlign = 'center'; x.fillText(w[3], W - 112, y + 39); x.textAlign = 'left';
      y += rh;
    });
    x.fillStyle = '#8a91a1'; x.font = `400 18px ${F}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillText('Todas las sesiones se celebran por la tarde en esta sala · Directora del Programa: Vicenta', W / 2, H - 26);
    return c;
  }
  function hexPath(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; x[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); } x.closePath(); }
  ER.PHASES = [['EMPATIZAR', '#e5413a', 'red'], ['DEFINIR', '#f4c430', 'yellow'], ['IDEAR', '#3aa655', 'green'], ['PROTOTIPAR', '#f28a1e', 'orange'], ['TESTEAR', '#2e6fd8', 'blue']];
  function docDT() {
    const W = 900, H = 1273, c = mk(W, H), x = c.getContext('2d');
    x.fillStyle = '#12233d'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#19c3b1'; x.font = `700 24px ${F}`; x.fillText('TALLER 3 · PATRICIA R. CIMAS', 60, 90);
    x.fillStyle = '#fff'; x.font = `800 68px ${F}`; x.fillText('Del Design Thinking', 60, 170); x.fillText('al Lean Startup', 60, 246);
    const pos = [[640, 520], [250, 900], [450, 700], [650, 900], [260, 500]]; // E, D, I, P, T (desordenadas a propósito)
    const order = [2, 4, 0, 3, 1];
    order.forEach((pi, i) => {
      const p = ER.PHASES[pi], q = pos[i];
      x.fillStyle = p[1]; hexPath(x, q[0], q[1], 150); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 5; hexPath(x, q[0], q[1], 132); x.stroke();
      x.fillStyle = pi === 1 ? '#1b2130' : '#fff'; x.font = `800 34px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p[0], q[0], q[1]);
    });
    x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = '#c9d3e6'; x.font = `400 28px ${F}`;
    x.fillText('Cinco fases. Un solo orden. Mil iteraciones.', 60, 1150);
    x.fillStyle = '#ff5a4e'; x.font = `700 26px ${F}`; x.fillText('CONSTRUIR  →  MEDIR  →  APRENDER', 60, 1200);
    return c;
  }
  function paperBase(W, H, col, lined) {
    const c = mk(W, H), x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, W, H); noise(x, W, H, .03, W);
    if (lined) { x.strokeStyle = 'rgba(60,90,160,.22)'; x.lineWidth = 2; for (let y = 150; y < H - 30; y += 58) { x.beginPath(); x.moveTo(40, y); x.lineTo(W - 40, y); x.stroke(); } x.strokeStyle = 'rgba(220,60,60,.4)'; x.beginPath(); x.moveTo(96, 0); x.lineTo(96, H); x.stroke(); }
    return [c, x];
  }
  function docMabel() {
    const [c, x] = paperBase(800, 1040, '#fff6b8', true);
    x.fillStyle = '#b3261e'; x.font = `700 30px ${F}`; x.font = `700 23px ${F}`; x.fillText('TALLER 4 · PRODUCTIVIDAD Y GESTIÓN DEL TIEMPO', 116, 78);
    x.fillStyle = '#1d3f8f'; x.font = `700 58px ${HW}`; x.fillText('Mi plan Pomodoro para mañana', 116, 140);
    x.font = `500 46px ${HW}`; x.fillStyle = '#232a3a';
    let y = 198; const L = ['Empiezo a las 9:00 en punto.', 'Cuatro pomodoros: 25 min de foco', 'cada uno, sin móvil ni correo.', 'Entre uno y otro, 5 min de descanso.', '(El descanso largo, después del 4.º)', '', 'Hoy he parado el reloj de la sala.', 'Quien lo ponga en la hora exacta', 'a la que TERMINA mi 4.º pomodoro', 'encontrará lo que guardo detrás.', 'El tiempo bien gestionado', 'abre puertas ;)'];
    L.forEach(l => { x.fillText(l, 116, y); y += 58; });
    x.fillStyle = '#b3261e'; x.font = `700 54px ${HW}`; x.fillText('— Mabel C.', 500, y + 40);
    return c;
  }
  function docLegoCard() {
    const c = mk(960, 640), x = c.getContext('2d');
    x.fillStyle = '#ffd23a'; x.fillRect(0, 0, 960, 640); x.fillStyle = '#fff'; rr(x, 30, 30, 900, 580, 26); x.fill();
    x.fillStyle = '#e5413a'; x.font = `700 26px ${F}`; x.fillText('TALLER 9 · EMPRENDIMIENTO CREATIVO CON LEGO · EVA SEGUIDO', 70, 100);
    x.fillStyle = '#1b2130'; x.font = `800 60px ${F}`; x.fillText('Reto: la torre del proceso', 70, 180);
    x.font = `400 32px ${F}`; x.fillStyle = '#3a4152';
    wrap(x, 'Pensar con las manos. Construye una torre con una pieza por cada fase del proceso que vimos con Patricia.\nLo primero que se hace va ABAJO; lo último, ARRIBA.\nCuando la torre cuente bien la historia, la caja se abrirá.', 70, 250, 820, 46);
    x.fillStyle = '#e5413a'; x.font = `700 44px ${HW}`; x.fillText('Ojo: a esta caja le falta una pieza… alguien se la llevó.', 70, 570);
    return c;
  }
  function docBin() {
    const c = mk(960, 720), x = c.getContext('2d'), r = rng(77);
    x.fillStyle = '#f1efe9'; x.fillRect(0, 0, 960, 720);
    for (let i = 0; i < 60; i++) { { const v = r() < .5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${.03 + r() * .05})`; } x.beginPath(); x.moveTo(r() * 960, r() * 720); x.lineTo(r() * 960, r() * 720); x.lineTo(r() * 960, r() * 720); x.fill(); }
    x.fillStyle = '#232a3a'; x.font = `700 50px ${HW}`; x.fillText('Lean Canvas: ¿en qué orden se rellena?', 50, 80);
    x.font = `500 36px ${HW}`; x.fillStyle = '#5c6578'; x.fillText('(apuntes del taller de Patricia — según Ash Maurya)', 50, 124);
    const X0 = 60, Y0 = 160, W = 840, H = 440; x.strokeStyle = '#232a3a'; x.lineWidth = 4;
    for (const k in B.blocks) {
      const b = B.blocks[k], rx = (b.r[0] - .02) / .96, ry = (b.r[1] - .14) / .83, rw = (b.r[2] - b.r[0]) / .96, rh = (b.r[3] - b.r[1]) / .83;
      x.strokeRect(X0 + rx * W, Y0 + ry * H, rw * W, rh * H);
      x.fillStyle = '#b3261e'; x.font = `700 84px ${HW}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(b.n, X0 + (rx + rw / 2) * W, Y0 + (ry + rh / 2) * H + 4);
    }
    x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = '#1d3f8f'; x.font = `700 42px ${HW}`;
    x.font = `700 38px ${HW}`; x.fillText('Del 1 al 9. Siempre, aunque apetezca empezar por la solución.', 50, 670);
    return c;
  }
  function docMaria() {
    const [c, x] = paperBase(860, 620, '#fdf3e3', false);
    x.fillStyle = '#b3261e'; x.font = `700 26px ${F}`; x.fillText('TALLER 1 · CREATIVIDAD Y CO-CREACIÓN', 60, 80);
    x.fillStyle = '#232a3a'; x.font = `500 48px ${HW}`;
    wrap(x, 'Para abrir mi cajón no hace falta llave: hace falta pensar con orden.\nPrimero, los HECHOS. Después, las EMOCIONES. Luego, los RIESGOS. Y solo al final, las IDEAS NUEVAS.\nCada cosa con su sombrero.', 60, 150, 740, 56);
    x.fillStyle = '#1d3f8f'; x.font = `700 56px ${HW}`; x.fillText('— María C.', 560, 570);
    return c;
  }
  function bookPage(title, sub, paras) {
    const W = 900, H = 1180, c = mk(W, H), x = c.getContext('2d');
    x.fillStyle = '#f6efe0'; x.fillRect(0, 0, W, H); noise(x, W, H, .03, 31);
    const g = x.createLinearGradient(0, 0, 70, 0); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 70, H);
    x.fillStyle = '#7a2e22'; x.font = '700 22px Georgia,serif'; x.fillText(sub.toUpperCase(), 100, 100);
    x.fillStyle = '#231c14'; x.font = '700 52px Georgia,serif'; let y = wrap(x, title, 100, 170, 720, 60);
    x.fillStyle = '#7a2e22'; x.fillRect(100, y - 26, 90, 5); y += 28;
    x.fillStyle = '#2f271d'; x.font = '400 30px Georgia,serif';
    paras.forEach(p => { y = wrap(x, p, 100, y, 720, 44) + 18; });
    return c;
  }
  function spine(text, bg, fg) {
    const c = mk(128, 512), x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 128, 512);
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, 26, 128, 6); x.fillRect(0, 480, 128, 6);
    x.save(); x.translate(64, 256); x.rotate(-Math.PI / 2); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 46; x.font = `800 ${fs}px ${F}`; while (x.measureText(text).width > 420) { fs -= 2; x.font = `800 ${fs}px ${F}`; }
    x.fillText(text, 0, 4); x.restore(); return c;
  }

  function docTalks() {
    const W = 800, H = 1130, c = mk(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1b2130'); g.addColorStop(1, '#3a1d3f'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ff5a4e'; x.font = `700 24px ${F}`; x.fillText('TALLER 11 · 28 MAY · SESIÓN GRUPAL', 56, 90);
    x.fillStyle = '#fff'; x.font = `800 76px ${F}`; x.fillText('Ponencias', 56, 180); x.fillText('de coworkers', 56, 260);
    [['STARTUP WARS', 'Gonzalo Oliveros', '#f4c430'], ['BRANDING', 'Javier García', '#19c3b1'], ['¿QUÉ SON LOS AGENTES DE IA?', 'Enrique Arias', '#ff6f91']].forEach((t, i) => {
      const y = 380 + i * 220; x.fillStyle = t[2]; x.fillRect(56, y - 50, 10, 130);
      x.font = `800 ${t[0].length > 14 ? 40 : 56}px ${F}`; x.fillText(t[0], 90, y + 6); x.fillStyle = '#d6dae4'; x.font = `400 32px ${F}`; x.fillText(t[1], 90, y + 60);
    });
    x.fillStyle = '#8a91a1'; x.font = `400 22px ${F}`; x.fillText('Coworking EOI Madrid 2026 · de coworker a coworker', 56, H - 50);
    return c;
  }
  /* ============ Pantallas y rótulos ============ */
  ER.KP = { w: 300, h: 500 };
  function keypadCanvas(uv) {
    const c = mk(300, 500), x = c.getContext('2d');
    if (!uv) {
      x.fillStyle = '#22252c'; x.fillRect(0, 0, 300, 500);
      x.fillStyle = '#07150f'; rr(x, 30, 26, 240, 64, 8); x.fill();
      x.fillStyle = '#49f2a0'; x.font = '700 30px ui-monospace,Menlo,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('- - - -', 150, 59);
      x.fillStyle = '#ff5a4e'; x.beginPath(); x.arc(52, 122, 8, 0, 7); x.fill();
      x.fillStyle = '#9aa2b4'; x.font = `500 18px ${F}`; x.textAlign = 'left'; x.fillText('TARJETA + CÓDIGO', 72, 123);
    }
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];
    keys.forEach((k, i) => {
      const kx = 34 + (i % 3) * 82, ky = 158 + Math.floor(i / 3) * 82;
      if (!uv) {
        x.fillStyle = k === 'C' ? '#6a302c' : k === '✓' ? '#27775a' : '#434956'; rr(x, kx, ky, 68, 68, 12); x.fill();
        x.fillStyle = '#fff'; x.font = `600 32px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(k, kx + 34, ky + 36);
      } else if ('1368'.includes(k)) {
        x.strokeStyle = 'rgba(190,255,90,.95)'; x.lineWidth = 2.5;
        for (let q = 0; q < 6; q++) { x.beginPath(); x.ellipse(kx + 34, ky + 38, 7 + q * 4, 10 + q * 4.6, .3, Math.PI * (1 + q * .03), Math.PI * (2 - q * .03)); x.stroke(); }
      }
    });
    return c;
  }
  function clockFace() {
    const c = mk(512, 512), x = c.getContext('2d');
    x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill();
    x.translate(256, 256);
    for (let i = 0; i < 60; i++) { x.save(); x.rotate(i * Math.PI / 30); x.fillStyle = '#1b2130'; if (i % 5 === 0) x.fillRect(-4, -236, 8, 30); else x.fillRect(-1.5, -236, 3, 12); x.restore(); }
    x.fillStyle = '#1b2130'; x.font = `700 54px ${F}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; x.fillText(i, Math.sin(a) * 168, -Math.cos(a) * 168 + 3); }
    x.fillStyle = '#ff5a4e'; x.font = `800 30px ${F}`; x.fillText('EOI', 0, -84);
    x.fillStyle = '#8a91a1'; x.font = `400 17px ${F}`; x.fillText('coworking', 0, 88);
    return c;
  }
  function labelCanvas(text, w, h, bg, fg, font) {
    const c = mk(w, h), x = c.getContext('2d'); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 2); return c;
  }
  ER.labelCanvas = labelCanvas;
  function vinyl() {
    const c = mk(1024, 512), x = c.getContext('2d');
    x.fillStyle = '#ff5a4e'; x.font = `800 250px ${F}`; x.textBaseline = 'alphabetic'; x.fillText('EOI', 30, 250);
    x.fillStyle = '#1b2130'; x.font = `600 58px ${F}`; x.fillText('Coworking Madrid', 40, 340);
    x.fillStyle = '#5c6578'; x.font = `400 38px ${F}`; x.fillText('Escuela de Organización Industrial', 40, 400);
    x.fillStyle = '#19a596'; x.font = `700 62px ${HW}`; x.fillText('ideas que se convierten en empresas', 40, 480);
    return c;
  }
  ER.drawTV = function (o) {
    const c = ER.T.tvCanvas, x = c.getContext('2d'), W = c.width, H = c.height;
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#c9d2da'); g.addColorStop(1, '#8794a3'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(40,50,66,.28)'; x.fillRect(0, 0, 250, 240);
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(720, 0, 20, H); x.fillRect(900, 0, 124, H);
    ER.drawVicenta(x, W / 2 - 290, 6, 580, Object.assign({ bg: false }, o));
    x.fillStyle = 'rgba(10,14,24,.78)'; rr(x, 30, H - 100, 400, 70, 14); x.fill();
    x.fillStyle = '#fff'; x.font = `700 32px ${F}`; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('Vicenta', 54, H - 76);
    x.fillStyle = '#b8c0cf'; x.font = `400 21px ${F}`; x.fillText('Directora del Programa · EOI', 54, H - 46);
    x.fillStyle = '#2fd688'; x.beginPath(); x.arc(396, H - 65, 9, 0, 7); x.fill();
    x.fillStyle = 'rgba(10,14,24,.78)'; rr(x, W - 330, 26, 300, 50, 25); x.fill();
    x.fillStyle = '#ff5a4e'; x.beginPath(); x.arc(W - 302, 51, 8, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = `500 21px ${F}`; x.fillText('¿Una pista? Haz clic', W - 282, 52);
    ER.T.tv.needsUpdate = true;
  };
  ER.drawLaptop = function (unlocked) {
    const c = ER.T.laptopCanvas, x = c.getContext('2d');
    if (!unlocked) {
      const g = x.createRadialGradient(150, 80, 20, 256, 160, 380); g.addColorStop(0, '#2a6f77'); g.addColorStop(1, '#0b1020'); x.fillStyle = g; x.fillRect(0, 0, 512, 320);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `300 84px ${F}`; x.fillText('22:47', 256, 130);
      x.font = `400 22px ${F}`; x.fillText('Introduce la contraseña', 256, 200);
      for (let i = 0; i < 4; i++) { x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; rr(x, 176 + i * 42, 226, 34, 40, 6); x.stroke(); }
    } else {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 320); x.fillStyle = '#1f6f5c'; x.fillRect(0, 0, 512, 44);
      x.fillStyle = '#fff'; x.textAlign = 'left'; x.font = `600 20px ${F}`; x.fillText('Finanzas_FacturIA.xlsx', 16, 29);
      x.strokeStyle = '#cfd4de'; x.lineWidth = 1; for (let y = 44; y < 320; y += 30) { x.beginPath(); x.moveTo(0, y); x.lineTo(512, y); x.stroke(); }
      for (let xx = 40; xx < 512; xx += 156) { x.beginPath(); x.moveTo(xx, 44); x.lineTo(xx, 320); x.stroke(); }
      x.fillStyle = '#fff4c9'; x.fillRect(197, 165, 155, 29);
    }
    ER.T.laptop.needsUpdate = true;
  };

  /* ============ Construcción ============ */
  ER.makeTextures = function () {
    const T = ER.T = {};
    T.floor = floorTex(); T.brick = brickTex(); T.wall = plainTex('#e7e3da', 2); T.accent = plainTex('#1d4a55', 4); T.ceil = plainTex('#f1f0ec', 6);
    T.sky = skyTex(); T.rug = rugTex(); T.board = boardTex();
    T.clock = ER.tex(clockFace()); T.vinyl = ER.tex(vinyl());
    T.keypad = ER.tex(keypadCanvas(false)); T.keypadUV = ER.tex(keypadCanvas(true));
    T.tvCanvas = mk(1024, 576); T.tv = ER.tex(T.tvCanvas); ER.drawTV({});
    T.laptopCanvas = mk(512, 320); T.laptop = ER.tex(T.laptopCanvas); ER.drawLaptop(false);
    T.neon = ER.tex(glowText('haz que suceda', 1024, 256, `700 150px ${HW}`, '#ff6f91'));
    T.exit = ER.tex(labelCanvas('SALIDA', 256, 96, '#0c3d27', '#7dffb8', `800 56px ${F}`));
    T.digits = []; for (let i = 0; i < 10; i++) T.digits.push(ER.tex(labelCanvas(String(i), 96, 128, '#f2efe6', '#1b2130', `800 92px ${F}`)));
    T.postit = {}; T.uvDigit = {}; ER.postitCanvas = {};
    for (const k in ER.POSTITS) {
      const p = ER.POSTITS[k]; ER.postitCanvas[k] = postitCanvas(p); T.postit[k] = ER.tex(ER.postitCanvas[k]);
      T.uvDigit[k] = ER.tex(glowText(String(p.digit), 256, 256, `800 190px ${F}`, '#c8ff4a'));
    }
    T.uvBoard = ER.tex(glowText('EL ORDEN LO MARCA EL LIENZO:  1 → 9', 2048, 160, `800 86px ${F}`, '#c8ff4a'));
    T.uvWall = ER.tex(glowText('Confía en el proceso. — V.', 1024, 200, `700 110px ${HW}`, '#7df9ff'));
    T.spines = {
      hats: ER.tex(spine('SEIS SOMBREROS PARA PENSAR', '#7a2e22', '#f6e7c8')),
      dt: ER.tex(spine('DESIGN THINKING', '#12233d', '#7df0e2')),
      fin: ER.tex(spine('FINANZAS PARA EMPRENDER', '#1f6f5c', '#fff')),
      copy: ER.tex(spine('COPYWRITING', '#e0a020', '#231c14'))
    };
    // documentos consultables
    const D = ER.docs = {
      program: { c: docProgram(), cap: 'Programa de talleres del Coworking EOI Madrid 2026' },
      dt: { c: docDT(), cap: 'Póster del taller «Del Design Thinking al Lean Startup»' },
      talks: { c: docTalks(), cap: 'Cartel de la sesión de ponencias de coworkers' },
      mabel: { c: docMabel(), cap: 'Nota de Mabel sobre la mesa' },
      legocard: { c: docLegoCard(), cap: 'Tarjeta del reto de construcción' },
      bin: { c: docBin(), cap: 'Papel arrugado rescatado de la papelera' },
      maria: { c: docMaria(), cap: 'Nota de María' },
      b_hats: { c: bookPage('Seis sombreros para pensar', 'Creatividad · resumen para talleres', ['Edward de Bono propuso separar los modos de pensar para no mezclarlos. Cada modo, un sombrero de un color:', 'BLANCO — hechos y datos, sin opinar.', 'ROJO — emociones, intuición y corazonadas.', 'NEGRO — riesgos, cautela, lo que puede salir mal.', 'AMARILLO — optimismo, beneficios y oportunidades.', 'VERDE — creatividad, alternativas e ideas nuevas.', 'AZUL — control del proceso: quién habla y cuándo.', 'Un buen facilitador decide el orden de los sombreros antes de empezar.']), cap: 'Libro: «Seis sombreros para pensar»' },
      b_dt: { c: bookPage('Design Thinking: el orden importa', 'Capítulo 2', ['El proceso arranca siempre por las personas: antes de nada se EMPATIZA con el usuario, se le observa y se le escucha.', 'Con lo aprendido se DEFINE el reto: una sola frase que diga a quién ayudamos y con qué.', 'Solo entonces toca IDEAR sin filtros. Cantidad antes que calidad.', 'De las mejores ideas se pasa a PROTOTIPAR rápido y barato: cartón, piezas, papel.', 'Y, por último, se sale a la calle a TESTEAR con usuarios reales. Lo que se aprende reinicia el ciclo.']), cap: 'Libro: «Design Thinking»' },
      b_fin: { c: bookPage('El punto de equilibrio', 'Finanzas para emprender · Capítulo 5', ['Es el número de ventas a partir del cual tu proyecto deja de perder dinero.', 'Cada venta deja un MARGEN: el precio menos lo que te cuesta servir esa venta (coste variable).', 'Con ese margen vas pagando, venta a venta, los COSTES FIJOS del mes.', 'Punto de equilibrio (unidades)  =', '     Costes fijos  ÷  (Precio − Coste variable)', 'Si vendes por debajo de esa cifra, pierdes. Si vendes por encima, empiezas a ganar.']), cap: 'Libro: «Finanzas para emprender»' },
      b_copy: { c: bookPage('La fórmula AIDA', 'Copywriting estratégico · Capítulo 1', ['Un buen texto de venta acompaña al lector por cuatro pasos:', 'ATENCIÓN — un titular que le haga parar.', 'INTERÉS — su problema, contado con sus palabras.', 'DESEO — cómo será su vida con tu solución.', 'ACCIÓN — una llamada clara: qué hacer ahora.', 'Nota a lápiz en el margen: «Raquel tenía razón: escribir bien es pensar bien. Pero esta fórmula no abre ninguna cerradura de esta sala».']), cap: 'Libro: «Copywriting»' }
    };
    T.program = ER.tex(D.program.c); T.talks = ER.tex(D.talks.c); T.dt = ER.tex(D.dt.c); T.mabel = ER.tex(D.mabel.c); T.legocard = ER.tex(D.legocard.c); T.maria = ER.tex(D.maria.c);
    return T;
  };
})();
