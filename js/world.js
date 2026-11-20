/* Construcción de la sala de coworking en 3D */
(function () {
  const ER = window.ER;
  ER.buildWorld = function (scene) {
    const T3 = THREE, T = ER.T, R = ER.refs = {}, clicks = ER.clickables = [], uvs = ER.uvMeshes = [], lights = ER.lights = [], glows = ER.glows = [];
    const RB = ADDONS.RoundedBoxGeometry, PI = Math.PI, rnd = ER.rng(1234);
    const V = (x, y, z) => new T3.Vector3(x, y, z);

    const reg = (o, id, label, zone) => { o.userData.it = { id, label, zone: zone || 'home', obj: o }; clicks.push(o); return o; };
    const std = (color, rough, metal, extra) => new T3.MeshStandardMaterial(Object.assign({ color, roughness: rough == null ? .7 : rough, metalness: metal || 0 }, extra));
    const mesh = (geo, mat, parent, x, y, z) => { const m = new T3.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; };
    const box = (w, h, d, mat, parent, x, y, z) => mesh(new T3.BoxGeometry(w, h, d), mat, parent, x, y, z);
    const rbox = (w, h, d, r, mat, parent, x, y, z) => mesh(new RB(w, h, d, 3, r), mat, parent, x, y, z);
    const cyl = (rt, rb, h, mat, parent, x, y, z, seg) => mesh(new T3.CylinderGeometry(rt, rb, h, seg || 24), mat, parent, x, y, z);
    const plane = (w, h, mat, parent, x, y, z) => { const m = mesh(new T3.PlaneGeometry(w, h), mat, parent, x, y, z); m.castShadow = false; return m; };
    const group = (parent, x, y, z, ry) => { const g = new T3.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; (parent || scene).add(g); return g; };
    const texMat = (tex, extra) => new T3.MeshStandardMaterial(Object.assign({ map: tex, roughness: .85 }, extra));
    const uvMat = tex => new T3.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, color: new T3.Color(1.5, 1.5, 1.5) });
    const addUV = (m, cone) => { m.visible = false; m.castShadow = m.receiveShadow = false; m.userData.cone = cone || .3; uvs.push(m); return m; };
    const addLight = l => { l.userData.base = l.intensity; lights.push(l); scene.add(l); return l; };
    const glow = (r, g, b) => { const m = new T3.MeshBasicMaterial({ color: new T3.Color(r, g, b), toneMapped: false }); glows.push({ m, base: m.color.clone() }); return m; };
    const ghost = new T3.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

    const M = {
      oak: std(0xc79a68, .5), walnut: std(0x6e4a32, .55), white: std(0xf1eee8, .55), black: std(0x191b20, .45, .5), chrome: std(0xd4d8dd, .22, .95),
      alu: std(0xb9bec6, .35, .8), teal: std(0x1aa99a, .55), coral: std(0xf0564a, .55), mustard: std(0xe2a93b, .65), navy: std(0x1d2a44, .6),
      fabric: std(0xd9a441, .95), plantG: std(0x2f7d4a, .6, 0, { side: T3.DoubleSide }), dark: new T3.MeshBasicMaterial({ color: 0x08090b })
    };

    /* ---------- Envolvente ---------- */
    const X = 5.5, Z = 4.5, H = 3.2;
    const floor = plane(2 * X, 2 * Z, new T3.MeshStandardMaterial({ map: T.floor, roughness: .42, metalness: .05 }), scene, 0, 0, 0); floor.rotation.x = -PI / 2;
    const ceil = plane(2 * X, 2 * Z, texMat(T.ceil, { roughness: 1 }), scene, 0, H, 0); ceil.rotation.x = PI / 2;
    plane(2 * X, H, texMat(T.accent, { roughness: .9 }), scene, 0, H / 2, -Z);
    const we = plane(2 * Z, H, texMat(T.wall, { roughness: .95 }), scene, X, H / 2, 0); we.rotation.y = -PI / 2;
    const ww = plane(2 * Z, H, new T3.MeshStandardMaterial({ map: T.brick, bumpMap: T.brick, bumpScale: 1.2, roughness: .9 }), scene, -X, H / 2, 0); ww.rotation.y = PI / 2;
    const wmat = texMat(T.wall, { roughness: .95 });
    [[-1.7, H / 2, 7.6, H], [4.3, H / 2, 2.4, H], [2.6, 2.65, 1.0, 1.1]].forEach(p => { const m = plane(p[2], p[3], wmat, scene, p[0], p[1], Z); m.rotation.y = PI; });
    // zócalos
    box(2 * X, .1, .03, M.white, scene, 0, .05, -Z + .015); box(.03, .1, 2 * Z, M.white, scene, -X + .015, .05, 0); box(.03, .1, 2 * Z, M.white, scene, X - .015, .05, 0);
    box(7.6, .1, .03, M.white, scene, -1.7, .05, Z - .015); box(2.4, .1, .03, M.white, scene, 4.3, .05, Z - .015);
    // vigas de techo
    [-2.6, 0.9].forEach(z => box(2 * X, .16, .2, M.walnut, scene, 0, H - .08, z));

    /* ---------- Ventanas (noche de Madrid) ---------- */
    [-2.75, -.35].forEach((z, i) => {
      const st = T.sky.clone(); st.repeat.set(.5, 1); st.offset.set(i * .5, 0); st.needsUpdate = true;
      const sk = plane(2.1, 1.75, new T3.MeshBasicMaterial({ map: st, color: 0xd8d8d8 }), scene, X - .02, 1.95, z); sk.rotation.y = -PI / 2;
      const gl = plane(2.1, 1.75, new T3.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .1, roughness: .03, metalness: .2 }), scene, X - .035, 1.95, z); gl.rotation.y = -PI / 2;
      reg(sk, 'window', 'Ventana');
      box(.08, .07, 2.24, M.black, scene, X - .04, 1.04, z); box(.08, .07, 2.24, M.black, scene, X - .04, 2.86, z);
      [-1.085, 0, 1.085].forEach(o => box(.08, 1.82, .06, M.black, scene, X - .04, 1.95, z + o));
      box(.2, .04, 2.3, M.white, scene, X - .1, 1.0, z);
    });

    /* ---------- Luces ---------- */
    const hemi = new T3.HemisphereLight(0xfff0dc, 0x4a4038, .42); addLight(hemi);
    const spot = new T3.SpotLight(0xffe0b4, 11, 14, 1.0, .7, 1.3); spot.position.set(0, 3.1, -.5); spot.target.position.set(0, 0, -.9); scene.add(spot.target);
    spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.0004; spot.shadow.radius = 5; addLight(spot);
    [[-3.3, 2.75, 2.1], [3.3, 2.75, 2.1], [-3.3, 2.75, -2.7], [3.5, 2.75, -2.6]].forEach(p => {
      addLight(new T3.PointLight(0xfff1de, 4.2, 13, 1.8)).position.set(p[0], p[1], p[2]);
      const led = plane(1.3, .5, glow(1.25, 1.2, 1.1), scene, p[0], H - .012, p[2]); led.rotation.x = PI / 2; led.receiveShadow = false;
      box(1.38, .03, .58, M.black, scene, p[0], H - .02, p[2]).castShadow = false;
    });
    addLight(new T3.PointLight(0x7f9bff, 2.5, 7, 1.6)).position.set(4.5, 2.0, -1.6);
    addLight(new T3.PointLight(0xff6f91, 1.2, 4.5, 1.6)).position.set(2.3, 2.6, -4.0);
    // lámparas colgantes
    [-1.15, 0, 1.15].forEach(x => {
      cyl(.006, .006, .85, M.black, scene, x, 2.77, -.9).castShadow = false;
      const sh = mesh(new T3.ConeGeometry(.22, .2, 32, 1, true), std(0x16181c, .5, .3, { side: T3.DoubleSide }), scene, x, 2.28, -.9); sh.castShadow = false;
      mesh(new T3.SphereGeometry(.05, 16, 12), glow(1.8, 1.4, .9), scene, x, 2.22, -.9).castShadow = false;
      addLight(new T3.PointLight(0xffc98a, .9, 5, 1.8)).position.set(x, 2.1, -.9);
    });

    /* ---------- Mesa, sillas, alfombra ---------- */
    const rug = plane(4.8, 3.1, texMat(T.rug, { roughness: 1 }), scene, 0, .006, -.9); rug.rotation.x = -PI / 2;
    rbox(3.4, .06, 1.4, .02, M.oak, scene, 0, .75, -.9);
    [-1.45, 1.45].forEach(x => { box(.06, .72, .06, M.black, scene, x, .36, -1.45); box(.06, .72, .06, M.black, scene, x, .36, -.35); box(.06, .06, 1.16, M.black, scene, x, .69, -.9); });
    const chair = (x, z, ry, mat) => {
      const g = group(scene, x, 0, z, ry);
      rbox(.44, .05, .44, .02, mat, g, 0, .46, 0);
      const b = rbox(.42, .34, .04, .02, mat, g, 0, .79, -.22); b.rotation.x = -.12;
      [-.15, .15].forEach(px => box(.025, .2, .025, M.black, g, px, .56, -.2));
      [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(p => cyl(.016, .012, .44, M.oak, g, p[0], .22, p[1], 10));
    };
    chair(-1.1, -1.95, .1, M.teal); chair(0, -2.0, -.05, M.coral); chair(1.1, -1.95, 0, M.mustard);
    chair(-1.55, .3, PI + .5, M.coral); chair(1.6, .25, PI - .45, M.teal);

    // portátil
    const lap = R.laptop = group(scene, -1.0, .78, -1.0, .12); reg(lap, 'laptop', 'Portátil');
    rbox(.36, .016, .25, .006, M.alu, lap, 0, .008, 0); const kb = plane(.31, .12, std(0x22252b, .8), lap, 0, .0165, -.03); kb.rotation.x = -PI / 2;
    const lid = group(lap, 0, .016, -.122); lid.rotation.x = -.26;
    rbox(.36, .24, .01, .006, M.alu, lid, 0, .12, 0); plane(.34, .2125, new T3.MeshBasicMaterial({ map: T.laptop, color: 0xcccccc }), lid, 0, .122, .0056);
    // nota de Mabel + boli + tazas
    const note = plane(.24, .312, texMat(T.mabel, { color: 0xd8d8d8 }), scene, -.42, .7815, -.47); note.rotation.x = -PI / 2; note.rotation.z = .18; reg(note, 'note', 'Nota manuscrita');
    const pen = cyl(.006, .006, .14, M.navy, scene, -.2, .787, -.42, 8); pen.rotation.z = PI / 2; pen.rotation.y = .9;
    const mug = (parent, x, y, z, mat) => { const g = group(parent, x, y, z); cyl(.04, .034, .09, mat, g, 0, .045, 0); const h = mesh(new T3.TorusGeometry(.026, .007, 8, 16), mat, g, .045, .047, 0); cyl(.035, .035, .004, std(0x3a2417, .4), g, 0, .082, 0); return g; };
    mug(scene, -.52, .78, -1.2, M.coral); mug(scene, .25, .78, -1.28, M.white);

    /* ---------- Caja de piezas (LEGO) ---------- */
    const LG = R.lego = group(scene, .95, .78, -.9); reg(LG, 'lego', 'Caja de piezas de construcción');
    rbox(.4, .1, .28, .008, std(0xf4c430, .45), LG, 0, .05, 0);
    plane(.335, .066, M.dark, LG, 0, .05, .1405);
    const ld = R.legoDrawer = group(LG, 0, .05, .141);
    rbox(.34, .07, .012, .004, std(0xe5413a, .45), ld, 0, 0, .004); box(.32, .006, .24, std(0x8a8f98, .6), ld, 0, -.03, -.125);
    mesh(new T3.SphereGeometry(.012, 12, 8), M.chrome, ld, 0, 0, .018);
    box(.3, .012, .2, std(0x3aa655, .5), LG, 0, .106, 0);
    const studG = new T3.CylinderGeometry(.008, .008, .006, 10), studM = std(0x3aa655, .5), inst = new T3.InstancedMesh(studG, studM, 60), dm = new T3.Object3D();
    for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) { dm.position.set(-.126 + i * .028, .115, -.07 + j * .028); dm.updateMatrix(); inst.setMatrixAt(i * 6 + j, dm.matrix); } LG.add(inst);
    R.BH = .075; R.stackBase = V(0, .112 + R.BH / 2, 0);
    R.bricks = {};
    const BR = { red: [0xe5413a, 'roja', -.43, .13, .5], yellow: [0xf4c430, 'amarilla', .4, .2, -.35], green: [0x3aa655, 'verde', -.38, -.2, -.2], orange: [0xf28a1e, 'naranja', .43, -.13, .3], blue: [0x2e6fd8, 'azul', -.62, -.02, 1.2] };
    for (const k in BR) {
      const d = BR[k], g = group(LG, d[2], R.BH / 2, d[3], d[4]), m = std(d[0], .32);
      box(.16, R.BH, .08, m, g, 0, 0, 0);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cyl(.015, .015, .012, m, g, -.06 + i * .04, R.BH / 2 + .006, -.02 + j * .04, 12);
      reg(g, 'brick:' + k, 'Pieza ' + d[1], 'lego'); R.bricks[k] = { g, home: g.position.clone(), ry: d[4] };
    }
    R.bricks.blue.g.visible = false;
    const lc = plane(.27, .18, texMat(T.legocard, { color: 0xd8d8d8 }), LG, -.74, .003, .4); lc.rotation.x = -PI / 2; lc.rotation.z = -.2; reg(lc, 'legocard', 'Tarjeta del reto', 'lego');
    const mkFlat = (w, h, mat, parent, x, y, z, rz) => { const p = plane(w, h, mat, parent, x, y, z); p.rotation.x = -PI / 2; p.rotation.z = rz || 0; return p; };
    R.items = {};
    R.items.pi_cost = reg(mkFlat(.085, .085, texMat(T.postit.pi_cost), ld, -.08, -.025, -.11, .2), 'item:pi_cost', 'Pósit verde', 'lego');
    R.items.noteMaria = reg(mkFlat(.11, .08, texMat(T.maria), ld, .07, -.025, -.1, -.15), 'item:noteMaria', 'Nota doblada', 'lego');

    /* ---------- Pizarra con el Lean Canvas ---------- */
    const BD = R.board = group(scene, -2.0, 1.5, -Z); reg(BD, 'board', 'Pizarra: Lean Canvas');
    const B = ER.BOARD;
    rbox(B.w + .1, B.h + .1, .04, .01, M.alu, BD, 0, 0, .02);
    plane(B.w, B.h, texMat(T.board, { roughness: .55, envMapIntensity: .3 }), BD, 0, 0, .0415);
    box(1.6, .025, .08, M.alu, BD, 0, -B.h / 2 - .06, .07);
    [0x1d4fa3, 0xe5413a, 0x191b20].forEach((c, i) => { const mk = cyl(.011, .011, .13, std(c, .4), BD, -.3 + i * .2, -B.h / 2 - .037, .075, 10); mk.rotation.z = PI / 2; });
    R.slots = {};
    for (const k in B.blocks) {
      const b = B.blocks[k], r = b.r, w = (r[2] - r[0]) * B.w, h = (r[3] - r[1]) * B.h, cx = ((r[0] + r[2]) / 2 - .5) * B.w, cy = (.5 - (r[1] + r[3]) / 2) * B.h;
      const p = plane(w - .01, h - .01, ghost, BD, cx, cy, .046); p.receiveShadow = false;
      reg(p, 'blk:' + k, b.t.charAt(0) + b.t.slice(1).toLowerCase(), 'board');
      R.slots[k] = V(cx, cy - h / 2 + .135, .05);
    }
    R.postits = {};
    for (const k in ER.POSTITS) {
      const pm = plane(.19, .19, texMat(T.postit[k], { roughness: .9 }), BD, 0, 0, .05); pm.visible = false; pm.castShadow = true;
      reg(pm, 'postit:' + k, ER.POSTITS[k].name + ': «' + ER.POSTITS[k].text + '»', 'board');
      const d = plane(.17, .17, uvMat(T.uvDigit[k]), pm, 0, -.005, .003); addUV(d, .26);
      R.postits[k] = pm;
    }
    addUV(plane(2.9, .226, uvMat(T.uvBoard), BD, 0, B.h / 2 + .2, .01), .55);
    const uw = addUV(plane(1.6, .31, uvMat(T.uvWall), scene, -X + .03, 1.42, -.9), .45); uw.rotation.y = PI / 2;

    /* ---------- Pantalla con Vicenta + neón ---------- */
    const TV = R.tv = group(scene, 2.3, 1.72, -Z); reg(TV, 'tv', 'Vicenta, tu mentora (videollamada)');
    rbox(1.58, .93, .05, .012, M.black, TV, 0, 0, .03);
    plane(1.5, .844, new T3.MeshBasicMaterial({ map: T.tv, color: 0xd0d0d0 }), TV, 0, 0, .0565);
    box(.9, .05, .07, M.black, TV, 0, -.56, .05);
    const neon = plane(2.1, .525, new T3.MeshBasicMaterial({ map: T.neon, transparent: true, toneMapped: false, depthWrite: false, color: new T3.Color(1.7, 1.35, 1.45) }), scene, 2.3, 2.68, -Z + .03); neon.receiveShadow = false;
    const vin = plane(1.9, .95, new T3.MeshStandardMaterial({ map: T.vinyl, transparent: true, roughness: .9 }), scene, -X + .012, 2.3, -.9); vin.rotation.y = PI / 2;

    /* ---------- Taquillas (pared oeste) ---------- */
    const L = R.lockers = group(scene, -X, 0, -2.85, PI / 2); reg(L, 'lockers', 'Taquillas');
    const lm = std(0x2a323e, .5, .45);
    box(1.56, .08, .5, lm, L, 0, .04, .25); box(1.56, .03, .5, lm, L, 0, 1.975, .25); box(1.56, 1.9, .02, lm, L, 0, 1.02, .01); box(1.56, .03, .5, lm, L, 0, 1.01, .25);
    [-.765, -.25, .25, .765].forEach(x => box(.03, 1.9, .5, lm, L, x, 1.02, .25));
    const names = ['María C.', 'Mabel C.', 'Carol S.', 'Mireia B.', 'Raquel B.', 'Ramón A.'], dcol = [M.teal, M.coral, M.mustard, M.coral, M.mustard, M.teal];
    R.lockerDoors = [];
    names.forEach((nm, i) => {
      const col = i % 3, row = i < 3 ? 1 : 0, x0 = -.75 + col * .5 + .015, y0 = row ? 1.03 : .09;
      const p = group(L, x0, y0, .5); reg(p, 'locker:' + i, 'Taquilla de ' + nm, 'lockers');
      rbox(.47, .915, .02, .008, dcol[i], p, .235, .458, .01);
      plane(.2, .05, texMat(ER.tex(ER.labelCanvas(nm, 256, 64, '#f4f1e8', '#1b2130', `700 36px ${ER.FONT}`))), p, .235, .76, .0215);
      for (let v = 0; v < 4; v++) box(.2, .008, .004, M.black, p, .235, .6 + v * .028, .021);
      const lk = cyl(.02, .02, .014, M.chrome, p, .41, .43, .026, 16); lk.rotation.x = PI / 2;
      box(.004, .018, .004, M.dark, p, .41, .43, .034);
      R.lockerDoors.push(p);
    });
    // ruedas de combinación (Mireia)
    const pM = R.lockerDoors[3]; R.dials = [];
    rbox(.3, .14, .014, .006, M.black, pM, .2, .34, .024);
    for (let i = 0; i < 3; i++) { const d = box(.075, .1, .016, new T3.MeshStandardMaterial({ map: T.digits[0], roughness: .6 }), pM, .115 + i * .085, .34, .034); reg(d, 'dial:' + i, 'Rueda ' + (i + 1), 'lockerMireia'); R.dials.push(d); }
    // contenido
    const bb = group(L, -.06, 1.03 + R.BH / 2 + .005, .22, .5), bm = std(0x2e6fd8, .32);
    box(.16, R.BH, .08, bm, bb); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cyl(.015, .015, .012, bm, bb, -.06 + i * .04, R.BH / 2 + .006, -.02 + j * .04, 12);
    R.items.brick = reg(bb, 'item:brick', 'Pieza azul', 'lockers');
    const pmet = plane(.13, .13, texMat(T.postit.pi_met), L, .1, 1.115, .1); pmet.rotation.x = -.3; R.items.pi_met = reg(pmet, 'item:pi_met', 'Pósit rosa', 'lockers');
    const fl = group(L, -.5, .14, .26, .4);
    const fb = cyl(.022, .022, .15, M.black, fl, 0, 0, 0, 16); fb.rotation.z = PI / 2; const fh = cyl(.032, .024, .05, M.alu, fl, .1, 0, 0, 16); fh.rotation.z = -PI / 2;
    const fls = cyl(.027, .027, .004, new T3.MeshBasicMaterial({ color: new T3.Color(1.6, .7, 3), toneMapped: false }), fl, .127, 0, 0, 16); fls.rotation.z = PI / 2;
    R.items.uv = reg(fl, 'item:uv', 'Linterna', 'lockerMireia');

    /* ---------- Rincón del café (pared oeste) ---------- */
    const C = group(scene, -X, 0, 1.35, PI / 2);
    rbox(2.0, .86, .55, .01, M.white, C, 0, .45, .28); rbox(2.06, .04, .6, .01, M.oak, C, 0, .9, .3);
    [-.5, 0, .5].forEach(x => box(.006, .8, .006, std(0xb9b4aa), C, x, .45, .558)); [-.75, -.25, .25, .75].forEach(x => box(.1, .012, .012, M.black, C, x, .78, .565));
    const cm = group(C, -.5, .92, .3); reg(cm, 'coffee', 'Cafetera');
    rbox(.3, .36, .32, .02, std(0x15171b, .25, .4), cm, 0, .18, 0); box(.3, .02, .32, M.chrome, cm, 0, .37, 0); box(.22, .17, .02, std(0x0a0b0d, .3), cm, 0, .15, .16);
    box(.24, .016, .13, M.chrome, cm, 0, .008, .2); cyl(.014, .01, .05, M.chrome, cm, 0, .21, .19, 10);
    [0x2fd688, 0xffb040, 0xff5a4e].forEach((c, i) => mesh(new T3.SphereGeometry(.009, 8, 8), new T3.MeshBasicMaterial({ color: c }), cm, -.07 + i * .07, .3, .162));
    R.cup = mug(cm, 0, .016, .2, M.white);
    mug(C, .1, .92, .3, M.teal); mug(C, .22, .92, .38, M.mustard); mug(C, .34, .92, .28, M.coral);
    cyl(.07, .05, .13, std(0xb5673c, .8), C, .75, .985, .3); mesh(new T3.SphereGeometry(.1, 10, 8), M.plantG, C, .75, 1.12, .3);
    box(.9, 1.25, .016, M.black, C, .3, 2.0, .008); const dtp = plane(.86, 1.21, texMat(T.dt), C, .3, 2.0, .018); reg(dtp, 'dtposter', 'Póster: Design Thinking');
    const bin = group(C, -1.4, 0, .32); reg(bin, 'bin', 'Papelera');
    mesh(new T3.CylinderGeometry(.17, .13, .38, 20, 1, true), std(0x30343c, .5, .6, { side: T3.DoubleSide }), bin, 0, .19, 0); cyl(.13, .13, .01, std(0x30343c, .5, .6), bin, 0, .005, 0);
    R.binPaper = mesh(new T3.IcosahedronGeometry(.07, 0), std(0xf1efe9, .9, 0, { flatShading: true }), bin, .02, .33, 0);
    mesh(new T3.IcosahedronGeometry(.06, 0), std(0xdedbd2, .9, 0, { flatShading: true }), bin, -.05, .26, .03);

    /* ---------- Sofá, perchero de sombreros, lámpara ---------- */
    const SF = group(scene, -3.9, 0, 3.95, PI);
    rbox(1.9, .28, .85, .07, M.fabric, SF, 0, .3, 0); rbox(1.9, .52, .22, .09, M.fabric, SF, 0, .62, -.32);
    [-.95, .95].forEach(x => rbox(.2, .42, .85, .08, M.fabric, SF, x, .44, 0)); [[-.8, -.3], [.8, -.3], [-.8, .3], [.8, .3]].forEach(p => cyl(.02, .015, .16, M.walnut, SF, p[0], .08, p[1], 8));
    const cu = rbox(.42, .38, .13, .06, M.teal, SF, -.5, .62, -.14); cu.rotation.x = -.3; const cu2 = rbox(.4, .36, .13, .06, std(0xf1eee8, .9), SF, .45, .61, -.14); cu2.rotation.x = -.3; cu2.rotation.z = .12;
    const HR = group(scene, -3.9, 1.95, Z, PI); reg(HR, 'hats', 'Seis sombreros de colores');
    box(2.0, .09, .03, M.walnut, HR, 0, .05, .015);
    [0xf4c430, 0x1c1c1e, 0x2e6fd8, 0xf4f1ea, 0x3aa655, 0xe5413a].forEach((c, i) => {
      const hg = group(HR, -.8 + i * .32, -.06, .05), hm = std(c, .8);
      const pg = cyl(.012, .012, .08, M.walnut, HR, -.8 + i * .32, .05, .05, 8); pg.rotation.x = PI / 2;
      hg.rotation.x = PI / 2 - .12; cyl(.135, .135, .012, hm, hg, 0, 0, 0, 28); cyl(.075, .088, .09, hm, hg, 0, .05, 0, 28); cyl(.09, .09, .02, std(0x2a2a2e, .7), hg, 0, .017, 0, 28);
    });
    const FL = group(scene, -2.55, 0, 4.05); cyl(.14, .16, .02, M.black, FL, 0, .01, 0); cyl(.012, .012, 1.5, M.black, FL, 0, .76, 0, 8);
    mesh(new T3.CylinderGeometry(.14, .19, .26, 24, 1, true), new T3.MeshBasicMaterial({ color: new T3.Color(1.5, 1.1, .7), side: T3.DoubleSide, toneMapped: false }), FL, 0, 1.6, 0).castShadow = false;
    addLight(new T3.PointLight(0xffb870, 2.2, 5, 1.8)).position.set(-2.55, 1.55, 3.9);

    /* ---------- Reloj (pared sur) ---------- */
    const CH = R.clockHinge = group(scene, -1.58, 2.3, Z - .03, PI); reg(CH, 'clock', 'Reloj de pared');
    const CK = group(CH, .32, 0, 0);
    const rim = cyl(.32, .32, .05, M.black, CK, 0, 0, .025, 48); rim.rotation.x = PI / 2;
    mesh(new T3.CircleGeometry(.297, 48), texMat(T.clock, { roughness: .6 }), CK, 0, 0, .0515).castShadow = false;
    const hg = new T3.BoxGeometry(.024, .17, .006); hg.translate(0, .07, 0); R.hHand = mesh(hg, M.black, CK, 0, 0, .058);
    const mg = new T3.BoxGeometry(.015, .26, .006); mg.translate(0, .115, 0); R.mHand = mesh(mg, M.black, CK, 0, 0, .066);
    const cc = cyl(.018, .018, .02, M.coral, CK, 0, 0, .066, 16); cc.rotation.x = PI / 2;
    const ni = mesh(new T3.CircleGeometry(.24, 40), M.dark, scene, -1.9, 2.3, Z - .004); ni.rotation.y = PI; ni.castShadow = false;
    const KY = R.items.key = group(scene, -1.9, 2.3, Z - .03, PI); reg(KY, 'item:key', 'Llave pequeña', 'clock'); KY.visible = false;
    const gold = std(0xe2b64a, .3, .9);
    mesh(new T3.TorusGeometry(.03, .008, 8, 20), gold, KY, 0, .03, 0); box(.012, .09, .008, gold, KY, 0, -.045, 0); box(.03, .012, .008, gold, KY, .014, -.07, 0); box(.022, .012, .008, gold, KY, .01, -.088, 0);
    const tag = plane(.11, .045, texMat(ER.tex(ER.labelCanvas('Mabel C.', 256, 104, '#f4f1e8', '#b3261e', `700 54px ${ER.HAND}`))), KY, .1, .0, .002); tag.rotation.z = -.2;
    cyl(.004, .004, .03, M.chrome, KY, 0, .07, 0, 6);

    /* ---------- Programa, puerta y teclado (pared sur) ---------- */
    box(.98, 1.36, .016, M.black, scene, -.1, 1.62, Z - .008);
    const prog = plane(.94, 1.33, texMat(T.program), scene, -.1, 1.62, Z - .018); prog.rotation.y = PI; reg(prog, 'program', 'Programa de talleres');
    box(.76, 1.06, .016, M.black, scene, 1.0, 1.66, Z - .008);
    const tk = plane(.72, 1.02, texMat(T.talks), scene, 1.0, 1.66, Z - .018); tk.rotation.y = PI; reg(tk, 'talks', 'Cartel: ponencias de coworkers');
    const DG = R.door = group(scene); reg(DG, 'door', 'Puerta de salida');
    const fr = std(0x22262d, .5, .3);
    box(.08, 2.18, .16, fr, DG, 2.06, 1.09, Z); box(.08, 2.18, .16, fr, DG, 3.14, 1.09, Z); box(1.16, .08, .16, fr, DG, 2.6, 2.14, Z);
    const DP = R.doorPivot = group(DG, 3.1, 0, Z);
    const leaf = rbox(1.0, 2.1, .05, .01, std(0x1e5e63, .5), DP, -.5, 1.05, 0); reg(leaf, 'doorleaf', 'Puerta de salida', 'door');
    box(.2, .9, .054, std(0xbfd6dc, .2, .1, { emissive: 0x18242a }), DP, -.5, 1.4, 0);
    box(.04, .16, .02, M.chrome, DP, -.9, 1.02, -.035); box(.14, .025, .025, M.chrome, DP, -.84, 1.04, -.06);
    box(.14, .225, .025, M.black, DG, 1.85, 1.32, Z - .013);
    const kp = plane(.12, .2, texMat(T.keypad, { roughness: .5, emissive: 0xffffff, emissiveMap: T.keypad, emissiveIntensity: .35 }), DG, 1.85, 1.32, Z - .027); kp.rotation.y = PI; reg(kp, 'keypad', 'Teclado de acceso', 'door');
    const kuv = addUV(plane(.12, .2, uvMat(T.keypadUV), DG, 1.85, 1.32, Z - .029), .3); kuv.rotation.y = PI;
    box(.52, .2, .04, M.black, DG, 2.6, 2.36, Z - .02); const ex = plane(.48, .18, new T3.MeshBasicMaterial({ map: T.exit, toneMapped: false }), DG, 2.6, 2.36, Z - .042); ex.rotation.y = PI;
    R.corridor = plane(1.6, 2.4, new T3.MeshBasicMaterial({ color: new T3.Color(3, 2.9, 2.6), toneMapped: false }), scene, 2.6, 1.1, Z + .9); R.corridor.rotation.y = PI; R.corridor.visible = false;
    R.corrLight = new T3.PointLight(0xfff4dc, 0, 9, 1.5); R.corrLight.position.set(2.6, 1.6, Z + .3); scene.add(R.corrLight);

    /* ---------- Estantería (pared este) ---------- */
    const S = R.shelf = group(scene, X, 0, 2.5, -PI / 2); reg(S, 'shelf', 'Estantería');
    [-.98, .98].forEach(x => box(.04, 2.24, .36, M.white, S, x, 1.12, .18)); box(1.96, 2.2, .02, M.oak, S, 0, 1.12, .01);
    const rows = [.05, .5, .95, 1.4, 1.85]; rows.concat([2.225]).forEach(y => box(1.96, .03, .35, M.white, S, 0, y, .18));
    const pal = [0xb5473c, 0x2c5f7a, 0xd9a441, 0x3d6b52, 0x7a5c8e, 0xe8e2d4, 0x1f2a3c, 0xc96f4a, 0x56898c].map(c => std(c, .8));
    const special = { 3: [[-.52, 'hats', 0x7a2e22, 'Libro: «Seis sombreros para pensar»'], [.3, 'dt', 0x12233d, 'Libro: «Design Thinking»']], 2: [[-.12, 'fin', 0x1f6f5c, 'Libro: «Finanzas para emprender»']], 4: [[.5, 'copy', 0xe0a020, 'Libro: «Copywriting»']] };
    const ug = new T3.BoxGeometry(1, 1, 1);
    rows.forEach((y, ri) => {
      let x = -.94; const sp = (special[ri] || []).slice();
      while (x < .9) {
        if (sp.length && x >= sp[0][0]) {
          const s = sp.shift(), side = std(s[2], .7), bk = mesh(new T3.BoxGeometry(.072, .32, .25), [side, side, M.white, side, texMat(T.spines[s[1]], { roughness: .7 }), side], S, x + .04, y + .175, .2);
          reg(bk, 'book:' + s[1], s[3], 'shelf'); x += .084; continue;
        }
        if (rnd() < .07) { if (rnd() < .5) { cyl(.06, .045, .11, std(0xe8e2d4, .7), S, x + .1, y + .07, .18); mesh(new T3.SphereGeometry(.075, 8, 6), M.plantG, S, x + .1, y + .17, .18); } x += .22; continue; }
        const w = .022 + rnd() * .03, h = .2 + rnd() * .11, d = .2 + rnd() * .05, b = mesh(ug, pal[Math.floor(rnd() * pal.length)], S, x + w / 2, y + .015 + h / 2, .04 + d / 2);
        b.scale.set(w, h, d); if (rnd() < .08) { b.rotation.z = -.18; b.position.x += .02; x += .03; }
        x += w + .003;
      }
    });

    /* ---------- Aparador con el cajón de María (pared este) ---------- */
    const SB = R.sideboard = group(scene, X, 0, -1.6, -PI / 2); reg(SB, 'sideboard', 'Aparador');
    [[-.9, .08], [.9, .08], [-.9, .38], [.9, .38]].forEach(p => cyl(.02, .014, .17, M.black, SB, p[0], .085, p[1], 8));
    rbox(2.0, .62, .45, .012, M.white, SB, 0, .48, .225); rbox(2.04, .03, .48, .01, M.oak, SB, 0, .805, .235);
    [-.67, .67].forEach(x => { rbox(.62, .56, .015, .005, M.oak, SB, x, .48, .455); cyl(.012, .012, .02, M.black, SB, x - Math.sign(x) * .25, .48, .47, 10).rotation.x = PI / 2; });
    rbox(.66, .25, .015, .005, M.oak, SB, 0, .325, .455); box(.14, .012, .014, M.black, SB, 0, .325, .468);
    plane(.64, .27, M.dark, SB, 0, .62, .4512);
    const DR = R.drawer = group(SB, 0, .62, .455);
    rbox(.66, .29, .015, .005, M.oak, DR, 0, 0, 0); box(.6, .01, .38, M.white, DR, 0, -.125, -.2);
    [-.3, .3].forEach(x => box(.012, .2, .38, M.white, DR, x, -.03, -.2)); box(.6, .2, .012, M.white, DR, 0, -.03, -.39);
    plane(.26, .045, texMat(ER.tex(ER.labelCanvas('María Calvo', 512, 88, '#f4f1e8', '#1b2130', `700 50px ${ER.FONT}`))), DR, 0, .105, .0085);
    R.cbtns = []; R.COLORS = [0xf4f1ea, 0xe5413a, 0x1c1c1e, 0xf4c430, 0x3aa655, 0x2e6fd8];
    for (let i = 0; i < 4; i++) {
      const bx = -.21 + i * .14; const ring = cyl(.05, .05, .008, M.chrome, DR, bx, -.03, .011, 28); ring.rotation.x = PI / 2;
      const b = cyl(.04, .04, .022, std(0xffffff, .4), DR, bx, -.03, .018, 28); b.rotation.x = PI / 2; reg(b, 'cbtn:' + i, 'Botón de color', 'drawer'); R.cbtns.push(b);
    }
    const card = group(DR, -.13, -.115, -.2, .25); box(.11, .004, .07, std(0xfafafa, .4), card); box(.11, .0045, .018, M.coral, card, 0, 0, -.02);
    R.items.card = reg(card, 'item:card', 'Tarjeta de coworker', 'drawer');
    R.items.pi_ing = reg(mkFlat(.1, .1, texMat(T.postit.pi_ing), DR, .12, -.118, -.2, -.2), 'item:pi_ing', 'Pósit naranja', 'drawer');
    // decoración encima
    box(.3, .035, .22, pal[1], SB, -.65, .838, .24); box(.27, .03, .2, pal[2], SB, -.64, .87, .24).rotation.y = .2;
    cyl(.08, .06, .15, std(0x1e5e63, .6), SB, .7, .895, .24); mesh(new T3.SphereGeometry(.13, 10, 8), M.plantG, SB, .7, 1.05, .24);
    const frm = box(.26, .34, .02, M.black, SB, .1, 1.0, .1); frm.rotation.x = -.14; const fp = plane(.22, .3, std(0xff5a4e, .8), SB, .1, 1.0, .112); fp.rotation.x = -.14;

    /* ---------- Planta (esquina noreste) ---------- */
    const PL = R.plant = group(scene, 4.72, 0, -3.72); reg(PL, 'plant', 'Planta');
    cyl(.25, .18, .44, std(0xf1eee8, .5), PL, 0, .22, 0, 28); cyl(.235, .235, .02, std(0x2b1d14, 1), PL, 0, .425, 0, 20);
    const ls = new T3.Shape(); ls.moveTo(0, 0); ls.bezierCurveTo(.17, .1, .15, .42, 0, .56); ls.bezierCurveTo(-.15, .42, -.17, .1, 0, 0); const lg = new T3.ShapeGeometry(ls, 8);
    for (let i = 0; i < 13; i++) {
      const a = group(PL, 0, .43, 0, i * 2.4), t = group(a); t.rotation.z = -(.12 + rnd() * .75); const len = .45 + rnd() * .75;
      cyl(.007, .01, len, std(0x3c6b3a, .7), t, 0, len / 2, 0, 6);
      const lh = group(t, 0, len, 0); lh.rotation.z = -.55; const lf = mesh(lg, std(i % 3 ? 0x2f7d4a : 0x3f9a5c, .55, 0, { side: T3.DoubleSide }), lh); lf.rotation.y = PI / 2; lf.scale.setScalar(.75 + rnd() * .5);
    }
    R.plantPostit = plane(.1, .1, texMat(T.postit.pi_seg, { side: T3.DoubleSide }), PL, .1, .5, .17); R.plantPostit.rotation.set(-.5, .4, .2);

    /* ---------- Estado inicial y zonas de cámara ---------- */
    ['pi_cost', 'noteMaria', 'brick', 'pi_met', 'uv', 'card', 'pi_ing'].forEach(k => R.items[k].visible = false);
    scene.updateMatrixWorld(true);
    const zl = (g, x, y, z) => g.localToWorld(V(x, y, z));
    ER.zones = {
      board: { c: zl(BD, 0, -.14, 0), n: V(0, 0, 1), w: 3.45, h: 2.5 },
      lockers: { c: zl(L, 0, .93, .5), n: V(1, 0, 0), w: 1.75, h: 2.2 },
      lockerMireia: { parent: 'lockers', c: zl(L, -.5, .42, .5), n: V(1, 0, 0), w: .66, h: .78, elev: .3 },
      clock: { c: V(-1.9, 2.3, Z), n: V(0, 0, -1), w: 1.3, h: 1.15, elev: -.45 },
      door: { c: V(2.45, 1.22, Z), n: V(0, 0, -1), w: 1.8, h: 2.5 },
      shelf: { c: zl(S, 0, 1.42, .35), n: V(-1, 0, 0), w: 2.0, h: 1.55 },
      drawer: { pos: zl(SB, 0, 1.75, 1.2), look: zl(SB, 0, .56, .56) },
      lego: { pos: V(.72, 1.58, .12), look: V(.72, .8, -.86) }
    };
  };
})();
