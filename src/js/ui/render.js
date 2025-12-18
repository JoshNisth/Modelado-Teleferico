(() => {
  const TF = (window.TF = window.TF || {});
  TF.ui = TF.ui || {};

  const { fmt2, fmt3, pad2 } = TF.utils.format;

  const hintEl = document.getElementById('hint');
  const tbody = document.getElementById('resultsBody');
  const tabsEl = document.getElementById('simTabs');

  const avgTMEEl = document.getElementById('avgTME');
  const avgTTVLEl = document.getElementById('avgTTVL');
  const cmoEl = document.getElementById('cmo');
  const avgPAEl = document.getElementById('avgPA');
  const avgPNAEl = document.getElementById('avgPNA');
  const simAvgBody = document.getElementById('simAvgBody');

  let activeRangeMode = 'todo';

  function normalizeRangeMode(mode) {
    if (mode === 'pico' || mode === 'valle' || mode === 'todo') return mode;
    return 'todo';
  }

  function includeRowByRange(row, rangeMode) {
    if (rangeMode === 'pico') return row.FH === 'PICO';
    if (rangeMode === 'valle') return row.FH === 'VALLE';
    return true;
  }

  function computeStatsFromRows(rows) {
    if (!rows || rows.length === 0) {
      return {
        count: 0,
        avg: { TME: null, TTVL: null, PA: null, PNA: null },
        cmo: null,
      };
    }

    let sumTME = 0;
    let sumTTVL = 0;
    let sumPA = 0;
    let sumPNA = 0;
    let cmo = 0;

    for (const r of rows) {
      sumTME += Number(r.TME) || 0;
      sumTTVL += Number(r.TTVL) || 0;
      sumPA += Number(r.PA) || 0;
      sumPNA += Number(r.PNA) || 0;
      const npc = Number(r.NPC_next);
      if (Number.isFinite(npc)) cmo = Math.max(cmo, npc);
    }

    const n = rows.length;
    return {
      count: n,
      avg: {
        TME: sumTME / n,
        TTVL: sumTTVL / n,
        PA: sumPA / n,
        PNA: sumPNA / n,
      },
      cmo,
    };
  }

  function computeFilteredResult(result, rangeMode) {
    const mode = normalizeRangeMode(rangeMode);
    const perSimStats = (result.perSim || []).map((sim) => {
      const filteredRows = (sim.rows || []).filter((r) => includeRowByRange(r, mode));
      const stats = computeStatsFromRows(filteredRows);
      return { sim: sim.sim, ...stats };
    });

    const totalCount = perSimStats.reduce((acc, s) => acc + (s.count || 0), 0);
    if (perSimStats.length === 0 || totalCount === 0) {
      return {
        perSimStats,
        overall: { avg: { TME: null, TTVL: null, PA: null, PNA: null }, cmo: null },
        totalCount,
      };
    }

    let sumAvgTME = 0;
    let sumAvgTTVL = 0;
    let sumAvgPA = 0;
    let sumAvgPNA = 0;
    let overallCMO = 0;
    let simsWithData = 0;

    for (const s of perSimStats) {
      if (!s.count) continue;
      simsWithData++;
      sumAvgTME += s.avg.TME;
      sumAvgTTVL += s.avg.TTVL;
      sumAvgPA += s.avg.PA;
      sumAvgPNA += s.avg.PNA;
      if (s.cmo != null) overallCMO = Math.max(overallCMO, s.cmo);
    }

    const denom = simsWithData || 1;
    return {
      perSimStats,
      overall: {
        avg: {
          TME: sumAvgTME / denom,
          TTVL: sumAvgTTVL / denom,
          PA: sumAvgPA / denom,
          PNA: sumAvgPNA / denom,
        },
        cmo: overallCMO,
      },
      totalCount,
    };
  }

  function setStatus(text) {
    hintEl.textContent = text;
  }

  function renderSummary(result, rangeMode = activeRangeMode) {
    const filtered = computeFilteredResult(result, rangeMode);
    if (!filtered.totalCount) {
      avgTMEEl.textContent = '—';
      avgTTVLEl.textContent = '—';
      cmoEl.textContent = '—';
      avgPAEl.textContent = '—';
      avgPNAEl.textContent = '—';
      return;
    }

    avgTMEEl.textContent = `${fmt3(filtered.overall.avg.TME)} min`;
    avgTTVLEl.textContent = `${fmt3(filtered.overall.avg.TTVL)} min`;
    cmoEl.textContent = `${Math.round(filtered.overall.cmo)} pas`;
    avgPAEl.textContent = `${fmt2(filtered.overall.avg.PA)} pas/min`;
    avgPNAEl.textContent = `${fmt2(filtered.overall.avg.PNA)} pas/min`;
  }

  function renderSimAverages(result, rangeMode = activeRangeMode) {
    if (!simAvgBody) return;
    const filtered = computeFilteredResult(result, rangeMode);
    const rows = (filtered.perSimStats || []).map((s) => {
      return {
        sim: s.sim,
        tme: s.avg.TME,
        ttvl: s.avg.TTVL,
        pa: s.avg.PA,
        pna: s.avg.PNA,
        cmo: s.cmo,
        count: s.count,
      };
    });

    if (rows.length === 0) {
      simAvgBody.innerHTML = '<tr><td class="muted" colspan="6">Sin datos.</td></tr>';
      return;
    }

    const html = rows
      .map((r) => {
        const empty = !r.count;
        return `
          <tr>
            <td>${r.sim}</td>
            <td>${empty ? '—' : fmt3(r.tme)}</td>
            <td>${empty ? '—' : fmt3(r.ttvl)}</td>
            <td>${empty ? '—' : fmt2(r.pa)}</td>
            <td>${empty ? '—' : fmt2(r.pna)}</td>
            <td>${empty ? '—' : Math.round(r.cmo)}</td>
          </tr>`;
      })
      .join('');

    const overall = filtered.overall;
    const totalRow = `
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>${filtered.totalCount ? fmt3(overall.avg.TME) : '—'}</strong></td>
        <td><strong>${filtered.totalCount ? fmt3(overall.avg.TTVL) : '—'}</strong></td>
        <td><strong>${filtered.totalCount ? fmt2(overall.avg.PA) : '—'}</strong></td>
        <td><strong>${filtered.totalCount ? fmt2(overall.avg.PNA) : '—'}</strong></td>
        <td><strong>${filtered.totalCount ? Math.round(overall.cmo) : '—'}</strong></td>
      </tr>`;

    simAvgBody.innerHTML = html + totalRow;
  }

let lastResult = null;
let activeSim = 1;

function renderTabs(result) {
  if (!tabsEl) return;

  const ns = result.perSim?.length ?? 0;
  if (ns <= 1) {
    tabsEl.hidden = true;
    tabsEl.innerHTML = '';
    return;
  }

  tabsEl.hidden = false;
  tabsEl.innerHTML = result.perSim
    .map((s) => {
      const selected = s.sim === activeSim;
      return `<button type="button" class="tab" data-sim="${s.sim}" aria-selected="${selected}">Sim ${s.sim}</button>`;
    })
    .join('');

  for (const btn of tabsEl.querySelectorAll('button[data-sim]')) {
    btn.addEventListener('click', () => {
      const sim = Number(btn.getAttribute('data-sim'));
      if (!Number.isFinite(sim)) return;
      activeSim = sim;
      renderTabs(lastResult);
      renderResultsTable(lastResult, activeSim, activeRangeMode);
    });
  }
}

  function renderSimulationTabs(result) {
    lastResult = result;
    activeSim = 1;
    renderTabs(result);
  }

  function renderResultsTable(result, simFilter = null, rangeMode = activeRangeMode) {
    const mode = normalizeRangeMode(rangeMode);
    const rows = [];

    for (const sim of result.perSim) {
      if (simFilter != null && sim.sim !== simFilter) continue;
      for (const r of sim.rows) {
        if (!includeRowByRange(r, mode)) continue;
        rows.push({ sim: sim.sim, ...r });
      }
    }

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td class="muted" colspan="13">Sin datos.</td></tr>';
    return;
  }

  const html = rows.map((r) => {
    return `
      <tr>
        <td>${r.sim}</td>
        <td>${pad2(r.horaReloj)}</td>
        <td>${pad2(r.minutoReloj)}</td>
        <td>${r.FH}</td>
        <td>${fmt2(r.FDH)}</td>
        <td>${fmt2(r.lambda)}</td>
        <td>${r.TLP}</td>
        <td>${Math.round(r.PA)}</td>
        <td>${Math.round(r.NPC_next)}</td>
        <td>${Math.round(r.PNA)}</td>
        <td>${fmt2(r.TME)}</td>
        <td>${fmt2(r.TTVL)}</td>
        <td>${Math.round(r.CMO)}</td>
      </tr>`;
  }).join('');

    tbody.innerHTML = html;
  }

  function setRangeMode(mode) {
    activeRangeMode = normalizeRangeMode(mode);
    if (!lastResult) return;
    renderSummary(lastResult, activeRangeMode);
    renderSimAverages(lastResult, activeRangeMode);
    renderTabs(lastResult);
    renderResultsTable(lastResult, activeSim, activeRangeMode);
  }

  TF.ui.render = {
    setStatus,
    renderSummary,
    renderSimAverages,
    renderSimulationTabs,
    renderResultsTable,
    setRangeMode,
  };
})();
