// night-main.js — инициализация рендера, камеры, света; API window.NightApp
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildScene } from './night-scene.js';

const stage = document.getElementById('stage');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0028, 0.0022);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.5, 600);
camera.position.set(74, 42, -52);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 2.5;
controls.maxDistance = 220;

/* ---------- плавный градационный зум колесом ---------- */
// Свой обработчик вместо встроенного: каждый щелчок колеса — маленький фиксированный
// шаг, не зависящий от величины deltaY мыши/тачпада, плюс затухание к целевой дистанции.
controls.enableZoom = false;
const ZMIN = controls.minDistance, ZMAX = controls.maxDistance;
let zoomDist = camera.position.distanceTo(controls.target);
let zoomTarget = zoomDist;
function syncZoom() { zoomDist = zoomTarget = camera.position.distanceTo(controls.target); }
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (camTween) return;
  if (walkActive) { walkSpeed = Math.max(2.5, Math.min(16, walkSpeed * (e.deltaY < 0 ? 1.12 : 0.89))); return; }
  let d = e.deltaY;
  if (e.deltaMode === 1) d *= 24;                 // строки → ~px
  else if (e.deltaMode === 2) d *= stage.clientHeight; // страницы
  d = Math.max(-120, Math.min(120, d));           // ограничиваем «прыжок» за один шаг
  const steps = d / 120;                          // -1 … 1
  zoomTarget *= Math.pow(1.09, steps);            // ~9% за щелчок — много мелких градаций
  zoomTarget = Math.max(ZMIN, Math.min(ZMAX, zoomTarget));
}, { passive: false });

// в режиме прогулки клик по сцене захватывает указатель (обзор мышью, как в игре)
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (walkActive && e.button === 0 && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
  }
});
document.addEventListener('mousemove', (e) => {
  if (!walkActive || document.pointerLockElement !== renderer.domElement) return;
  walkYaw   -= e.movementX * 0.0023;
  walkPitch -= e.movementY * 0.0023;
  walkPitch = Math.max(-1.2, Math.min(1.2, walkPitch));
});

/* ---------- точки обзора (плановые координаты: PX=x-30, PZ=y-18.9) ---------- */
// mkView(x, h, y,  tx, th, ty) — позиция «на уровне глаз» и цель взгляда
function mkView(x, h, y, tx, th, ty) {
  return {
    pos: new THREE.Vector3(x - 30, h, y - 18.9),
    tgt: new THREE.Vector3(tx - 30, th, ty - 18.9),
  };
}
const VIEWS = {
  overview:  { pos: new THREE.Vector3(74, 42, -52), tgt: new THREE.Vector3(0, 2.5, 0) },
  entrance:  mkView(69,   2.0, 7.4,   59,    3.4, 7.4),   // снаружи, у входной группы
  reception: mkView(59.3, 1.7, 6.9,   55.2,  1.6, 9.9),   // от входа: стойка, бренд-стена, табло
  cloakroom: mkView(59.1, 1.72, 8.3,  56.6,  1.0, 4.7),   // гардероб: стойка, вешалки, номерки
  shop:      mkView(41.2, 1.68, 12.35,  38.4,  1.0, 14.2), // в про-шопе (перенесён в зону НТ): касса, витрина, ракеточная стена
  corridor:  mkView(56.1, 1.65, 7.8,  47.7,  1.3, 7.8),   // вдоль коридора к кортам
  locker:    mkView(53.6, 1.65, 9.3,  48.7,  1.05, 13.4), // внутри раздевалки 2
  wet:       mkView(55.0, 1.7, 1.5,   58.4,  1.05, 3.1),   // мокрая зона 1: душевые, раковины, санузлы
  padel:     mkView(23.85,1.6, 18.8,  23.85, 1.3, 33),    // на падел-корте, лицом к сетке
  badminton: mkView(11.45,1.6, 2.4,   11.45, 1.2, 13),    // на бадминтонном корте
  tt:        mkView(46.5, 1.6, 11.8,  33,    0.95,10),    // в зоне настольного тенниса
  tech:      mkView(16.5, 8.5, 33.9, 3.0, 0.8, 33.4),     // техзона: венткамера, серверная, склады + воздуховоды
  ventroom:  mkView(5.6, 1.75, 34.6, 1.4, 1.35, 35.0),    // внутри венткамеры — установки + ИТП
  server:    mkView(5.8, 1.7, 31.5, 1.3, 1.35, 30.0),     // внутри серверной — стойки, кондиционер
  storeinv:  mkView(5.9, 1.7, 27.6, 1.4, 1.3, 24.9),      // склад инвентаря — стеллажи, пушки
  store:     mkView(5.9, 1.7, 21.2, 1.4, 1.3, 18.4),      // склад/хозблок — стеллажи, ГРЩ
  mezzanine: mkView(32.5, 7.6, 7.2,  49,    4.9, 12.6),  // на антресоли — анфилада зон сверху
  gym:       mkView(52.2, 5.8, 4.6,   57.5,  5.2, 12.0),  // ОФП-зал (дальний край): рама, кардио, зеркало
  lounge:    mkView(38.5, 6.0, 10.6,  32.0,  5.0, 6.4),   // лаундж: диваны, пуфики, балкон
  office:    mkView(36.2, 5.7, 6.6,   36.2,  4.9, 1.6),   // кабинеты у южной стены
};

// окружение для точки обзора: крыша / антресоль
const VIEW_ENV = {
  overview:  { roof: 1, mezz: 1 }, entrance: { roof: 1, mezz: 1 },
  reception: { roof: 0, mezz: 1 }, shop: { roof: 0, mezz: 1 }, corridor: { roof: 0, mezz: 1 },
  cloakroom: { roof: 0, mezz: 1 },
  locker:    { roof: 0, mezz: 0 }, padel: { roof: 0, mezz: 1 }, badminton: { roof: 0, mezz: 1 },
  wet:       { roof: 0, mezz: 1 },
  tt:        { roof: 0, mezz: 0 },
  tech:      { roof: 0, mezz: 0 },
  ventroom:  { roof: 0, mezz: 1 }, server: { roof: 0, mezz: 1 },
  storeinv:  { roof: 0, mezz: 1 }, store: { roof: 0, mezz: 1 },
  mezzanine: { roof: 0, mezz: 1 }, gym: { roof: 0, mezz: 1 },
  lounge:    { roof: 0, mezz: 1 }, office: { roof: 0, mezz: 1 },
};

let camTween = null;
let walkActive = false;
function flyTo(name, animate = true) {
  const v = VIEWS[name];
  if (!v) return;
  if (walkActive) stopWalk();
  // авто-окружение: показать/скрыть крышу и антресоль под точку обзора
  const env = VIEW_ENV[name];
  if (env && window.NightApp) {
    window.NightApp.setRoof(!!env.roof);
    window.NightApp.setMezz(!!env.mezz);
  }
  if (!animate) {
    camTween = null;
    controls.enabled = true;
    camera.position.copy(v.pos);
    controls.target.copy(v.tgt);
    controls.update();
    syncZoom();
    return;
  }
  camTween = {
    fromPos: camera.position.clone(),
    fromTgt: controls.target.clone(),
    toPos: v.pos.clone(),
    toTgt: v.tgt.clone(),
    t: 0, dur: 1.05,
  };
  controls.enabled = false;
}

/* ---------- свободная прогулка от первого лица (как в Minecraft) ---------- */
// WASD / стрелки + мышь — обзор; пробел/Shift — выше/ниже. Координаты сцены: x-30, z-18.9.
const EYE = 1.65;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const walkPos = new THREE.Vector3(20, EYE, -11); // главный коридор
let walkYaw = Math.PI / 2;   // 0 = взгляд на −Z; π/2 = взгляд на −X (вглубь зала)
let walkPitch = 0;
let walkSpeed = 7.0;         // м/с (регулируется колесом)
const TURN_SPEED = 1.7;      // рад/с (кнопки/Q-E)
const move = { f: 0, b: 0, l: 0, r: 0, up: 0, down: 0, tl: 0, tr: 0 };
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _mv = new THREE.Vector3();

function startWalk() {
  if (walkActive) return;
  walkActive = true; camTween = null; controls.enabled = false;
  walkSpeed = 7.0;
  // если камера сверху (обзор) — спускаемся на пол у входа; иначе с текущей точки
  if (camera.position.y > 4) {
    walkPos.set(20, EYE, -11); walkYaw = Math.PI / 2;
  } else {
    walkPos.copy(camera.position); walkPos.y = EYE;
    const d = controls.target.clone().sub(camera.position);
    walkYaw = Math.atan2(-d.x, -d.z);
  }
  walkPitch = 0;
  for (const k in move) move[k] = 0;
  document.dispatchEvent(new CustomEvent('night:walk', { detail: true }));
}
function stopWalk() {
  if (!walkActive) return;
  walkActive = false; controls.enabled = true;
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  // передаём орбит-камере текущее положение/направление, чтобы не было рывка
  const cp = Math.cos(walkPitch);
  controls.target.set(walkPos.x - Math.sin(walkYaw) * cp * 4, walkPos.y + Math.sin(walkPitch) * 4, walkPos.z - Math.cos(walkYaw) * cp * 4);
  controls.update();
  syncZoom();
  document.dispatchEvent(new CustomEvent('night:walk', { detail: false }));
}
function setMove(key, on) { if (key in move) move[key] = on ? 1 : 0; }

// один шаг обновления свободной прогулки (вызывается каждый кадр)
function updateWalk(dt) {
  walkYaw += (move.tl - move.tr) * TURN_SPEED * dt;
  const sinY = Math.sin(walkYaw), cosY = Math.cos(walkYaw);
  _fwd.set(-sinY, 0, -cosY);
  _right.set(cosY, 0, -sinY);
  _mv.set(0, 0, 0);
  if (move.f) _mv.add(_fwd);
  if (move.b) _mv.sub(_fwd);
  if (move.r) _mv.add(_right);
  if (move.l) _mv.sub(_right);
  if (_mv.lengthSq() > 0) { _mv.normalize().multiplyScalar(walkSpeed * dt); walkPos.add(_mv); }
  if (move.up)   walkPos.y += walkSpeed * 0.7 * dt;
  if (move.down) walkPos.y -= walkSpeed * 0.7 * dt;
  walkPos.x = clamp(walkPos.x, -42, 44);
  walkPos.z = clamp(walkPos.z, -24, 24);
  walkPos.y = clamp(walkPos.y, 0.7, 12);
  camera.position.copy(walkPos);
  const cp = Math.cos(walkPitch);
  camera.lookAt(walkPos.x - sinY * cp, walkPos.y + Math.sin(walkPitch), walkPos.z - cosY * cp);
}

// клавиатура — управление шагами
const WALK_KEYS = {
  KeyW: 'f', KeyS: 'b', KeyA: 'l', KeyD: 'r',
  ArrowUp: 'f', ArrowDown: 'b', ArrowLeft: 'tl', ArrowRight: 'tr',
  KeyQ: 'tl', KeyE: 'tr', Space: 'up', ShiftLeft: 'down', ShiftRight: 'down',
};
window.addEventListener('keydown', (e) => {
  if (!walkActive) return;
  const k = WALK_KEYS[e.code]; if (!k) return;
  e.preventDefault(); move[k] = 1;
});
window.addEventListener('keyup', (e) => {
  const k = WALK_KEYS[e.code]; if (!k) return;
  move[k] = 0;
});

/* ---------- свет ---------- */
const hemi = new THREE.HemisphereLight(0x7c5cd6, 0x0b0028, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe2f4, 1.7);
sun.position.set(48, 60, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -80;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0006;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x6a8cff, 0.35);
fill.position.set(-50, 30, 40);
scene.add(fill);

// неоновые точки — малиновый/фиолетовый объёмный свет
const neonLights = [];
function neonPoint(color, x, h, z, intensity, dist) {
  const l = new THREE.PointLight(color, intensity, dist, 2);
  l.position.set(x, h, z);
  l.userData.base = intensity;
  scene.add(l); neonLights.push(l);
}
neonPoint(0xdd58c5, 0, 9.5, -3, 220, 70);     // конёк
neonPoint(0x7238e6, -18, 6.5, 8, 120, 50);    // бадминтон-холл
neonPoint(0xff8a3d, 9, 4.5, 16, 60, 30);      // кафе
neonPoint(0xdd58c5, 31.5, 4.5, 11.5, 70, 30); // вход

/* ---------- сцена ---------- */
const { roofGroup, roofMats, neonMats, mezzGroup, M } = buildScene(scene);

/* ---------- состояние / API ---------- */
const state = { roof: 1, roofTarget: 1, mezz: 1, mezzTarget: 1, glow: 1, walls: 0.16 };

const SCHEMES = {
  'Малина':   { bad: 0xc2399f, padel: 0x5e2fd6, single: 0x7a3fe2, tt: 0x4a1dad },
  'Фиолет':   { bad: 0x5e2fd6, padel: 0xb83fa3, single: 0xd158b8, tt: 0x7238e6 },
  'Классика': { bad: 0x2e7d52, padel: 0x2563b8, single: 0x2e7d52, tt: 0x1e4fa0 },
};

window.NightApp = {
  setRoof(on) {
    state.roofTarget = on ? 1 : 0;
    document.dispatchEvent(new CustomEvent('night:roof', { detail: on }));
  },
  getRoof() { return state.roofTarget === 1; },
  setMezz(on) {
    state.mezzTarget = on ? 1 : 0;
    document.dispatchEvent(new CustomEvent('night:mezz', { detail: on }));
  },
  getMezz() { return state.mezzTarget === 1; },
  setGlow(v) {
    state.glow = v;
    for (const { mat, base } of neonMats) mat.emissiveIntensity = base * v;
    for (const l of neonLights) l.intensity = l.userData.base * v;
  },
  setWalls(v) {
    state.walls = v;
    M.wall.opacity = v;
  },
  setScheme(name) {
    const s = SCHEMES[name] || SCHEMES['Малина'];
    M.badCourt.color.set(s.bad);
    M.padelTurf.color.set(s.padel);
    M.padelTurfSingle.color.set(s.single);
    M.ttTop.color.set(s.tt);
  },
  // точки обзора
  flyTo,
  views() { return Object.keys(VIEWS); },
  // служебное: перестановка камеры
  lookAt(px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz);
    controls.target.set(tx, ty, tz);
    controls.update();
  },
  renderNow() { renderer.render(scene, camera); },
  startWalk, stopWalk, setMove,
  toggleWalk() { walkActive ? stopWalk() : startWalk(); },
  isWalking() { return walkActive; },
};

/* ---------- цикл ---------- */
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  // плавный подъём крыши
  state.roof += (state.roofTarget - state.roof) * Math.min(1, dt * 4.5);
  const k = state.roof;
  roofGroup.position.y = (1 - k) * 16;
  const op = Math.max(0, Math.min(1, (k - 0.15) / 0.85));
  for (const m of roofMats) { m.opacity = op; m.transparent = true; }
  roofGroup.visible = k > 0.02;
  // плавный подъём антресоли
  state.mezz += (state.mezzTarget - state.mezz) * Math.min(1, dt * 4.5);
  const km = state.mezz;
  mezzGroup.position.y = (1 - km) * 12;
  mezzGroup.visible = km > 0.03;
  // свободная прогулка от первого лица
  if (walkActive) {
    updateWalk(dt);
    renderer.render(scene, camera);
    return;
  }
  // плавный перелёт между точками обзора
  if (camTween) {
    camTween.t = Math.min(1, camTween.t + dt / camTween.dur);
    const e = camTween.t < 0.5
      ? 4 * camTween.t * camTween.t * camTween.t
      : 1 - Math.pow(-2 * camTween.t + 2, 3) / 2;
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTgt, camTween.toTgt, e);
    if (camTween.t >= 1) { camTween = null; controls.enabled = true; syncZoom(); }
  }
  controls.update();
  // градационный зум: плавно тянем дистанцию к цели и задаём длину вектора камеры
  if (!camTween) {
    zoomDist += (zoomTarget - zoomDist) * Math.min(1, dt * 9);
    const off = camera.position.clone().sub(controls.target);
    if (off.lengthSq() > 1e-6) {
      off.setLength(zoomDist);
      camera.position.copy(controls.target).add(off);
    }
  }
  renderer.render(scene, camera);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth, stage.clientHeight);
});
