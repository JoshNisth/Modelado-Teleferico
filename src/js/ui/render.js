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

  function setStatus(text) {
    hintEl.textContent = text;
  }

  function renderSummary(result) {
    avgTMEEl.textContent = `${fmt3(result.overall.avg.TME)} min`;
    avgTTVLEl.textContent = `${fmt3(result.overall.avg.TTVL)} min`;
    cmoEl.textContent = `${Math.round(result.overall.cmo)} pas`;
    avgPAEl.textContent = `${fmt2(result.overall.avg.PA)} pas/min`;
    avgPNAEl.textContent = `${fmt2(result.overall.avg.PNA)} pas/min`;
  }

  function renderSimAverages(result) {
    if (!simAvgBody) return;
    const rows = (result.perSim || []).map((s) => {
      return {
        sim: s.sim,
        tme: s.avg.TME,
        ttvl: s.avg.TTVL,
        pa: s.avg.PA,
        pna: s.avg.PNA,
        cmo: s.cmo,
      };
    });

    if (rows.length === 0) {
      simAvgBody.innerHTML = '<tr><td class="muted" colspan="6">Sin datos.</td></tr>';
      return;
    }

    const html = rows
      .map((r) => {
        return `
          <tr>
            <td>${r.sim}</td>
            <td>${fmt3(r.tme)}</td>
            <td>${fmt3(r.ttvl)}</td>
            <td>${fmt2(r.pa)}</td>
            <td>${fmt2(r.pna)}</td>
            <td>${Math.round(r.cmo)}</td>
          </tr>`;
      })
      .join('');

    const overall = result.overall;
    const totalRow = `
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>${fmt3(overall.avg.TME)}</strong></td>
        <td><strong>${fmt3(overall.avg.TTVL)}</strong></td>
        <td><strong>${fmt2(overall.avg.PA)}</strong></td>
        <td><strong>${fmt2(overall.avg.PNA)}</strong></td>
        <td><strong>${Math.round(overall.cmo)}</strong></td>
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
      renderResultsTable(lastResult, activeSim);
    });
  }
}

  function renderSimulationTabs(result) {
    lastResult = result;
    activeSim = 1;
    renderTabs(result);
  }

  function renderResultsTable(result, simFilter = null) {
    const rows = [];

  for (const sim of result.perSim) {
    if (simFilter != null && sim.sim !== simFilter) continue;
    for (const r of sim.rows) {
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

  TF.ui.render = {
    setStatus,
    renderSummary,
    renderSimAverages,
    renderSimulationTabs,
    renderResultsTable,
  };
})();
