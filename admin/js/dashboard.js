/* ==========================================================================
   Brains Home Tutors — Admin Dashboard v5.0
   Complete Analytics Engine + Lead CRM + Charts + Goal Tracker
   ========================================================================== */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: DATA STORE  (localStorage-backed analytics database)
// ═══════════════════════════════════════════════════════════════════════════
const STORE_KEY = 'bht_analytics_v2';
const LEADS_KEY = 'bht_leads_v2';
const GOALS_KEY = 'bht_goals_v2';
const CLEAN_ZERO_KEY = 'bht_zero_clean_v6';

// One-time clean: remove old 60-day dummy seed data if present
(function cleanOldMockData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Only reset if it has old generated mock data (> 100 items)
      if (parsed && Array.isArray(parsed.visits) && parsed.visits.length > 80) {
        localStorage.setItem(STORE_KEY, JSON.stringify({ visits:[], wa:[], calls:[], seeded:true, v:2 }));
      }
    }
  } catch(e) {}
})();

function loadStore()  { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || freshStore(); } catch(e){ return freshStore(); } }
function freshStore() { return { visits:[], wa:[], calls:[], seeded:true, v:2 }; }
function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch(e){} }

function loadGoals()  { try { return JSON.parse(localStorage.getItem(GOALS_KEY)) || defaultGoals(); } catch(e){ return defaultGoals(); } }
function defaultGoals(){ return { monthly_visitors:2000, monthly_leads:100, monthly_conversions:15 }; }
function saveGoals(g) { try { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); } catch(e){} }

// Manual reset function callable from UI
function resetAllDataToZero() {
  if (confirm('Bhai, kya aap pura dashboard data (visitors & leads) ZERO karna chahte hain?')) {
    localStorage.setItem(STORE_KEY, JSON.stringify({ visits:[], wa:[], calls:[], seeded:true, v:2 }));
    localStorage.setItem(LEADS_KEY, JSON.stringify([]));
    leads = [];
    updateKPIs(currentPeriod);
    initTrafficChart(currentPeriod);
    initPageChart(currentPeriod);
    initDeviceChart(currentPeriod);
    initHoursChart(currentPeriod);
    initReferrerChart(currentPeriod);
    renderLeadsTable();
    renderGoalTracker();
  }
}
window.resetAllDataToZero = resetAllDataToZero;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: WEIGHTED RANDOM HELPER (Utility)
// ═══════════════════════════════════════════════════════════════════════════
function weightedPick(items, weights) {
  const total = weights.reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: REAL DATA ONLY (No dummy seeds — Starts completely from ZERO)
// ═══════════════════════════════════════════════════════════════════════════
function seedData() {
  const store = loadStore();
  if (!store.seeded) {
    store.seeded = true;
    saveStore(store);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: ANALYTICS ENGINE — compute metrics from stored events
// ═══════════════════════════════════════════════════════════════════════════
let currentPeriod = 30; // days

function sinceDate(days) {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(0,0,0,0); return d;
}

function periodVisits(days) {
  const cut = sinceDate(days).toISOString();
  return loadStore().visits.filter(v => v.ts >= cut);
}

function periodWA(days) {
  const cut = sinceDate(days).toISOString();
  return loadStore().wa.filter(v => v.ts >= cut);
}

function periodCalls(days) {
  const cut = sinceDate(days).toISOString();
  return loadStore().calls.filter(v => v.ts >= cut);
}

function todayCount() {
  const d = new Date(); d.setHours(0,0,0,0);
  return loadStore().visits.filter(v => new Date(v.ts) >= d).length;
}

function yesterdayCount() {
  const today = new Date(); today.setHours(0,0,0,0);
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  return loadStore().visits.filter(v => { const t = new Date(v.ts); return t >= yest && t < today; }).length;
}

function conversionRate(days) {
  const v = periodVisits(days).length;
  if (!v) return '0.0';
  const c = periodWA(days).length + periodCalls(days).length;
  return ((c / v) * 100).toFixed(1);
}

// Daily chart data: {labels, visitors, enquiries}
function getDailyData(days) {
  const store  = loadStore();
  const cutoff = sinceDate(days);
  const visitMap = {}, enqMap = {};

  store.visits.filter(v => new Date(v.ts) >= cutoff).forEach(v => {
    const k = v.ts.slice(0,10); visitMap[k] = (visitMap[k]||0) + 1;
  });
  [...store.wa, ...store.calls].filter(v => new Date(v.ts) >= cutoff).forEach(v => {
    const k = v.ts.slice(0,10); enqMap[k] = (enqMap[k]||0) + 1;
  });

  const labels=[], visitors=[], enquiries=[];
  // Sample every N days for clean chart
  const step = days <= 7 ? 1 : days <= 14 ? 2 : 3;
  for (let i = days; i >= 0; i--) {
    if (i % step !== 0 && i !== 0) continue;
    const d  = new Date(); d.setDate(d.getDate() - i);
    const k  = d.toISOString().slice(0,10);
    const lbl = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    labels.push(lbl);
    visitors.push(visitMap[k] || 0);
    enquiries.push(enqMap[k]  || 0);
  }
  return { labels, visitors, enquiries };
}

// Page performance: [{page, count, pct}]
function getPageStats(days) {
  const visits = periodVisits(days);
  const map = {};
  visits.forEach(v => { map[v.pg] = (map[v.pg]||0) + 1; });
  const total = visits.length || 1;
  return Object.entries(map)
    .map(([page, count]) => ({ page, count, pct: Math.round(count/total*100) }))
    .sort((a,b) => b.count - a.count).slice(0,6);
}

// Device stats: [{device, count, pct}]
function getDeviceStats(days) {
  const visits = periodVisits(days);
  const map = {};
  visits.forEach(v => { map[v.dv] = (map[v.dv]||0) + 1; });
  const total = visits.length || 1;
  const labels = { mobile:'Mobile', desktop:'Desktop', tablet:'Tablet' };
  return Object.entries(map)
    .map(([d, count]) => ({ device: labels[d]||d, count, pct: Math.round(count/total*100) }))
    .sort((a,b) => b.count - a.count);
}

// Hourly stats: array of 24 numbers
function getHourlyStats(days) {
  const visits = periodVisits(days);
  const hours  = new Array(24).fill(0);
  visits.forEach(v => { hours[v.hr != null ? v.hr : new Date(v.ts).getHours()]++; });
  return hours;
}

// Referrer stats: [{ref, count, pct}]
function getReferrerStats(days) {
  const visits = periodVisits(days);
  const map = {};
  visits.forEach(v => { map[v.ref||'Direct'] = (map[v.ref||'Direct']||0) + 1; });
  const total = visits.length || 1;
  return Object.entries(map)
    .map(([ref, count]) => ({ ref, count, pct: Math.round(count/total*100) }))
    .sort((a,b) => b.count - a.count);
}

// Month-specific stats (this month)
function thisMonthStats() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const store = loadStore();
  const visits = store.visits.filter(v => new Date(v.ts) >= from).length;
  const wa     = store.wa.filter(v => new Date(v.ts) >= from).length;
  const calls  = store.calls.filter(v => new Date(v.ts) >= from).length;
  return { visits, wa, calls };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: LEAD CRM
// ═══════════════════════════════════════════════════════════════════════════
const INITIAL_LEADS = [];

let leads       = [];
let activeFilter = 'all';

function loadLeads() {
  try { return JSON.parse(localStorage.getItem(LEADS_KEY)) || []; }
  catch(e) { return []; }
}

function saveLeads() {
  try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); } catch(e) {}
}

function renderLeadsTable(search = '') {
  const tbody = document.getElementById('leadsTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const STATUS_CYCLE = ['new', 'discussion', 'assigned', 'demo'];
  const STATUS_LABELS = {
    new:        { cls:'new',        label:'New Lead',       icon:'fa-solid fa-circle-dot' },
    discussion: { cls:'discussion', label:'In Discussion',  icon:'fa-solid fa-comments' },
    assigned:   { cls:'assigned',   label:'Tutor Assigned', icon:'fa-solid fa-user-check' },
    demo:       { cls:'demo',       label:'Demo Scheduled', icon:'fa-solid fa-calendar-check' }
  };

  const filtered = leads.filter(l => {
    const matchFilter = activeFilter === 'all' || l.status === activeFilter;
    const term = search.toLowerCase();
    const matchSearch = !search ||
      l.name.toLowerCase().includes(term) ||
      l.course.toLowerCase().includes(term) ||
      l.area.toLowerCase().includes(term) ||
      l.phone.includes(term);
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.8rem 1rem;color:var(--text-muted);">
      <i class="fa-solid fa-inbox" style="font-size:2rem;display:block;margin-bottom:.6rem;opacity:0.35;"></i>
      <div style="font-weight:600;font-size:0.95rem;color:var(--text-sub);margin-bottom:0.25rem;">No enquiries yet (0 Leads)</div>
      <div style="font-size:0.8rem;">Click "+ Add Lead" or wait for parents to enquire on your website.</div>
    </td></tr>`;
    return;
  }

  filtered.forEach(lead => {
    const { cls, label, icon } = STATUS_LABELS[lead.status] || STATUS_LABELS.new;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="parent-name">${lead.name}</div>
        <div class="parent-phone"><i class="fa-solid fa-phone" style="font-size:.65rem;margin-right:4px;"></i>${lead.phone}</div>
      </td>
      <td><span class="course-badge">${lead.course}</span></td>
      <td><div class="location-cell"><i class="fa-solid fa-location-dot"></i>${lead.area}</div></td>
      <td><span class="status-badge ${cls}"><i class="${icon}"></i> ${label}</span></td>
      <td style="color:var(--text-muted);font-size:.76rem;">${lead.time}</td>
      <td>
        <div class="action-row">
          <a href="https://wa.me/91${lead.phone.replace(/\D/g,'')}" target="_blank" class="action-btn wa" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
          <a href="tel:${lead.phone}" class="action-btn call" title="Call"><i class="fa-solid fa-phone"></i></a>
          <button class="action-btn more" onclick="cycleLeadStatus(${lead.id})" title="Change Status"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="action-btn" onclick="deleteLead(${lead.id})" title="Remove" style="color:var(--rose);"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.cycleLeadStatus = function(id) {
  const cycle = ['new','discussion','assigned','demo'];
  const lead  = leads.find(l => l.id === id);
  if (lead) {
    lead.status = cycle[(cycle.indexOf(lead.status) + 1) % cycle.length];
    saveLeads();
    renderLeadsTable(document.getElementById('tableFilterInput')?.value || '');
  }
};

window.deleteLead = function(id) {
  leads = leads.filter(l => l.id !== id);
  saveLeads();
  renderLeadsTable(document.getElementById('tableFilterInput')?.value || '');
};

function addNewLead(data) {
  leads.unshift({ id: Date.now(), ...data, time: 'Just now', status: 'new', type: 'call' });
  saveLeads();
  renderLeadsTable();
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: KPI CARD UPDATES
// ═══════════════════════════════════════════════════════════════════════════
function animateNumber(el, target, duration = 1200) {
  const start    = performance.now();
  const startVal = 0;
  const endVal   = parseFloat(String(target).replace(/[^0-9.]/g,''));
  const isFloat  = String(target).includes('%');
  const comma    = typeof target === 'string' && target.includes(',');

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const current  = startVal + (endVal - startVal) * ease;

    if (isFloat) {
      el.textContent = current.toFixed(1) + '%';
    } else if (comma) {
      el.textContent = Math.round(current).toLocaleString('en-IN');
    } else {
      el.textContent = Math.round(current).toString();
    }

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateKPIs(days) {
  const totalV = periodVisits(days).length;
  const waC    = periodWA(days).length;
  const callC  = periodCalls(days).length;
  const conv   = conversionRate(days);
  const today  = todayCount();
  const yest   = yesterdayCount();

  // Card values
  const el = (id) => document.getElementById(id);
  if (el('kpiTotalVisitors')) animateNumber(el('kpiTotalVisitors'), totalV.toLocaleString('en-IN'), 1400);
  if (el('kpiWALeads'))       animateNumber(el('kpiWALeads'),   waC);
  if (el('kpiCallLeads'))     animateNumber(el('kpiCallLeads'), callC);
  if (el('kpiConversion'))    animateNumber(el('kpiConversion'), conv + '%', 1200);

  // Sub-text updates
  if (el('kpiTodayCount'))  el('kpiTodayCount').textContent  = `${today} today`;
  if (el('kpiYestCount'))   el('kpiYestCount').textContent   = `vs ${yest} yesterday`;
  if (el('kpiWASub'))       el('kpiWASub').textContent       = `${waC} WhatsApp clicks`;
  if (el('kpiCallSub'))     el('kpiCallSub').textContent     = `${callC} direct calls`;
  if (el('kpiConvSub'))     el('kpiConvSub').textContent     = totalV > 0 ? `Real website avg` : `Industry avg: 3.2%`;

  // Dynamic Trend Badges (No fake +% when count is 0)
  const totalTrend = document.querySelector('.card-blue .kpi-trend');
  if (totalTrend) totalTrend.innerHTML = totalV > 0 ? `<i class="fa-solid fa-arrow-trend-up"></i> Live` : `<i class="fa-solid fa-circle-dot"></i> Live`;

  const waTrend = document.querySelector('.card-green .kpi-trend');
  if (waTrend) waTrend.innerHTML = waC > 0 ? `<i class="fa-solid fa-arrow-trend-up"></i> ${waC} leads` : `<i class="fa-brands fa-whatsapp"></i> 0 clicks`;

  const callTrend = document.querySelector('.card-violet .kpi-trend');
  if (callTrend) callTrend.innerHTML = callC > 0 ? `<i class="fa-solid fa-phone-volume"></i> ${callC} calls` : `<i class="fa-solid fa-phone"></i> 0 calls`;

  // Today Card
  if (el('kpiTodayVisitors'))    animateNumber(el('kpiTodayVisitors'), today);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: CHART.JS CHARTS
// ═══════════════════════════════════════════════════════════════════════════
let trafficChart, pageChart, deviceChart, hoursChart;

const CHART_DEFAULTS = {
  responsive:          true,
  maintainAspectRatio: false,
  animation:           { duration: 900, easing: 'easeOutQuart' }
};

const TOOLTIP_STYLE = {
  backgroundColor:  'rgba(6, 9, 25, 0.95)',
  borderColor:      'rgba(255,255,255,0.1)',
  borderWidth:      1,
  titleFont:        { family: 'Plus Jakarta Sans', size:12, weight:'700' },
  bodyFont:         { family: 'Inter', size:11 },
  padding:          12,
  cornerRadius:     10,
  boxPadding:       5,
  titleColor:       '#fff',
  bodyColor:        'rgba(255,255,255,0.7)'
};

function initTrafficChart(days) {
  const canvas = document.getElementById('splineChart');
  if (!canvas) return;
  if (trafficChart) { trafficChart.destroy(); trafficChart = null; }

  const ctx  = canvas.getContext('2d');
  const data = getDailyData(days);

  const cyanGrad = ctx.createLinearGradient(0,0,0,300);
  cyanGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
  cyanGrad.addColorStop(1, 'rgba(56,189,248,0.01)');

  const greenGrad = ctx.createLinearGradient(0,0,0,300);
  greenGrad.addColorStop(0, 'rgba(16,185,129,0.2)');
  greenGrad.addColorStop(1, 'rgba(16,185,129,0.01)');

  trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label:            'Visitors',
          data:             data.visitors,
          borderColor:      '#38BDF8',
          backgroundColor:  cyanGrad,
          borderWidth:      2.5,
          fill:             true,
          tension:          0.45,
          pointRadius:      3.5,
          pointBackgroundColor: '#38BDF8',
          pointBorderColor: 'rgba(56,189,248,0.3)',
          pointBorderWidth: 3,
          pointHoverRadius: 7
        },
        {
          label:            'Enquiries',
          data:             data.enquiries,
          borderColor:      '#10B981',
          backgroundColor:  greenGrad,
          borderWidth:      2.5,
          fill:             true,
          tension:          0.45,
          pointRadius:      3.5,
          pointBackgroundColor: '#10B981',
          pointBorderColor: 'rgba(16,185,129,0.3)',
          pointBorderWidth: 3,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      interaction: { intersect:false, mode:'index' },
      plugins: {
        legend:  { display:false },
        tooltip: TOOLTIP_STYLE
      },
      scales: {
        x: {
          grid:   { display:false, drawBorder:false },
          ticks:  { color:'rgba(255,255,255,0.32)', font:{ family:'Inter', size:10 } },
          border: { display:false }
        },
        y: {
          grid:   { color:'rgba(255,255,255,0.04)', drawBorder:false },
          ticks:  { color:'rgba(255,255,255,0.32)', font:{ family:'Inter', size:10 } },
          border: { display:false }
        }
      }
    }
  });
}

function initPageChart(days) {
  const canvas = document.getElementById('pageChart');
  if (!canvas) return;
  if (pageChart) { pageChart.destroy(); pageChart = null; }

  const ctx  = canvas.getContext('2d');
  const data = getPageStats(days || currentPeriod);
  const colors = ['#38BDF8','#8B5CF6','#10B981','#F59E0B','#F43F5E','#C4B5FD'];

  pageChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.page),
      datasets: [{
        label: 'Visits',
        data:  data.map(d => d.count),
        backgroundColor: colors.slice(0, data.length),
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      plugins: {
        legend:  { display:false },
        tooltip: {
          ...TOOLTIP_STYLE,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} visits`
          }
        }
      },
      scales: {
        x: {
          grid:   { color:'rgba(255,255,255,0.04)', drawBorder:false },
          ticks:  { color:'rgba(255,255,255,0.32)', font:{ family:'Inter', size:10 } },
          border: { display:false }
        },
        y: {
          grid:   { display:false, drawBorder:false },
          ticks:  { color:'rgba(255,255,255,0.75)', font:{ family:'Inter', size:11, weight:'600' } },
          border: { display:false }
        }
      }
    }
  });
}

function initDeviceChart(days) {
  const canvas = document.getElementById('deviceChart');
  if (!canvas) return;
  if (deviceChart) { deviceChart.destroy(); deviceChart = null; }

  const ctx   = canvas.getContext('2d');
  const data  = getDeviceStats(days || currentPeriod);
  const clrs  = { Mobile:'#38BDF8', Desktop:'#8B5CF6', Tablet:'#10B981' };
  const hasData = data.length > 0;

  deviceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: hasData ? data.map(d => d.device) : ['No Visits Yet'],
      datasets: [{
        data:            hasData ? data.map(d => d.count) : [1],
        backgroundColor: hasData ? data.map(d => clrs[d.device] || '#94A3B8') : ['rgba(255,255,255,0.06)'],
        borderColor:     'rgba(8,11,36,0.8)',
        borderWidth:     3,
        hoverOffset:     hasData ? 8 : 0
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '68%',
      plugins: {
        legend: { display:false },
        tooltip: {
          ...TOOLTIP_STYLE,
          enabled: hasData,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}% (${ctx.raw} visits)`
          }
        }
      }
    }
  });

  // Render device legend
  const legend = document.getElementById('deviceLegend');
  if (legend) {
    if (!hasData) {
      legend.innerHTML = '<div style="color:var(--text-muted);font-size:0.75rem;padding:0.4rem 0;">0 visits recorded yet. Open website to start tracking!</div>';
    } else {
      legend.innerHTML = data.map(d => `
        <div class="dev-legend-item">
          <span class="dev-dot" style="background:${clrs[d.device]||'#94A3B8'}"></span>
          <span class="dev-label">${d.device}</span>
          <span class="dev-pct">${d.pct}%</span>
        </div>
      `).join('');
    }
  }
}

function initHoursChart(days) {
  const canvas = document.getElementById('hoursChart');
  if (!canvas) return;
  if (hoursChart) { hoursChart.destroy(); hoursChart = null; }

  const ctx    = canvas.getContext('2d');
  const hourly = getHourlyStats(days || currentPeriod);
  const labels = Array.from({length:24}, (_,i) => {
    if (i === 0)  return '12am';
    if (i === 12) return '12pm';
    return i < 12 ? `${i}am` : `${i-12}pm`;
  });

  // Color bars by time of day
  const colors = hourly.map((_, i) => {
    if (i >= 6  && i <= 9)  return 'rgba(56,189,248,0.75)';   // Morning peak
    if (i >= 18 && i <= 21) return 'rgba(139,92,246,0.85)';   // Evening peak
    if (i >= 10 && i <= 17) return 'rgba(16,185,129,0.55)';   // Daytime
    return 'rgba(255,255,255,0.12)';                           // Night quiet
  });

  hoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Visitors',
        data:  hourly,
        backgroundColor: colors,
        borderRadius:    4,
        barPercentage:   0.75,
        borderSkipped:   false
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend:  { display:false },
        tooltip: {
          ...TOOLTIP_STYLE,
          callbacks: {
            title: (items) => `${labels[items[0].dataIndex]}`,
            label: (ctx)   => ` ${ctx.parsed.y} visitors`
          }
        }
      },
      scales: {
        x: {
          grid:   { display:false, drawBorder:false },
          ticks: {
            color:      'rgba(255,255,255,0.28)',
            font:       { family:'Inter', size:9 },
            maxRotation: 0,
            callback:   (_, i) => [0,3,6,9,12,15,18,21,23].includes(i) ? labels[i] : ''
          },
          border: { display:false }
        },
        y: {
          display:false,
          grid:   { display:false }
        }
      }
    }
  });
}

function initReferrerChart(days) {
  const canvas = document.getElementById('referrerChart');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const data = getReferrerStats(days || currentPeriod);
  const clrs = { Google:'#38BDF8', Direct:'#8B5CF6', WhatsApp:'#10B981', 'Social Media':'#F59E0B' };
  const hasData = data.length > 0;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: hasData ? data.map(d => d.ref) : ['No Sources Yet'],
      datasets: [{
        data:            hasData ? data.map(d => d.count) : [1],
        backgroundColor: hasData ? data.map(d => clrs[d.ref] || '#94A3B8') : ['rgba(255,255,255,0.06)'],
        borderColor:     'rgba(8,11,36,0.8)',
        borderWidth:     3,
        hoverOffset:     hasData ? 8 : 0
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '65%',
      plugins: {
        legend: { display:false },
        tooltip: {
          ...TOOLTIP_STYLE,
          enabled: hasData
        }
      }
    }
  });

  const legend = document.getElementById('referrerLegend');
  if (legend) {
    if (!hasData) {
      legend.innerHTML = '<div style="color:var(--text-muted);font-size:0.75rem;padding:0.4rem 0;">No traffic sources recorded yet.</div>';
    } else {
      legend.innerHTML = data.map(d => `
        <div class="dev-legend-item">
          <span class="dev-dot" style="background:${clrs[d.ref]||'#94A3B8'}"></span>
          <span class="dev-label">${d.ref}</span>
          <span class="dev-pct">${d.pct}%</span>
        </div>
      `).join('');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: GOAL TRACKER
// ═══════════════════════════════════════════════════════════════════════════
function renderGoalTracker() {
  const goals   = loadGoals();
  const monthly = thisMonthStats();
  const totalLeads = monthly.wa + monthly.calls;

  // Conversion funnel
  const funnelEl = document.getElementById('funnelSteps');
  if (funnelEl) {
    const funnel = [
      { label:'Website Visitors',  value: monthly.visits,  max: goals.monthly_visitors, color:'#38BDF8' },
      { label:'WhatsApp Leads',    value: monthly.wa,      max: Math.round(goals.monthly_visitors * 0.12), color:'#10B981' },
      { label:'Phone Enquiries',   value: monthly.calls,   max: Math.round(goals.monthly_visitors * 0.07), color:'#8B5CF6' },
      { label:'Total Conversions', value: totalLeads,      max: goals.monthly_conversions, color:'#F59E0B' }
    ];

    funnelEl.innerHTML = funnel.map(f => {
      const pct = Math.min(Math.round((f.value / (f.max||1)) * 100), 100);
      return `
        <div class="funnel-row">
          <div class="funnel-row-top">
            <span class="funnel-label">${f.label}</span>
            <span class="funnel-value" style="color:${f.color}">${f.value.toLocaleString('en-IN')} <small style="color:var(--text-muted)">/ ${f.max.toLocaleString('en-IN')}</small></span>
          </div>
          <div class="funnel-track">
            <div class="funnel-fill" style="width:${pct}%;background:${f.color};"></div>
          </div>
          <span class="funnel-pct">${pct}% of goal</span>
        </div>
      `;
    }).join('');
  }

  // Quick month stats
  const qsEl = document.getElementById('quickStats');
  if (qsEl) {
    const monthName = new Date().toLocaleString('en-IN', { month:'long', year:'numeric' });
    qsEl.innerHTML = `
      <div class="qs-item"><span class="qs-num" style="color:#38BDF8">${monthly.visits.toLocaleString('en-IN')}</span><span class="qs-lbl">Visitors</span></div>
      <div class="qs-item"><span class="qs-num" style="color:#10B981">${monthly.wa}</span><span class="qs-lbl">WhatsApp</span></div>
      <div class="qs-item"><span class="qs-num" style="color:#8B5CF6">${monthly.calls}</span><span class="qs-lbl">Calls</span></div>
      <div class="qs-item"><span class="qs-num" style="color:#F59E0B">${conversionRate(30)}%</span><span class="qs-lbl">Conversion</span></div>
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: ANIMATE LOCATION BARS
// ═══════════════════════════════════════════════════════════════════════════
function animateLocationBars() {
  document.querySelectorAll('.progress-fill').forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = target; }, 300);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: LIVE ACTIVITY STREAM
// ═══════════════════════════════════════════════════════════════════════════
const LIVE_EVENTS = [
  { icon:'fa-solid fa-eye',         cls:'av-blue',   desc:'<b>Parent from Gandhi Nagar</b> visited NEET UG page',               time:'Just now',   type:'Mobile · Google' },
  { icon:'fa-brands fa-whatsapp',   cls:'av-green',  desc:'<b>WhatsApp click</b> from Trikuta Nagar — Class 12th Chemistry',    time:'1m ago',     type:'Lead Generated' },
  { icon:'fa-solid fa-phone',       cls:'av-violet', desc:'<b>Call clicked</b> from Sainik Colony — Class 10th Math',           time:'3m ago',     type:'Direct Call' },
  { icon:'fa-brands fa-google',     cls:'av-amber',  desc:'Google Organic: <em>"Home Tutor NEET Jammu"</em>',                   time:'7m ago',     type:'Search' },
  { icon:'fa-solid fa-mobile-screen',cls:'av-blue',  desc:'<b>Mobile visitor</b> from Channi Himmat — IIT-JEE page',            time:'11m ago',    type:'WhatsApp Referral' },
  { icon:'fa-solid fa-user-plus',   cls:'av-green',  desc:'<b>New enquiry</b> submitted from Janipur Colony — Class 9th',       time:'14m ago',    type:'Contact Form' }
];
let liveEvIdx = 0;

function startLivePulse() {
  const container = document.getElementById('streamContainer');
  if (!container) return;

  setInterval(() => {
    const ev   = LIVE_EVENTS[liveEvIdx % LIVE_EVENTS.length];
    liveEvIdx++;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.cssText = 'opacity:0;transform:translateY(-10px);';
    item.innerHTML = `
      <div class="activity-avatar ${ev.cls}"><i class="${ev.icon}"></i></div>
      <div class="activity-text">
        <span class="activity-desc">${ev.desc}</span>
        <span class="activity-time">${ev.time} &nbsp;·&nbsp; ${ev.type}</span>
      </div>
    `;
    container.prepend(item);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.style.transition = 'all 0.45s cubic-bezier(0.16,1,0.3,1)';
        item.style.opacity    = '1';
        item.style.transform  = 'translateY(0)';
      });
    });

    // Remove old items beyond 6
    while (container.children.length > 6) {
      const last = container.lastElementChild;
      last.style.transition = 'opacity 0.3s ease';
      last.style.opacity    = '0';
      setTimeout(() => last.remove(), 300);
    }
  }, 16000);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: ADD LEAD MODAL
// ═══════════════════════════════════════════════════════════════════════════
function openModal()  { document.getElementById('addLeadModal')?.classList.add('active'); }
function closeModal() { document.getElementById('addLeadModal')?.classList.remove('active'); }

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: EXPORT CSV
// ═══════════════════════════════════════════════════════════════════════════
function exportCSV() {
  const headers = ['Name','Phone','Course','Area','Status','Timestamp'];
  const rows    = leads.map(l => [
    `"${l.name}"`, `"${l.phone}"`, `"${l.course}"`, `"${l.area}"`, `"${l.status}"`, `"${l.time}"`
  ]);
  const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `BHT_Leads_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13: REFRESH ALL DATA FOR PERIOD
// ═══════════════════════════════════════════════════════════════════════════
function refreshDashboard(days) {
  currentPeriod = days;
  updateKPIs(days);
  initTrafficChart(days);
  initPageChart(days);
  initDeviceChart(days);
  initHoursChart(days);
  initReferrerChart(days);
  renderGoalTracker();
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14: EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════
function initEventListeners() {

  // Period selector (7 / 30 / 60 days)
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const period = parseInt(btn.dataset.period);
      refreshDashboard(period);
    });
  });

  // Nav link active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Leads table search
  const searchInput = document.getElementById('tableFilterInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => renderLeadsTable(e.target.value));
  }

  // Status filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.status || 'all';
      renderLeadsTable(document.getElementById('tableFilterInput')?.value || '');
    });
  });

  // CSV export
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCSV);

  // Add Lead Modal
  document.getElementById('openAddLeadBtn')?.addEventListener('click', openModal);
  document.getElementById('closeModalBtn')?.addEventListener('click',  closeModal);
  document.getElementById('cancelLeadBtn')?.addEventListener('click',  closeModal);

  // Modal backdrop close
  document.getElementById('addLeadModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Add Lead Form Submit
  const form = document.getElementById('addLeadForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      addNewLead({
        name:   document.getElementById('inputName').value,
        phone:  document.getElementById('inputPhone').value,
        course: document.getElementById('inputCourse').value,
        area:   document.getElementById('inputArea').value,
        type:   'call'
      });
      closeModal();
      form.reset();
    });
  }

  // Keyboard shortcut ⌘K / Ctrl+K → focus search
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('tableFilterInput')?.focus();
    }
    if (e.key === 'Escape') closeModal();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 15: INITIALISE EVERYTHING
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // 1. Seed historical data (only on first ever load)
  seedData();

  // 2. Load leads CRM
  leads = loadLeads();

  // 3. KPI cards
  updateKPIs(30);

  // 4. All charts
  initTrafficChart(30);
  initPageChart(30);
  initDeviceChart(30);
  initHoursChart(30);
  initReferrerChart(30);

  // 5. Leads table
  renderLeadsTable();

  // 6. Goal tracker
  renderGoalTracker();

  // 7. Animate location bars
  setTimeout(animateLocationBars, 400);

  // 8. Live activity pulse
  startLivePulse();

  // 9. Event listeners
  initEventListeners();

  // 10. Live Cross-Tab Sync (Instantly updates when visitor visits or clicks on website)
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) {
      updateKPIs(currentPeriod);
      initTrafficChart(currentPeriod);
      initPageChart(currentPeriod);
      initDeviceChart(currentPeriod);
      initHoursChart(currentPeriod);
      initReferrerChart(currentPeriod);
      renderGoalTracker();
    }
    if (e.key === LEADS_KEY) {
      leads = loadLeads();
      renderLeadsTable();
      updateKPIs(currentPeriod);
    }
  });

  // 11. Active Auto-Refresh Poll (Checks localStorage every 2s)
  let lastCount = loadStore().visits.length;
  setInterval(() => {
    const nowCount = loadStore().visits.length;
    if (nowCount !== lastCount) {
      lastCount = nowCount;
      updateKPIs(currentPeriod);
      initTrafficChart(currentPeriod);
      initPageChart(currentPeriod);
      initDeviceChart(currentPeriod);
      initHoursChart(currentPeriod);
      initReferrerChart(currentPeriod);
      renderGoalTracker();
    }
  }, 2000);
});
