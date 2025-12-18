const TF = window.TF;

const { DEFAULTS, applyThemeForLine, parseFormConfig, validateConfig } = TF.sim.config;
const { getOperationWindow, computeFdhValle, runSimulations } = TF.sim.engine;
const { renderResultsTable, renderSummary, renderSimulationTabs, renderSimAverages, setStatus } = TF.ui.render;
const { getPreset } = TF.sim.scenarios;

const form = document.getElementById('configForm');
const resetBtn = document.getElementById('resetBtn');
const errorEl = document.getElementById('error');

function showError(message) {
  errorEl.textContent = message;
}

window.addEventListener('error', (evt) => {
  const msg = evt?.error?.message || evt?.message || 'Error inesperado.';
  showError(msg);
});

window.addEventListener('unhandledrejection', (evt) => {
  const msg = evt?.reason?.message || String(evt?.reason || 'Promesa rechazada sin manejar.');
  showError(msg);
});

function setFormValues(defaults) {
  document.getElementById('linea').value = defaults.linea;
  document.getElementById('mes').value = defaults.mes;
  document.getElementById('tipoDia').value = defaults.tipoDia;
  document.getElementById('ns').value = String(defaults.ns);

  document.getElementById('cc').value = String(defaults.cc);
  document.getElementById('tap').value = String(defaults.tap);
  document.getElementById('tec').value = String(defaults.tec);
  document.getElementById('trl').value = String(defaults.trl);

  document.getElementById('iplp').value = String(defaults.iplp);
  document.getElementById('fdhPico').value = String(defaults.fdhPico);
  document.getElementById('fdhValle').value = String(defaults.fdhValle);
  document.getElementById('horasPico').value = defaults.horasPico.join(',');
  document.getElementById('seed').value = '';

  applyThemeForLine(defaults.linea);
}

setFormValues(DEFAULTS);

function setPresetLock(locked) {
  const iplpEl = document.getElementById('iplp');
  const trlEl = document.getElementById('trl');
  // En este modelo, IPLP y TRL son datos fijos (no editables)
  if (iplpEl) iplpEl.disabled = true;
  if (trlEl) trlEl.disabled = true;
}

function formatTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function updateFixedFields() {
  const tipoDia = document.getElementById('tipoDia').value;
  const win = getOperationWindow(tipoDia);
  document.getElementById('inicioOp').value = formatTime(win.startMin);
  document.getElementById('finOp').value = formatTime(win.endMin);

  // CC fijo
  document.getElementById('cc').value = '10';
  // FDH pico fijo
  document.getElementById('fdhPico').value = '1.5';

  // FDH valle calculado con la fórmula de normalización
  const peakText = document.getElementById('horasPico').value;
  const peakHours = peakText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 23);

  const fdhValle = computeFdhValle(tipoDia, peakHours, 1.5);
  if (fdhValle == null) {
    document.getElementById('fdhValle').value = '';
    return;
  }
  document.getElementById('fdhValle').value = String(fdhValle.toFixed(3));
}

if (window.location.protocol === 'file:') {
  setStatus('Abierto como archivo local (file://). Esta versión debería funcionar sin servidor.');
}

function applyPresetParams() {
  const linea = document.getElementById('linea').value;
  const mes = document.getElementById('mes').value;
  const preset = getPreset(linea, mes);
  if (preset == null) {
    setStatus('Preset no encontrado para esa Línea/Mes. (Edita src/js/sim/scenarios.js)');
    setPresetLock(true);
    return;
  }

  if (preset.iplp != null) {
    document.getElementById('iplp').value = String(preset.iplp);
  }
  if (preset.trl != null) {
    document.getElementById('trl').value = String(preset.trl);
  }

  // Si hay preset, bloquea para que se note que viene del escenario
  setPresetLock(true);

  const parts = [];
  if (preset.iplp != null) parts.push(`IPLP=${preset.iplp} pas/min`);
  if (preset.trl != null) parts.push(`TRL=${preset.trl} min`);
  setStatus(`Preset aplicado (${linea}-${mes}): ${parts.join(' · ')}`);
}

// Aplica preset una vez al cargar
applyPresetParams();
updateFixedFields();

form.addEventListener('change', (e) => {
  if (e.target?.id === 'linea') {
    applyThemeForLine(e.target.value);
    applyPresetParams();
  }
  if (e.target?.id === 'mes') {
    applyPresetParams();
  }
  if (e.target?.id === 'tipoDia' || e.target?.id === 'horasPico') {
    updateFixedFields();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  showError('');

  try {
    const config = parseFormConfig(form);
    updateFixedFields();
    const validation = validateConfig(config);
    if (!validation.ok) {
      showError(validation.error);
      return;
    }

    setStatus('Simulando…');
    const result = runSimulations(config);
    renderSummary(result);
    renderSimAverages(result);
    renderSimulationTabs(result);
    renderResultsTable(result, 1);
    setStatus(`Listo. Minutos simulados por corrida: ${result.minutesPerDay}.`);
  } catch (err) {
    console.error(err);
    showError(err?.message ? String(err.message) : String(err));
    setStatus('Error al simular.');
  }
});

resetBtn.addEventListener('click', () => {
  errorEl.textContent = '';
  setFormValues(DEFAULTS);
  applyPresetParams();
  updateFixedFields();
  setStatus('Parámetros reseteados.');
});
