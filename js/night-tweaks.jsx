// night-tweaks.jsx — панель «Tweaks» для 3D-прототипа
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "overview",
  "glow": 1,
  "walls": 0.16
}/*EDITMODE-END*/;

const VIEWPOINTS = [
  { key: 'overview',  label: 'Общий план' },
  { key: 'entrance',  label: 'Вход' },
  { key: 'reception', label: 'Ресепшн' },
  { key: 'cloakroom', label: 'Гардероб' },
  { key: 'shop',      label: 'Магазин' },
  { key: 'corridor',  label: 'Коридор' },
  { key: 'locker',    label: 'Раздевалка' },
  { key: 'wet',       label: 'Душ · с/у' },
  { key: 'padel',     label: 'Падел-корт' },
  { key: 'badminton', label: 'Бадминтон' },
  { key: 'tt',        label: 'Наст. теннис' },
  { key: 'tech',      label: 'Техзона' },
  { key: 'ventroom',  label: 'Венткамера' },
  { key: 'server',    label: 'Серверная' },
  { key: 'storeinv',  label: 'Склад · инвент.' },
  { key: 'store',     label: 'Склад' },
  { key: 'mezzanine', label: 'Антресоль' },
  { key: 'gym',       label: 'ОФП-зал' },
  { key: 'lounge',    label: 'Лаундж' },
  { key: 'office',    label: 'Кабинеты' },
];

function ViewGrid({ value, onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {VIEWPOINTS.map((v) => (
        <button key={v.key} type="button"
                className={'twk-btn' + (value === v.key ? '' : ' secondary')}
                onClick={() => onPick(v.key)}
                style={{ height: 30, padding: '0 8px', fontSize: 11, justifyContent: 'center' }}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const firstFlyRef = React.useRef(true);

  React.useEffect(() => {
    const apply = () => {
      if (!window.NightApp) return false;
      window.NightApp.setGlow(t.glow);
      window.NightApp.setWalls(t.walls);
      window.NightApp.setScheme('Классика'); // покрытия кортов — только классика
      return true;
    };
    if (apply()) return;
    const id = setInterval(() => { if (apply()) clearInterval(id); }, 300);
    return () => clearInterval(id);
  }, [t.glow, t.walls]);

  // перелёт к выбранной точке (на первом кадре — мгновенно, дальше — с анимацией)
  React.useEffect(() => {
    const go = () => {
      if (!window.NightApp || !window.NightApp.flyTo) return false;
      window.NightApp.flyTo(t.view, !firstFlyRef.current);
      firstFlyRef.current = false;
      return true;
    };
    if (go()) return;
    const id = setInterval(() => { if (go()) clearInterval(id); }, 300);
    return () => clearInterval(id);
  }, [t.view]);

  return (
    <TweaksPanel>
      <TweakSection label="Точки обзора" />
      <ViewGrid value={t.view} onPick={(k) => setTweak('view', k)} />
      <TweakSection label="Атмосфера" />
      <TweakSlider label="Свечение неона" value={t.glow} min={0} max={2} step={0.05}
                   onChange={(v) => setTweak('glow', v)} />
      <TweakSlider label="Прозрачность стен" value={t.walls} min={0.04} max={0.5} step={0.01}
                   onChange={(v) => setTweak('walls', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<TweaksApp />);
