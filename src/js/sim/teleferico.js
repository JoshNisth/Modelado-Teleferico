(() => {
  const TF = (window.TF = window.TF || {});
  TF.sim = TF.sim || {};

  const poissonInverse = TF.sim?.poisson?.poissonInverse;
  const makeRng = TF.utils?.rng?.makeRng;

  function isPeakHour(hora, peakHours) {
    return peakHours.includes(hora);
  }

  function getOperationWindow(tipoDia) {
    // Horario real del Teleférico (según lo que indicaste):
    // - Lunes a sábado: 06:30 a 22:30 (16h)
    // - Domingo y feriados: 07:00 a 21:00 (14h)
    if (tipoDia === 'Lunes a sábado') {
      const startMin = 6 * 60 + 30;
      const endMin = 22 * 60 + 30;
      return { startMin, endMin, minutes: endMin - startMin };
    }
    const startMin = 7 * 60;
    const endMin = 21 * 60;
    return { startMin, endMin, minutes: endMin - startMin };
  }

  function countPeakMinutes(tipoDia, peakHours) {
    const { startMin, minutes } = getOperationWindow(tipoDia);
    let peakMinutes = 0;
    for (let i = 0; i < minutes; i++) {
      const t = startMin + i;
      const hour = Math.floor(t / 60) % 24;
      if (isPeakHour(hour, peakHours)) peakMinutes++;
    }
    return peakMinutes;
  }

  function computeFdhValle(tipoDia, peakHours, fdhPico) {
    const { minutes } = getOperationWindow(tipoDia);
    const picoMin = countPeakMinutes(tipoDia, peakHours);
    const valleMin = minutes - picoMin;
    if (valleMin <= 0) return null;
    // Normalización: (pico*fdhPico + valle*fdhValle) / MOD = 1
    const fdhValle = (minutes - picoMin * fdhPico) / valleMin;
    return Number.isFinite(fdhValle) ? fdhValle : null;
  }

  function simulateDay(config, rng) {
    const { startMin, minutes: MOD } = getOperationWindow(config.tipoDia);
    const picoMin = countPeakMinutes(config.tipoDia, config.horasPico);
    const valleMin = MOD - picoMin;

  let NPC = 0.0;
  let CMO = 0.0;

  let sumTME = 0.0;
  let sumTTVL = 0.0;
  let sumPA = 0.0;
  let sumPNA = 0.0;
  let sumANPCP = 0.0;
  let sumANPCV = 0.0;

  const rows = [];

    for (let CM = 0; CM < MOD; CM++) {
    const t = startMin + CM;
    const horaReloj = Math.floor(t / 60) % 24;
    const minutoReloj = t % 60;

    const peak = isPeakHour(horaReloj, config.horasPico);
    const FH = peak ? 'PICO' : 'VALLE';
    const FDH = peak ? config.fdhPico : config.fdhValle;

    // Nota: replico tu Python: λ = IPLP_base * FDH (interpretado como llegadas/hora)
    const lambda = config.iplp * FDH;

    const u = rng();
    const TLP = poissonInverse(lambda, u);

    const NPC_t = NPC;

    // Tiempo total de abordaje por cabina, limitado por la capacidad y la disponibilidad
    const pasajerosAIntentar = Math.min(config.cc, NPC_t + TLP);
    const TATC = config.tap * pasajerosAIntentar;

    // Cabinas por minuto, según TEC + TATC
    const denom = config.tec + TATC;
    const CPM = denom > 0 ? 1.0 / denom : 0.0;
    const CAI = CPM * config.cc;

    // Atención
    const PA = Math.min(TLP + NPC_t, CAI);
    const NPC_next = Math.max(0.0, NPC_t + TLP - CAI);
    const PNA = Math.max(0.0, NPC_t + TLP - CAI);

    const TME = (NPC_t > 0 && PA > 0) ? (NPC_t / PA) : 0.0;
    const TTVL = TME + config.trl;

    if (NPC_t > 0 && PA > 0) {
      if (peak) {
        sumANPCP += PNA;
      } else {
        sumANPCV += PNA;
      }
    }

    NPC = NPC_next;
    CMO = Math.max(CMO, NPC);

    sumTME += TME;
    sumTTVL += TTVL;
    sumPA += PA;
    sumPNA += PNA;

    rows.push({
      horaReloj,
      minutoReloj,
      FH,
      FDH,
      lambda,
      TLP,
      PA,
      NPC_next,
      PNA,
      TME,
      TTVL,
      CMO,
      ANPCP: sumANPCP,
      ANPCV: sumANPCV,
    });
  }

  const avg = {
    TME: sumTME / MOD,
    TTVL: sumTTVL / MOD,
    PA: sumPA / MOD,
    PNA: sumPNA / MOD,
    PNPCP: picoMin > 0 ? sumANPCP / picoMin : 0,
    PNPCV: valleMin > 0 ? sumANPCV / valleMin : 0,
  };

    return {
      minutesPerDay: MOD,
      picoMin,
      valleMin,
      rows,
      avg,
      cmo: CMO,
    };
  }

  function runSimulations(config) {
    if (typeof poissonInverse !== 'function') {
      throw new Error('poissonInverse no disponible (orden de scripts incorrecto).');
    }
    if (typeof makeRng !== 'function') {
      throw new Error('makeRng no disponible (orden de scripts incorrecto).');
    }

    const derivedValle = computeFdhValle(config.tipoDia, config.horasPico, config.fdhPico);
    if (derivedValle == null || derivedValle < 0) {
      throw new Error('FDH_valle inválido: revisa horas pico y la normalización.');
    }

    const normalizedConfig = {
      ...config,
      cc: 10,
      fdhPico: 1.5,
      fdhValle: derivedValle,
    };

    const rng = makeRng(normalizedConfig.seed);

  const perSim = [];
  let sumAvgTME = 0;
  let sumAvgTTVL = 0;
  let sumAvgPA = 0;
  let sumAvgPNA = 0;
  let sumAvgPNPCP = 0;
  let sumAvgPNPCV = 0;
  let globalCMO = 0;

    for (let s = 1; s <= normalizedConfig.ns; s++) {
      const day = simulateDay(normalizedConfig, rng);
    perSim.push({ sim: s, ...day });

    sumAvgTME += day.avg.TME;
    sumAvgTTVL += day.avg.TTVL;
    sumAvgPA += day.avg.PA;
    sumAvgPNA += day.avg.PNA;
    sumAvgPNPCP += day.avg.PNPCP;
    sumAvgPNPCV += day.avg.PNPCV;
    globalCMO = Math.max(globalCMO, day.cmo);
  }

    return {
      config: normalizedConfig,
      minutesPerDay: perSim[0]?.minutesPerDay ?? 0,
      perSim,
      overall: {
        avg: {
          TME: sumAvgTME / config.ns,
          TTVL: sumAvgTTVL / config.ns,
          PA: sumAvgPA / config.ns,
          PNA: sumAvgPNA / config.ns,
          PNPCP: sumAvgPNPCP / config.ns,
          PNPCV: sumAvgPNPCV / config.ns,
        },
        cmo: globalCMO,
      },
    };
  }

  TF.sim.engine = { getOperationWindow, computeFdhValle, simulateDay, runSimulations };
})();
