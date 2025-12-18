(() => {
const TF = (window.TF = window.TF || {});
TF.sim = TF.sim || {};

const LINE_COLORS = {
  'Morada': '#7c4dff',
  'Roja': '#ff3b30',
  'Amarilla': '#ffd60a',
  'Azul': '#0a84ff',
  'Verde': '#34c759',
  'Café': '#a2845e',
  'Naranja': '#ff9f0a',
  'Blanca': '#e7eefc',
  'Celeste': '#5ac8fa',
  'Plateada': '#8e8e93',
};

const DEFAULTS = {
  linea: 'Morada',
  mes: 'Diciembre',
  tipoDia: 'Lunes a sábado',
  ns: 1,

  cc: 10,
  tap: 0.034,
  tec: 0.2,
  trl: 14,

  iplp: 17,
  fdhPico: 1.5,
  fdhValle: 1.0,
  horasPico: [7, 12, 13, 18, 19],

  seed: '',
};

function applyThemeForLine(linea) {
  const color = LINE_COLORS[linea] ?? LINE_COLORS['Morada'];
  document.documentElement.style.setProperty('--accent', color);
}

function parseHorasPico(text) {
  if (!text || !text.trim()) return [];
  const parts = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const hours = [];
  for (const p of parts) {
    const h = Number(p);
    if (Number.isFinite(h)) hours.push(h);
  }
  return hours;
}

function parseFormConfig(form) {
  const get = (id) => form.querySelector(`#${id}`);

  return {
    linea: String(get('linea').value),
    mes: String(get('mes').value),
    tipoDia: String(get('tipoDia').value),
    ns: Number(get('ns').value),

    // En el Teleférico de La Paz la cabina es fija: 10 pasajeros
    cc: 10,
    tap: Number(get('tap').value),
    tec: Number(get('tec').value),
    trl: Number(get('trl').value),

    iplp: Number(get('iplp').value),
    // FDH pico fijo = 1.5; FDH valle se calcula (se actualiza en el motor)
    fdhPico: 1.5,
    fdhValle: Number(get('fdhValle').value),
    horasPico: parseHorasPico(String(get('horasPico').value)),

    seed: String(get('seed').value ?? '').trim(),
  };
}

function validateConfig(cfg) {
  const mustBeFinite = (v) => Number.isFinite(v);
  const mustBeNonNeg = (v) => mustBeFinite(v) && v >= 0;

  if (!Number.isInteger(cfg.ns) || cfg.ns < 1) return { ok: false, error: 'NS debe ser entero >= 1.' };
  if (cfg.cc !== 10) return { ok: false, error: 'CC debe ser 10 (capacidad fija del sistema).' };

  if (!mustBeNonNeg(cfg.tap)) return { ok: false, error: 'TAP debe ser >= 0.' };
  if (!mustBeNonNeg(cfg.tec)) return { ok: false, error: 'TEC debe ser >= 0.' };
  if (!mustBeNonNeg(cfg.trl)) return { ok: false, error: 'TRL debe ser >= 0.' };

  if (!mustBeNonNeg(cfg.iplp)) return { ok: false, error: 'IPLP base debe ser >= 0.' };
  if (cfg.fdhPico !== 1.5) return { ok: false, error: 'FDH pico debe ser 1.5 (fijo).' };

  for (const h of cfg.horasPico) {
    if (!Number.isInteger(h) || h < 0 || h > 23) return { ok: false, error: 'Horas pico deben ser enteros 0..23.' };
  }

  return { ok: true };
}

TF.sim.config = {
  DEFAULTS,
  applyThemeForLine,
  parseFormConfig,
  validateConfig,
};
})();
