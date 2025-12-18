import { poissonInverse } from './poisson.js';
import { makeRng } from '../utils/rng.js';

function isPeakHour(hora, peakHours) {
  return peakHours.includes(hora);
}

function minutesOfDay(tipoDia) {
  const hours = tipoDia === 'Lunes a sábado' ? 16 : 14;
  return hours * 60;
}

export function simulateDay(config, rng) {
  const MOD = minutesOfDay(config.tipoDia);

  let NPC = 0.0;
  let CMO = 0.0;

  let sumTME = 0.0;
  let sumTTVL = 0.0;
  let sumPA = 0.0;
  let sumPNA = 0.0;

  const rows = [];

  for (let CM = 1; CM <= MOD; CM++) {
    const horaReloj = config.horaInicio + Math.floor((CM - 1) / 60);
    const minutoReloj = (CM - 1) % 60;

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
    });
  }

  const avg = {
    TME: sumTME / MOD,
    TTVL: sumTTVL / MOD,
    PA: sumPA / MOD,
    PNA: sumPNA / MOD,
  };

  return {
    minutesPerDay: MOD,
    rows,
    avg,
    cmo: CMO,
  };
}

export function runSimulations(config) {
  const rng = makeRng(config.seed);

  const perSim = [];
  let sumAvgTME = 0;
  let sumAvgTTVL = 0;
  let sumAvgPA = 0;
  let sumAvgPNA = 0;
  let globalCMO = 0;

  for (let s = 1; s <= config.ns; s++) {
    const day = simulateDay(config, rng);
    perSim.push({ sim: s, ...day });

    sumAvgTME += day.avg.TME;
    sumAvgTTVL += day.avg.TTVL;
    sumAvgPA += day.avg.PA;
    sumAvgPNA += day.avg.PNA;
    globalCMO = Math.max(globalCMO, day.cmo);
  }

  return {
    config,
    minutesPerDay: perSim[0]?.minutesPerDay ?? 0,
    perSim,
    overall: {
      avg: {
        TME: sumAvgTME / config.ns,
        TTVL: sumAvgTTVL / config.ns,
        PA: sumAvgPA / config.ns,
        PNA: sumAvgPNA / config.ns,
      },
      cmo: globalCMO,
    },
  };
}
