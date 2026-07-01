// night-scene.js — геометрия центра «Найт», версия 4 (тентовый вариант)
// Каркасно-тентовое двухконтурное сооружение: зал 50 × 30 м (≤1500 м²),
// двускатный профиль — карниз (стенка) 8.0 м, конёк 10.6 м (бадминтон ≥9 м).
// Компоновка 4 падел / 3 бадминтон / 3 НТ. Сервис вынесен в капитальную
// пристройку ≈300 м² (раздевалки, ресепшн, pro-shop, серверная, админ).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Плановые координаты: x 0–50 (запад→восток), y 0–30 (юг→север). Конёк по y=15.
// Пристройка — южнее зала (y отрицательные). Центр сцены — центр зала.
const PX = (x) => x - 25;
const PZ = (y) => y - 15;
const HW = 8.0;            // высота по стенке (карниз)
const HR = 10.6;          // высота в коньке
const RIDGE = 15;         // плановая y конька
// высота тентового ската над точкой y
const roofH = (y) => HW + (HR - HW) * (1 - Math.abs(y - RIDGE) / 15);

export function buildScene(scene) {
  const root = new THREE.Group();
  scene.add(root);

  /* ============================ МАТЕРИАЛЫ ============================ */
  const M = {
    ground:    new THREE.MeshStandardMaterial({ color: 0x110b28, roughness: 0.96 }),
    asphalt:   new THREE.MeshStandardMaterial({ color: 0x191333, roughness: 0.95 }),
    slab:      new THREE.MeshStandardMaterial({ color: 0x262047, roughness: 0.92 }),
    steel:     new THREE.MeshStandardMaterial({ color: 0xe9eaf4, roughness: 0.5, metalness: 0.3 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x8f95b8, roughness: 0.35, metalness: 0.8 }),
    // тентовая мембрана (два контура) — полупрозрачная, чуть светящаяся
    tentOut:   new THREE.MeshStandardMaterial({ color: 0xf1ecf8, roughness: 0.82, metalness: 0.0, transparent: true, opacity: 0.66, emissive: 0x2a2247, emissiveIntensity: 0.32, side: THREE.DoubleSide }),
    tentIn:    new THREE.MeshStandardMaterial({ color: 0xe6def2, roughness: 0.9, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
    wall:      new THREE.MeshStandardMaterial({ color: 0xb9c6ff, transparent: true, opacity: 0.14, roughness: 0.2, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    glass:     new THREE.MeshStandardMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.14, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    line:      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    partition: new THREE.MeshStandardMaterial({ color: 0xcdc7ea, roughness: 0.9 }),
    annexWall: new THREE.MeshStandardMaterial({ color: 0x3a3568, roughness: 0.86, metalness: 0.12 }),
    wood:      new THREE.MeshStandardMaterial({ color: 0x8a6347, roughness: 0.8 }),
    net:       new THREE.MeshStandardMaterial({ color: 0x161233, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    mint:      new THREE.MeshStandardMaterial({ color: 0x22e6a8, roughness: 0.7 }),
    orange:    new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.6 }),
    magentaSoft: new THREE.MeshStandardMaterial({ color: 0xc2399f, roughness: 0.8 }),
    dark:      new THREE.MeshStandardMaterial({ color: 0x1c1640, roughness: 0.9 }),
    lockerDoor: new THREE.MeshStandardMaterial({ color: 0x332a68, roughness: 0.65, metalness: 0.15 }),
    lockerFloor: new THREE.MeshStandardMaterial({ color: 0x1e1745, roughness: 0.92 }),
    // покрытия — меняются твиком схемы
    padelTurf: new THREE.MeshStandardMaterial({ color: 0x5e2fd6, roughness: 0.95 }),
    badCourt:  new THREE.MeshStandardMaterial({ color: 0xc2399f, roughness: 0.9 }),
    ttFloor:   new THREE.MeshStandardMaterial({ color: 0x382a6e, roughness: 0.92 }),
    ttTop:     new THREE.MeshStandardMaterial({ color: 0x4a1dad, roughness: 0.6 }),
    // неон / эмиссия
    led:       new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6 }),
    ledMagenta: new THREE.MeshStandardMaterial({ color: 0xdd58c5, emissive: 0xdd58c5, emissiveIntensity: 2.2 }),
    ledOrange: new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff8a3d, emissiveIntensity: 1.4 }),
    ledMint:   new THREE.MeshStandardMaterial({ color: 0x22e6a8, emissive: 0x22e6a8, emissiveIntensity: 1.6 }),
    ledCyan:   new THREE.MeshStandardMaterial({ color: 0x44d9ff, emissive: 0x44d9ff, emissiveIntensity: 1.8 }),
  };
  const neonMats = [
    { mat: M.led, base: 1.6 },
    { mat: M.ledMagenta, base: 2.2 },
    { mat: M.ledOrange, base: 1.4 },
    { mat: M.ledMint, base: 1.6 },
    { mat: M.ledCyan, base: 1.8 },
  ];

  /* ============================ ХЕЛПЕРЫ ============================ */
  function addBox(parent, mat, xr, hr, yr, cast = false) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(xr[1] - xr[0], hr[1] - hr[0], yr[1] - yr[0]), mat);
    m.position.set((xr[0] + xr[1]) / 2 - 25, (hr[0] + hr[1]) / 2, (yr[0] + yr[1]) / 2 - 15);
    m.castShadow = cast; m.receiveShadow = true;
    parent.add(m); return m;
  }
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
  const matFoliage = new THREE.MeshStandardMaterial({ color: 0x1f9e6e, roughness: 0.85 });
  function plant(cx, cy, s = 1) {
    addCyl(root, M.dark, 0.17 * s, 0.05, 0.4 * s, cx, cy, true);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.26 * s, 12, 10), matFoliage);
    f.scale.set(1, 1.35, 1); f.position.set(PX(cx), 0.4 * s + 0.22, PZ(cy)); f.castShadow = true; root.add(f);
    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.17 * s, 10, 8), matFoliage);
    f2.position.set(PX(cx) + 0.12, 0.4 * s + 0.06, PZ(cy) + 0.06); root.add(f2);
  }

  /* ============================ УЧАСТОК ============================ */
  addBox(root, M.ground, [-80, 80], [-0.32, -0.12], [-70, 60]);
  // парковка с юга (со стороны входа/пристройки)
  addBox(root, M.asphalt, [-2, 50], [-0.1, -0.04], [-34, -20]);
  for (let i = 0; i <= 14; i++) addLine(root, 1 + i * 3.2, -33, 1 + i * 3.2, -28, -0.03, 0.1);
  // подъездная площадка перед пристройкой
  addBox(root, M.slab, [9, 41], [-0.06, 0.02], [-15.5, -13]);

  /* ============================ ПЛИТА ПОЛА ЗАЛА ============================ */
  addBox(root, M.slab, [0, 50], [-0.12, 0.02], [0, 30]);

  /* ============================ ТЕНТОВЫЙ КАРКАС (клир-спан 30 м) ============================
     Рамы по оси x; каждая — двускатная ферма от карниза (y=0,h8) к коньку (y=15,h10.6)
     и обратно к карнизу (y=30,h8). Внутренних колонн нет — чистый пролёт. */
  const colXs = [0.3, 7.1, 13.9, 20.7, 27.5, 34.3, 41.1, 49.7];
  const colGeos = [];
  for (const x of colXs) for (const y of [0.2, 29.8]) {
    const g = new THREE.BoxGeometry(0.34, HW, 0.34);
    g.translate(PX(x), HW / 2, PZ(y));
    colGeos.push(g);
  }
  const columns = new THREE.Mesh(mergeGeometries(colGeos), M.steel);
  columns.castShadow = true; columns.receiveShadow = true; root.add(columns);

  // решётчатая двускатная ферма в плоскости Y-Z на позиции xPos
  function trussGeos(xPos) {
    const geos = [];
    const xs = PX(xPos);
    const bot = 7.1;                                   // нижний пояс (затяжка) — горизонт у карниза
    const member = (ay, ah, by, bh, t) => {
      const ax = xs, az = PZ(ay), bx = xs, bz = PZ(by);
      const len = Math.hypot(0, bh - ah, bz - az);
      const g = new THREE.BoxGeometry(t, len, t);
      g.translate(0, len / 2, 0);
      const dir = new THREE.Vector3(0, bh - ah, bz - az).normalize();
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
      g.translate(ax, ah, az);
      geos.push(g);
    };
    const seg = 2.5, n = Math.round(30 / seg);
    for (let i = 0; i < n; i++) {
      const ya = i * seg, yb = (i + 1) * seg;
      member(ya, roofH(ya) - 0.07, yb, roofH(yb) - 0.07, 0.15);   // верхний пояс (стропило)
      if (ya >= 0 && yb <= 30) member(ya, bot, yb, bot, 0.13);    // нижний пояс
      member(ya, bot, ya, roofH(ya) - 0.07, 0.09);                // стойка
      member(ya, bot, yb, roofH(yb) - 0.07, 0.08);                // раскос
    }
    member(30, bot, 30, roofH(30) - 0.07, 0.09);
    return geos;
  }
  const allTruss = [];
  for (const x of colXs) allTruss.push(...trussGeos(x));
  const trusses = new THREE.Mesh(mergeGeometries(allTruss), M.steel);
  trusses.receiveShadow = true; root.add(trusses);
  // прогоны вдоль конька и карнизов
  for (const [y, h] of [[15, HR - 0.12], [0.2, HW - 0.1], [29.8, HW - 0.1]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(50.4, 0.12, 0.12), M.steelDark);
    m.position.set(0, h, PZ(y)); root.add(m);
  }

  /* ============================ СТЕНЫ-МЕМБРАНА ЗАЛА ============================ */
  const t = 0.16;
  // длинные боковые (карнизные) стены — юг (вход) и север
  addBox(root, M.wall, [0, 50], [0.4, HW], [0, t]);            // юг (с проёмом входа — см. ниже)
  addBox(root, M.wall, [0, 50], [0.4, HW], [30 - t, 30]);      // север
  // торцевые (фронтонные) вертикальные стены до карниза
  addBox(root, M.wall, [0, t], [0.4, HW], [0, 30]);            // запад
  addBox(root, M.wall, [50 - t, 50], [0.4, HW], [0, 30]);      // восток
  // цоколь по периметру
  for (const seg of [[[0, 50], [0, 0.45], [0, 0.2]], [[0, 50], [0, 0.45], [29.8, 30]], [[0, 0.2], [0, 0.45], [0, 30]], [[49.8, 50], [0, 0.45], [0, 30]]])
    addBox(root, M.dark, seg[0], seg[1], seg[2]);
  // проём входа в южной стене (x 30–38) — стеклянная витражная группа
  addBox(root, M.glass, [30, 38], [0.4, 3.4], [-0.02, 0.06]);
  addBox(root, M.steelDark, [33.9, 34.1], [0.4, 3.45], [-0.05, 0.09], true);
  addBox(root, M.steelDark, [29.9, 30.1], [0.4, 3.45], [-0.05, 0.09], true);
  addBox(root, M.steelDark, [37.9, 38.1], [0.4, 3.45], [-0.05, 0.09], true);

  /* ============================ ПАДЕЛ ×4 (панорамик 20×10, длина по X) ============================ */
  function padelCourt(x0, y0, turfMat) {
    const g = new THREE.Group(); root.add(g);
    const x1 = x0 + 20, y1 = y0 + 10, net = x0 + 10, L = 0.082;
    addBox(g, turfMat, [x0, x1], [0.02, 0.07], [y0, y1]);
    // линии: подачи (net±6.95, поперёк ширины) + центральная (вдоль X между линиями подачи)
    addLine(g, net - 6.95, y0 + 0.1, net - 6.95, y1 - 0.1, L);
    addLine(g, net + 6.95, y0 + 0.1, net + 6.95, y1 - 0.1, L);
    addLine(g, net - 6.95, (y0 + y1) / 2, net + 6.95, (y0 + y1) / 2, L);
    // стеклянные стены h3 (панорамик) + рамка-сталь
    addBox(g, M.glass, [x0 - 0.04, x0 + 0.01], [0.07, 3.07], [y0, y1]);
    addBox(g, M.glass, [x1 - 0.01, x1 + 0.04], [0.07, 3.07], [y0, y1]);
    addBox(g, M.glass, [x0, x1], [0.07, 3.07], [y0 - 0.04, y0 + 0.01]);
    addBox(g, M.glass, [x0, x1], [0.07, 3.07], [y1 - 0.01, y1 + 0.04]);
    for (let i = 0; i <= 8; i++) {                                // стойки вдоль длинных сторон
      const x = x0 + (20 * i) / 8;
      addBox(g, M.steelDark, [x - 0.045, x + 0.045], [0.07, 3.1], [y0 - 0.045, y0 + 0.045], true);
      addBox(g, M.steelDark, [x - 0.045, x + 0.045], [0.07, 3.1], [y1 - 0.045, y1 + 0.045], true);
    }
    for (let i = 1; i < 4; i++) {                                // стойки на торцах
      const y = y0 + (10 * i) / 4;
      addBox(g, M.steelDark, [x0 - 0.045, x0 + 0.045], [0.07, 3.1], [y - 0.045, y + 0.045]);
      addBox(g, M.steelDark, [x1 - 0.045, x1 + 0.045], [0.07, 3.1], [y - 0.045, y + 0.045]);
    }
    // сетка поперёк (вдоль Y) на середине длины
    addBox(g, M.net, [net - 0.012, net + 0.012], [0.07, 0.92], [y0 + 0.12, y1 - 0.12]);
    addBox(g, M.line, [net - 0.02, net + 0.02], [0.92, 0.99], [y0 + 0.12, y1 - 0.12]);
    addCyl(g, M.steelDark, 0.05, 0.07, 1.05, net, y0 + 0.07);
    addCyl(g, M.steelDark, 0.05, 0.07, 1.05, net, y1 - 0.07);
  }
  padelCourt(1, 19.5, M.padelTurf);     // ПАДЕЛ 1 (С-З)
  padelCourt(21.4, 19.5, M.padelTurf);  // ПАДЕЛ 2 (С-В)
  padelCourt(1, 0.5, M.padelTurf);      // ПАДЕЛ 3 (Ю-З)
  padelCourt(21.4, 0.5, M.padelTurf);   // ПАДЕЛ 4 (Ю-В)

  /* ============================ БАДМИНТОН ×3 (длина 13.4 по X, центр зала) ============================ */
  // единый мат зоны (3 корта вплотную) + по-кортовая разметка сверху
  addBox(root, M.badCourt, [0.4, 41.0], [0.02, 0.05], [11.2, 18.8]);
  function badmintonCourt(cx, cy) {
    const g = new THREE.Group(); root.add(g);
    const hw = 6.7, hh = 3.05, x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh, net = cx, L = 0.06;
    addLine(g, x0, y0, x1, y0, L); addLine(g, x0, y1, x1, y1, L);
    addLine(g, x0, y0, x0, y1, L); addLine(g, x1, y0, x1, y1, L);
    addLine(g, x0, y0 + 0.46, x1, y0 + 0.46, L); addLine(g, x0, y1 - 0.46, x1, y1 - 0.46, L); // одиночные
    addLine(g, net - 1.98, y0, net - 1.98, y1, L); addLine(g, net + 1.98, y0, net + 1.98, y1, L); // короткая подача
    addLine(g, x0 + 0.76, y0, x0 + 0.76, y1, L); addLine(g, x1 - 0.76, y0, x1 - 0.76, y1, L);     // длинная подача
    addLine(g, x0, cy, net - 1.98, cy, L); addLine(g, net + 1.98, cy, x1, cy, L);                 // центральная
    // сетка вдоль Y на середине длины
    addBox(g, M.net, [net - 0.012, net + 0.012], [0.82, 1.52], [y0 - 0.05, y1 + 0.05]);
    addBox(g, M.line, [net - 0.02, net + 0.02], [1.52, 1.57], [y0 - 0.05, y1 + 0.05]);
    addCyl(g, M.steelDark, 0.045, 0.05, 1.57, net, y0 - 0.08, true);
    addCyl(g, M.steelDark, 0.045, 0.05, 1.57, net, y1 + 0.08, true);
  }
  badmintonCourt(7.5, 15);   // БАДМ 1
  badmintonCourt(20.7, 15);  // БАДМ 2
  badmintonCourt(33.9, 15);  // БАДМ 3

  /* ============================ НАСТОЛЬНЫЙ ТЕННИС ×3 (гибкая зона, восток) ============================ */
  addBox(root, M.ttFloor, [41.6, 49.7], [0.02, 0.045], [0.4, 29.6]);
  function ttTable(cx, cy) {
    const g = new THREE.Group(); root.add(g);
    // разметка игрового пространства стола (бокс по полу)
    addLine(g, cx - 2.4, cy - 4.0, cx + 2.4, cy - 4.0, 0.05, 0.05);
    addLine(g, cx - 2.4, cy + 4.0, cx + 2.4, cy + 4.0, 0.05, 0.05);
    addLine(g, cx - 2.4, cy - 4.0, cx - 2.4, cy + 4.0, 0.05, 0.05);
    addLine(g, cx + 2.4, cy - 4.0, cx + 2.4, cy + 4.0, 0.05, 0.05);
    // стол: длина 2.74 по Y, ширина 1.525 по X
    addBox(g, M.ttTop, [cx - 0.7625, cx + 0.7625], [0.72, 0.76], [cy - 1.37, cy + 1.37], true);
    addLine(g, cx, cy - 1.37, cx, cy + 1.37, 0.76, 0.035);        // центральная линия стола
    for (const dx of [-0.55, 0.55]) for (const dy of [-1.05, 1.05])
      addBox(g, M.steelDark, [cx + dx - 0.03, cx + dx + 0.03], [0.05, 0.72], [cy + dy - 0.03, cy + dy + 0.03]);
    // сетка поперёк (вдоль X) на середине стола
    addBox(g, M.net, [cx - 0.85, cx + 0.85], [0.76, 0.915], [cy - 0.012, cy + 0.012]);
  }
  ttTable(45.85, 24.3);  // НТ 1 (север)
  ttTable(45.85, 15.0);  // НТ 2 (центр)
  ttTable(45.85, 5.7);   // НТ 3 (юг)
  // подпись «гибкая зона»
  addPlane(root, makeLabelTexture('НАСТОЛЬНЫЙ ТЕННИС · ГИБКАЯ ЗОНА', { accent: '#FF8A3D' }), 3.2, 0.7, 45.8, 3.2, 29.55, Math.PI, 0.95);

  /* ============================ ВХОДНАЯ ГРУППА (южный фасад) ============================ */
  addBox(root, M.dark, [29, 39], [3.5, 3.72], [-3.4, 0.2], true);          // козырёк
  addBox(root, M.ledMagenta, [29, 39], [3.52, 3.68], [-3.42, -3.36]);      // LED-кромка козырька
  addCyl(root, M.steelDark, 0.08, 0.0, 3.5, 29.6, -3.2, true);
  addCyl(root, M.steelDark, 0.08, 0.0, 3.5, 38.4, -3.2, true);
  // вывеска над входом
  const signTex = makeSignTexture();
  const mSign = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.15 });
  neonMats.push({ mat: mSign, base: 1.15 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.5, 0.18), mSign);
  sign.position.set(PX(34), 4.6, PZ(-0.05)); root.add(sign);

  /* ============================ КАПИТАЛЬНАЯ ПРИСТРОЙКА ≈300 м² (юг) ============================
     6 помещений в ряд (z −13…−3, 10 м глубиной): раздевалка М, раздевалка Ж,
     ресепшн/ожидание, pro-shop, серверная, админ/тренерская. Связь с залом — остеклённый
     переход x 28–38, y −3…0. Плоская капитальная кровля h 3.6. */
  // группа кровли создаётся заранее: в неё попадает и плоская кровля пристройки,
  // чтобы тот же тоггл «крыша» открывал интерьеры пристройки сверху
  const roofGroup = new THREE.Group(); root.add(roofGroup);
  const roofMats = [];
  buildAnnex();
  function buildAnnex() {
    const A = new THREE.Group(); root.add(A);
    const yN = -3, yS = -13, h = 3.6, w = 0.16;          // север/юг пристройки, высота, толщина стен
    // плита пола
    addBox(A, M.lockerFloor, [10, 40], [-0.1, 0.02], [yS, yN]);
    // наружные стены (капитальные)
    // южная (уличная) стена с проёмом под входную витражную группу ресепшна (x 22.6–26.4)
    addBox(A, M.annexWall, [10, 22.6], [0.0, h], [yS - w, yS], true);        // юг (улица) — левее входа
    addBox(A, M.annexWall, [26.4, 40], [0.0, h], [yS - w, yS], true);        // юг (улица) — правее входа
    addBox(A, M.annexWall, [22.6, 26.4], [2.9, h], [yS - w, yS], true);      // перемычка над витражом входа
    addBox(A, M.annexWall, [10, 10 + w], [0.0, h], [yS, yN], true);          // запад
    addBox(A, M.annexWall, [40 - w, 40], [0.0, h], [yS, yN], true);          // восток
    // северная стена с проёмом перехода (x 28–38)
    addBox(A, M.annexWall, [10, 28], [0.0, h], [yN - w, yN], true);
    addBox(A, M.annexWall, [38, 40], [0.0, h], [yN - w, yN], true);
    // плоская кровля (в группе кровли — снимается тем же тогглом)
    const annexRoofMat = M.dark.clone(); annexRoofMat.transparent = true; annexRoofMat.userData.baseOpacity = 1; roofMats.push(annexRoofMat);
    addBox(roofGroup, annexRoofMat, [9.9, 40.1], [h, h + 0.16], [yS - w - 0.1, yN + 0.1]);
    addBox(roofGroup, M.ledMagenta, [9.9, 40.1], [h + 0.02, h + 0.12], [yN + 0.04, yN + 0.1]);

    // межкомнатные перегородки: x = 16, 22, 27, 32, 35
    const partX = [16, 22, 27, 32, 35];
    for (const px of partX) addBox(A, M.partition, [px - 0.06, px + 0.06], [0.0, h], [yS, yN], true);
    // внутренний коридор-связка по северной кромке (y −4…−3) — единый «тёплый» путь
    addBox(A, M.lockerFloor, [10, 38], [0.02, 0.05], [yN - 1.0, yN]);
    addBox(A, M.ledMagenta, [10.2, 37.8], [0.05, 0.056], [yN - 0.55, yN - 0.5]);

    // ── переход зал↔пристройка (остеклённый тамбур) ──
    addBox(A, M.glass, [28, 38], [0.4, 3.0], [yN - 0.02, yN + 0.04]);
    addBox(A, M.lockerFloor, [28, 38], [0.0, 0.04], [yN, 0]);
    addBox(A, M.glass, [28, 28.05], [0.4, 3.2], [yN, 0]);
    addBox(A, M.glass, [37.95, 38], [0.4, 3.2], [yN, 0]);
    addBox(A, M.dark, [28, 38], [3.2, 3.36], [yN, 0]);                       // перекрытие тамбура
    addPlane(A, makeLabelTexture('К КОРТАМ →', { accent: '#22E6A8' }), 1.7, 0.37, 33, 2.7, -0.3, 0, 1.05);

    /* ── общий хелпер дверного проёма в перегородке (в коридор, y≈yN−0.5) ── */
    function doorTag(text, cx, accent) {
      addPlane(A, makeLabelTexture(text, { accent }), 1.8, 0.39, cx, 2.55, yN - 0.04, Math.PI, 0.95);
    }

    /* ═════════ 1 · РАЗДЕВАЛКА М + ДУШЕВЫЕ (x 10–16) ═════════ */
    /* ═════════ 2 · РАЗДЕВАЛКА Ж + ДУШЕВЫЕ (x 16–22) ═════════ */
    let lockerNo = 1;
    function lockerRun(xa, xb, yy, faceNorth) {
      // ряд шкафчиков вдоль линии y=yy, дверцы смотрят на ±Z
      addBox(A, M.dark, [xa, xb], [0.05, 2.0], [yy - 0.22, yy + 0.22], true);
      const fy = faceNorth ? yy + 0.22 : yy - 0.22;
      const n = Math.floor((xb - xa - 0.06) / 0.42);
      const pad = (xb - xa - n * 0.42) / 2;
      const doorGeos = [];
      for (let i = 0; i < n; i++) {
        const dx0 = xa + pad + i * 0.42 + 0.028, dx1 = xa + pad + (i + 1) * 0.42 - 0.028;
        for (const hr of [[0.14, 0.94], [1.02, 1.82]]) {
          const gg = new THREE.BoxGeometry(dx1 - dx0, hr[1] - hr[0], 0.035);
          gg.translate((dx0 + dx1) / 2 - 25, (hr[0] + hr[1]) / 2, PZ(fy));
          doorGeos.push(gg);
        }
      }
      const doors = new THREE.Mesh(mergeGeometries(doorGeos), M.lockerDoor);
      doors.castShadow = true; doors.receiveShadow = true; A.add(doors);
      const tex = makeNumbersTexture(n, lockerNo); lockerNo += n;
      addPlane(A, tex, n * 0.42, 0.17, (xa + xb) / 2, 1.95, fy + (faceNorth ? 0.022 : -0.022), faceNorth ? 0 : Math.PI, 0.45);
    }
    function bench(xa, xb, yy) {
      addBox(A, M.wood, [xa, xb], [0.42, 0.5], [yy - 0.18, yy + 0.18], true);
      for (const lx of [xa + 0.12, xb - 0.12]) addBox(A, M.dark, [lx - 0.03, lx + 0.03], [0.05, 0.42], [yy - 0.12, yy + 0.12]);
    }
    function showers(xa, xb, yWall) {
      // 3 душевые кабины у южной стены раздевалки
      const n = 3, step = (xb - xa) / n;
      for (let i = 0; i < n; i++) {
        const x0 = xa + i * step + 0.08, x1 = xa + (i + 1) * step - 0.08;
        addBox(A, M.mint, [x0 + 0.06, x1 - 0.06], [0.04, 0.07], [yWall + 0.1, yWall + 0.95]);   // поддон
        addBox(A, M.glass, [x0, x0 + 0.03], [0.05, 2.0], [yWall, yWall + 0.95]);                // боковина
        addCyl(A, M.steelDark, 0.05, 1.95, 2.12, (x0 + x1) / 2, yWall + 0.18);                  // лейка
      }
      addBox(A, M.glass, [xb - 0.03, xb], [0.05, 2.0], [yWall, yWall + 0.95]);
      addBox(A, M.lockerFloor, [xa, xb], [0.05, 2.0], [yWall - 0.02, yWall + 0.04], true);       // тёмная плитка
    }
    function changeRoom(xa, xb, label, accent) {
      lockerRun(xa + 0.35, xb - 0.35, yS + 0.55, true);    // шкафчики у южной зоны (фронт на север)
      bench((xa + xb) / 2 - 1.4, (xa + xb) / 2 + 1.4, yS + 2.0);
      showers(xa + 0.25, xb - 0.25, yS + 0.12);
      // санузел-кабина в углу
      addBox(A, M.lockerDoor, [xb - 1.2, xb - 0.1], [0.05, 2.0], [yN - 1.3, yN - 1.26], true);
      addBox(A, M.lockerDoor, [xb - 1.2, xb - 1.16], [0.05, 2.0], [yN - 2.4, yN - 1.26], true);
      addBox(A, M.line, [xb - 1.0, xb - 0.3], [0.05, 0.42], [yN - 2.1, yN - 1.6], true);          // унитаз
      doorTag(label, (xa + xb) / 2, accent);
    }
    changeRoom(10, 16, 'РАЗДЕВАЛКА М', '#44D9FF');
    changeRoom(16, 22, 'РАЗДЕВАЛКА Ж', '#DD58C5');

    /* ═════════ 3 · РЕСЕПШН / ОЖИДАНИЕ (x 22–27) — главный вход с улицы ═════════ */
    (() => {
      const cx = 24.5;
      // входная витражная группа в южной (уличной) стене
      addBox(A, M.glass, [22.6, 26.4], [0.4, 2.9], [yS - 0.02, yS + 0.04]);
      addBox(A, M.steelDark, [24.4, 24.6], [0.4, 2.95], [yS - 0.05, yS + 0.08], true);
      // стойка администратора (фронт на юг, к входу) — в глубине зоны, чтобы был «подход»
      addBox(A, M.dark, [23.3, 25.7], [0.05, 1.0], [yS + 3.6, yS + 4.1], true);
      addBox(A, M.orange, [23.2, 25.8], [1.0, 1.08], [yS + 3.55, yS + 4.15], true);
      addBox(A, M.ledMagenta, [23.3, 25.7], [0.62, 0.68], [yS + 3.55, yS + 3.554]);
      addCyl(A, M.dark, 0.22, 0.06, 0.1, cx, yS + 4.55);
      addCyl(A, M.steelDark, 0.03, 0.1, 0.5, cx, yS + 4.55);
      addBox(A, M.magentaSoft, [cx - 0.2, cx + 0.2], [0.5, 0.58], [yS + 4.38, yS + 4.78], true);
      // бренд-стена за стойкой (вывеска + табло фронтом на юг — к входящим)
      addBox(A, M.dark, [22.7, 26.3], [0.4, 2.95], [yS + 4.6, yS + 4.66], true);
      addBox(A, M.ledMagenta, [22.7, 26.3], [2.9, 2.95], [yS + 4.57, yS + 4.59]);
      addPlane(A, makeSignTexture(), 3.0, 0.6, cx, 2.05, yS + 4.585, Math.PI, 1.1);    // вывеска
      addPlane(A, makeBoardTexture(), 2.4, 0.88, cx, 1.12, yS + 4.585, Math.PI, 1.15);  // табло занятий
      // зона ожидания: диван + столик (север зоны)
      addBox(A, M.magentaSoft, [22.5, 24.3], [0.16, 0.44], [yN - 1.9, yN - 1.1], true);
      addBox(A, M.magentaSoft, [22.5, 24.3], [0.44, 0.92], [yN - 1.18, yN - 1.02], true);
      addCyl(A, M.wood, 0.34, 0.34, 0.4, 25.2, yN - 1.5, true);
      plant(26.4, yN - 0.7, 0.9);
      // подвесные светильники над стойкой
      for (const py of [yS + 3.8, yS + 4.9]) {
        addCyl(A, M.led, 0.12, 2.3, 2.42, cx, py);
        const pl = new THREE.PointLight(0xffd6ac, 5.5, 6, 2); pl.position.set(PX(cx), 2.2, PZ(py)); A.add(pl);
      }
      doorTag('РЕСЕПШН · ОЖИДАНИЕ', cx, '#DD58C5');
    })();

    /* ═════════ 4 · PRO-SHOP (x 27–32) ═════════ */
    (() => {
      const PAL = [0xdd58c5, 0x22e6a8, 0xff8a3d, 0x44d9ff, 0x7238e6, 0xeef0ff];
      const fab = (i) => new THREE.MeshStandardMaterial({ color: PAL[((i % PAL.length) + PAL.length) % PAL.length], roughness: 0.82 });
      const matPeg = new THREE.MeshStandardMaterial({ color: 0x16103a, roughness: 0.9 });
      const matShelf = new THREE.MeshStandardMaterial({ color: 0x2a2152, roughness: 0.7, metalness: 0.18 });
      const matCounter = new THREE.MeshStandardMaterial({ color: 0x191338, roughness: 0.45, metalness: 0.32 });
      const stringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.6, side: THREE.DoubleSide, depthWrite: false });
      addBox(A, matCounter, [27.2, 31.8], [0.02, 0.06], [yS, yN]);
      function racket(x, hC, y, rot, ci, scale = 1) {
        const g = new THREE.Group();
        const fm = new THREE.MeshStandardMaterial({ color: PAL[ci % PAL.length], roughness: 0.36, metalness: 0.45 });
        const head = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.009, 8, 30), fm);
        head.scale.set(1, 1.3, 1); head.position.y = 0.5; head.castShadow = true; g.add(head);
        const str = new THREE.Mesh(new THREE.CircleGeometry(0.092, 26), stringMat);
        str.scale.set(1, 1.3, 1); str.position.set(0, 0.5, 0.001); g.add(str);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.32, 8), fm);
        shaft.position.y = 0.2; g.add(shaft);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.15, 12), M.dark);
        grip.position.y = 0.085; grip.castShadow = true; g.add(grip);
        g.scale.setScalar(scale); g.rotation.set(0, rot, 0); g.position.set(PX(x), hC, PZ(y));
        A.add(g);
      }
      // пегборд с ракетками (западная стена)
      addBox(A, matPeg, [27.25, 27.33], [0.6, 2.4], [yS + 0.4, yS + 3.2], false);
      addBox(A, M.ledMagenta, [27.25, 27.33], [2.38, 2.41], [yS + 0.4, yS + 3.2]);
      for (let i = 0; i < 6; i++) racket(27.45, 1.5, yS + 0.7 + i * 0.45, -Math.PI / 2, [0, 1, 2, 3, 5, 4][i]);
      // стеллаж (восточная стена) — обувь/одежда
      addBox(A, matPeg, [31.7, 31.78], [0.05, 2.0], [yS + 0.4, yN - 0.4], true);
      for (const hh of [0.5, 1.0, 1.5]) addBox(A, matShelf, [31.2, 31.7], [hh, hh + 0.04], [yS + 0.4, yN - 0.4], true);
      for (let s = 0; s < 4; s++) addBox(A, fab(s + 1), [31.25, 31.62], [1.04, 1.18], [yS + 0.7 + s * 0.6, yS + 1.2 + s * 0.6], true);
      // витрина-остров + касса
      addBox(A, matCounter, [28.6, 30.4], [0.05, 0.9], [yN - 1.5, yN - 0.7], true);
      addBox(A, M.glass, [28.58, 30.42], [0.9, 1.16], [yN - 1.52, yN - 0.68]);
      racket(29.1, 0.93, yN - 1.1, 0.15, 0); racket(29.6, 0.93, yN - 1.1, -0.1, 2); racket(30.1, 0.93, yN - 1.1, 0.1, 3);
      addBox(A, matCounter, [27.4, 28.8], [0.05, 1.0], [yN - 2.6, yN - 1.9], true);   // касса
      addBox(A, M.orange, [27.35, 28.85], [1.0, 1.08], [yN - 2.65, yN - 1.85], true);
      addBox(A, M.ledMagenta, [27.4, 28.8], [0.55, 0.62], [yN - 1.9, yN - 1.896]);
      // брендовая панель
      addBox(A, M.dark, [27.4, 31.6], [2.2, 2.95], [yN - 0.1, yN - 0.04], true);
      addPlane(A, makeShopPanelTexture(), 3.8, 0.6, 29.5, 2.58, yN - 0.03, 0, 1.15);
      const sl = new THREE.PointLight(0xffd0b0, 13, 9, 2); sl.position.set(PX(29.5), 3.0, PZ(yN - 1.4)); A.add(sl);
      doorTag('PRO-SHOP', 29.5, '#FF8A3D');
    })();

    /* ═════════ 5 · СЕРВЕРНАЯ + УЗЕЛ СВЯЗИ (x 32–35) ═════════ */
    (() => {
      const mRack = new THREE.MeshStandardMaterial({ color: 0x0c0a22, roughness: 0.5, metalness: 0.4 });
      const mVent = new THREE.MeshStandardMaterial({ color: 0x05040f, roughness: 0.85 });
      addBox(A, new THREE.MeshStandardMaterial({ color: 0x10122e, roughness: 0.7, metalness: 0.3 }), [32.1, 34.9], [0.02, 0.06], [yS, yN]);
      const dotCols = [M.ledMint, M.ledCyan, M.ledOrange];
      function rack(x0, x1, yy) {
        addBox(A, mRack, [x0, x1], [0.05, 2.05], [yy, yy + 0.7], true);
        addBox(A, mVent, [x1 - 0.005, x1 + 0.01], [0.12, 1.98], [yy + 0.05, yy + 0.65]);
        for (let i = 0; i < 9; i++) addBox(A, dotCols[i % 3], [x1 + 0.008, x1 + 0.022], [0.4 + i * 0.18, 0.45 + i * 0.18], [yy + 0.1, yy + 0.16]);
      }
      for (let i = 0; i < 3; i++) rack(32.4, 33.1, yS + 0.5 + i * 1.0);   // ряд A
      for (let i = 0; i < 3; i++) rack(33.9, 34.6, yS + 0.5 + i * 1.0);   // ряд B
      addBox(A, M.ledCyan, [33.15, 33.85], [0.081, 0.09], [yS + 0.5, yS + 3.5]);  // холодный коридор
      // прецизионный кондиционер + ИБП
      addBox(A, mRack, [34.5, 34.85], [0.05, 2.0], [yN - 1.3, yN - 0.5], true);
      addBox(A, M.ledCyan, [34.46, 34.5], [1.9, 1.95], [yN - 1.2, yN - 0.6]);
      addBox(A, mRack, [32.3, 33.0], [0.05, 1.8], [yN - 1.2, yN - 0.5], true);
      addBox(A, M.ledOrange, [32.3, 33.0], [1.4, 1.46], [yN - 1.24, yN - 1.2]);
      doorTag('СЕРВЕРНАЯ · СВЯЗЬ', 33.5, '#44D9FF');
    })();

    /* ═════════ 6 · АДМИН / ТРЕНЕРСКАЯ / ПОДСОБНЫЕ (x 35–40) ═════════ */
    (() => {
      const mTech = new THREE.MeshStandardMaterial({ color: 0x171134, roughness: 0.85, metalness: 0.2 });
      addBox(A, mTech, [35.1, 39.9], [0.02, 0.06], [yS, yN]);
      function desk(cx, cy, rot) {
        const g = new THREE.Group(); g.position.set(PX(cx), 0, PZ(cy)); g.rotation.y = rot; A.add(g);
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.66), M.wood); top.position.y = 0.74; top.castShadow = true; g.add(top);
        const pan = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.66, 0.04), M.dark); pan.position.set(0, 0.4, -0.31); g.add(pan);
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.04), M.dark); scr.position.set(0, 1.04, -0.06); g.add(scr);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 0.02), M.ledMint); face.position.set(0, 1.04, -0.04); g.add(face);
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), M.dark); chair.position.set(0, 0.46, 0.5); g.add(chair);
        const cback = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.08), M.dark); cback.position.set(0, 0.69, 0.71); g.add(cback);
      }
      desk(36.4, yS + 1.3, 0);
      desk(38.6, yS + 1.3, 0);
      // шкаф + стеллаж тренерского инвентаря
      addBox(A, M.dark, [35.3, 36.0], [0.05, 2.0], [yN - 1.0, yN - 0.2], true);
      addBox(A, M.dark, [38.9, 39.7], [0.05, 1.6], [yN - 1.0, yN - 0.2], true);
      for (let i = 0; i < 4; i++) addBox(A, [M.magentaSoft, M.mint, M.orange, M.led][i], [38.95, 39.65], [0.4 + i * 0.36, 0.44 + i * 0.36], [yN - 0.95, yN - 0.25]);
      plant(37.6, yN - 0.7, 0.85);
      doorTag('АДМИН · ТРЕНЕРСКАЯ', 37.5, '#22E6A8');
    })();

    // локальный свет пристройки
    for (const [x, c, li] of [[13, 0x9fc4ff, 16], [19, 0xdd9fd0, 16], [24.5, 0xffc9a1, 18], [29.5, 0xffd0b0, 14], [33.5, 0x9fe6ff, 12], [37.5, 0xbfc4ff, 14]]) {
      const l = new THREE.PointLight(c, li, 12, 2); l.position.set(PX(x), 2.9, PZ(-8)); A.add(l);
    }
  }

  /* ============================ LED-ОСВЕЩЕНИЕ ЗАЛА (имитация) ============================ */
  const ledGeo = new THREE.BoxGeometry(3.0, 0.1, 0.5);
  const ledRows = [];
  for (const x of [6, 12, 18, 24, 30, 36]) for (const y of [5.5, 25])  ledRows.push([x, roofH(y) - 0.6, y]);  // падел С/Ю
  for (const x of [7.6, 20.8, 34]) for (const y of [13, 17])           ledRows.push([x, HR - 0.7, y]);        // бадминтон
  for (const y of [5.7, 15, 24.3])                                      ledRows.push([45.85, roofH(y) - 0.6, y]); // НТ
  for (const [x, hh, y] of ledRows) {
    const m = new THREE.Mesh(ledGeo, M.led);
    m.position.set(PX(x), hh, PZ(y)); root.add(m);
  }
  // малиновая LED-линия по коньку
  addBox(root, M.ledMagenta, [0.4, 49.6], [HR - 0.12, HR - 0.04], [14.96, 15.04]);

  /* ============================ ТЕНТОВАЯ КРОВЛЯ (двухконтурная, тоггл) ============================ */
  // roofGroup / roofMats объявлены выше (до пристройки)
  // один скат мембраны (y0→y1, h0→h1), материал mat, шир. по X = 50.8
  function membranePlane(y0, y1, h0, h1, mat) {
    const len = Math.hypot(y1 - y0, h1 - h0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(50.8, 0.08, len + 0.4), mat);
    m.position.set(0, (h0 + h1) / 2 + 0.06, (PZ(y0) + PZ(y1)) / 2);
    m.rotation.x = Math.atan2(h0 - h1, y1 - y0);
    m.castShadow = true; m.receiveShadow = true;
    roofGroup.add(m);
  }
  // наружный контур
  const tOut = M.tentOut; tOut.opacity = 0.58; tOut.userData.baseOpacity = 0.58; roofMats.push(tOut);
  membranePlane(-0.4, 15, HW + 0.05, HR + 0.05, tOut);
  membranePlane(15, 30.4, HR + 0.05, HW + 0.05, tOut);
  // внутренний контур (ниже на ~0.55 м — тёплая воздушная прослойка)
  const tIn = M.tentIn; tIn.opacity = 0.26; tIn.userData.baseOpacity = 0.26; roofMats.push(tIn);
  membranePlane(-0.2, 15, HW - 0.5, HR - 0.5, tIn);
  membranePlane(15, 30.2, HR - 0.5, HW - 0.5, tIn);
  // фронтонные мембранные треугольники (поднимаются вместе с кровлей)
  function gableTri(xPlane) {
    const X = PX(xPlane);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      X, HW, PZ(0), X, HW, PZ(30), X, HR + 0.05, PZ(15),
    ]), 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, tOut); m.receiveShadow = true; roofGroup.add(m);
  }
  gableTri(0.0); gableTri(50.0);
  // карнизная LED-кромка (брендовая «energy frame»)
  const edgeMat = M.ledMagenta.clone(); edgeMat.userData.baseOpacity = 1; roofMats.push(edgeMat); neonMats.push({ mat: edgeMat, base: 2.2 });
  for (const seg of [[[-0.4, 50.4], [HW - 0.02, HW + 0.1], [-0.5, -0.36]], [[-0.4, 50.4], [HW - 0.02, HW + 0.1], [30.36, 30.5]]])
    addBox(roofGroup, edgeMat, seg[0], seg[1], seg[2]);

  // mezzGroup сохранён пустым для совместимости API (антресоль исключена в v4)
  const mezz = new THREE.Group(); root.add(mezz);

  return { root, roofGroup, roofMats, neonMats, mezzGroup: mezz, M };
}

/* ============================ ТЕКСТУРЫ ============================ */
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
    ctx.fillText('СВОБОДНЫ СЕЙЧАС: БАДМИНТОН — 1 КОРТ · НАСТ. ТЕННИС — 2 СТОЛА', 48, 516);
  });
  return tex;
}
function makeShopPanelTexture() {
  const c = document.createElement('canvas'); c.width = 1280; c.height = 208;
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
