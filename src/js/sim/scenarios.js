// Presets opcionales por (línea, mes).
// Completa este objeto con tus valores del informe.
// Ejemplo (tu Python): Morada + Diciembre => 17
(() => {
  const TF = (window.TF = window.TF || {});
  TF.sim = TF.sim || {};

  const SCENARIO_IPLP = {
    Morada: {
      Diciembre: 17,
    },
  };

  function getIplpPreset(linea, mes) {
    const byLine = SCENARIO_IPLP[linea];
    if (!byLine) return null;
    const v = byLine[mes];
    return Number.isFinite(v) ? v : null;
  }

  TF.sim.scenarios = { SCENARIO_IPLP, getIplpPreset };
})();
