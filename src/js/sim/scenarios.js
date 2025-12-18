// Presets opcionales por (línea, mes).
// Completa este objeto con tus valores del informe.
// Ejemplo (tu Python): Morada + Diciembre => 17
(() => {
  const TF = (window.TF = window.TF || {});
  TF.sim = TF.sim || {};

  // Figura 6: cantidad por minuto de pasajeros transportados por cada línea
  // Se usa como IPLP_base (pasajeros/minuto) y luego se ajusta con FDH.
  const SCENARIO_IPLP = {
    Roja: {
      Enero: 7, Febrero: 7, Marzo: 6, Abril: 6, Mayo: 7, Junio: 7, Julio: 8, Agosto: 8, Septiembre: 8, Octubre: 8, Noviembre: 8, Diciembre: 10,
    },
    Amarilla: {
      Enero: 6, Febrero: 6, Marzo: 7, Abril: 7, Mayo: 6, Junio: 7, Julio: 7, Agosto: 8, Septiembre: 8, Octubre: 8, Noviembre: 8, Diciembre: 8,
    },
    Verde: {
      Enero: 3, Febrero: 2, Marzo: 3, Abril: 3, Mayo: 3, Junio: 3, Julio: 3, Agosto: 3, Septiembre: 3, Octubre: 3, Noviembre: 3, Diciembre: 4,
    },
    Azul: {
      Enero: 5, Febrero: 4, Marzo: 4, Abril: 3, Mayo: 4, Junio: 4, Julio: 5, Agosto: 5, Septiembre: 5, Octubre: 5, Noviembre: 5, Diciembre: 6,
    },
    Naranja: {
      Enero: 4, Febrero: 3, Marzo: 3, Abril: 3, Mayo: 3, Junio: 3, Julio: 3, Agosto: 3, Septiembre: 3, Octubre: 3, Noviembre: 3, Diciembre: 4,
    },
    Blanca: {
      Enero: 2, Febrero: 2, Marzo: 2, Abril: 2, Mayo: 2, Junio: 2, Julio: 2, Agosto: 2, Septiembre: 2, Octubre: 2, Noviembre: 1, Diciembre: 3,
    },
    Celeste: {
      Enero: 2, Febrero: 2, Marzo: 2, Abril: 2, Mayo: 2, Junio: 2, Julio: 2, Agosto: 2, Septiembre: 2, Octubre: 2, Noviembre: 1, Diciembre: 3,
    },
    Morada: {
      Enero: 12, Febrero: 10, Marzo: 13, Abril: 14, Mayo: 14, Junio: 13, Julio: 14, Agosto: 14, Septiembre: 15, Octubre: 15, Noviembre: 16, Diciembre: 17,
    },
    Café: {
      Enero: 1, Febrero: 1, Marzo: 1, Abril: 1, Mayo: 1, Junio: 1, Julio: 1, Agosto: 1, Septiembre: 1, Octubre: 1, Noviembre: 1, Diciembre: 1,
    },
    Plateada: {
      Enero: 5, Febrero: 1, Marzo: 5, Abril: 4, Mayo: 5, Junio: 5, Julio: 6, Agosto: 6, Septiembre: 6, Octubre: 6, Noviembre: 6, Diciembre: 7,
    },
  };

  // Figura 7: tiempos de recorrido por cada línea (promedio, en minutos)
  const SCENARIO_TRL = {
    Roja: 11,
    Amarilla: 17.5,
    Verde: 17,
    Azul: 21.5,
    Naranja: 13,
    Blanca: 14,
    Celeste: 11.5,
    Morada: 17,
    Café: 3.5,
    Plateada: 12,
  };

  function getIplpPreset(linea, mes) {
    const byLine = SCENARIO_IPLP[linea];
    if (!byLine) return null;
    const v = byLine[mes];
    return Number.isFinite(v) ? v : null;
  }

  function getTrlPreset(linea) {
    const v = SCENARIO_TRL[linea];
    return Number.isFinite(v) ? v : null;
  }

  function getPreset(linea, mes) {
    const iplp = getIplpPreset(linea, mes);
    const trl = getTrlPreset(linea);
    if (iplp == null && trl == null) return null;
    return { iplp, trl };
  }

  TF.sim.scenarios = { SCENARIO_IPLP, SCENARIO_TRL, getIplpPreset, getTrlPreset, getPreset };
})();
