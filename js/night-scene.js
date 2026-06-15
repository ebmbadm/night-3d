// night-scene.js — геометрия центра «Найт» 60.0 × 37.8 м
// План: северный пролёт 22.2 м (падел), южный 15.6 м (бадминтон / НТ / кафе / сервис),
// антресоль +4.600 над НТ и сервисом, конёк +10.4, карниз +8.0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Перевод плановых координат (x: 0–60 запад→восток, y: 0–37.8 юг→север) в сцену
const PX = (x) => x - 30;
const PZ = (y) => y - 18.9;

export function buildScene(scene) {
  const root = new THREE.Group();
  scene.add(root);

  /* ============================ МАТЕРИАЛЫ ============================ */
  const M = {
    ground:    new THREE.MeshStandardMaterial({ color: 0x110b28, roughness: 0.96 }),
    asphalt:   new THREE.MeshStandardMaterial({ color: 0x191333, roughness: 0.95 }),
    slab:      new THREE.MeshStandardMaterial({ color: 0x262047, roughness: 0.92 }),
    slabMezz:  new THREE.MeshStandardMaterial({ color: 0x2e2758, roughness: 0.9 }),
    steel:     new THREE.MeshStandardMaterial({ color: 0xe9eaf4, roughness: 0.55, metalness: 0.25 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x8f95b8, roughness: 0.35, metalness: 0.8 }),
    roof:      new THREE.MeshStandardMaterial({ color: 0x221a4d, roughness: 0.6, metalness: 0.35, transparent: true, opacity: 1 }),
    wall:      new THREE.MeshStandardMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.16, roughness: 0.2, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    glass:     new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.14, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    rail:      new THREE.MeshStandardMaterial({ color: 0xa8e8ff, transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    line:      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    partition: new THREE.MeshStandardMaterial({ color: 0xcdc7ea, roughness: 0.9 }),
    wood:      new THREE.MeshStandardMaterial({ color: 0x8a6347, roughness: 0.8 }),
    net:       new THREE.MeshStandardMaterial({ color: 0x161233, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    mint:      new THREE.MeshStandardMaterial({ color: 0x22e6a8, roughness: 0.7 }),
    orange:    new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.6 }),
    magentaSoft: new THREE.MeshStandardMaterial({ color: 0xc2399f, roughness: 0.8 }),
    dark:      new THREE.MeshStandardMaterial({ color: 0x1c1640, roughness: 0.9 }),
    lockerDoor: new THREE.MeshStandardMaterial({ color: 0x332a68, roughness: 0.65, metalness: 0.15 }),
    lockerFloor: new THREE.MeshStandardMaterial({ color: 0x1e1745, roughness: 0.92 }),
    // покрытия — меняются твиком
    padelTurf: new THREE.MeshStandardMaterial({ color: 0x5e2fd6, roughness: 0.95 }),
    padelTurfSingle: new THREE.MeshStandardMaterial({ color: 0x7a3fe2, roughness: 0.95 }),
    badCourt:  new THREE.MeshStandardMaterial({ color: 0xc2399f, roughness: 0.9 }),
    ttFloor:   new THREE.MeshStandardMaterial({ color: 0x382a6e, roughness: 0.92 }),
    ttTop:     new THREE.MeshStandardMaterial({ color: 0x4a1dad, roughness: 0.6 }),
    // неон / эмиссия
    led:       new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6 }),
    ledMagenta: new THREE.MeshStandardMaterial({ color: 0xdd58c5, emissive: 0xdd58c5, emissiveIntensity: 2.2 }),
    ledOrange: new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff8a3d, emissiveIntensity: 1.4 }),
    ledMint:   new THREE.MeshStandardMaterial({ color: 0x22e6a8, emissive: 0x22e6a8, emissiveIntensity: 1.6 }),
  };
  const neonMats = [
    { mat: M.led, base: 1.6 },
    { mat: M.ledMagenta, base: 2.2 },
    { mat: M.ledOrange, base: 1.4 },
    { mat: M.ledMint, base: 1.6 },
  ];

  /* ============================ ХЕЛПЕРЫ ============================ */
  // addBox(parent, mat, [x0,x1], [h0,h1], [y0,y1]) — плановые координаты
  function addBox(parent, mat, xr, hr, yr, cast = false) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(xr[1] - xr[0], hr[1] - hr[0], yr[1] - yr[0]), mat);
    m.position.set((xr[0] + xr[1]) / 2 - 30, (hr[0] + hr[1]) / 2, (yr[0] + yr[1]) / 2 - 18.9);
    m.castShadow = cast; m.receiveShadow = true;
    parent.add(m); return m;
  }
  // осевые линии разметки (тонкие коробки)
  function addLine(parent, x0, y0, x1, y1, level, w = 0.06) {
    const xr = x0 === x1 ? [x0 - w / 2, x0 + w / 2] : [Math.min(x0, x1), Math.max(x0, x1)];
    const yr = y0 === y1 ? [y0 - w / 2, y0 + w / 2] : [Math.min(y0, y1), Math.max(y0, y1)];
    return addBox(parent, M.line, xr, [level, level + 0.012], yr);
  }
  function addCyl(parent, mat, r, h0, h1, x, y, cast = false) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h1 - h0, 14), mat);
    m.position.set(PX(x), (h0 + h1) / 2, PZ(y));
    m.castShadow = cast; m.receiveShadow = true;
    parent.add(m); return m;
  }
  // светящаяся плоскость с canvas-текстурой; rotY: 0 — на север, π — на юг, π/2 — на восток, -π/2 — на запад
  function addPlane(parent, tex, w, h, x, hC, y, rotY, glow = 1.0) {
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow });
    neonMats.push({ mat, base: glow });
    const g = new THREE.PlaneGeometry(w, h);
    g.rotateY(rotY);
    const m = new THREE.Mesh(g, mat);
    m.position.set(PX(x), hC, PZ(y));
    parent.add(m);
    return m;
  }

  /* ---------- мягкая мебель лаундж-зон (планарные координаты) ---------- */
  const matFoliage = new THREE.MeshStandardMaterial({ color: 0x1f9e6e, roughness: 0.85 });
  // диван: faceY -1 — спинка на севере (лицом на юг), +1 — наоборот
  function loungeSofa(x0, x1, y0, y1, faceY, cushA, cushB) {
    const back = faceY < 0 ? [y1 - 0.2, y1] : [y0, y0 + 0.2];
    addBox(root, M.magentaSoft, [x0, x1], [0.16, 0.44], [y0, y1], true);          // сиденье
    addBox(root, M.magentaSoft, [x0, x1], [0.44, 0.94], back, true);              // спинка
    addBox(root, M.magentaSoft, [x0, x0 + 0.16], [0.16, 0.66], [y0, y1], true);   // подлокотники
    addBox(root, M.magentaSoft, [x1 - 0.16, x1], [0.16, 0.66], [y0, y1], true);
    const cy0 = faceY < 0 ? y0 + 0.12 : y1 - 0.64;
    const cy1 = faceY < 0 ? y0 + 0.64 : y1 - 0.12;
    const w = (x1 - x0 - 0.52) / 2;
    addBox(root, cushA, [x0 + 0.24, x0 + 0.24 + w], [0.44, 0.6], [cy0, cy1], true);
    addBox(root, cushB, [x1 - 0.24 - w, x1 - 0.24], [0.44, 0.6], [cy0, cy1], true);
  }
  function loungeBench(x0, x1, y0, y1) {
    addBox(root, M.wood, [x0, x1], [0.4, 0.46], [y0, y1], true);
    for (const lx of [x0 + 0.12, x1 - 0.12]) addBox(root, M.dark, [lx - 0.04, lx + 0.04], [0.05, 0.4], [y0 + 0.05, y1 - 0.05]);
  }
  function loungeTable(x0, x1, y0, y1) {
    addBox(root, M.wood, [x0, x1], [0.34, 0.4], [y0, y1], true);
    for (const lx of [x0 + 0.08, x1 - 0.08]) for (const ly of [y0 + 0.08, y1 - 0.08])
      addBox(root, M.dark, [lx - 0.03, lx + 0.03], [0.05, 0.34], [ly - 0.03, ly + 0.03]);
  }
  function loungePlant(cx, cy, s = 1) {
    addCyl(root, M.dark, 0.17 * s, 0.05, 0.4 * s, cx, cy, true);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.26 * s, 12, 10), matFoliage);
    f.scale.set(1, 1.35, 1); f.position.set(PX(cx), 0.4 * s + 0.22, PZ(cy)); f.castShadow = true; root.add(f);
    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.17 * s, 10, 8), matFoliage);
    f2.position.set(PX(cx) + 0.12, 0.4 * s + 0.06, PZ(cy) + 0.06); root.add(f2);
  }
  function loungeSign(text, cx, hC, cy, w, accent = '#FF8A3D') {
    addPlane(root, makeLabelTexture(text, { accent }), w, w / 4.571, cx, hC, cy, Math.PI, 0.95);
    for (const s of [-1, 1]) addCyl(root, M.dark, 0.012, hC + (w / 4.571) / 2, 4.28, cx + s * (w / 2 - 0.2), cy, false);
  }

  /* ============================ УЧАСТОК ============================ */
  addBox(root, M.ground, [-70, 130], [-0.32, -0.12], [-50, 90]);
  // парковка с востока + подъезд
  addBox(root, M.asphalt, [61, 80], [-0.1, -0.04], [-2, 40]);
  for (let i = 0; i <= 8; i++) addLine(root, 63, 1 + i * 2.7, 68, 1 + i * 2.7, -0.03, 0.1);
  addLine(root, 63, 1, 63, 22.6, -0.03, 0.1);
  // входная площадка
  addBox(root, M.slab, [60, 63.5], [-0.06, 0.02], [4.4, 11.2]);

  /* ============================ ПЛИТА ПОЛА ============================ */
  addBox(root, M.slab, [0, 60], [-0.12, 0.02], [0, 37.8]);

  /* ============================ КАРКАС ============================ */
  const colGeos = [];
  const colXs = [0.15, 6, 12, 18, 24, 30, 36, 42, 48, 54, 59.85];
  for (const x of colXs) for (const y of [0.15, 15.6, 37.65]) {
    const g = new THREE.BoxGeometry(0.38, 8, 0.38);
    g.translate(PX(x), 4, PZ(y));
    colGeos.push(g);
  }
  const columns = new THREE.Mesh(mergeGeometries(colGeos), M.steel);
  columns.castShadow = true; columns.receiveShadow = true;
  root.add(columns);

  // фермы: южный пролёт y 0→15.6 (низ 8.0 → конёк 10.4), северный y 15.6→37.8 (10.4 → 8.0)
  function trussGeos(xPos, y0, y1, hA, hB) {
    const geos = [];
    const bot = 7.05;
    const n = Math.round((y1 - y0) / 2.6);
    const member = (ax, ay, az, bx, by, bz, t = 0.13) => {
      const len = Math.hypot(bx - ax, by - ay, bz - az);
      const g = new THREE.BoxGeometry(t, len, t);
      g.translate(0, len / 2, 0);
      const dir = new THREE.Vector3(bx - ax, by - ay, bz - az).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.applyQuaternion(q);
      g.translate(ax, ay, az);
      geos.push(g);
    };
    const topH = (y) => hA + (hB - hA) * (y - y0) / (y1 - y0);
    const xs = PX(xPos);
    for (let i = 0; i < n; i++) {
      const ya = y0 + (y1 - y0) * i / n, yb = y0 + (y1 - y0) * (i + 1) / n;
      member(xs, topH(ya) - 0.07, PZ(ya), xs, topH(yb) - 0.07, PZ(yb), 0.16); // верхний пояс
      member(xs, bot, PZ(ya), xs, bot, PZ(yb), 0.16);                          // нижний пояс
      member(xs, bot, PZ(ya), xs, topH(ya) - 0.07, PZ(ya), 0.11);              // стойка
      member(xs, bot, PZ(ya), xs, topH(yb) - 0.07, PZ(yb), 0.1);               // раскос
    }
    member(xs, bot, PZ(y1), xs, topH(y1) - 0.07, PZ(y1), 0.11);
    return geos;
  }
  const allTruss = [];
  for (const x of colXs) {
    allTruss.push(...trussGeos(x, 0.15, 15.6, 8.0, 10.4));
    allTruss.push(...trussGeos(x, 15.6, 37.65, 10.4, 8.0));
  }
  const trusses = new THREE.Mesh(mergeGeometries(allTruss), M.steel);
  trusses.receiveShadow = true;
  root.add(trusses);

  /* ============================ СТЕНЫ ============================ */
  const t = 0.18;
  addBox(root, M.wall, [0, 60], [0.4, 8], [0, t]);            // юг
  addBox(root, M.wall, [0, 60], [0.4, 8], [37.8 - t, 37.8]);  // север (панорамный фасад)
  addBox(root, M.wall, [0, t], [0.4, 8], [0, 37.8]);          // запад
  addBox(root, M.wall, [60 - t, 60], [0.4, 8], [0, 9.4]);     // восток (южнее входа... ниже проём)
  addBox(root, M.wall, [60 - t, 60], [0.4, 8], [5.4, 37.8]);  // восток
  // цоколь
  for (const seg of [[[0, 60], [0, 0.45], [0, 0.22]], [[0, 60], [0, 0.45], [37.58, 37.8]], [[0, 0.22], [0, 0.45], [0, 37.8]], [[59.78, 60], [0, 0.45], [0, 37.8]]])
    addBox(root, M.dark, seg[0], seg[1], seg[2]);

  // перегородка между пролётами (стекло, y = 15.6) с проёмами
  for (const seg of [[6.6, 13], [16, 36], [40, 54], [56, 60]])
    addBox(root, M.glass, seg, [0.05, 3.6], [15.55, 15.65]);

  /* ============================ ТЕХБЛОК (запад, x 0.22–6.6, y 15.65–37.58) ============================
     Дальний край за падел-кортами. Венткамера (~32 м²) с приточно-вытяжными установками,
     серверная и склады инвентаря. Из венткамеры по потолку расходятся воздуховоды. */
  buildTechBlock();
  function buildTechBlock() {
    const xW = 0.22, xE = 6.6, wT = 0.07, wallH = 3.0;
    /* --- материалы зоны --- */
    const mFloor   = new THREE.MeshStandardMaterial({ color: 0x171134, roughness: 0.86, metalness: 0.2 });
    const mFloorSrv= new THREE.MeshStandardMaterial({ color: 0x10122e, roughness: 0.7, metalness: 0.3 });
    const mAHU     = new THREE.MeshStandardMaterial({ color: 0xc9cee1, roughness: 0.5, metalness: 0.55 });
    const mAHUp    = new THREE.MeshStandardMaterial({ color: 0x9ba1bf, roughness: 0.42, metalness: 0.7 });
    const mDuct    = new THREE.MeshStandardMaterial({ color: 0xbcc1d4, roughness: 0.44, metalness: 0.6 });
    const mWrap    = new THREE.MeshStandardMaterial({ color: 0x6f7596, roughness: 0.72, metalness: 0.28 });
    const mRack    = new THREE.MeshStandardMaterial({ color: 0x0c0a22, roughness: 0.5, metalness: 0.4 });
    const mVent    = new THREE.MeshStandardMaterial({ color: 0x05040f, roughness: 0.85 });
    const mShelf   = new THREE.MeshStandardMaterial({ color: 0x3a3168, roughness: 0.72, metalness: 0.22 });
    const mPipe    = new THREE.MeshStandardMaterial({ color: 0x9aa0c2, roughness: 0.34, metalness: 0.82 });
    const mLedCyan = new THREE.MeshStandardMaterial({ color: 0x44d9ff, emissive: 0x44d9ff, emissiveIntensity: 1.8 });
    neonMats.push({ mat: mLedCyan, base: 1.8 });
    const crateMats = [
      new THREE.MeshStandardMaterial({ color: 0x4a3a86, roughness: 0.86 }),
      new THREE.MeshStandardMaterial({ color: 0x2c2560, roughness: 0.86 }),
      new THREE.MeshStandardMaterial({ color: 0x6d4d37, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x3f3a72, roughness: 0.86 }),
    ];
    const dotCols = [M.ledMint, mLedCyan, M.ledOrange];

    /* --- хелперы воздуховодов / оборудования --- */
    function hDuct(ax, ay, bx, by, hC, r, mat) {
      const sx = PX(ax), sz = PZ(ay), ex = PX(bx), ez = PZ(by);
      const len = Math.hypot(ex - sx, ez - sz);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 18), mat);
      const dir = new THREE.Vector3(ex - sx, 0, ez - sz).normalize();
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      m.position.set((sx + ex) / 2, hC, (sz + ez) / 2);
      m.castShadow = true; m.receiveShadow = true; root.add(m); return m;
    }
    function elbow(x, y, hC, r, mat) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 16, 12), mat);
      s.position.set(PX(x), hC, PZ(y)); root.add(s);
    }
    function hanger(x, y, hTop) { addCyl(root, mWrap, 0.012, hTop, 7.04, x, y, false); }
    function coupling(x, y, hC, r, axis) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.13, r * 1.13, 0.12, 18), mAHUp);
      if (axis === 'x') m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2;
      m.position.set(PX(x), hC, PZ(y)); root.add(m);
    }
    function diffuser(x, y) {
      addBox(root, mDuct, [x - 0.16, x + 0.16], [5.98, 6.5], [y - 0.16, y + 0.16], true); // спуск
      addBox(root, mAHUp, [x - 0.3, x + 0.3], [5.88, 5.99], [y - 0.3, y + 0.3], true);     // рамка
      addBox(root, M.line, [x - 0.26, x + 0.26], [5.86, 5.89], [y - 0.26, y + 0.26]);      // решётка
    }
    function ahu(x0, x1, y0, y1, accent) {
      const top = 1.95, cx = (x0 + x1) / 2;
      addBox(root, mAHU, [x0, x1], [0.06, top], [y0, y1], true);
      addBox(root, mAHUp, [x0 - 0.02, x1 + 0.02], [top, top + 0.05], [y0 - 0.02, y1 + 0.02], true);
      addBox(root, mAHUp, [x0 - 0.02, x1 + 0.02], [0.06, 0.15], [y0 - 0.02, y1 + 0.02], true); // цоколь-рама
      const segN = 3, segLen = (y1 - y0) / segN;
      for (let i = 0; i < segN; i++) {
        const a = y0 + i * segLen + 0.06, b = y0 + (i + 1) * segLen - 0.06;
        addBox(root, mAHUp, [x1 - 0.01, x1 + 0.03], [0.2, top - 0.14], [a, b], true);         // дверца секции
        addBox(root, M.steelDark, [x1 + 0.02, x1 + 0.07], [0.92, 1.12], [b - 0.18, b - 0.05]); // ручка
        if (i === 1) addBox(root, mVent, [x1 + 0.005, x1 + 0.04], [0.5, 1.4], [a + 0.08, b - 0.08]); // смотровое
      }
      addCyl(root, mDuct, 0.3, top, top + 0.32, cx, y0 + 0.55, true);                          // выходной патрубок
      addBox(root, mRack, [x1 + 0.0, x1 + 0.14], [0.78, 1.42], [y1 - 0.7, y1 - 0.24], true);   // щит управления
      addBox(root, accent, [x1 + 0.14, x1 + 0.16], [0.9, 1.3], [y1 - 0.62, y1 - 0.32]);
      return { ox: cx, oy: y0 + 0.55, top };
    }
    function rack(x0, x1, y0, y1) {
      addBox(root, mRack, [x0, x1], [0.05, 2.05], [y0, y1], true);
      addBox(root, mVent, [x1 - 0.005, x1 + 0.01], [0.12, 1.98], [y0 + 0.05, y1 - 0.05]); // перфодверь
      for (let i = 0; i < 9; i++) {
        const h = 0.4 + i * 0.18;
        addBox(root, dotCols[i % dotCols.length], [x1 + 0.008, x1 + 0.022], [h, h + 0.05], [y0 + 0.12, y0 + 0.18]);
      }
    }
    function shelfRun(x0, x1, y0, y1, fill) {
      for (const cx of [x0 + 0.04, x1 - 0.04]) for (const cy of [y0 + 0.04, y1 - 0.04])
        addBox(root, mShelf, [cx - 0.04, cx + 0.04], [0.05, 2.15], [cy - 0.04, cy + 0.04], true);
      const levels = [0.06, 0.74, 1.42, 2.05];
      for (const h of levels) addBox(root, mShelf, [x0, x1], [h, h + 0.05], [y0, y1], true);
      if (fill) {
        let k = Math.round((x0 + y0) * 5);
        for (let li = 0; li < 3; li++) {
          const base = levels[li] + 0.05;
          let cy = y0 + 0.18;
          while (cy < y1 - 0.2) {
            const w = 0.3 + (k % 3) * 0.12, d = 0.3 + (k % 2) * 0.12, hh = 0.22 + (k % 4) * 0.06;
            if (cy + d > y1 - 0.1) break;
            addBox(root, crateMats[k % crateMats.length], [x0 + 0.12, x0 + 0.12 + w], [base, base + hh], [cy, cy + d], true);
            cy += d + 0.12; k++;
          }
        }
      }
    }
    function ballMachine(cx, cy) {
      addBox(root, mRack, [cx - 0.34, cx + 0.34], [0.12, 0.72], [cy - 0.26, cy + 0.26], true); // корпус
      addCyl(root, M.steelDark, 0.27, 0.72, 1.2, cx, cy, true);                                // бункер
      addCyl(root, mLedCyan, 0.1, 1.18, 1.22, cx, cy);                                          // подсветка
      addBox(root, mDuct, [cx + 0.3, cx + 0.62], [0.78, 0.96], [cy - 0.09, cy + 0.09], true);   // ствол
      for (const sx of [-0.28, 0.28]) for (const sy of [-0.2, 0.2])
        addBox(root, M.dark, [cx + sx - 0.05, cx + sx + 0.05], [0.0, 0.12], [cy + sy - 0.05, cy + sy + 0.05]);
    }

    /* ---------- полы ---------- */
    addBox(root, mFloor, [xW, xE], [0.02, 0.05], [15.65, 37.58]);
    addBox(root, mFloorSrv, [xW, xE], [0.05, 0.08], [28.4, 32.4]);                 // фальшпол серверной
    for (let gx = 0.6; gx < xE; gx += 0.6) addBox(root, M.line, [gx - 0.006, gx + 0.006], [0.08, 0.085], [28.4, 32.4]);
    for (let gy = 28.6; gy < 32.4; gy += 0.6) addBox(root, M.line, [xW, xE], [0.08, 0.085], [gy - 0.006, gy + 0.006]);

    /* ---------- ограждающие стены (глухой лайнер + перегородки) ---------- */
    addBox(root, M.partition, [xW, xW + 0.1], [0.05, wallH], [15.65, 37.58], true);  // запад
    addBox(root, M.partition, [xW, xE], [0.05, wallH], [37.46, 37.58], true);        // север
    addBox(root, M.partition, [xW, xE], [0.05, wallH], [15.65, 15.77], true);        // юг
    function crossWall(yc) { addBox(root, M.partition, [xW, xE], [0.05, wallH], [yc - wT, yc + wT], true); }
    crossWall(32.4); crossWall(28.4); crossWall(22.2);

    /* ---------- восточная перегородка к холлу с дверьми ---------- */
    const doors = [[34.45, 35.55], [29.85, 30.95], [24.75, 25.85], [18.35, 19.45]];
    for (const [a, b] of [[15.6, 18.35], [19.45, 24.75], [25.85, 29.85], [30.95, 34.45], [35.55, 37.8]])
      addBox(root, M.partition, [6.6, 6.74], [0.05, 4.2], [a, b], true);
    for (const [a, b] of doors) {
      addBox(root, M.partition, [6.6, 6.74], [2.2, 4.2], [a, b], true);                    // перемычка
      addBox(root, M.steelDark, [6.58, 6.76], [0.05, 2.22], [a - 0.02, a + 0.02], true);   // косяки
      addBox(root, M.steelDark, [6.58, 6.76], [0.05, 2.22], [b - 0.02, b + 0.02], true);
      addBox(root, M.steelDark, [6.58, 6.76], [2.18, 2.26], [a, b], true);
      addBox(root, M.glass, [6.64, 6.68], [0.06, 2.18], [a + 0.03, b - 0.03]);             // дверь-стекло
    }
    addPlane(root, makeLabelTexture('ВЕНТКАМЕРА', { accent: '#FF8A3D' }), 1.7, 0.37, 6.79, 2.62, 35.0, Math.PI / 2, 0.95);
    addPlane(root, makeLabelTexture('СЕРВЕРНАЯ', { accent: '#44D9FF' }), 1.55, 0.34, 6.79, 2.62, 30.4, Math.PI / 2, 0.95);
    addPlane(root, makeLabelTexture('СКЛАД · ИНВЕНТАРЬ', { accent: '#22E6A8' }), 2.15, 0.47, 6.79, 2.62, 25.3, Math.PI / 2, 0.95);
    addPlane(root, makeLabelTexture('СКЛАД', { accent: '#DD58C5' }), 1.1, 0.24, 6.79, 2.62, 18.9, Math.PI / 2, 0.95);

    /* ═════════ ВЕНТКАМЕРА (y 32.4–37.58 · ~32 м²) ═════════ */
    const a1 = ahu(0.5, 1.65, 33.2, 36.6, M.ledMint);
    const a2 = ahu(1.95, 3.1, 33.2, 36.6, M.ledMint);
    // ИТП — узел отопления (восток венткамеры)
    addCyl(root, mPipe, 0.48, 0.1, 2.0, 5.0, 35.7, true);
    addCyl(root, mPipe, 0.48, 0.1, 2.0, 6.0, 35.7, true);
    addBox(root, mRack, [4.3, 6.25], [0.1, 0.92], [33.3, 34.0], true);            // насосный скид
    addCyl(root, M.steelDark, 0.12, 0.92, 1.22, 4.7, 33.65, true);
    addCyl(root, M.steelDark, 0.12, 0.92, 1.22, 5.3, 33.65, true);
    addBox(root, mPipe, [4.3, 6.25], [1.5, 1.6], [34.5, 34.58], true);            // гребёнка-коллектор
    for (const px of [4.5, 5.0, 5.5, 6.0]) addCyl(root, mPipe, 0.045, 0.92, 1.5, px, 34.54);
    addCyl(root, mPipe, 0.06, 2.0, 6.5, 6.1, 36.4, false);                        // транзитный стояк

    /* ═════════ ВОЗДУХОВОДЫ ПО ПОТОЛКУ ═════════ */
    const hMain = 6.6, rMain = 0.4, rCross = 0.36;
    // стояки от установок → сборная приточная магистраль
    for (const a of [a1, a2]) {
      addCyl(root, mDuct, 0.3, a.top + 0.32, hMain, a.ox, a.oy, true);            // стояк
      elbow(a.ox, a.oy, hMain, 0.34, mDuct);
      hDuct(a.ox, a.oy, 5.6, a.oy, hMain, 0.32, mDuct);                           // отвод к магистрали
    }
    hDuct(5.6, 36.6, 5.6, 16.4, hMain, rMain, mDuct);                            // главная приточная магистраль (С-Ю)
    for (let y = 18; y <= 36; y += 3.4) hanger(5.6, y, hMain + rMain);
    coupling(5.6, 30.2, hMain, rMain, 'y'); coupling(5.6, 23.2, hMain, rMain, 'y');
    // вытяжная магистраль вдоль северного фасада (утеплённая) — «уже протянутая», теперь от венткамеры
    hDuct(4.6, 36.9, 52, 36.9, 7.0, 0.44, mWrap);
    addCyl(root, mDuct, 0.34, 1.95, 6.7, 3.6, 36.9, true);                        // вытяжной стояк
    elbow(3.6, 36.9, 7.0, 0.46, mWrap);
    for (let x = 9; x <= 50; x += 4.2) hanger(x, 36.9, 7.44);
    // поперечные приточные ветви в падел-холл + диффузоры
    for (const cy of [30.2, 23.2]) {
      elbow(5.6, cy, hMain, rMain, mDuct);
      hDuct(6.0, cy, 52, cy, hMain, rCross, mDuct);
      for (let x = 10.5; x <= 50; x += 4.0) hanger(x, cy, hMain + rCross);
      for (const dx of [11, 18.5, 26, 33.5, 41, 48]) diffuser(dx, cy);
    }

    /* ═════════ СЕРВЕРНАЯ (y 28.4–32.4) ═════════ */
    for (let i = 0; i < 3; i++) rack(0.8, 1.5, 29.0 + i * 1.0, 29.85 + i * 1.0);   // ряд A
    for (let i = 0; i < 3; i++) rack(2.3, 3.0, 29.0 + i * 1.0, 29.85 + i * 1.0);   // ряд B
    addBox(root, mLedCyan, [1.55, 2.25], [0.081, 0.09], [29.0, 32.0]);            // холодный коридор — подсветка
    addBox(root, mRack, [5.5, 6.3], [0.05, 2.1], [28.9, 30.1], true);             // прецизионный кондиционер
    addBox(root, mVent, [5.48, 5.52], [0.3, 1.9], [29.0, 30.0]);
    addBox(root, mLedCyan, [5.46, 5.5], [1.95, 2.0], [29.0, 30.0]);
    addCyl(root, mDuct, 0.22, 2.1, 6.5, 5.9, 29.5, true);                         // отвод кондиционера вверх
    addBox(root, mRack, [4.5, 5.2], [0.05, 1.9], [31.0, 31.9], true);             // ИБП + АКБ
    addBox(root, M.ledOrange, [4.5, 5.2], [1.5, 1.56], [30.97, 31.0]);
    addBox(root, M.wood, [4.3, 5.5], [0.72, 0.76], [28.7, 29.1], true);           // стол мониторинга
    addBox(root, mRack, [4.6, 5.2], [0.78, 1.18], [28.74, 28.78], true);          // монитор
    addBox(root, mLedCyan, [4.64, 5.16], [0.82, 1.14], [28.72, 28.74]);
    for (const ty of [29.05, 31.75]) {                                            // кабельные лотки
      addBox(root, mShelf, [0.7, 3.1], [2.5, 2.6], [ty - 0.05, ty + 0.05], true);
      addBox(root, mLedCyan, [0.7, 3.1], [2.46, 2.5], [ty - 0.01, ty + 0.01]);
    }

    /* ═════════ СКЛАД · ИНВЕНТАРЬ (y 22.2–28.4) ═════════ */
    shelfRun(0.45, 1.5, 22.6, 28.0, true);
    shelfRun(2.0, 3.05, 22.6, 28.0, true);
    shelfRun(5.0, 6.05, 22.6, 28.0, true);
    for (let i = 0; i < 3; i++) {                                                 // рулоны матов
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 16), crateMats[i % crateMats.length]);
      m.rotation.x = Math.PI / 2; m.position.set(PX(3.9), 0.24, PZ(23.2 + i * 0.5)); m.castShadow = true; root.add(m);
    }
    for (let i = 0; i < 6; i++) addCyl(root, mAHUp, 0.05, 0.06, 0.7, 3.7 + (i % 3) * 0.13, 25.0 + Math.floor(i / 3) * 0.16, true); // тубусы воланов
    ballMachine(4.2, 27.2);
    ballMachine(3.55, 26.4);

    /* ═════════ СКЛАД (y 15.65–22.2 · хозблок + электрощитовая) ═════════ */
    shelfRun(0.45, 1.5, 16.3, 21.6, true);
    shelfRun(2.0, 3.05, 16.3, 21.6, true);
    for (let i = 0; i < 3; i++) addBox(root, mRack, [4.2 + i * 0.62, 4.78 + i * 0.62], [0.1, 1.95], [21.0, 21.5], true); // ГРЩ/ВРУ
    for (let i = 0; i < 3; i++) addBox(root, i === 1 ? M.ledMint : M.ledOrange, [4.28 + i * 0.62, 4.7 + i * 0.62], [1.6, 1.66], [20.97, 21.0]);
    for (let i = 0; i < 4; i++) addBox(root, crateMats[i % crateMats.length], [4.4, 6.0], [0.08 + i * 0.16, 0.22 + i * 0.16], [17.0, 18.4], true); // стопка матов
    addBox(root, M.steelDark, [5.2, 6.0], [0.05, 0.35], [19.0, 19.7], true);      // тележка
    addCyl(root, M.dark, 0.04, 0.35, 1.0, 5.3, 19.1, true);

    /* ---------- свет техзоны ---------- */
    for (const [x, y, c, inten] of [
      [2.4, 35.0, 0xbfe6ff, 13], [1.9, 30.4, 0x9fe6ff, 11],
      [2.4, 25.3, 0xcfd6ff, 12], [2.4, 18.9, 0xcfd6ff, 12],
    ]) {
      const l = new THREE.PointLight(c, inten, 12, 2); l.position.set(PX(x), 2.7, PZ(y)); root.add(l);
    }
  }

  /* ============================ ПАДЕЛ-ХОЛЛ (север) ============================ */
  // 4 панорамика 20×10 + сингл 20×6 на востоке; корты y 17.3–37.3
  function padelCourt(cx0, w, turfMat) {
    const g = new THREE.Group(); root.add(g);
    const y0 = 17.3, y1 = 37.3, net = 27.3;
    addBox(g, turfMat, [cx0, cx0 + w], [0.02, 0.07], [y0, y1]);
    const L = 0.082;
    addLine(g, cx0 + 0.1, net - 6.95, cx0 + w - 0.1, net - 6.95, L);
    addLine(g, cx0 + 0.1, net + 6.95, cx0 + w - 0.1, net + 6.95, L);
    addLine(g, cx0 + w / 2, y0 + 0.1, cx0 + w / 2, net - 6.95, L);
    addLine(g, cx0 + w / 2, net + 6.95, cx0 + w - (w / 2), y1 - 0.1, L);
    // стеклянные стены h 3 + стойки
    addBox(g, M.glass, [cx0, cx0 + w], [0.07, 3.07], [y0 - 0.04, y0 + 0.01]);
    addBox(g, M.glass, [cx0, cx0 + w], [0.07, 3.07], [y1 - 0.01, y1 + 0.04]);
    addBox(g, M.glass, [cx0 - 0.04, cx0 + 0.01], [0.07, 3.07], [y0, y1]);
    addBox(g, M.glass, [cx0 + w - 0.01, cx0 + w + 0.04], [0.07, 3.07], [y0, y1]);
    for (let i = 0; i <= Math.round(w / 2.5); i++) {
      const x = cx0 + (w * i) / Math.round(w / 2.5);
      addBox(g, M.steelDark, [x - 0.045, x + 0.045], [0.07, 3.1], [y0 - 0.045, y0 + 0.045], true);
      addBox(g, M.steelDark, [x - 0.045, x + 0.045], [0.07, 3.1], [y1 - 0.045, y1 + 0.045], true);
    }
    for (let i = 1; i < 8; i++) {
      const y = y0 + (20 * i) / 8;
      addBox(g, M.steelDark, [cx0 - 0.045, cx0 + 0.045], [0.07, 3.1], [y - 0.045, y + 0.045]);
      addBox(g, M.steelDark, [cx0 + w - 0.045, cx0 + w + 0.045], [0.07, 3.1], [y - 0.045, y + 0.045]);
    }
    // сетка
    addBox(g, M.net, [cx0 + 0.12, cx0 + w - 0.12], [0.07, 0.92], [net - 0.012, net + 0.012]);
    addBox(g, M.line, [cx0 + 0.12, cx0 + w - 0.12], [0.92, 0.99], [net - 0.02, net + 0.02]);
    addCyl(g, M.steelDark, 0.05, 0.07, 1.05, cx0 + 0.07, net);
    addCyl(g, M.steelDark, 0.05, 0.07, 1.05, cx0 + w - 0.07, net);
  }
  const padelXs = [7.95, 18.85, 29.75, 40.65];
  for (const x of padelXs) padelCourt(x, 10, M.padelTurf);
  padelCourt(53, 6, M.padelTurfSingle); // сингл у раздевалок

  /* ============================ ГАЛЕРЕЯ 1.3 м ============================ */
  addBox(root, M.dark, [6.78, 60], [0.02, 0.17], [15.65, 16.95]); // подиум галереи
  addBox(root, M.rail, [6.78, 60], [0.17, 1.27], [16.93, 16.97]); // стеклянный экран к кортам
  addBox(root, M.steelDark, [6.78, 60], [1.27, 1.33], [16.9, 17.0]);
  // видеоэкраны на торцевых стенах падел-холла
  const screenTex = makeGradientTexture();
  const mScreen = new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.3 });
  neonMats.push({ mat: mScreen, base: 1.3 });
  const scrW = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 5.6), mScreen);
  scrW.position.set(PX(6.95), 4.0, PZ(26.5)); root.add(scrW);
  const scrE = scrW.clone(); scrE.position.set(PX(59.65), 4.0, PZ(26.5)); root.add(scrE);

  /* ============================ БАДМИНТОН-ХОЛЛ (x 0–29.6) ============================ */
  function badmintonCourt(cx0) {
    const g = new THREE.Group(); root.add(g);
    const y0 = 1.1, y1 = 14.5, net = 7.8, w = 6.1;
    addBox(g, M.badCourt, [cx0 - 0.55, cx0 + w + 0.55], [0.02, 0.05], [y0 - 0.55, y1 + 0.55]);
    const L = 0.06;
    addLine(g, cx0, y0, cx0 + w, y0, L); addLine(g, cx0, y1, cx0 + w, y1, L);
    addLine(g, cx0, y0, cx0, y1, L); addLine(g, cx0 + w, y0, cx0 + w, y1, L);
    addLine(g, cx0 + 0.46, y0, cx0 + 0.46, y1, L); addLine(g, cx0 + w - 0.46, y0, cx0 + w - 0.46, y1, L);
    addLine(g, cx0, net - 1.98, cx0 + w, net - 1.98, L); addLine(g, cx0, net + 1.98, cx0 + w, net + 1.98, L);
    addLine(g, cx0, y0 + 0.76, cx0 + w, y0 + 0.76, L); addLine(g, cx0, y1 - 0.76, cx0 + w, y1 - 0.76, L);
    addLine(g, cx0 + w / 2, y0, cx0 + w / 2, net - 1.98, L); addLine(g, cx0 + w / 2, net + 1.98, cx0 + w / 2, y1, L);
    addBox(g, M.net, [cx0 - 0.05, cx0 + w + 0.05], [0.82, 1.52], [net - 0.012, net + 0.012]);
    addBox(g, M.line, [cx0 - 0.05, cx0 + w + 0.05], [1.52, 1.57], [net - 0.02, net + 0.02]);
    addCyl(g, M.steelDark, 0.045, 0.05, 1.57, cx0 - 0.08, net, true);
    addCyl(g, M.steelDark, 0.045, 0.05, 1.57, cx0 + w + 0.08, net, true);
  }
  for (const x of [1.7, 8.4, 15.1, 21.8]) badmintonCourt(x);

  /* ============================ НТ — 4 стола (x 29.6–47.6, y 6–15.6) ============================ */
  addBox(root, M.ttFloor, [29.6, 47.6], [0.02, 0.045], [0.2, 15.6]);
  function ttTable(cx, cy) {
    const g = new THREE.Group(); root.add(g);
    addLine(g, cx - 4.5, cy - 2.4, cx + 4.5, cy - 2.4, 0.05, 0.05);
    addLine(g, cx - 4.5, cy + 2.4, cx + 4.5, cy + 2.4, 0.05, 0.05);
    addLine(g, cx - 4.5, cy - 2.4, cx - 4.5, cy + 2.4, 0.05, 0.05);
    addLine(g, cx + 4.5, cy - 2.4, cx + 4.5, cy + 2.4, 0.05, 0.05);
    addBox(g, M.ttTop, [cx - 1.37, cx + 1.37], [0.72, 0.76], [cy - 0.7625, cy + 0.7625], true);
    addLine(g, cx - 1.37, cy, cx + 1.37, cy, 0.76, 0.035);
    for (const dx of [-1.05, 1.05]) for (const dy of [-0.55, 0.55])
      addBox(g, M.steelDark, [cx + dx - 0.03, cx + dx + 0.03], [0.05, 0.72], [cy + dy - 0.03, cy + dy + 0.03]);
    addBox(g, M.net, [cx - 0.012, cx + 0.012], [0.76, 0.915], [cy - 0.85, cy + 0.85]);
  }
  // два стола у перегородки падел-холла демонтированы — на их месте лаундж + магазин
  ttTable(34.1, 8.4); ttTable(43.1, 8.4);
  ttTable(34.1, 3.0); ttTable(43.1, 3.0);

  /* ---- освободившаяся зона (север НТ): лаундж со скамьями и диванами ---- */
  addBox(root, M.dark, [30.0, 35.3], [0.045, 0.07], [11.3, 15.15]);            // ковёр
  addBox(root, M.magentaSoft, [30.0, 35.3], [0.07, 0.078], [11.3, 11.42]);     // акцент-кромка
  loungeSofa(30.5, 34.7, 14.0, 14.95, -1, M.mint, M.orange);                   // диван у перегородки, лицом на юг
  loungeBench(30.3, 31.7, 11.55, 12.25);                                       // скамьи
  loungeBench(33.5, 34.9, 11.55, 12.25);
  loungeTable(31.95, 33.55, 12.85, 13.75);                                     // журнальный стол
  loungePlant(30.35, 14.8, 1.05);
  loungePlant(34.85, 11.75, 0.9);
  loungeSign('ЗОНА ОТДЫХА', 32.6, 2.55, 14.45, 2.3, '#FF8A3D');


  /* ============================ СЕРВИС-БЛОК (x 47.6–60) ============================ */
  const P = M.partition, H = [0.05, 3.0];
  // западная стена блока — портал коридора к кортам (проём y 7.1–8.5)
  addBox(root, P, [47.6, 47.78], [0.05, 4.4], [0, 7.1], true);
  addBox(root, P, [47.6, 47.78], [0.05, 4.4], [8.5, 15.6], true);
  addBox(root, P, [47.6, 47.78], [2.55, 4.4], [7.1, 8.5], true);
  // рамка портала + LED-кромки
  addBox(root, M.steelDark, [47.56, 47.84], [0.05, 2.62], [7.02, 7.12], true);
  addBox(root, M.steelDark, [47.56, 47.84], [0.05, 2.62], [8.48, 8.58], true);
  addBox(root, M.steelDark, [47.56, 47.84], [2.52, 2.64], [7.02, 8.58], true);
  addBox(root, M.ledMagenta, [47.82, 47.85], [0.1, 2.5], [7.1, 7.14]);
  addBox(root, M.ledMagenta, [47.82, 47.85], [0.1, 2.5], [8.46, 8.5]);
  // стены коридора (x 47.78–54.45) с дверями в раздевалки (x 49.2–50.2)
  for (const wy of [[7.1, 7.25], [8.35, 8.5]]) {
    addBox(root, P, [47.78, 49.2], H, wy, true);
    addBox(root, P, [50.2, 54.45], H, wy, true);
    addBox(root, P, [49.2, 50.2], [2.2, 3.0], wy, true); // перемычка над дверью
  }
  // стена «раздевалка | вестибюль» с проёмами в мокрые зоны (юг и север)
  addBox(root, P, [54.3, 54.45], H, [0, 0.62], true);
  addBox(root, P, [54.3, 54.45], H, [1.82, 7.1], true);
  addBox(root, P, [54.3, 54.45], H, [8.5, 13.88], true);
  addBox(root, P, [54.3, 54.45], H, [15.08, 15.6], true);
  addBox(root, P, [54.3, 54.45], [2.2, 3.0], [0.62, 1.82], true);     // перемычка (юг)
  addBox(root, P, [54.3, 54.45], [2.2, 3.0], [13.88, 15.08], true);   // перемычка (север)
  // проёмы в мокрые зоны — без дверей (открытый проход из раздевалки)
  // дальние стены мокрых зон (на месте медпункта / зоны отдыха) — глухие
  addBox(root, P, [54.45, 60], H, [3.9, 4.05], true);
  addBox(root, P, [54.45, 60], H, [11.9, 12.05], true);
  // ближняя (северная) стена мокрой зоны 2 (закрывает и проём галереи x54–56)
  addBox(root, P, [54.45, 59.8], H, [15.4, 15.5], true);

  /* ---------- коридор: LED-трасса, навигация, скамья, кулер ---------- */
  addBox(root, M.lockerFloor, [47.78, 54.45], [0.02, 0.05], [7.25, 8.35]);
  addBox(root, M.magentaSoft, [47.95, 54.35], [0.05, 0.056], [7.76, 7.84]);   // направляющая на полу
  addBox(root, M.ledMagenta, [47.85, 56.35], [2.92, 2.96], [7.77, 7.83]);     // LED-линия к кортам
  for (const rx of [48.6, 51.0, 53.4, 55.8]) addCyl(root, M.dark, 0.014, 2.96, 4.3, rx, 7.8);
  addBox(root, M.wood, [50.6, 52.2], [0.4, 0.48], [7.27, 7.56], true);        // скамья
  for (const lx of [50.7, 52.1]) addBox(root, M.dark, [lx - 0.03, lx + 0.03], [0.05, 0.4], [7.3, 7.53]);
  addCyl(root, M.line, 0.16, 0.05, 1.02, 53.1, 7.45, true);                   // кулер с водой
  addCyl(root, M.rail, 0.125, 1.02, 1.32, 53.1, 7.45);
  // навигационные таблички
  addPlane(root, makeLabelTexture('РАЗДЕВАЛКА 1', { accent: '#DD58C5' }), 0.95, 0.21, 49.7, 2.42, 7.26, 0, 0.9);
  addPlane(root, makeLabelTexture('РАЗДЕВАЛКА 2', { accent: '#DD58C5' }), 0.95, 0.21, 49.7, 2.42, 8.34, Math.PI, 0.9);
  addPlane(root, makeLabelTexture('К КОРТАМ →', { accent: '#22E6A8' }), 1.35, 0.3, 47.8, 2.88, 7.8, Math.PI / 2, 1.1);
  // указатели в мокрые зоны (из раздевалок)
  addPlane(root, makeLabelTexture('ДУШ · С/У', { accent: '#22E6A8' }), 1.0, 0.22, 54.27, 2.32, 1.22, -Math.PI / 2, 0.9);
  addPlane(root, makeLabelTexture('ДУШ · С/У', { accent: '#22E6A8' }), 1.0, 0.22, 54.27, 2.32, 14.48, -Math.PI / 2, 0.9);

  /* ---------- раздевалки 2 × 44 м² ---------- */
  addBox(root, M.lockerFloor, [47.78, 54.3], [0.02, 0.05], [0.22, 7.1]);
  addBox(root, M.lockerFloor, [47.78, 54.3], [0.02, 0.05], [8.5, 15.45]);
  // индивидуальные шкафчики с нумерованными дверцами
  let lockerNo = 1;
  function lockerRun(xa, xb, y0, y1, faceWest) {
    addBox(root, M.dark, [xa, xb], [0.05, 2.06], [y0, y1], true);
    const fx = faceWest ? xa : xb;
    const n = Math.floor((y1 - y0 - 0.06) / 0.42);
    const pad = (y1 - y0 - n * 0.42) / 2;
    const doorGeos = [], handleGeos = [];
    for (let i = 0; i < n; i++) {
      const dy0 = y0 + pad + i * 0.42 + 0.028, dy1 = y0 + pad + (i + 1) * 0.42 - 0.028;
      for (const hr of [[0.14, 0.94], [1.02, 1.82]]) {
        const g = new THREE.BoxGeometry(0.035, hr[1] - hr[0], dy1 - dy0);
        g.translate(PX(fx), (hr[0] + hr[1]) / 2, PZ((dy0 + dy1) / 2));
        doorGeos.push(g);
        const hg = new THREE.BoxGeometry(0.05, 0.09, 0.028);
        hg.translate(PX(fx) + (faceWest ? -0.02 : 0.02), hr[1] - 0.16, PZ(dy1 - 0.06));
        handleGeos.push(hg);
      }
    }
    const doors = new THREE.Mesh(mergeGeometries(doorGeos), M.lockerDoor);
    doors.castShadow = true; doors.receiveShadow = true; root.add(doors);
    root.add(new THREE.Mesh(mergeGeometries(handleGeos), M.steelDark));
    const tex = makeNumbersTexture(n, lockerNo); lockerNo += n;
    addPlane(root, tex, n * 0.42, 0.17, fx + (faceWest ? -0.022 : 0.022), 1.95, (y0 + y1) / 2, faceWest ? -Math.PI / 2 : Math.PI / 2, 0.45);
  }
  lockerRun(47.94, 48.36, 1.9, 6.9, false);   // комната 1, западная стена
  lockerRun(53.86, 54.28, 1.9, 6.9, true);    // комната 1, восточная
  lockerRun(47.94, 48.36, 8.7, 13.7, false);  // комната 2, западная
  lockerRun(53.86, 54.28, 8.7, 13.7, true);   // комната 2, восточная
  // скамьи-острова с крючками по центру
  function benchIsland(x0, x1, cy) {
    addBox(root, M.dark, [x0, x1], [0.05, 1.5], [cy - 0.05, cy + 0.05], true);       // центральная панель
    addBox(root, M.wood, [x0, x1], [0.42, 0.5], [cy - 0.48, cy - 0.1], true);
    addBox(root, M.wood, [x0, x1], [0.42, 0.5], [cy + 0.1, cy + 0.48], true);
    addBox(root, M.steelDark, [x0, x1], [1.42, 1.46], [cy - 0.07, cy + 0.07], true); // верхняя полка
    for (let hx = x0 + 0.3; hx < x1 - 0.1; hx += 0.45)
      for (const s of [-1, 1]) addBox(root, M.steelDark, [hx - 0.015, hx + 0.015], [1.18, 1.3], [cy + s * 0.06, cy + s * 0.1]);
    for (const lx of [x0 + 0.15, x1 - 0.15]) for (const s of [-1, 1])
      addBox(root, M.dark, [lx - 0.03, lx + 0.03], [0.05, 0.42], [cy + s * 0.25 - 0.03, cy + s * 0.25 + 0.03]);
  }
  benchIsland(49.4, 52.8, 4.3);
  benchIsland(49.4, 52.8, 11.1);
  // ── МОКРЫЕ ЗОНЫ: душевые + раковины + закрытые санузлы — отдельные помещения
  //    с проходом из раздевалки; заняли площадь бывш. медпункта и зоны отдыха ──
  function buildWetRoom(yNear, sgn, depthFar) {
    const yr = (a, b) => (a < b ? [a, b] : [b, a]);
    const Y = (d) => yNear + sgn * d;                 // d — глубина от ближней стены
    // влагостойкий пол + дренажный кант
    addBox(root, M.lockerFloor, [54.45, 59.8], [0.02, 0.05], yr(Y(0.04), Y(depthFar)));
    addBox(root, M.mint, [54.8, 59.5], [0.05, 0.056], yr(Y(2.42), Y(2.46)));
    // тёмная плиточная облицовка — гасит засветку от наружных стеклянных стен
    addBox(root, M.lockerFloor, [59.72, 59.78], [0.05, 2.5], yr(Y(0.0), Y(depthFar)), true);     // восток
    addBox(root, M.lockerFloor, [54.45, 59.78], [0.05, 2.5], yr(Y(-0.02), Y(0.04)), true);        // ближняя стена (раковины)
    addBox(root, M.lockerFloor, [54.45, 59.78], [0.05, 2.5], yr(Y(depthFar - 0.06), Y(depthFar)), true); // дальняя стена (за душевыми)
    /* раковины (3) + зеркала у ближней стены, x 55.0–56.9 */
    addBox(root, M.dark, [55.0, 56.9], [0.05, 0.82], yr(Y(0.06), Y(0.6)), true);
    addBox(root, M.steelDark, [54.96, 56.94], [0.82, 0.86], yr(Y(0.02), Y(0.64)), true);
    for (let i = 0; i < 3; i++) {
      const cx = 55.32 + i * 0.63;
      addCyl(root, M.line, 0.13, 0.78, 0.85, cx, Y(0.32), true);
      addBox(root, M.steelDark, [cx - 0.018, cx + 0.018], [0.86, 1.04], yr(Y(0.06), Y(0.16)));
      addBox(root, M.glass, [cx - 0.26, cx + 0.26], [0.96, 1.5], yr(Y(0.0), Y(0.04)));
    }
    /* закрытые санузлы (2 кабины) у ближней стены, x 57.15–59.55 */
    for (let i = 0; i < 2; i++) {
      const x0 = 57.15 + i * 1.24, x1 = x0 + 1.16;
      const back = Y(0.04), front = Y(1.42);
      addBox(root, M.lockerDoor, [x0 - 0.04, x0 + 0.02], [0.05, 2.0], yr(back, front), true);
      addBox(root, M.lockerDoor, [x1 - 0.02, x1 + 0.04], [0.05, 2.0], yr(back, front), true);
      addBox(root, M.lockerDoor, [x0 - 0.04, x1 + 0.04], [0.05, 2.0], yr(back, Y(-0.02)), true);
      addBox(root, M.dark, [x0 + 0.05, x1 - 0.05], [0.14, 1.9], yr(front, Y(1.39)), true); // дверь кабины
      addBox(root, M.ledMint, [x0 + 0.05, x1 - 0.05], [1.86, 1.9], yr(front, Y(1.4)));      // индикатор «свободно»
      addBox(root, M.steelDark, [x1 - 0.2, x1 - 0.12], [0.94, 1.04], yr(front, Y(1.46)));        // ручка
      addBox(root, M.line, [x0 + 0.34, x1 - 0.34], [0.05, 0.42], yr(Y(0.12), Y(0.64)), true);    // унитаз
      addBox(root, M.line, [x0 + 0.3, x1 - 0.3], [0.42, 0.78], yr(Y(0.08), Y(0.24)), true);      // бачок
    }
    /* душевые (3 кабины) — придвинуты вплотную к дальней стене, x 55.35–58.74 */
    const shB = depthFar, shF = depthFar - 0.85;
    for (let i = 0; i < 3; i++) {
      const x0 = 55.35 + i * 1.13, x1 = x0 + 1.13;
      addBox(root, M.glass, [x0 + 0.05, x1 - 0.05], [0.05, 2.0], yr(Y(shF), Y(shF + 0.03)));   // фронт-стекло
      addBox(root, M.glass, [x0 - 0.02, x0 + 0.02], [0.05, 2.0], yr(Y(shF), Y(shB)));          // боковина
      addBox(root, M.mint, [x0 + 0.12, x1 - 0.12], [0.045, 0.075], yr(Y(shF + 0.08), Y(shB))); // поддон-кант
      addCyl(root, M.steelDark, 0.06, 2.0, 2.18, (x0 + x1) / 2, Y(shB - 0.18));                 // стояк-лейка
      addBox(root, M.steelDark, [x0 + 0.49, x0 + 0.62], [1.46, 1.5], yr(Y(shB - 0.18), Y(shB - 0.42)));
    }
    addBox(root, M.glass, [58.72, 58.76], [0.05, 2.0], yr(Y(shF), Y(shB)));               // торец ряда
  }
  buildWetRoom(0.22, 1, 3.68);     // мокрая зона раздевалки 1 (на месте медпункта)
  buildWetRoom(15.45, -1, 3.4);    // мокрая зона раздевалки 2 (на месте бывшего магазина / зоны отдыха)

  // освободившиеся стены раздевалок (где были душевые) — скамьи с вешалками
  function wallBench(cy, sgn) {
    const yr = (a, b) => (a < b ? [a, b] : [b, a]);
    addBox(root, M.wood, [48.5, 53.2], [0.42, 0.5], yr(cy, cy + sgn * 0.42), true);
    addBox(root, M.dark, [48.5, 53.2], [0.05, 1.7], yr(cy, cy - sgn * 0.04), true);          // панель-спинка с крючками
    for (let hx = 48.9; hx < 53.0; hx += 0.5)
      addBox(root, M.steelDark, [hx - 0.02, hx + 0.02], [1.32, 1.46], yr(cy + sgn * 0.04, cy + sgn * 0.12));
    for (const lx of [48.7, 53.0]) addBox(root, M.dark, [lx - 0.03, lx + 0.03], [0.05, 0.42], yr(cy + sgn * 0.12, cy + sgn * 0.3));
  }
  wallBench(0.42, 1);    // раздевалка 1, у южной стены
  wallBench(15.28, -1);  // раздевалка 2, у северной стены

  /* ---------- вестибюль: ресепшн, бренд-стена, табло, ожидание ---------- */
  // стойка администратора
  addBox(root, M.dark, [55.05, 55.65], [0.05, 1.02], [9.2, 11.6], true);
  addBox(root, M.orange, [54.95, 55.75], [1.02, 1.1], [9.1, 11.7], true);
  addBox(root, M.ledMagenta, [55.65, 55.68], [0.68, 0.74], [9.3, 11.5]);     // LED-строка по фронту
  addBox(root, M.steelDark, [55.28, 55.42], [1.1, 1.16], [10.3, 10.5], true); // монитор
  addBox(root, M.dark, [55.33, 55.37], [1.16, 1.48], [10.14, 10.66], true);
  addCyl(root, M.dark, 0.22, 0.06, 0.1, 54.75, 10.4);                         // кресло администратора
  addCyl(root, M.steelDark, 0.03, 0.1, 0.5, 54.75, 10.4);
  addBox(root, M.magentaSoft, [54.55, 54.95], [0.5, 0.58], [10.2, 10.6], true);
  addBox(root, M.magentaSoft, [54.55, 54.63], [0.58, 1.12], [10.2, 10.6], true);
  // бренд-стена за стойкой
  addBox(root, M.dark, [54.45, 54.52], [0.4, 3.0], [8.65, 12.15], true);
  addBox(root, M.ledMagenta, [54.5, 54.53], [0.55, 2.85], [8.72, 8.78]);
  addBox(root, M.ledMagenta, [54.5, 54.53], [0.55, 2.85], [12.02, 12.08]);
  addPlane(root, makeSignTexture(), 3.05, 0.62, 54.54, 2.0, 10.4, Math.PI / 2, 1.05);
  // ── детали ресепшена ──
  addBox(root, M.dark, [54.95, 56.1], [0.038, 0.056], [8.9, 11.9]);              // ковёр у стойки
  addBox(root, M.glass, [55.62, 55.66], [1.1, 1.56], [9.4, 11.4]);              // акрил-экран на стойке
  addBox(root, M.steelDark, [55.2, 55.42], [1.1, 1.16], [9.5, 9.76], true);     // картоприёмник/терминал
  addBox(root, M.ledMint, [55.25, 55.37], [1.16, 1.19], [9.56, 9.7]);
  loungePlant(55.95, 11.78, 0.82);                                             // растение у стойки
  // подвесные светильники над стойкой
  for (const py of [9.9, 10.9]) {
    addCyl(root, M.dark, 0.01, 2.4, 4.3, 55.35, py, false);
    addCyl(root, M.led, 0.12, 2.26, 2.4, 55.35, py);
    const pl = new THREE.PointLight(0xffd6ac, 5.5, 6, 2); pl.position.set(PX(55.35), 2.18, PZ(py)); root.add(pl);
  }
  // вывеска РЕСЕПШН над логотипом
  addPlane(root, makeLabelTexture('РЕСЕПШН', { accent: '#DD58C5' }), 1.4, 0.31, 54.55, 2.66, 10.4, Math.PI / 2, 1.0);
  // очередь: стойки-ограничители с лентой
  function queuePost(cx, cy) {
    addCyl(root, M.dark, 0.13, 0.04, 0.06, cx, cy);
    addCyl(root, M.steelDark, 0.022, 0.06, 0.95, cx, cy, true);
    addCyl(root, M.dark, 0.05, 0.9, 0.98, cx, cy);
  }
  queuePost(56.25, 9.5); queuePost(56.25, 11.3);
  addBox(root, M.ledMagenta, [56.23, 56.27], [0.86, 0.9], [9.5, 11.3]); // лента между стойками
  // табло занятий над турникетами
  addBox(root, M.dark, [56.56, 56.6], [2.0, 3.0], [8.2, 10.9], true);
  addPlane(root, makeBoardTexture(), 2.6, 0.95, 56.62, 2.5, 9.55, Math.PI / 2, 1.25);
  for (const ry of [8.45, 10.65]) addCyl(root, M.dark, 0.014, 3.0, 4.3, 56.58, ry);
  // ── ТУРНИКЕТЫ: 2 спид-гейта прямо у входа в коридор (проход y 7.67–8.13, движение на запад к кортам) ──
  function speedGate(yc) {
    const x0 = 54.62, x1 = 55.68, w = 0.18;
    addBox(root, M.dark, [x0, x1], [0.05, 0.95], [yc - w / 2, yc + w / 2], true);                       // корпус-тумба
    addBox(root, M.steelDark, [x0 - 0.02, x1 + 0.02], [0.95, 1.0], [yc - w / 2 - 0.02, yc + w / 2 + 0.02], true); // топ-панель
    addBox(root, M.ledMint, [x0 + 0.12, x0 + 0.52], [1.001, 1.014], [yc - 0.04, yc + 0.04]);            // стрелка-«проход» к коридору
    // QR-сканер на входном (восточном) торце
    addBox(root, M.steelDark, [x1 - 0.22, x1 - 0.05], [0.72, 0.95], [yc - w / 2 - 0.016, yc - w / 2 + 0.07], true);
    addBox(root, M.ledMint, [x1 - 0.19, x1 - 0.08], [0.76, 0.9], [yc - w / 2 - 0.024, yc - w / 2 - 0.016]); // светящийся скан-таргет
  }
  speedGate(7.58);
  speedGate(8.22);
  // стеклянные створки-флапы (закрыты в центре прохода)
  addBox(root, M.rail, [55.0, 55.05], [0.18, 0.94], [7.67, 7.9]);  // створка (юг)
  addBox(root, M.rail, [55.0, 55.05], [0.18, 0.94], [7.9, 8.13]);  // створка (север)
  addBox(root, M.ledMagenta, [54.72, 55.6], [0.5, 0.53], [7.665, 7.671]); // LED вдоль прохода (юг)
  addBox(root, M.ledMagenta, [54.72, 55.6], [0.5, 0.53], [8.129, 8.135]); // LED вдоль прохода (север)
  addBox(root, M.magentaSoft, [53.6, 54.55], [0.05, 0.056], [7.77, 7.83]); // напольная направляющая к коридору
  // подвесной указатель к коридору
  function hangSign(tex, w, h, x, hC, y) {
    addBox(root, M.dark, [x - 0.035, x - 0.008], [hC - h / 2 - 0.02, hC + h / 2 + 0.02], [y - w / 2 - 0.03, y + w / 2 + 0.03], true);
    addPlane(root, tex, w, h, x, hC, y, Math.PI / 2, 0.95);
    for (const s of [-1, 1]) addCyl(root, M.dark, 0.013, hC + h / 2, 4.3, x - 0.02, y + s * (w / 2 - 0.12));
  }
  hangSign(makeLabelTexture('РАЗДЕВАЛКИ · КОРТЫ →', { accent: '#DD58C5' }), 1.8, 0.39, 54.62, 2.55, 7.8);
  // ── ГАРДЕРОБ: стойка + вешалки с одеждой (на месте бывшей зоны ожидания), y 4.0–6.95 ──
  const coatMats = [M.magentaSoft,
                    new THREE.MeshStandardMaterial({ color: 0x4a2aa0, roughness: 0.86 }),
                    new THREE.MeshStandardMaterial({ color: 0x2c2560, roughness: 0.86 }),
                    M.orange,
                    new THREE.MeshStandardMaterial({ color: 0x7238e6, roughness: 0.86 })];
  addBox(root, M.dark, [55.0, 59.4], [0.04, 0.058], [4.2, 6.95]);                // ковёр
  addBox(root, M.ledMagenta, [55.0, 59.4], [0.058, 0.064], [4.2, 4.26]);
  // вешалки с одеждой (2 ряда у южной стены): рейл + плечики + изделия
  function coatRail(x0, x1, cy, h, n) {
    addCyl(root, M.steelDark, 0.02, 0.05, h, x0, cy, true);
    addCyl(root, M.steelDark, 0.02, 0.05, h, x1, cy, true);
    addBox(root, M.steelDark, [x0, x1], [h - 0.04, h], [cy - 0.02, cy + 0.02], true); // рейл
    for (let i = 0; i < n; i++) {
      const gx = x0 + 0.2 + i * ((x1 - x0 - 0.4) / (n - 1));
      const m = coatMats[(i + Math.round(cy * 3)) % coatMats.length];
      addBox(root, M.steelDark, [gx - 0.07, gx + 0.07], [h - 0.05, h - 0.01], [cy - 0.012, cy + 0.012]); // плечики
      addBox(root, m, [gx - 0.1, gx + 0.1], [h - 0.78, h - 0.06], [cy - 0.07, cy + 0.07], true);          // изделие
      addBox(root, m, [gx - 0.12, gx + 0.12], [h - 0.2, h - 0.06], [cy - 0.085, cy + 0.085], true);       // плечи
    }
  }
  coatRail(55.3, 58.9, 4.32, 1.78, 9);
  coatRail(55.3, 58.9, 4.62, 1.78, 9);
  // стойка гардероба (фронт на север, к входу)
  addBox(root, M.dark, [55.2, 58.9], [0.05, 1.0], [5.05, 5.5], true);
  addBox(root, M.orange, [55.1, 59.0], [1.0, 1.08], [4.98, 5.58], true);           // столешница
  addBox(root, M.ledMagenta, [55.2, 58.9], [0.62, 0.68], [5.5, 5.504]);            // LED-строка по фронту
  // панель с номерками за стойкой + вывеска
  addBox(root, M.dark, [55.4, 58.6], [1.95, 2.46], [4.06, 4.1], true);
  for (let i = 0; i < 24; i++)
    addBox(root, M.ledMint, [55.55 + (i % 12) * 0.25, 55.67 + (i % 12) * 0.25], [2.04 + Math.floor(i / 12) * 0.2, 2.08 + Math.floor(i / 12) * 0.2], [4.1, 4.11]);
  addPlane(root, makeLabelTexture('ГАРДЕРОБ', { accent: '#FF8A3D' }), 1.7, 0.37, 57.0, 2.66, 4.08, 0, 0.95);
  // стул гардеробщика
  addCyl(root, M.dark, 0.2, 0.06, 0.1, 56.9, 4.8);
  addCyl(root, M.steelDark, 0.028, 0.1, 0.5, 56.9, 4.8);
  addBox(root, M.magentaSoft, [56.7, 57.1], [0.5, 0.58], [4.64, 5.0], true);
  // стойки-вешалки самообслуживания (у входа)
  function coatTree(cx, cy) {
    addCyl(root, M.steelDark, 0.16, 0.04, 0.07, cx, cy);          // база
    addCyl(root, M.steelDark, 0.025, 0.07, 1.78, cx, cy, true);   // стойка
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2;
      addCyl(root, M.steelDark, 0.012, 1.66, 1.74, cx + Math.cos(ang) * 0.15, cy + Math.sin(ang) * 0.15);
    }
    addBox(root, coatMats[Math.round(cx) % coatMats.length], [cx + 0.05, cx + 0.23], [0.95, 1.64], [cy - 0.1, cy + 0.1], true);
    addBox(root, coatMats[(Math.round(cx) + 2) % coatMats.length], [cx - 0.23, cx - 0.05], [0.98, 1.6], [cy - 0.09, cy + 0.09], true);
  }
  coatTree(59.05, 6.5);
  coatTree(58.85, 7.0);
  // роллап-баннеры у про-шопа
  function rollup(tex, x, y) {
    addBox(root, M.dark, [x - 0.42, x + 0.42], [0.05, 0.11], [y - 0.07, y + 0.07], true);
    addBox(root, M.dark, [x - 0.41, x + 0.41], [0.14, 2.12], [y - 0.005, y + 0.025], true);
    addPlane(root, tex, 0.78, 1.95, x, 1.13, y - 0.01, Math.PI, 0.8);
  }
  rollup(makeRollupTexture('АБОНЕМЕНТЫ', '8 · 12 · 24', 'ТРЕНИРОВКИ'), 58.5, 11.72);
  rollup(makeRollupTexture('ТРЕНЕР', 'ПЕРСОНАЛЬНЫЕ', 'ТРЕНИРОВКИ'), 59.42, 11.72);
  // ── ПРО-ШОП (магазин экипировки) — перенесён в зону НТ на место демонтированных столов ──
  buildProShop();
  // на прежнем месте магазина / зоны отдыха (x 54.45–60, y 12.05–15.45) — мокрая зона раздевалки 2 (см. buildWetRoom)
  function buildProShop() {
    const shop = new THREE.Group(); root.add(shop);
    shop.position.set(-18, 0, 0); // перенос на место двух демонтированных столов НТ
    const PAL = [0xdd58c5, 0x22e6a8, 0xff8a3d, 0x44d9ff, 0x7238e6, 0xeef0ff];
    const fabricMat = (i) => new THREE.MeshStandardMaterial({ color: PAL[((i % PAL.length) + PAL.length) % PAL.length], roughness: 0.82 });
    const matFloor   = new THREE.MeshStandardMaterial({ color: 0x241a4a, roughness: 0.4, metalness: 0.28 });
    const matPeg     = new THREE.MeshStandardMaterial({ color: 0x16103a, roughness: 0.9 });
    const matShelf   = new THREE.MeshStandardMaterial({ color: 0x2a2152, roughness: 0.7, metalness: 0.18 });
    const matCounter = new THREE.MeshStandardMaterial({ color: 0x191338, roughness: 0.45, metalness: 0.32 });
    const matWhite   = new THREE.MeshStandardMaterial({ color: 0xeef0ff, roughness: 0.6 });
    const matBox     = new THREE.MeshStandardMaterial({ color: 0xe4dffa, roughness: 0.85 });
    const matSole    = new THREE.MeshStandardMaterial({ color: 0x0f0a28, roughness: 0.7 });
    const stringMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.6, side: THREE.DoubleSide, depthWrite: false });

    // глянцевый пол магазина
    addBox(shop, matFloor, [54.45, 60], [0.02, 0.06], [12.05, 15.55]);
    addBox(shop, M.ledMagenta, [54.6, 59.7], [0.061, 0.07], [13.78, 13.82]); // тонкая брендовая инкрустация
    // мягкий ковёр у входа
    addBox(shop, M.magentaSoft, [56.7, 58.4], [0.06, 0.072], [12.2, 13.4]);

    // ── ракетка: голова-овал + струны + древко + ручка ──
    function racket(x, hC, y, rot, colorIdx, scale = 1, flat = false) {
      const g = new THREE.Group();
      const fm = new THREE.MeshStandardMaterial({ color: PAL[colorIdx % PAL.length], roughness: 0.36, metalness: 0.45 });
      const head = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.009, 8, 30), fm);
      head.scale.set(1, 1.3, 1); head.position.y = 0.5; head.castShadow = true; g.add(head);
      const str = new THREE.Mesh(new THREE.CircleGeometry(0.092, 26), stringMat);
      str.scale.set(1, 1.3, 1); str.position.set(0, 0.5, 0.001); g.add(str);
      for (const s of [-1, 1]) {
        const th = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.14, 6), fm);
        th.position.set(s * 0.045, 0.342, 0); th.rotation.z = s * 0.34; g.add(th);
      }
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.16, 8), fm);
      shaft.position.y = 0.245; g.add(shaft);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.15, 12), M.dark);
      grip.position.y = 0.085; grip.castShadow = true; g.add(grip);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0188, 0.0188, 0.022, 12), fm);
      band.position.y = 0.155; g.add(band);
      g.scale.setScalar(scale);
      g.rotation.set(flat ? -Math.PI / 2 : 0, rot, 0);
      g.position.set(PX(x), hC, PZ(y));
      shop.add(g);
    }
    // ── туба с воланами ──
    function shuttleTube(x, baseH, y, capIdx) {
      addCyl(shop, matWhite, 0.035, baseH, baseH + 0.21, x, y, true);
      addCyl(shop, fabricMat(capIdx), 0.034, baseH + 0.19, baseH + 0.27, x, y);
    }

    /* ── ЗАПАД: ракеточная стена (пегборд) + витрина-низ с воланами ── */
    addBox(shop, matPeg, [54.47, 54.55], [0.62, 2.45], [12.5, 15.3], false);
    addBox(shop, M.ledMagenta, [54.47, 54.55], [2.44, 2.47], [12.5, 15.3]); // верхняя LED-кромка пегборда
    const wallIdx = [0, 1, 2, 3, 5, 4];
    for (let i = 0; i < 6; i++) racket(54.66, 1.55, 12.78 + i * 0.43, Math.PI / 2, wallIdx[i], 1);
    // нижняя витрина-стол вдоль западной стены
    addBox(shop, matCounter, [54.55, 55.18], [0.05, 0.88], [12.55, 15.25], true);
    addBox(shop, M.steelDark, [54.5, 55.24], [0.88, 0.92], [12.5, 15.3], true);
    addBox(shop, M.ledOrange, [55.18, 55.21], [0.55, 0.6], [12.6, 15.2]);
    for (let i = 0; i < 5; i++) shuttleTube(54.82, 0.92, 12.95 + i * 0.46, i);
    for (let i = 0; i < 5; i++) addBox(shop, fabricMat(i + 2), [55.0, 55.14], [0.92, 1.04], [12.96 + i * 0.46, 15.16 - (4 - i) * 0.46 + (i - i)], true);

    /* ── СЕВЕР: стеллаж обувь + одежда, брендовая подсветка ── */
    addBox(shop, matPeg, [55.5, 59.6], [0.05, 2.0], [15.46, 15.5], true);   // задняя панель
    addBox(shop, matShelf, [55.5, 55.62], [0.05, 2.0], [15.08, 15.5], true); // боковина
    addBox(shop, matShelf, [59.48, 59.6], [0.05, 2.0], [15.08, 15.5], true);
    const shelfH = [0.05, 0.5, 0.97, 1.44];
    for (const h of shelfH) addBox(shop, matShelf, [55.5, 59.6], [h, h + 0.04], [15.08, 15.5], true);
    // обувь на нижней полке (h 0.54) — пары коробкой подошва+верх
    for (let p = 0; p < 4; p++) {
      const sx = 55.78 + p * 0.92;
      for (const dx of [0, 0.16]) {
        addBox(shop, matSole, [sx + dx, sx + dx + 0.11], [0.54, 0.58], [15.14, 15.42], true);
        addBox(shop, fabricMat(p + 1), [sx + dx + 0.005, sx + dx + 0.1], [0.58, 0.66], [15.18, 15.4], true);
      }
    }
    // сложенная одежда на полках h 1.01 и 1.48
    for (const [sh, off] of [[1.01, 0], [1.48, 3]]) {
      for (let s = 0; s < 4; s++) {
        const sx = 55.75 + s * 0.93;
        addBox(shop, fabricMat(s + off), [sx, sx + 0.62], [sh, sh + 0.14], [15.14, 15.44], true);
        addBox(shop, fabricMat(s + off + 1), [sx + 0.03, sx + 0.59], [sh + 0.14, sh + 0.26], [15.16, 15.42], true);
      }
    }
    // брендовая подсветка над стеллажом
    addBox(shop, M.dark, [55.5, 59.6], [2.0, 2.78], [15.45, 15.5], true);
    addPlane(shop, makeShopPanelTexture(), 4.0, 0.64, 57.55, 2.4, 15.44, Math.PI, 1.15);

    /* ── ВОСТОК: вешало с экипировкой + полка футболок ── */
    addBox(shop, M.steelDark, [59.6, 59.67], [1.56, 1.62], [12.55, 14.65], true); // штанга
    for (const yy of [12.6, 14.6]) addCyl(shop, M.steelDark, 0.018, 0.06, 1.62, 59.63, yy, true); // стойки
    for (let i = 0; i < 8; i++) {
      const yy = 12.72 + i * 0.245;
      addBox(shop, M.steelDark, [59.45, 59.63], [1.5, 1.56], [yy - 0.01, yy + 0.01]);       // плечики
      addBox(shop, fabricMat(i), [59.36, 59.6], [0.98, 1.5], [yy - 0.085, yy + 0.085], true); // изделие
      addBox(shop, fabricMat(i), [59.4, 59.58], [1.32, 1.5], [yy - 0.13, yy + 0.13], true);    // «плечи»
    }
    addBox(shop, matShelf, [59.3, 59.7], [0.46, 0.5], [12.55, 14.65], true);
    for (let s = 0; s < 4; s++) {
      const sy = 12.66 + s * 0.5;
      addBox(shop, fabricMat(s + 2), [59.36, 59.66], [0.5, 0.62], [sy, sy + 0.34], true);
    }

    /* ── ЦЕНТР: стеклянная витрина-остров (премиум-ракетки) ── */
    addBox(shop, matCounter, [56.6, 58.6], [0.05, 0.9], [13.75, 14.62], true);
    addBox(shop, M.ledMagenta, [56.6, 58.6], [0.05, 0.12], [13.72, 13.76]); // LED-цоколь по фронту
    addBox(shop, M.ledMagenta, [56.6, 58.6], [0.05, 0.12], [14.61, 14.65]);
    // стеклянный колпак
    addBox(shop, M.glass, [56.58, 58.62], [0.9, 1.16], [13.73, 13.77]);
    addBox(shop, M.glass, [56.58, 58.62], [0.9, 1.16], [14.6, 14.64]);
    addBox(shop, M.glass, [56.56, 56.6], [0.9, 1.16], [13.73, 14.64]);
    addBox(shop, M.glass, [58.6, 58.64], [0.9, 1.16], [13.73, 14.64]);
    addBox(shop, M.glass, [56.58, 58.62], [1.15, 1.18], [13.73, 14.64]);
    racket(57.05, 0.93, 14.18, 0.18, 0, 0.82, true);
    racket(57.6, 0.93, 14.18, -0.05, 2, 0.82, true);
    racket(58.15, 0.93, 14.18, 0.12, 3, 0.82, true);
    for (let i = 0; i < 3; i++) shuttleTube(56.85 + i * 0.18, 0.9, 13.95, i + 1);

    /* ── КАССА: стойка слева от входа ── */
    addBox(shop, matCounter, [54.62, 56.5], [0.05, 1.0], [12.28, 13.05], true);
    addBox(shop, M.orange, [54.55, 56.58], [1.0, 1.08], [12.22, 13.12], true);
    addBox(shop, M.ledMagenta, [54.62, 56.5], [0.55, 0.62], [13.05, 13.09]); // LED-строка по фронту
    // POS-монитор + терминал
    addBox(shop, M.steelDark, [55.55, 55.95], [1.08, 1.5], [12.5, 12.55], true);
    addBox(shop, M.dark, [55.6, 55.9], [1.14, 1.46], [12.55, 12.58], true);
    addBox(shop, M.dark, [55.0, 55.34], [1.08, 1.14], [12.5, 12.74], true);   // картоприёмник
    addBox(shop, M.ledMint, [55.06, 55.28], [1.14, 1.17], [12.56, 12.68]);
    // фирменный пакет на стойке
    addBox(shop, matWhite, [54.78, 55.06], [1.08, 1.42], [12.82, 13.04], true);
    addBox(shop, M.ledMagenta, [54.82, 55.02], [1.18, 1.34], [12.81, 12.815]);
    // табурет кассира
    addCyl(shop, M.dark, 0.2, 0.06, 0.1, 55.5, 12.0);
    addCyl(shop, M.steelDark, 0.028, 0.1, 0.56, 55.5, 12.0);
    addBox(shop, M.magentaSoft, [55.3, 55.7], [0.56, 0.64], [11.85, 12.2], true);

    /* ── СТЕНД-ФАН у входа справа: ракетки в держателе ── */
    addBox(shop, matShelf, [58.45, 59.62], [0.05, 0.14], [12.28, 12.92], true);
    addBox(shop, M.steelDark, [58.5, 58.56], [0.14, 1.15], [12.34, 12.86], true);
    for (let i = 0; i < 4; i++) {
      const rx = 58.66 + i * 0.26;
      const g = racket(rx, 0.14, 12.62, Math.PI, i + 1, 0.92);
    }

    /* ── манекен-бюст (демонстрация формы) ── */
    addCyl(shop, M.steelDark, 0.2, 0.06, 0.08, 55.5, 14.6);
    addCyl(shop, M.steelDark, 0.028, 0.08, 0.82, 55.5, 14.6);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.62, 18), fabricMat(0));
    torso.position.set(PX(55.5), 1.13, PZ(14.6)); torso.castShadow = true; shop.add(torso);
    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), fabricMat(0));
    shoulders.scale.set(1, 0.5, 0.7); shoulders.position.set(PX(55.5), 1.42, PZ(14.6)); shop.add(shoulders);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 12), matWhite);
    neck.position.set(PX(55.5), 1.5, PZ(14.6)); shop.add(neck);

    /* ── торговый свет: трек-споты под антресолью + ретейл-подсветка ── */
    for (const [sx, sy] of [[55.6, 13.0], [57.5, 14.2], [58.8, 13.0], [56.4, 15.2]]) {
      addBox(shop, M.led, [sx - 0.16, sx + 0.16], [4.04, 4.12], [sy - 0.42, sy + 0.42]);
      addCyl(shop, M.dark, 0.05, 4.12, 4.26, sx, sy);
    }
    const sl1 = new THREE.PointLight(0xffd0b0, 16, 9, 2); sl1.position.set(PX(56.6), 3.4, PZ(13.4)); shop.add(sl1);
    const sl2 = new THREE.PointLight(0xdd58c5, 12, 8, 2); sl2.position.set(PX(57.8), 3.2, PZ(14.8)); shop.add(sl2);
    const sl3 = new THREE.PointLight(0x9fb0ff, 9, 7, 2);  sl3.position.set(PX(55.2), 3.0, PZ(13.0)); shop.add(sl3);
  }
  // (медпункт демонтирован — площадь отдана мокрой зоне раздевалки 1)
  // локальный свет сервис-зоны
  for (const [color, x, h, y, li, ld] of [
    [0xbfc4ff, 51.0, 3.4, 3.7, 26, 13],
    [0xbfc4ff, 51.0, 3.4, 11.85, 26, 13],
    [0xdd58c5, 52.0, 2.6, 7.8, 10, 7],
    [0xffc9a1, 57.4, 3.4, 8.0, 30, 14],
    [0x9fc4ff, 56.6, 2.6, 1.9, 8, 8.5],   // мокрая зона 1
    [0x9fc4ff, 56.6, 2.6, 13.6, 8, 8.5],  // мокрая зона 2
    [0xffc9a1, 57.6, 3.0, 5.3, 16, 11],   // гардероб
  ]) {
    const l = new THREE.PointLight(color, li, ld, 2);
    l.position.set(PX(x), h, PZ(y));
    root.add(l);
  }

  /* ============================ ВХОД (восточный фасад) ============================ */
  addBox(root, M.glass, [59.82, 60.0], [0.05, 3.0], [5.4, 9.4]);           // витраж входа
  addBox(root, M.steelDark, [59.8, 60.02], [0.05, 3.05], [7.32, 7.48], true);
  addBox(root, M.dark, [60.0, 63.2], [3.3, 3.5], [4.8, 10.0], true);       // козырёк
  addBox(root, M.ledMagenta, [63.1, 63.2], [3.32, 3.48], [4.8, 10.0]);     // LED-кромка козырька
  addCyl(root, M.steelDark, 0.07, 0.0, 3.3, 62.8, 5.2, true);
  addCyl(root, M.steelDark, 0.07, 0.0, 3.3, 62.8, 9.6, true);
  // вывеска
  const signTex = makeSignTexture();
  const mSign = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.15 });
  neonMats.push({ mat: mSign, base: 1.15 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 8.4), mSign);
  sign.position.set(PX(60.12), 5.1, PZ(7.4));
  root.add(sign);

  /* ============================ АНТРЕСОЛЬ +4.600 (366 м²) ============================ */
  const mezz = new THREE.Group(); root.add(mezz);
  addBox(mezz, M.slabMezz, [29.6, 60], [4.3, 4.6], [0.2, 15.6], true);   // плита A (над НТ, полное перекрытие)
  addBox(mezz, M.slabMezz, [47.6, 60], [4.3, 4.6], [0, 6.0], true);      // плита B (над сервисом)
  // балюстрады (стекло + поручень)
  function rail(xr, yr) {
    addBox(mezz, M.rail, xr, [4.6, 5.7], yr);
    addBox(mezz, M.steelDark, [xr[0] - 0.02, xr[1] + 0.02], [5.7, 5.78], [yr[0] - 0.02, yr[1] + 0.02]);
  }
  rail([29.6, 29.66], [0.2, 8.5]);      // запад — вид на НТ/бадминтон (разрыв — выход с лестницы)
  rail([29.6, 29.66], [9.7, 15.6]);
      rail([29.66, 60], [15.54, 15.6]);     // север — вид на падел
  buildMezzInterior();
  function buildMezzInterior() {
    /* ── материалы интерьера антресоли ── */
    const mGymFloor = new THREE.MeshStandardMaterial({ color: 0x1b1442, roughness: 0.94 });
    const mWoodFloor= new THREE.MeshStandardMaterial({ color: 0x6d4d37, roughness: 0.86 });
    const mTechFloor= new THREE.MeshStandardMaterial({ color: 0x171134, roughness: 0.85, metalness: 0.2 });
    const mRug      = new THREE.MeshStandardMaterial({ color: 0x2b2256, roughness: 0.96 });
    const mSofaA    = new THREE.MeshStandardMaterial({ color: 0xc2399f, roughness: 0.86 });
    const mSofaB    = new THREE.MeshStandardMaterial({ color: 0x4a2aa0, roughness: 0.86 });
    const mSofaC    = new THREE.MeshStandardMaterial({ color: 0x2c2560, roughness: 0.86 });
    const mCushO    = new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.82 });
    const mCushM    = new THREE.MeshStandardMaterial({ color: 0x22e6a8, roughness: 0.82 });
    const mFoliage  = new THREE.MeshStandardMaterial({ color: 0x1f9e6e, roughness: 0.85 });
    const mFoliage2 = new THREE.MeshStandardMaterial({ color: 0x2bbf86, roughness: 0.82 });
    const mPot      = new THREE.MeshStandardMaterial({ color: 0x14103a, roughness: 0.9 });
    const mScreen   = new THREE.MeshStandardMaterial({ color: 0x07061f, roughness: 0.35, metalness: 0.4 });
    const mMirror   = new THREE.MeshStandardMaterial({ color: 0x8fb6dc, roughness: 0.05, metalness: 0.95 });
    const mTableTop = new THREE.MeshStandardMaterial({ color: 0xece8fb, roughness: 0.5 });
    const mMetal    = M.steelDark;

    /* ── хелперы: повёрнутые группы и локальные примитивы (в метрах) ── */
    function spot(cx, cy, rot = 0) {
      const g = new THREE.Group();
      g.position.set(PX(cx), 4.6, PZ(cy)); g.rotation.y = rot; mezz.add(g); return g;
    }
    function lb(g, mat, w, h, d, x, y, z, cast = true) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
    }
    function lcyl(g, mat, r, h, x, y, z, cast = true) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), mat);
      m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
    }
    function legs(g, w, d, h, inset = 0.09) {
      for (const sx of [-w / 2 + inset, w / 2 - inset]) for (const sz of [-d / 2 + inset, d / 2 - inset])
        lcyl(g, mMetal, 0.025, h, sx, h / 2, sz, false);
    }
    // глянцевая перегородка: thin x → стена север-юг, thin y → стена восток-запад
    function gWall(x0, x1, y0, y1, h = 2.0) {
      addBox(mezz, M.glass, [x0, x1], [4.6, 4.6 + h], [y0, y1]);
      addBox(mezz, mMetal, [x0 - 0.02, x1 + 0.02], [4.6 + h, 4.6 + h + 0.06], [y0 - 0.02, y1 + 0.02]);
      addBox(mezz, mMetal, [x0 - 0.02, x1 + 0.02], [4.6, 4.66], [y0 - 0.02, y1 + 0.02]);
    }
    // LED-контур зоны на полу
    function zoneEdge(led, x0, x1, y0, y1) {
      addBox(mezz, led, [x0, x1], [4.6, 4.616], [y0, y0 + 0.05]);
      addBox(mezz, led, [x0, x1], [4.6, 4.616], [y1 - 0.05, y1]);
      addBox(mezz, led, [x0, x0 + 0.05], [4.6, 4.616], [y0, y1]);
      addBox(mezz, led, [x1 - 0.05, x1], [4.6, 4.616], [y0, y1]);
    }
    // подвесной навигационный «клинок» с названием зоны (смотрит на юг)
    function zoneSign(text, cx, cy, w = 2.4, accent = '#DD58C5') {
      const tex = makeLabelTexture(text, { accent });
      addPlane(mezz, tex, w, w / 4.571, cx, 6.35, cy, Math.PI, 1.0);
      addCyl(mezz, mMetal, 0.012, 6.45, 6.9, cx - w / 2 + 0.2, cy + 0.02, false);
      addCyl(mezz, mMetal, 0.012, 6.45, 6.9, cx + w / 2 - 0.2, cy + 0.02, false);
    }
    // настенный экран с canvas-текстурой (rotY>0 — лицом на восток, <0 — на запад)
    function wallScreen(tex, w, h, x, hC, y, rotY) {
      const dir = rotY > 0 ? 1 : -1;
      addBox(mezz, mScreen, [x - 0.05, x + 0.05], [hC - h / 2 - 0.08, hC + h / 2 + 0.08], [y - w / 2 - 0.08, y + w / 2 + 0.08]);
      addPlane(mezz, tex, w, h, x + dir * 0.09, hC, y, rotY, 1.0);
    }
    // мини-монитор на столе (повёрнут локально)
    function monitor(g, x, y, z, w = 0.5, rot = 0, face = M.ledMint) {
      const mg = new THREE.Group(); mg.position.set(x, y, z); mg.rotation.y = rot; g.add(mg);
      lb(mg, mScreen, w, w * 0.62, 0.04, 0, 0, 0, false);
      lb(mg, face, w - 0.06, w * 0.62 - 0.06, 0.02, 0, 0, 0.03, false);
      lcyl(mg, mMetal, 0.02, 0.16, 0, -w * 0.31 - 0.08, 0, false);
      lb(mg, mMetal, 0.18, 0.02, 0.12, 0, -w * 0.31 - 0.16, 0, false);
    }
    function deskChair(cx, cy, rot, mat = M.dark) {
      const g = spot(cx, cy, rot);
      lb(g, mat, 0.5, 0.08, 0.5, 0, 0.46, 0);
      lb(g, mat, 0.5, 0.44, 0.08, 0, 0.69, -0.21);
      lcyl(g, mMetal, 0.04, 0.46, 0, 0.23, 0, false);
      lcyl(g, mMetal, 0.26, 0.05, 0, 0.04, 0, false);
    }
    function sofa(cx, cy, rot, len, mat, cush) {
      const g = spot(cx, cy, rot);
      lb(g, mat, len, 0.20, 0.80, 0, 0.30, 0.02);
      lb(g, mat, len, 0.50, 0.16, 0, 0.55, -0.32);
      lb(g, mat, 0.16, 0.42, 0.80, -len / 2 + 0.08, 0.46, 0.02);
      lb(g, mat, 0.16, 0.42, 0.80, len / 2 - 0.08, 0.46, 0.02);
      const n = Math.max(2, Math.round(len / 0.85));
      for (let i = 0; i < n; i++) lb(g, cush, len / n - 0.1, 0.16, 0.54, -len / 2 + len / n * (i + 0.5), 0.48, 0.06);
      legs(g, len, 0.8, 0.18);
    }
    function armchair(cx, cy, rot, mat, cush) {
      const g = spot(cx, cy, rot);
      lb(g, mat, 0.84, 0.20, 0.76, 0, 0.30, 0.02);
      lb(g, mat, 0.84, 0.48, 0.15, 0, 0.54, -0.30);
      lb(g, mat, 0.15, 0.38, 0.76, -0.35, 0.44, 0.02);
      lb(g, mat, 0.15, 0.38, 0.76, 0.35, 0.44, 0.02);
      lb(g, cush, 0.58, 0.15, 0.52, 0, 0.46, 0.06);
      legs(g, 0.84, 0.76, 0.18);
    }
    function lowTable(cx, cy, rot, w, d, mat = M.wood) {
      const g = spot(cx, cy, rot);
      lb(g, mat, w, 0.06, d, 0, 0.37, 0); legs(g, w, d, 0.37);
    }
    function barStool(cx, cy) {
      const g = spot(cx, cy, 0);
      lcyl(g, mSofaA, 0.17, 0.07, 0, 0.74, 0);
      lcyl(g, mMetal, 0.03, 0.74, 0, 0.37, 0, false);
      lcyl(g, mMetal, 0.18, 0.04, 0, 0.05, 0, false);
    }
    function plant(cx, cy, s = 1) {
      const g = spot(cx, cy, (cx * 7) % 3); g.scale.setScalar(s);
      lcyl(g, mPot, 0.16, 0.4, 0, 0.2, 0);
      const fm = (Math.round(cx + cy)) % 2 ? mFoliage : mFoliage2;
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), fm);
      f.scale.set(1, 1.3, 1); f.position.y = 0.66; f.castShadow = true; g.add(f);
      const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), fm);
      f2.position.set(0.12, 0.5, 0.08); g.add(f2);
    }
    function pendant(cx, cy, color = 0xffd6ac) {
      addCyl(mezz, mMetal, 0.012, 6.55, 6.9, cx, cy, false);
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.12, 16), M.led);
      disk.position.set(PX(cx), 6.48, PZ(cy)); mezz.add(disk);
      const pl = new THREE.PointLight(color, 7, 7, 2); pl.position.set(PX(cx), 6.2, PZ(cy)); mezz.add(pl);
    }

    function pouf(cx, cy, mat) {
      const g = spot(cx, cy, 0);
      lcyl(g, mat, 0.28, 0.07, 0, 0.035, 0);
      lcyl(g, mat, 0.265, 0.4, 0, 0.25, 0);
    }

    /* ═════════ 1 · ОФП-ЗАЛ — дальний (восточный) край, x 51.0–59.8, ~129 м² ═════════
       Зонирование: силовая (помост, север) · функциональная (рама, центр) ·
       свободные веса у зеркала (восток) · кардио у стекла (запад) · растяжка (юг). */
    addBox(mezz, mGymFloor, [51.0, 59.8], [4.6, 4.63], [0.6, 15.3]);
    zoneEdge(M.ledMint, 51.04, 59.76, 0.66, 15.26);
    // западная стеклянная стена с дверным проёмом
    gWall(50.95, 51.0, 0.6, 7.5, 2.3);
    gWall(50.95, 51.0, 9.0, 15.3, 2.3);
    addBox(mezz, M.rail, [50.95, 50.99], [4.6, 6.5], [7.5, 8.05]); // приоткрытая стеклянная дверь
    // зеркальная стена (восток) + класс-экран на западной стене
    addBox(mezz, mMirror, [59.6, 59.66], [4.62, 6.6], [2.2, 13.0]);
    addBox(mezz, M.steelDark, [59.58, 59.68], [6.55, 6.62], [2.1, 13.1]); // карниз зеркала
    wallScreen(makeBoardTexture(), 2.3, 0.86, 51.12, 5.6, 3.4, Math.PI / 2);

    /* --- материалы покрытий зон --- */
    const mRubber  = new THREE.MeshStandardMaterial({ color: 0x140f33, roughness: 0.97 });
    const mStretch = new THREE.MeshStandardMaterial({ color: 0x203a5c, roughness: 0.95 });
    const mRopeMat = new THREE.MeshStandardMaterial({ color: 0x6d4d37, roughness: 0.9 });

    /* --- хелперы инвентаря (g = группа spot(); локальные оси: x восток, y высота, z север) --- */
    function gTreadmill(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, M.dark, 0.55, 0.18, 1.3, 0, 0.18, 0.1, true);
      lb(g, M.steelDark, 0.5, 0.04, 1.0, 0, 0.30, 0.15, false);
      lb(g, mMetal, 0.06, 0.95, 0.06, 0, 0.7, -0.55);
      lb(g, mMetal, 0.5, 0.06, 0.06, 0, 1.15, -0.55);
      monitor(g, 0, 1.25, -0.52, 0.34, 0, M.ledMint);
    }
    function gBike(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, mMetal, 0.12, 0.06, 1.05, 0, 0.06, 0, true);
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 22), M.steelDark);
      fan.rotation.x = Math.PI / 2; fan.position.set(0, 0.55, -0.42); fan.castShadow = true; g.add(fan);
      lcyl(g, mMetal, 0.04, 0.7, 0, 0.55, 0.12, false);
      lb(g, M.dark, 0.42, 0.05, 0.05, 0, 0.92, 0.14);
      lcyl(g, mMetal, 0.04, 0.46, 0, 0.4, 0.36, false);
      lb(g, M.magentaSoft, 0.16, 0.08, 0.3, 0, 0.62, 0.4, true);
      monitor(g, 0, 1.04, -0.06, 0.24, 0, M.ledMint);
    }
    function gRowing(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, mMetal, 0.16, 0.07, 1.95, 0, 0.1, 0, true);
      lb(g, M.dark, 0.34, 0.12, 0.34, 0, 0.26, 0.55, true);
      lb(g, M.dark, 0.42, 0.4, 0.18, 0, 0.4, -0.85, true);
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 18), M.steelDark);
      fw.rotation.z = Math.PI / 2; fw.position.set(0, 0.42, -0.78); g.add(fw);
      lb(g, M.ledMint, 0.2, 0.13, 0.02, 0, 0.82, -0.74, false);
      lb(g, mMetal, 0.42, 0.04, 0.04, 0, 0.5, -0.6, false);
    }
    function gPowerRack(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      for (const sz of [0, 0.7]) for (const sx of [-0.55, 0.55]) lb(g, mMetal, 0.1, 2.4, 0.1, sx, 1.2, sz, true);
      for (const sz of [0, 0.7]) lb(g, mMetal, 1.2, 0.1, 0.1, 0, 2.35, sz);
      for (const sx of [-0.55, 0.55]) lb(g, mMetal, 0.1, 0.1, 0.7, sx, 2.35, 0.35);
      lb(g, mMetal, 1.2, 0.07, 0.07, 0, 2.28, 0.35, false);             // турник сверху
      lb(g, mMetal, 1.3, 0.06, 0.06, 0, 1.55, 0.06);                    // упоры безопасности
      for (const sx of [-0.62, 0.62]) { lcyl(g, M.ledMagenta, 0.16, 0.07, sx, 1.5, 0.06, false); lcyl(g, M.dark, 0.17, 0.05, sx, 1.5, 0.13, false); }
      // загруженная штанга на стойках
      lb(g, M.steelDark, 0.05, 0.05, 0.05, 0, 1.5, 0.06);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 12), M.steelDark);
      bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.5, 0.06); g.add(bar);
      for (const s of [-1, 1]) for (const [px, r] of [[0.7, 0.24], [0.82, 0.18]]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 18), s > 0 ? M.dark : M.magentaSoft);
        p.rotation.z = Math.PI / 2; p.position.set(s * px, 1.5, 0.06); p.castShadow = true; g.add(p);
      }
    }
    function gBenchFlat(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, M.dark, 0.34, 0.1, 1.2, 0, 0.46, 0, true);
      lb(g, M.magentaSoft, 0.32, 0.04, 1.18, 0, 0.52, 0);
      lb(g, mMetal, 0.1, 0.42, 0.1, 0, 0.21, 0.5, false);
      lb(g, mMetal, 0.1, 0.42, 0.1, 0, 0.21, -0.5, false);
      lb(g, mMetal, 0.08, 0.06, 1.1, 0, 0.04, 0, false);
    }
    function gBenchIncline(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, M.dark, 0.34, 0.1, 0.62, 0, 0.46, 0.3, true);
      lb(g, M.mint, 0.32, 0.04, 0.6, 0, 0.52, 0.3);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.82), M.dark);
      back.position.set(0, 0.66, -0.34); back.rotation.x = 0.52; back.castShadow = true; g.add(back);
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.8), M.mint);
      bp.position.set(0, 0.72, -0.34); bp.rotation.x = 0.52; g.add(bp);
      lb(g, mMetal, 0.1, 0.46, 0.1, 0, 0.23, 0.56, false);
      lb(g, mMetal, 0.1, 0.5, 0.1, 0, 0.25, -0.52, false);
    }
    function gDumbbell(g, x, z, h, L, hd, mat) {
      lb(g, M.steelDark, L, 0.045, 0.045, x, h + hd / 2, z, false);
      for (const s of [-1, 1]) lb(g, mat, 0.12, hd, hd, x + s * (L / 2 - 0.03), h + hd / 2, z, false);
    }
    function gDumbbellRack(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      for (const s of [-1, 1]) lb(g, mMetal, 0.08, 0.94, 0.64, s * 0.95, 0.47, 0, true);
      lb(g, mMetal, 1.9, 0.07, 0.62, 0, 0.46, 0.04);
      lb(g, mMetal, 1.9, 0.07, 0.54, 0, 0.84, -0.12);
      lb(g, M.ledMint, 1.9, 0.02, 0.03, 0, 0.9, 0.24);
      const pal = [M.magentaSoft, M.mint, M.orange, M.dark, M.magentaSoft];
      for (let i = 0; i < 5; i++) {
        const x = -0.72 + i * 0.36, hd = 0.13 + i * 0.013;
        gDumbbell(g, x, 0.13, 0.52, 0.32, hd, pal[i]);
        gDumbbell(g, x, -0.1, 0.9, 0.32, hd * 0.9, pal[(i + 2) % 5]);
      }
    }
    function gKettle(g, x, z, s, mat) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.13 * s, 14, 12), mat);
      b.scale.set(1, 0.9, 1); b.position.set(x, 0.12 * s, z); b.castShadow = true; g.add(b);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.07 * s, 0.02 * s, 8, 14), mMetal);
      h.position.set(x, 0.23 * s, z); g.add(h);
    }
    function gPlateTree(cx, cy) {
      addCyl(mezz, mMetal, 0.2, 4.6, 4.66, cx, cy, true);
      addCyl(mezz, mMetal, 0.05, 4.66, 6.0, cx, cy, false);
      const pal = [M.magentaSoft, M.mint, M.orange, M.dark];
      for (let i = 0; i < 4; i++) {
        const h = 4.6 + 0.32 + i * 0.32, r = 0.26 - i * 0.035;
        for (const s of [-1, 1]) {
          const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.1, 18), pal[i]);
          c.rotation.z = Math.PI / 2; c.position.set(PX(cx) + s * 0.18, h, PZ(cy)); c.castShadow = true; mezz.add(c);
        }
      }
    }
    function gBarbellHolder(cx, cy) {
      const g = spot(cx, cy, 0);
      lcyl(g, mMetal, 0.18, 0.06, 0, 0.03, 0);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; lcyl(g, mMetal, 0.045, 1.2, 0.16 * Math.cos(a), 0.6, 0.16 * Math.sin(a), false); }
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; lcyl(g, M.steelDark, 0.022, 1.7, 0.12 * Math.cos(a), 0.85, 0.12 * Math.sin(a), false); lcyl(g, M.dark, 0.04, 0.26, 0.12 * Math.cos(a), 0.13, 0.12 * Math.sin(a), false); }
    }
    function gRig(cx, cy) {
      const g = spot(cx, cy, 0), W = 1.4, D = 0.78, H = 2.5;
      for (const sx of [-W, W]) for (const sz of [-D, D]) lb(g, mMetal, 0.1, H, 0.1, sx, H / 2, sz, true);
      for (const sz of [-D, D]) lb(g, mMetal, 2 * W + 0.1, 0.1, 0.1, 0, H, sz);
      for (const sx of [-W, W]) lb(g, mMetal, 0.1, 0.1, 2 * D, sx, H, 0);
      lb(g, mMetal, 2 * W - 0.2, 0.06, 0.06, 0, H - 0.18, 0, false);                 // турник
      lb(g, mMetal, 2 * W - 0.2, 0.06, 0.06, 0, H - 0.18, -0.45, false);
      for (const tx of [-0.4, 0.4]) { lb(g, M.orange, 0.035, 0.95, 0.035, tx, H - 0.55, 0.25, false); lb(g, M.dark, 0.13, 0.07, 0.05, tx, H - 1.05, 0.25, false); } // TRX
      for (const tx of [-0.95, 0.95]) {                                              // гимнастические кольца
        lb(g, M.dark, 0.022, 0.85, 0.022, tx, H - 0.5, -0.2, false);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 8, 18), mRopeMat);
        ring.position.set(tx, H - 0.92, -0.2); g.add(ring);
      }
      lcyl(g, mRopeMat, 0.035, 1.5, 1.0, H - 0.7, 0.45, false);                       // канат для лазания
      for (const [tx, c] of [[-1.2, M.mint], [1.2, M.magentaSoft]]) lb(g, c, 0.04, 0.7, 0.04, tx, H - 0.5, 0.45, false); // эспандеры
    }
    function gBattleRopes(cx, cy) {
      const g = spot(cx, cy, 0);
      lb(g, mMetal, 0.34, 0.16, 0.34, 0, 0.08, 0, true);
      for (const [s, c] of [[-1, M.dark], [1, M.magentaSoft]]) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 8, 26), c);
        t.rotation.x = Math.PI / 2; t.position.set(s * 0.52, 0.05, 0.6); g.add(t);
        lb(g, c, 0.05, 0.05, 0.6, s * 0.22, 0.06, 0.3, false);
      }
    }
    function gMedRack(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      for (const s of [-1, 1]) lb(g, mMetal, 0.06, 0.95, 0.5, s * 0.5, 0.47, 0, true);
      const pal = [M.magentaSoft, M.mint, M.orange];
      for (let i = 0; i < 3; i++) {
        const h = 0.28 + i * 0.3;
        lb(g, mMetal, 1.0, 0.04, 0.34, 0, h, i * 0.05, false);
        for (const bx of [-0.28, 0.28]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), pal[i]); b.position.set(bx, h + 0.14, i * 0.05); b.castShadow = true; g.add(b); }
      }
    }
    function gPlyo(cx, cy) {
      const g = spot(cx, cy, 0);
      lb(g, M.mint, 0.52, 0.6, 0.42, 0, 0.3, 0, true);
      lb(g, M.orange, 0.44, 0.45, 0.36, 0.04, 0.82, 0.0, true);
      lb(g, M.magentaSoft, 0.38, 0.34, 0.3, -0.02, 1.21, 0.02, true);
    }
    function gWallBars(cx, w) {
      const x0 = cx - w / 2, x1 = cx + w / 2, y = 0.66;
      for (const px of [x0, x1]) addBox(mezz, mRopeMat, [px - 0.05, px + 0.05], [4.6, 7.0], [y, y + 0.09], true);
      for (let h = 4.95; h < 6.95; h += 0.27) addBox(mezz, mRopeMat, [x0, x1], [h, h + 0.05], [y + 0.02, y + 0.11]);
    }
    function gYogaMat(cx, cy, mat) { const g = spot(cx, cy, 0); lb(g, mat, 0.62, 0.02, 1.7, 0, 0.012, 0); }
    function gMatBin(cx, cy) {
      const g = spot(cx, cy, 0);
      for (const s of [-1, 1]) lb(g, mMetal, 0.04, 0.55, 0.5, s * 0.34, 0.27, 0, true);
      lb(g, mMetal, 0.72, 0.04, 0.5, 0, 0.04, 0, true);
      const pal = [M.mint, M.magentaSoft, M.orange];
      for (let i = 0; i < 6; i++) lcyl(g, pal[i % 3], 0.07, 0.62, -0.24 + (i % 3) * 0.16, 0.6, -0.13 + Math.floor(i / 3) * 0.2, true);
    }
    function gFoamRoller(cx, cy, mat) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 14), mat);
      c.rotation.z = Math.PI / 2; c.position.set(PX(cx), 4.69, PZ(cy)); c.castShadow = true; mezz.add(c);
    }
    function gCone(cx, cy, mat) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 14), mat);
      c.position.set(PX(cx), 4.74, PZ(cy)); mezz.add(c);
    }
    function gAgility(cx, cy, len) {
      const g = spot(cx, cy, 0);
      for (const sx of [-0.21, 0.21]) lb(g, M.orange, 0.035, 0.012, len, sx, 0.008, 0);
      for (let z = -len / 2 + 0.2; z < len / 2; z += 0.4) lb(g, M.orange, 0.45, 0.012, 0.03, 0, 0.008, z);
    }
    function gCooler(cx, cy) {
      const g = spot(cx, cy, 0);
      lb(g, M.line, 0.32, 1.0, 0.32, 0, 0.5, 0, true);
      lcyl(g, M.rail, 0.14, 1.0, 0, 1.2, 0);
      lb(g, M.ledMint, 0.1, 0.06, 0.02, 0.05, 0.55, 0.16, false);
    }
    function gTowelShelf(cx, cy, rot) {
      const g = spot(cx, cy, rot);
      lb(g, mMetal, 0.9, 1.6, 0.4, 0, 0.8, 0, true);
      for (let i = 0; i < 3; i++) lb(g, M.dark, 0.84, 0.03, 0.36, 0, 0.55 + i * 0.45, 0, false);
      const pal = [M.mint, M.magentaSoft, M.orange];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12), pal[(i + j) % 3]);
        c.rotation.z = Math.PI / 2; c.position.set(-0.26 + j * 0.26, 0.64 + i * 0.45, 0.08); g.add(c);
      }
    }
    function gClock(cx, hC, cy) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 24), M.dark);
      r.rotation.z = Math.PI / 2; r.position.set(PX(cx) + 0.01, hC, PZ(cy)); mezz.add(r);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24), M.line);
      f.rotation.z = Math.PI / 2; f.position.set(PX(cx), hC, PZ(cy)); mezz.add(f);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.17), M.magentaSoft);
      hand.position.set(PX(cx) - 0.03, hC + 0.04, PZ(cy)); mezz.add(hand);
    }
    function gChalk(cx, cy) {
      const g = spot(cx, cy, 0);
      lcyl(g, M.dark, 0.13, 0.34, 0, 0.17, 0, true);
      lcyl(g, M.line, 0.1, 0.06, 0, 0.33, 0);
    }

    /* --- покрытия зон --- */
    addBox(mezz, mWoodFloor, [51.7, 54.5], [4.63, 4.664], [12.5, 15.0]);   // помост (силовая)
    addBox(mezz, M.ledMint, [51.7, 54.5], [4.664, 4.674], [12.5, 12.56]);  // LED-кант помоста
    addBox(mezz, mRubber, [53.4, 57.6], [4.63, 4.66], [5.4, 11.7]);        // функциональная зона
    addBox(mezz, mStretch, [53.6, 57.9], [4.63, 4.66], [0.9, 4.7]);        // зона растяжки
    addBox(mezz, mRubber, [57.4, 59.4], [4.63, 4.66], [2.6, 12.4]);        // лейн у зеркала
    addBox(mezz, M.ledMagenta, [57.4, 57.46], [4.66, 4.672], [2.6, 12.4]); // кромка лейна

    /* --- СИЛОВАЯ (север, помост) --- */
    gPowerRack(53.0, 13.9, Math.PI);
    gBenchFlat(53.0, 12.7, 0);
    gPlateTree(51.5, 13.7);
    gBarbellHolder(51.5, 12.6);
    gChalk(54.25, 14.55);
    (() => { const g = spot(54.2, 12.9, 0); gKettle(g, -0.18, 0, 1.05, M.magentaSoft); gKettle(g, 0.12, 0.1, 0.88, M.mint); gKettle(g, 0.34, -0.08, 1.15, M.orange); })();

    /* --- СВОБОДНЫЕ ВЕСА у зеркала (восток) --- */
    gDumbbellRack(58.9, 4.5, -Math.PI / 2);
    gBenchFlat(58.1, 7.5, Math.PI / 2);
    gBenchIncline(58.1, 9.6, Math.PI / 2);
    (() => { const g = spot(57.85, 6.0, 0); gKettle(g, -0.16, 0, 1.1, M.orange); gKettle(g, 0.14, 0.08, 0.9, M.magentaSoft); })();
    gClock(59.42, 6.45, 6.4);

    /* --- ФУНКЦИОНАЛЬНАЯ (центр) --- */
    gRig(55.4, 8.8);
    gBattleRopes(55.4, 6.5);
    gPlyo(53.9, 6.0);
    gMedRack(53.9, 11.0, 0);
    gAgility(56.8, 8.4, 2.2);
    (() => { const g = spot(56.7, 10.7, 0); for (const [x, z, r, c] of [[-0.2, 0, 0.16, M.magentaSoft], [0.16, 0.12, 0.13, M.mint], [0.02, -0.2, 0.18, M.orange]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), c); b.position.set(x, r, z); b.castShadow = true; g.add(b); } })();
    for (const [cx, cy, c] of [[54.7, 7.6, M.orange], [56.3, 7.1, M.mint], [55.0, 10.2, M.magentaSoft], [56.7, 9.4, M.orange]]) gCone(cx, cy, c);

    /* --- КАРДИО у стекла (запад) --- */
    for (const cyc of [3.0, 4.7, 6.4]) gTreadmill(51.7, cyc, -Math.PI / 2);
    gBike(52.0, 1.3, -Math.PI / 2);
    gRowing(52.1, 9.5, 0);
    gCooler(52.65, 8.7);
    gTowelShelf(51.45, 11.1, Math.PI / 2);

    /* --- РАСТЯЖКА (юг) --- */
    gYogaMat(54.4, 2.7, M.mint);
    gYogaMat(55.2, 2.7, M.magentaSoft);
    gYogaMat(56.0, 2.7, M.orange);
    gMatBin(57.4, 1.5);
    gFoamRoller(56.6, 3.7, M.mint);
    gFoamRoller(56.95, 4.05, M.orange);
    gWallBars(54.9, 1.9);
    (() => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 14), M.mint); b.position.set(PX(55.7), 4.93, PZ(3.9)); b.castShadow = true; mezz.add(b); })(); // фитбол

    /* --- детали и подсветка --- */
    addPlane(mezz, makeLabelTexture('СИЛА · СКОРОСТЬ · ВЫНОСЛИВОСТЬ', { accent: '#22E6A8' }), 4.0, 0.875, 55.7, 5.55, 0.66, 0, 0.95); // настенная графика (юг)
    pendant(55.4, 8.8, 0x9fffe0);
    pendant(53.2, 13.5, 0xffd6ac);
    const gpl = new THREE.PointLight(0x9fe8ff, 6, 9, 2); gpl.position.set(PX(58.0), 6.0, PZ(8.0)); mezz.add(gpl);
    zoneSign('ОФП-ЗАЛ', 55.4, 12.6, 2.6, '#22E6A8');

    /* ═════════ 2 · КАБИНЕТЫ (мед., руководитель, делопроизводство) — у южной стены ═════════ */
    function office(x0, x1, label, accent, kind) {
      const cx = (x0 + x1) / 2;
      addBox(mezz, mTechFloor, [x0, x1], [4.6, 4.63], [0.55, 3.9]);
      gWall(x0, x0 + 0.05, 0.55, 3.9, 2.2);
      gWall(x1 - 0.05, x1, 0.55, 3.9, 2.2);
      gWall(x0, cx - 0.45, 3.85, 3.9, 2.2);
      gWall(cx + 0.45, x1, 3.85, 3.9, 2.2);
      addBox(mezz, M.rail, [cx - 0.45, cx - 0.42], [4.6, 6.5], [3.85, 4.25]); // дверь-стекло
      const g = spot(cx, 1.2, 0);
      lb(g, M.wood, 1.4, 0.06, 0.66, 0, 0.74, 0);
      lb(g, M.dark, 1.4, 0.66, 0.04, 0, 0.4, -0.31);
      monitor(g, 0, 1.04, -0.06, 0.46, 0, M.ledMint);
      deskChair(cx, 2.0, Math.PI);
      lb(spot(x0 + 0.45, 1.15, 0), M.dark, 0.5, 1.5, 0.85, 0, 0.75, 0); // шкаф
      if (kind === 'med') {
        const k = spot(x1 - 0.65, 2.7, 0);
        lb(k, M.line, 0.7, 0.46, 1.7, 0, 0.5, 0);                       // кушетка
        addBox(mezz, M.mint, [cx - 0.09, cx + 0.09], [5.3, 5.92], [0.56, 0.59]); // крест
        addBox(mezz, M.mint, [cx - 0.24, cx + 0.24], [5.5, 5.72], [0.56, 0.59]);
      } else {
        plant(x1 - 0.5, 3.3, 0.72);
      }
      addPlane(mezz, makeLabelTexture(label, { accent }), 2.4, 0.34, cx, 5.5, 3.92, 0, 1.0);
    }
    office(30.0, 33.8, 'МЕДКАБИНЕТ', '#22E6A8', 'med');
    office(34.1, 38.1, 'РУКОВОДИТЕЛЬ', '#DD58C5', 'dir');
    office(38.4, 42.4, 'ДЕЛОПРОИЗВОДСТВО', '#44D9FF', 'sales');

    /* ═════════ 3 · КУХНЯ (закрытое помещение) + БАР/КАФЕ ═════════ */
    (() => {
      const x0 = 43.4, x1 = 47.6, y0 = 0.55, y1 = 3.8;
      addBox(mezz, mTechFloor, [x0, x1], [4.6, 4.63], [y0, y1]);
      addBox(mezz, M.partition, [x0, x0 + 0.06], [4.6, 6.7], [y0, y1], true);   // запад
      addBox(mezz, M.partition, [x1 - 0.06, x1], [4.6, 6.7], [y0, y1], true);   // восток
      addBox(mezz, M.partition, [x0, x0 + 0.2], [4.6, 6.7], [y1 - 0.06, y1], true);          // север: левее двери
      addBox(mezz, M.partition, [x0 + 1.1, x1], [4.6, 6.7], [y1 - 0.06, y1], true);          // правее двери (с окном выдачи)
      addBox(mezz, M.partition, [x0 + 0.2, x0 + 1.1], [6.3, 6.7], [y1 - 0.06, y1], true);    // перемычка над дверью
      addBox(mezz, M.partition, [x1 - 1.6, x1 - 0.4], [4.6, 5.45], [y1 - 0.06, y1], true);   // подоконник окна выдачи
      // кухонная мебель вдоль южной стены
      const g = spot((x0 + x1) / 2, y0 + 0.45, 0);
      lb(g, M.steelDark, x1 - x0 - 0.4, 0.9, 0.62, 0, 0.45, 0);                 // тумбы + столешница
      for (const bx of [-1.45, -1.15, -1.45, -1.15]) lcyl(g, M.ledOrange, 0.07, 0.02, bx, 0.92, bx < -1.3 ? 0.12 : -0.12, false); // конфорки
      lb(g, M.dark, 0.9, 0.34, 0.5, -1.3, 1.75, 0, true);                       // вытяжка
      lb(g, M.rail, 0.42, 0.03, 0.34, 0.7, 0.92, 0, false);                     // мойка
      lb(g, M.steelDark, 0.6, 1.7, 0.58, 1.6, 0.85, 0, true);                   // холодильник
      addPlane(mezz, makeLabelTexture('КУХНЯ', { accent: '#FF8A3D' }), 1.5, 0.27, (x0 + x1) / 2, 5.9, y1 + 0.02, 0, 1.0);
    })();
    // барная стойка перед кухней (фронт на север)
    addBox(mezz, M.wood, [43.4, 47.6], [4.6, 5.55], [4.0, 4.55]);
    addBox(mezz, M.dark, [43.3, 47.7], [5.55, 5.63], [3.92, 4.62]);              // столешница
    addBox(mezz, M.ledMagenta, [43.4, 47.6], [5.1, 5.18], [4.55, 4.556]);       // LED-фронт
    addBox(mezz, M.steelDark, [43.6, 44.4], [5.63, 6.02], [4.06, 4.46], true);  // кофемашина
    addBox(mezz, M.ledMint, [43.72, 44.28], [5.72, 5.82], [4.04, 4.07]);
    for (const bx of [44.1, 45.0, 45.9, 46.8]) barStool(bx, 5.05);
    addPlane(mezz, makeLabelTexture('КАФЕ · БАР', { accent: '#FF8A3D' }), 2.3, 0.42, 45.5, 6.25, 4.5, 0, 1.0);
    // кафе-зона: круглые столики + табуреты
    for (const [tx, ty] of [[43.7, 6.5], [45.7, 6.6], [47.6, 7.7], [44.2, 8.3]]) {
      const t = spot(tx, ty, 0);
      lcyl(t, M.steelDark, 0.04, 0.72, 0, 0.36, 0, false);
      lcyl(t, M.wood, 0.4, 0.05, 0, 0.72, 0);
      lcyl(t, M.steelDark, 0.28, 0.04, 0, 0.04, 0, false);
      barStool(tx - 0.62, ty); barStool(tx + 0.62, ty);
    }

    /* ═════════ 4 · ЛАУНДЖ (диваны, пуфики) ═════════ */
    addBox(mezz, mRug, [29.9, 35.0], [4.6, 4.624], [4.4, 8.6]);                  // ковёр (зап.)
    sofa(31.0, 5.3, -Math.PI / 2, 2.4, mSofaA, mCushM);                         // диван у зап. балкона
    armchair(33.6, 5.1, -Math.PI / 2, mSofaB, mCushO);
    lowTable(32.0, 6.4, 0, 1.0, 0.6);
    pouf(33.2, 7.4, mSofaC); pouf(31.5, 7.6, mCushO);
    plant(30.3, 8.3, 1.0);
    addBox(mezz, mRug, [30.6, 36.4], [4.6, 4.624], [11.5, 15.0]);                // ковёр (сев.-зап.)
    sofa(33.0, 13.7, Math.PI, 2.6, mSofaB, mCushO);                            // диван у сев. балкона
    armchair(35.7, 13.5, Math.PI, mSofaA, mCushM);
    lowTable(33.6, 12.4, 0, 1.1, 0.6);
    pouf(31.6, 12.6, mSofaA); pouf(35.2, 12.0, mCushM);
    plant(30.9, 11.7, 0.9);
    sofa(39.2, 13.8, Math.PI, 2.4, mSofaC, mCushO);                            // ещё диван у сев. балкона
    armchair(41.6, 13.6, Math.PI, mSofaA, mCushM);
    lowTable(40.2, 12.5, 0, 1.0, 0.6);
    pouf(42.4, 12.5, mSofaB);
    plant(43.8, 14.0, 0.9);
    // центральный кластер у выхода с лестницы
    armchair(32.2, 10.3, 0, mSofaA, mCushO);
    armchair(33.9, 10.3, 0, mSofaB, mCushM);
    lowTable(33.0, 9.2, 0, 0.9, 0.9);
    pouf(35.4, 9.6, mSofaC);
    plant(37.0, 9.6, 1.0); plant(48.2, 12.6, 1.0); plant(48.4, 4.6, 0.9);
    zoneSign('ЛАУНДЖ', 35.6, 8.2, 2.4, '#DD58C5');

    /* свет антресоли */
    pendant(32.0, 6.4); pendant(33.6, 12.6); pendant(40.0, 12.9); pendant(45.5, 6.6, 0xffd0a0);
    const gl1 = new THREE.PointLight(0xff9f6b, 8, 11, 2); gl1.position.set(PX(33), 6.2, PZ(8)); mezz.add(gl1);
    const gl2 = new THREE.PointLight(0x9fb0ff, 7, 11, 2); gl2.position.set(PX(55), 6.2, PZ(8)); mezz.add(gl2);
    const gl3 = new THREE.PointLight(0xff9f6b, 7, 10, 2); gl3.position.set(PX(40), 6.0, PZ(13)); mezz.add(gl3);
    const gl4 = new THREE.PointLight(0xffc9a1, 6, 8, 2);  gl4.position.set(PX(45.5), 5.8, PZ(5)); mezz.add(gl4);
  }
  // лестница на антресоль: прямой марш по западной кромке плиты + поворотная площадка
  function buildStaircase() {
    const x0 = 28.35, x1 = 29.55;
    const N = 16, rise = 4.6 / N, going = 0.33;
    const yTop = 9.55;                        // верх марша (стык с площадкой)
    const yBot = yTop + N * going;            // низ марша у пола ≈ 14.83
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 0, 1);
    // наклонный элемент (косоур / стекло / поручень) вдоль уклона
    function rake(x, y0, h0, y1, h1, sx, sh, mat, cast) {
      _a.set(PX(x), h0, PZ(y0)); _b.set(PX(x), h1, PZ(y1));
      const len = _a.distanceTo(_b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sh, len), mat);
      m.quaternion.setFromUnitVectors(_up, _b.clone().sub(_a).normalize());
      m.position.copy(_a).add(_b).multiplyScalar(0.5);
      m.castShadow = !!cast; m.receiveShadow = true; mezz.add(m);
    }
    // ступени: проступь с носом + закрытый подступёнок + LED-кромка
    for (let i = 0; i < N; i++) {
      const h = (i + 1) * rise;
      const yf = yTop + (N - 1 - i) * going;                                                     // передняя (южная) кромка ступени
      addBox(mezz, M.slabMezz, [x0, x1], [h - 0.06, h], [yf - 0.04, yf + going], true);           // проступь (с носом)
      addBox(mezz, M.dark, [x0, x1], [h - rise, h - 0.06], [yf - 0.01, yf + 0.05], true);          // подступёнок
      addBox(mezz, M.ledMint, [x0 + 0.05, x1 - 0.05], [h, h + 0.013], [yf - 0.045, yf + 0.005]);   // LED-нос
    }
    // косоуры (закрытые боковины — убирают «парящий» вид)
    rake(x0 + 0.06, yBot, -0.02, yTop, 4.55, 0.12, 0.5, M.steelDark, true);
    rake(x1 - 0.06, yBot, -0.02, yTop, 4.55, 0.12, 0.5, M.steelDark, true);
    // стартовая ступень у пола
    addBox(mezz, M.slabMezz, [x0, x1], [0.0, 0.07], [yBot - 0.04, yBot + 0.46], true);
    // поворотная площадка наверху, заподлицо с антресолью
    addBox(mezz, M.slabMezz, [x0, 29.6], [4.5, 4.6], [8.66, yTop + 0.05], true);
    addBox(mezz, M.ledMint, [x0, 29.6], [4.6, 4.613], [8.66, 8.72]);                               // LED-кромка площадки
    // балюстрада по открытой (западной) стороне марша
    rake(x0 - 0.03, yBot, 0.58, yTop, 5.18, 0.02, 0.92, M.rail);                                   // стекло
    rake(x0 - 0.04, yBot, 1.04, yTop, 5.64, 0.055, 0.055, M.steelDark);                            // поручень
    for (let i = 0; i <= N; i += 2) {                                                              // балясины
      const yf = yTop + (N - i) * going, hb = i * rise;
      addCyl(mezz, M.steelDark, 0.016, hb + 0.05, hb + 1.0, x0 - 0.03, yf, false);
    }
    // ограждение площадки: запад + юг (стекло + поручень)
    addBox(mezz, M.rail, [x0 - 0.03, x0 + 0.01], [4.6, 5.5], [8.66, yTop]);
    addBox(mezz, M.steelDark, [x0 - 0.06, x0 + 0.03], [5.5, 5.58], [8.62, yTop + 0.04]);
    addBox(mezz, M.rail, [x0, 29.55], [4.6, 5.5], [8.66, 8.7]);
    addBox(mezz, M.steelDark, [x0 - 0.04, 29.58], [5.5, 5.58], [8.62, 8.72]);
    // ньюэлы (тумбы поручня) внизу и на площадке
    addBox(mezz, M.steelDark, [x0 - 0.09, x0 + 0.03], [0.0, 1.14], [yBot - 0.05, yBot + 0.07], true);
    addBox(mezz, M.steelDark, [x0 - 0.09, x0 + 0.03], [4.6, 5.74], [8.66, 8.78], true);
  }
  buildStaircase();

  /* ============================ ОСВЕЩЕНИЕ-РЕКВИЗИТ (LED 500 лк) ============================ */
  const ledGeo = new THREE.BoxGeometry(2.6, 0.1, 0.5);
  const ledRows = [];
  for (const x of [12, 22, 32, 42, 52]) for (const y of [20.5, 26.5, 32.5]) ledRows.push([x, 7.45, y]); // падел
  for (const x of [5, 12, 19, 26]) for (const y of [4.4, 11.2]) ledRows.push([x, 7.45, y]);             // бадминтон
  for (const x of [33, 39, 45]) for (const y of [8.5, 13.5]) ledRows.push([x, 4.18, y]);                 // под антресолью
  for (const x of [49.5, 52.5]) for (const y of [3.7, 11.85]) ledRows.push([x, 4.18, y]);               // раздевалки
  for (const y of [5.6, 10.3]) ledRows.push([57.3, 4.18, y]);                                           // вестибюль
  for (const y of [1.9, 13.6]) ledRows.push([57, 4.18, y]);                                              // мокрые зоны
  for (const [x, h, y] of ledRows) {
    const m = new THREE.Mesh(ledGeo, M.led);
    m.position.set(PX(x), h, PZ(y)); root.add(m);
  }
  // малиновая LED-линия по коньку
  addBox(root, M.ledMagenta, [0.4, 59.6], [10.18, 10.26], [15.56, 15.64]);

  /* ============================ КРЫША (тоггл) ============================ */
  const roofGroup = new THREE.Group(); root.add(roofGroup);
  const roofMats = [];
  function roofPlane(y0, y1, h0, h1) {
    const len = Math.hypot(y1 - y0, h1 - h0);
    const mat = M.roof.clone(); roofMats.push(mat);
    const m = new THREE.Mesh(new THREE.BoxGeometry(60.8, 0.12, len + 0.5), mat);
    m.position.set(0, (h0 + h1) / 2 + 0.12, (PZ(y0) + PZ(y1)) / 2);
    m.rotation.x = Math.atan2(h0 - h1, y1 - y0);
    m.castShadow = true; m.receiveShadow = true;
    roofGroup.add(m);
  }
  roofPlane(0, 15.6, 8.05, 10.45);
  roofPlane(15.6, 37.8, 10.45, 8.05);
  // карнизная LED-кромка (брендовая «energy frame»)
  const edgeMat = M.ledMagenta.clone(); roofMats.push(edgeMat); neonMats.push({ mat: edgeMat, base: 2.2 });
  for (const seg of [[[-0.4, 60.4], [7.98, 8.1], [-0.45, -0.32]], [[-0.4, 60.4], [7.98, 8.1], [38.12, 38.25]]])
    addBox(roofGroup, edgeMat, seg[0], seg[1], seg[2]);

  return { root, roofGroup, roofMats, neonMats, mezzGroup: mezz, M };
}

/* ============================ ТЕКСТУРЫ ============================ */
function makeGradientTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 256, 512, 0);
  g.addColorStop(0, '#7238E6'); g.addColorStop(0.55, '#DD58C5'); g.addColorStop(1, '#FF8A3D');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx2) => {
    ctx2.fillStyle = 'rgba(255,255,255,0.92)';
    ctx2.font = '110px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText('НАЙТ', 256, 134);
  });
  return tex;
}
function makeSignTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 208;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0B0028'; ctx.fillRect(0, 0, 1024, 208);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx2) => {
    ctx2.fillStyle = '#0B0028'; ctx2.fillRect(0, 0, 1024, 208);
    ctx2.fillStyle = '#FFFFFF';
    ctx2.font = '104px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx2.textAlign = 'right'; ctx2.textBaseline = 'middle';
    ctx2.fillText('БАДМИНТОН', 588, 112);
    ctx2.fillStyle = '#DD58C5';
    ctx2.fillRect(630, 44, 9, 120);
    ctx2.fillStyle = '#FFFFFF';
    ctx2.textAlign = 'left';
    ctx2.fillText('НАЙТ', 682, 112);
  });
  return tex;
}
function makeLabelTexture(text, { bg = '#0B0028', fg = '#FFFFFF', accent = null } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 224;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 224);
    let size = 138;
    const setFont = () => { ctx.font = size + 'px "Bebas Neue", "Arial Narrow", sans-serif'; };
    setFont();
    while (ctx.measureText(text).width > 930 && size > 40) { size -= 6; setFont(); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 108);
    if (accent) { ctx.fillStyle = accent; ctx.fillRect(0, 202, 1024, 22); }
  });
  return tex;
}
function makeNumbersTexture(n, start) {
  const cw = 64;
  const c = document.createElement('canvas'); c.width = n * cw; c.height = 64;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    ctx.fillStyle = '#151037'; ctx.fillRect(0, 0, n * cw, 64);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      if (i) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(i * cw - 1, 10, 2, 44); }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '38px "Bebas Neue", "Arial Narrow", sans-serif';
      ctx.fillText(String(start + i).padStart(2, '0'), i * cw + cw / 2, 34);
    }
  });
  return tex;
}
function makeBoardTexture() {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 560;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    ctx.fillStyle = '#0B0028'; ctx.fillRect(0, 0, 1536, 560);
    const F = (s) => s + 'px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.font = F(60);
    ctx.fillText('СЕГОДНЯ В КЛУБЕ', 48, 72);
    ctx.textAlign = 'right'; ctx.fillStyle = '#DD58C5';
    ctx.fillText('19:05', 1488, 72);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(48, 116, 1440, 3);
    const rows = [
      ['19:00', 'БАДМИНТОН · ГРУППОВАЯ ТРЕНИРОВКА', 'К1–К3'],
      ['19:00', 'ПАДЕЛ · ТРЕНИРОВКА С ТРЕНЕРОМ', 'П2'],
      ['20:30', 'ПАДЕЛ · ИГРОВОЙ ВЕЧЕР КЛУБА', 'П1–П4'],
    ];
    rows.forEach(([t, title, court], i) => {
      const y = 178 + i * 100;
      ctx.textAlign = 'left'; ctx.font = F(58);
      ctx.fillStyle = '#FF8A3D'; ctx.fillText(t, 48, y);
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(title, 248, y);
      ctx.textAlign = 'right'; ctx.fillStyle = '#22E6A8'; ctx.fillText(court, 1488, y);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(48, 460, 1440, 3);
    ctx.textAlign = 'left'; ctx.fillStyle = '#22E6A8'; ctx.font = F(46);
    ctx.fillText('СВОБОДНЫ СЕЙЧАС: БАДМИНТОН — 2 КОРТА · НАСТ. ТЕННИС — 4 СТОЛА', 48, 516);
  });
  return tex;
}
function makeRollupTexture(title, sub1, sub2) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1280;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 160, 1280);
    g.addColorStop(0, '#7238E6'); g.addColorStop(0.6, '#B43FB0'); g.addColorStop(1, '#DD58C5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 1280);
    const F = (s) => s + 'px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = F(36);
    ctx.fillText('КЛУБ «НАЙТ»', 256, 150);
    ctx.fillStyle = '#FFFFFF';
    let size = 124; ctx.font = F(size);
    while (ctx.measureText(title).width > 430 && size > 56) { size -= 6; ctx.font = F(size); }
    ctx.fillText(title, 256, 430);
    ctx.font = F(58);
    ctx.fillText(sub1, 256, 580);
    if (sub2) ctx.fillText(sub2, 256, 660);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(96, 1080, 320, 2);
    ctx.fillStyle = '#FFFFFF'; ctx.font = F(44);
    ctx.fillText('БАДМИНТОН | НАЙТ', 256, 1150);
  });
  return tex;
}
function makeAnalyticsTexture() {
  const c = document.createElement('canvas'); c.width = 1152; c.height = 488;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    ctx.fillStyle = '#0B0028'; ctx.fillRect(0, 0, 1152, 488);
    const g = ctx.createLinearGradient(0, 0, 1152, 488);
    g.addColorStop(0, 'rgba(114,56,230,0.28)'); g.addColorStop(1, 'rgba(221,88,197,0.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1152, 488);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 48; x < 1152; x += 48) ctx.fillRect(x, 0, 1, 488);
    for (let y = 0; y < 488; y += 48) ctx.fillRect(0, y, 1152, 1);
    // заголовок
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF'; ctx.font = '34px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('НАЙТ', 48, 52); ctx.fillStyle = '#DD58C5'; ctx.fillText(' | ', 132, 52);
    ctx.fillStyle = '#FFFFFF'; ctx.fillText('АНАЛИТИКА', 168, 52);
    ctx.fillStyle = '#22E6A8'; ctx.font = '22px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
    ctx.fillText('● LIVE · СЕАНС 14', 1104, 52);
    // KPI плитки
    const kpis = [['СКОРОСТЬ СМЭША', '298', 'км/ч', '#FF8A3D'], ['ТОЧНОСТЬ', '87', '%', '#22E6A8'], ['РАЛЛИ', '24', 'удара', '#44D9FF']];
    kpis.forEach(([t, v, u, col], i) => {
      const x = 48 + i * 250;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, 96, 226, 120);
      ctx.fillStyle = col; ctx.fillRect(x, 96, 6, 120);
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '19px "JetBrains Mono", monospace';
      ctx.fillText(t, x + 24, 124);
      ctx.fillStyle = col; ctx.font = '74px "Bebas Neue", sans-serif'; ctx.fillText(v, x + 22, 178);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '22px "JetBrains Mono", monospace';
      ctx.fillText(u, x + 22 + ctx.measureText(v).width * 1.7 + 14, 188);
    });
    // линейный график
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2;
    ctx.strokeRect(820, 96, 284, 120);
    const pts = [0.3, 0.5, 0.42, 0.66, 0.58, 0.8, 0.72, 0.92];
    ctx.strokeStyle = '#22E6A8'; ctx.lineWidth = 3; ctx.beginPath();
    pts.forEach((p, i) => { const x = 820 + i * (284 / 7), y = 206 - p * 100; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = '#22E6A8';
    pts.forEach((p, i) => { ctx.beginPath(); ctx.arc(820 + i * (284 / 7), 206 - p * 100, 4, 0, 7); ctx.fill(); });
    // столбики нагрузки
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillText('НАГРУЗКА ПО НЕДЕЛЯМ', 48, 268);
    const bars = [0.4, 0.62, 0.55, 0.78, 0.7, 0.88, 0.95, 0.6, 0.72, 0.84, 0.5, 0.9];
    bars.forEach((b, i) => {
      const x = 48 + i * 88, h = b * 150;
      ctx.fillStyle = i === 6 ? '#FF8A3D' : 'rgba(221,88,197,0.85)';
      ctx.fillRect(x, 444 - h, 56, h);
    });
  });
  return tex;
}
function makeTacticsTexture() {
  const c = document.createElement('canvas'); c.width = 760; c.height = 500;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx) => {
    ctx.fillStyle = '#0B0028'; ctx.fillRect(0, 0, 760, 500);
    // корт
    const x0 = 70, y0 = 40, w = 620, h = 420;
    ctx.fillStyle = 'rgba(34,230,168,0.10)'; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    ctx.strokeRect(x0, y0, w, h);
    ctx.beginPath(); ctx.moveTo(x0, y0 + h / 2); ctx.lineTo(x0 + w, y0 + h / 2); ctx.stroke(); // сетка
    ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(x0 + 30, y0 + 60, w - 60, h - 120);
    ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h); ctx.stroke();
    ctx.setLineDash([]);
    // движение волана (стрелки)
    const arrow = (ax, ay, bx, by, col) => {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      const a = Math.atan2(by - ay, bx - ax);
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx - 16 * Math.cos(a - 0.4), by - 16 * Math.sin(a - 0.4));
      ctx.lineTo(bx - 16 * Math.cos(a + 0.4), by - 16 * Math.sin(a + 0.4));
      ctx.fill();
    };
    arrow(200, 360, 540, 130, '#FF8A3D');
    arrow(540, 130, 240, 180, '#DD58C5');
    ctx.fillStyle = '#22E6A8'; ctx.beginPath(); ctx.arc(200, 360, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#44D9FF'; ctx.beginPath(); ctx.arc(540, 130, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '30px "Bebas Neue", sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText('АТАКА · СМЭШ ПО ЛИНИИ', x0, 22);
  });
  return tex;
}
function makeShopPanelTexture() {
  const c = document.createElement('canvas'); c.width = 1280; c.height = 208;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  drawWhenFontReady(c, tex, (ctx2) => {
    const g = ctx2.createLinearGradient(0, 0, 1280, 208);
    g.addColorStop(0, '#7238E6'); g.addColorStop(0.55, '#DD58C5'); g.addColorStop(1, '#FF8A3D');
    ctx2.fillStyle = g; ctx2.fillRect(0, 0, 1280, 208);
    ctx2.fillStyle = 'rgba(11,0,40,0.16)'; ctx2.fillRect(0, 0, 1280, 208);
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#FFFFFF';
    ctx2.font = '118px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx2.textAlign = 'right';
    ctx2.fillText('НАЙТ', 640, 96);
    ctx2.fillStyle = '#0B0028'; ctx2.fillRect(664, 36, 8, 120);
    ctx2.fillStyle = '#FFFFFF'; ctx2.textAlign = 'left';
    ctx2.fillText('PRO-SHOP', 700, 96);
    ctx2.font = '36px "JetBrains Mono", "Bebas Neue", monospace';
    ctx2.textAlign = 'center'; ctx2.fillStyle = 'rgba(255,255,255,0.92)';
    ctx2.fillText('РАКЕТКИ · СТРУНЫ · ВОЛАНЫ · ОБУВЬ · ЭКИПИРОВКА', 640, 178);
  });
  return tex;
}
function drawWhenFontReady(canvas, tex, draw) {
  const ctx = canvas.getContext('2d');
  draw(ctx); tex.needsUpdate = true;
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('120px "Bebas Neue"').then(() => document.fonts.ready).then(() => {
      draw(ctx); tex.needsUpdate = true;
    });
  }
}
