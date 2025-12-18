const TF = window.TF;

const { DEFAULTS, applyThemeForLine, parseFormConfig, validateConfig } = TF.sim.config;
const { runSimulations } = TF.sim.engine;
const { renderResultsTable, renderSummary, renderSimulationTabs, setStatus } = TF.ui.render;
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

  document.getElementById('horaInicio').value = String(defaults.horaInicio);
  document.getElementById('iplp').value = String(defaults.iplp);
  document.getElementById('usarPreset').value = defaults.usarPreset ? 'si' : 'no';
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
  if (iplpEl) iplpEl.disabled = Boolean(locked);
  if (trlEl) trlEl.disabled = Boolean(locked);
}

if (window.location.protocol === 'file:') {
  setStatus('Abierto como archivo local (file://). Esta versión debería funcionar sin servidor.');
}

function maybeApplyPresetParams() {
  const usar = document.getElementById('usarPreset').value === 'si';
  if (!usar) {
    setPresetLock(false);
    return;
  }
  const linea = document.getElementById('linea').value;
  const mes = document.getElementById('mes').value;
  const preset = getPreset(linea, mes);
  if (preset == null) {
    setStatus('Preset no encontrado para esa Línea/Mes. (Edita src/js/sim/scenarios.js)');
    setPresetLock(false);
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
maybeApplyPresetParams();

form.addEventListener('change', (e) => {
  if (e.target?.id === 'linea') {
    applyThemeForLine(e.target.value);
    maybeApplyPresetParams();
  }
  if (e.target?.id === 'mes') {
    maybeApplyPresetParams();
  }
  if (e.target?.id === 'usarPreset') {
    maybeApplyPresetParams();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  showError('');

  try {
    const config = parseFormConfig(form);
    const validation = validateConfig(config);
    if (!validation.ok) {
      showError(validation.error);
      return;
    }

    setStatus('Simulando…');
    const result = runSimulations(config);
    renderSummary(result);
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
  setStatus('Parámetros reseteados.');
});
