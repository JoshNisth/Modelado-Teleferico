import { fmt2, fmt3, pad2 } from '../utils/format.js';

const hintEl = document.getElementById('hint');
const tbody = document.getElementById('resultsBody');

const avgTMEEl = document.getElementById('avgTME');
const avgTTVLEl = document.getElementById('avgTTVL');
const cmoEl = document.getElementById('cmo');
const avgPAEl = document.getElementById('avgPA');
const avgPNAEl = document.getElementById('avgPNA');

export function setStatus(text) {
  hintEl.textContent = text;
}

export function renderSummary(result) {
  avgTMEEl.textContent = `${fmt3(result.overall.avg.TME)} min`;
  avgTTVLEl.textContent = `${fmt3(result.overall.avg.TTVL)} min`;
  cmoEl.textContent = `${Math.round(result.overall.cmo)} pas`;
  avgPAEl.textContent = `${fmt2(result.overall.avg.PA)} pas/min`;
  avgPNAEl.textContent = `${fmt2(result.overall.avg.PNA)} pas/min`;
}

export function renderResultsTable(result) {
  const rows = [];

  for (const sim of result.perSim) {
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
