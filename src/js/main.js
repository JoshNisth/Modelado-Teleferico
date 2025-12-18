import { DEFAULTS, applyThemeForLine, parseFormConfig, validateConfig } from './sim/config.js';
import { runSimulations } from './sim/teleferico.js';
import { renderResultsTable, renderSummary, setStatus } from './ui/render.js';
import { getIplpPreset } from './sim/scenarios.js';

const form = document.getElementById('configForm');
const resetBtn = document.getElementById('resetBtn');
const errorEl = document.getElementById('error');

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

function maybeApplyPresetIplp() {
  const usar = document.getElementById('usarPreset').value === 'si';
  if (!usar) return;
  const linea = document.getElementById('linea').value;
  const mes = document.getElementById('mes').value;
  const preset = getIplpPreset(linea, mes);
  if (preset == null) {
    setStatus('Preset no encontrado para Línea+Mes. (Puedes editar src/js/sim/scenarios.js)');
    return;
  }
  document.getElementById('iplp').value = String(preset);
  setStatus(`Preset aplicado: IPLP=${preset} para ${linea}-${mes}.`);
}

form.addEventListener('change', (e) => {
  if (e.target?.id === 'linea') {
    applyThemeForLine(e.target.value);
    maybeApplyPresetIplp();
  }
  if (e.target?.id === 'mes') {
    maybeApplyPresetIplp();
  }
  if (e.target?.id === 'usarPreset') {
    maybeApplyPresetIplp();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const config = parseFormConfig(form);
  const validation = validateConfig(config);
  if (!validation.ok) {
    errorEl.textContent = validation.error;
    return;
  }

  setStatus('Simulando…');
  const result = runSimulations(config);
  renderSummary(result);
  renderResultsTable(result);
  setStatus(`Listo. Minutos simulados por corrida: ${result.minutesPerDay}.`);
});

resetBtn.addEventListener('click', () => {
  errorEl.textContent = '';
  setFormValues(DEFAULTS);
  setStatus('Parámetros reseteados.');
});
