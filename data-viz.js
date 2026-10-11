// CatalystOS shared data visualization builder.
// Usage in any app:
//   <script src="./data-viz.js"></script>
//   const result = await CatalystDataViz.open({ clientId, app: 'Fact Sheet Builder' });
//   // result = { dataSource, image } or null if cancelled. dataSource is saved to the client's library.
// Or embed inline: const el = document.createElement('catalyst-data-viz'); el.brand = {...}; el.value = ds;
//   el.addEventListener('change', (e) => save(e.detail));
(function () {
  if (window.CatalystDataViz) return;
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || location.href;
  const CHART_JS = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
  const XLSX_JS = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const FALLBACK = ['#6818F8', '#FD5920', '#2E9E5B', '#F2A541', '#4977B8', '#C837AB', '#087E8B', '#E94F64'];
  const loaded = {};
  const loadScript = (src) => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  const ensureChart = () => (window.Chart ? Promise.resolve() : loadScript(CHART_JS));
  const ensureXlsx = () => (window.XLSX ? Promise.resolve() : loadScript(XLSX_JS));
  const ensureFont = (family) => {
    if (!family || /^(system-ui|sans-serif|serif|monospace|arial|helvetica|georgia|times|inter|manrope)$/i.test(family)) return;
    const id = 'cdv-font-' + family.replace(/\W+/g, '-');
    if (document.getElementById(id)) return;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + family.trim().replace(/\s+/g, '+') + ':wght@400;500;600;700;800&display=swap';
    document.head.appendChild(l);
  };
  const stable = (v) => {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  };
  const clone = (v) => JSON.parse(JSON.stringify(v || {}));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const hexA = (hex, a) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || '') || [];
    return 'rgba(' + parseInt(m[1] || '68', 16) + ',' + parseInt(m[2] || '18', 16) + ',' + parseInt(m[3] || 'f8', 16) + ',' + a + ')';
  };
  const M = (headers, rows) => ({ headers, rows });

  const TYPES = [
    { key: 'Bar Chart', group: 'Compare', engine: 'bar', hint: 'First column = categories. Each other column = a series.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="11" width="3.5" height="10"/><rect x="10.25" y="5" width="3.5" height="16"/><rect x="15.5" y="14" width="3.5" height="7"/>', sample: M(['Month', 'Revenue'], [['Jan', '32'], ['Feb', '48'], ['Mar', '41'], ['Apr', '55'], ['May', '62']]) },
    { key: 'Horizontal Bar', group: 'Compare', engine: 'hbar', hint: 'First column = categories. Each other column = a series.', icon: '<line x1="3" y1="3" x2="3" y2="21"/><rect x="3" y="5" width="13" height="3.5"/><rect x="3" y="10.25" width="18" height="3.5"/><rect x="3" y="15.5" width="8" height="3.5"/>', sample: M(['Channel', 'Leads'], [['LinkedIn', '120'], ['Email', '86'], ['Search', '64'], ['Events', '41']]) },
    { key: 'Stacked Bar Chart', group: 'Compare', engine: 'stacked', hint: 'First column = categories. Each other column stacks on top.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="6" y="13" width="4" height="8"/><rect x="6" y="7" width="4" height="6" fill="currentColor"/><rect x="14" y="15" width="4" height="6"/><rect x="14" y="9" width="4" height="6" fill="currentColor"/>', sample: M(['Quarter', 'Product A', 'Product B'], [['Q1', '20', '14'], ['Q2', '26', '18'], ['Q3', '31', '22'], ['Q4', '38', '25']]) },
    { key: 'Combo (Bar + Line)', group: 'Compare', engine: 'combo', hint: 'Column 2 = bars. Columns 3+ = lines on a second axis.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="13" width="3" height="8"/><rect x="10.5" y="10" width="3" height="11"/><rect x="16" y="12" width="3" height="9"/><polyline points="4,9 9,6 14,8 20,3"/>', sample: M(['Month', 'Revenue', 'Growth %'], [['Jan', '32', '4'], ['Feb', '48', '9'], ['Mar', '41', '6'], ['Apr', '55', '12']]) },
    { key: 'Waterfall', group: 'Compare', engine: 'waterfall', hint: 'First row = starting value. Following rows = positive or negative changes.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><rect x="4" y="12" width="3" height="9"/><rect x="8.5" y="7" width="3" height="5" fill="currentColor"/><rect x="13" y="7" width="3" height="4"/><rect x="17.5" y="11" width="3" height="10" fill="currentColor"/>', sample: M(['Step', 'Change'], [['Start', '100'], ['New sales', '40'], ['Churn', '-18'], ['Upsell', '22'], ['Costs', '-30']]) },
    { key: 'Line Chart', group: 'Trend', engine: 'line', hint: 'First column = time or categories. Each other column = a line.', icon: '<polyline points="3,18 9,10 14,14 21,5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/>', sample: M(['Month', 'Visitors', 'Signups'], [['Jan', '1200', '140'], ['Feb', '1500', '190'], ['Mar', '1420', '210'], ['Apr', '1880', '260'], ['May', '2100', '310']]) },
    { key: 'Area Chart', group: 'Trend', engine: 'area', hint: 'First column = time or categories. Each other column = a filled area.', icon: '<path d="M3 18 L9 10 L14 14 L21 5 L21 21 L3 21 Z" fill="currentColor" opacity="0.25"/><polyline points="3,18 9,10 14,14 21,5"/>', sample: M(['Month', 'Users'], [['Jan', '420'], ['Feb', '610'], ['Mar', '580'], ['Apr', '790'], ['May', '940']]) },
    { key: 'Pie Chart', group: 'Composition', engine: 'pie', hint: 'First column = segment names. Second column = values.', icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5 L12 12 L19.5 8 A8.5 8.5 0 0 0 12 3.5 Z" fill="currentColor"/>', sample: M(['Segment', 'Share'], [['Enterprise', '45'], ['Mid-market', '30'], ['SMB', '25']]) },
    { key: 'Donut Chart', group: 'Composition', engine: 'doughnut', hint: 'First column = segment names. Second column = values.', icon: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12 L15.5 12 A3.5 3.5 0 0 0 12 8.5 Z" fill="currentColor"/>', sample: M(['Segment', 'Share'], [['Equities', '55'], ['Fixed income', '30'], ['Cash', '15']]) },
    { key: 'Polar Area', group: 'Composition', engine: 'polarArea', hint: 'First column = categories. Second column = values.', icon: '<path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="currentColor"/><path d="M12 12 L18 12 A6 6 0 0 1 12 18 Z"/><path d="M12 12 L12 16 A4 4 0 0 1 8 12 Z"/><path d="M12 12 L5 12 A7 7 0 0 1 12 5 Z"/>', sample: M(['Region', 'Sales'], [['North', '32'], ['South', '21'], ['East', '28'], ['West', '17']]) },
    { key: 'Funnel', group: 'Composition', engine: 'funnel', hint: 'First column = stage names, top to bottom. Second column = counts.', icon: '<rect x="3" y="4" width="18" height="3.5"/><rect x="5.5" y="10.25" width="13" height="3.5"/><rect x="8.5" y="16.5" width="7" height="3.5"/>', sample: M(['Stage', 'Count'], [['Visitors', '12000'], ['Leads', '3400'], ['Qualified', '1200'], ['Opportunities', '420'], ['Customers', '130']]) },
    { key: 'Radar', group: 'Relationship', engine: 'radar', hint: 'First column = attributes. Each other column = a profile.', icon: '<polygon points="12,3 20.5,9.5 17,20 7,20 3.5,9.5"/><polygon points="12,7 17,10.5 15,17 9,16 6.5,10.5" fill="currentColor" opacity="0.35"/>', sample: M(['Attribute', 'Us', 'Competitor'], [['Price', '7', '5'], ['Quality', '9', '6'], ['Support', '8', '7'], ['Speed', '6', '8'], ['Brand', '8', '6']]) },
    { key: 'Scatter Plot', group: 'Relationship', engine: 'scatter', hint: 'First column = X values. Each other column = Y values.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="21" x2="3" y2="3"/><circle cx="7" cy="16" r="1.4" fill="currentColor"/><circle cx="11" cy="10" r="1.4" fill="currentColor"/><circle cx="15" cy="13" r="1.4" fill="currentColor"/><circle cx="18" cy="6" r="1.4" fill="currentColor"/>', sample: M(['Spend', 'Conversions'], [['10', '22'], ['18', '30'], ['25', '28'], ['32', '45'], ['40', '52'], ['48', '49']]) },
    { key: 'Bubble', group: 'Relationship', engine: 'bubble', hint: 'Columns: Label, X, Y, Size.', icon: '<line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="21" x2="3" y2="3"/><circle cx="8" cy="15" r="2.5"/><circle cx="15" cy="9" r="4" fill="currentColor" opacity="0.4"/><circle cx="17" cy="17" r="1.5"/>', sample: M(['Product', 'Price', 'Satisfaction', 'Users'], [['Alpha', '10', '20', '8'], ['Beta', '25', '35', '14'], ['Gamma', '40', '18', '10'], ['Delta', '55', '42', '18']]) },
    { key: 'Heatmap', group: 'Relationship', engine: 'heatmap', hint: 'First column = row labels. Other columns = values for each column heading.', icon: '<rect x="3" y="3" width="6" height="6"/><rect x="9" y="3" width="6" height="6" fill="currentColor"/><rect x="15" y="3" width="6" height="6" opacity="0.5" fill="currentColor"/><rect x="3" y="9" width="6" height="6" fill="currentColor" opacity="0.5"/><rect x="9" y="9" width="6" height="6"/><rect x="15" y="9" width="6" height="6" fill="currentColor"/><rect x="3" y="15" width="6" height="6"/><rect x="9" y="15" width="6" height="6" fill="currentColor" opacity="0.5"/><rect x="15" y="15" width="6" height="6"/>', sample: M(['Day', '9am', '12pm', '3pm', '6pm'], [['Mon', '2', '5', '7', '3'], ['Tue', '3', '6', '8', '4'], ['Wed', '4', '7', '9', '5'], ['Thu', '3', '8', '6', '4'], ['Fri', '1', '4', '5', '2']]) },
    { key: 'KPI / Number', group: 'Single value', engine: 'kpi', hint: 'Columns: Metric, Value, Previous value (optional, shows change).', icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><text x="12" y="15.5" font-size="8" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">42</text>', sample: M(['Metric', 'Value', 'Previous'], [['Total revenue', '1250000', '1080000']]) },
    { key: 'Gauge', group: 'Single value', engine: 'gauge', hint: 'Columns: Metric, Value, Max (defaults to 100).', icon: '<path d="M3.5 17 A8.5 8.5 0 0 1 20.5 17"/><path d="M3.5 17 A8.5 8.5 0 0 1 15 8.6" stroke-width="3.5"/><line x1="12" y1="17" x2="15.5" y2="11"/>', sample: M(['Metric', 'Value', 'Max'], [['Goal progress', '72', '100']]) },
    { key: 'Progress Bars', group: 'Single value', engine: 'progress', hint: 'Columns: Goal, Value, Target (defaults to 100).', icon: '<rect x="3" y="5" width="18" height="3" rx="1.5"/><rect x="3" y="5" width="12" height="3" rx="1.5" fill="currentColor"/><rect x="3" y="11" width="18" height="3" rx="1.5"/><rect x="3" y="11" width="7" height="3" rx="1.5" fill="currentColor"/><rect x="3" y="17" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="15" height="3" rx="1.5" fill="currentColor"/>', sample: M(['Goal', 'Value', 'Target'], [['Pipeline', '78', '100'], ['Signups', '54', '80'], ['NPS', '62', '70']]) },
    { key: 'Table', group: 'Detail', engine: 'table', hint: 'Any columns. First row = headings.', icon: '<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="14.5" x2="21" y2="14.5"/><line x1="10" y1="4" x2="10" y2="20"/>', sample: M(['Account', 'Region', 'Revenue'], [['Northwind', 'East', '42000'], ['Contoso', 'West', '38500'], ['Fabrikam', 'Central', '29900']]) },
  ];
  const TYPE = Object.fromEntries(TYPES.map((t) => [t.key, t]));
  const AXIS = ['bar', 'hbar', 'stacked', 'combo', 'waterfall', 'line', 'area', 'scatter', 'bubble'];
  const CHARTJS = [...AXIS, 'pie', 'doughnut', 'polarArea', 'radar'];
  const LINES = ['line', 'area', 'combo', 'radar'];
  const BARS = ['bar', 'hbar', 'stacked', 'combo', 'waterfall', 'funnel', 'progress'];

  const DEFAULT_STYLE = { palette: null, font: 'body', showTitle: true, showGrid: true, showAxis: true, legend: 'bottom', dataLabels: false, stroke: 2, radius: 6, smooth: true, fill: true, background: 'white', numberFormat: 'plain', decimals: null, prefix: '', suffix: '' };
  const styleOf = (ds) => {
    const s = { ...DEFAULT_STYLE, ...(ds.style || {}) };
    if (!ds.style) {
      if (ds.gridEnabled === false) s.showGrid = false;
      if (ds.axisLabelsEnabled === false) s.showAxis = false;
      if (ds.fillEnabled === false) s.fill = false;
      if (ds.strokeWidth != null) s.stroke = ds.strokeWidth;
      if (ds.chartColors && ds.chartColors.length) s.palette = ds.chartColors;
    }
    return s;
  };
  const normalize = (ds) => ({ ...ds, id: ds.id || 'd' + Date.now(), name: ds.name || '', subtitle: ds.subtitle || '', chartType: TYPE[ds.chartType] ? ds.chartType : '', chartData: ds.chartData || null, style: styleOf(ds) });
  const fmt = (v, s) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!isFinite(n)) return String(v == null ? '' : v);
    const d = s.decimals, o = { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: d == null ? 0 : d };
    let out;
    if (s.numberFormat === 'compact') out = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: d == null ? 1 : d }).format(n);
    else if (s.numberFormat === 'currency') out = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', ...o }).format(n);
    else if (s.numberFormat === 'percent') out = n.toLocaleString(undefined, o) + '%';
    else out = n.toLocaleString(undefined, o);
    return (s.prefix || '') + out + (s.suffix || '');
  };

  const parseDelimited = (text) => {
    const first = text.split(/\r?\n/)[0] || '';
    const delim = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };
  const toGrid = (rows) => {
    rows = (rows || []).filter((r) => r.some((c) => String(c == null ? '' : c).trim() !== ''));
    if (!rows.length) return null;
    const w = Math.max(...rows.map((r) => r.length));
    const pad = (r) => { const a = r.map((c) => String(c == null ? '' : c).trim()); while (a.length < w) a.push(''); return a; };
    return { headers: pad(rows[0]), rows: rows.slice(1).map(pad) };
  };
  const parseFile = async (file) => {
    if (/\.(xlsx|xlsm|xls|ods)$/i.test(file.name)) {
      await ensureXlsx();
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      return toGrid(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }));
    }
    return toGrid(parseDelimited(await file.text()));
  };

  const labelPlugin = {
    id: 'cdvLabels',
    afterDatasetsDraw(chart, args, o) {
      if (!o || !o.enabled) return;
      const ctx = chart.ctx; ctx.save(); ctx.font = '600 11px ' + o.family; ctx.textAlign = 'center';
      chart.data.datasets.forEach((d, di) => {
        const meta = chart.getDatasetMeta(di); if (meta.hidden) return;
        const arc = ['pie', 'doughnut', 'polarArea'].includes(meta.type);
        meta.data.forEach((el, i) => {
          let v = d.data[i]; if (v && typeof v === 'object') v = Array.isArray(v) ? (d.rawDelta ? d.rawDelta[i] : v[1] - v[0]) : v.y;
          const p = el.tooltipPosition();
          ctx.fillStyle = arc ? '#FFFFFF' : o.color; ctx.textBaseline = arc ? 'middle' : 'bottom';
          const horiz = chart.options.indexAxis === 'y';
          if (horiz) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.format(v), p.x + 6, p.y); ctx.textAlign = 'center'; }
          else ctx.fillText(o.format(v), p.x, arc ? p.y : p.y - 5);
        });
      });
      ctx.restore();
    },
  };

  const CSS = `
  :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #081A53; }
  * { box-sizing: border-box; }
  button { font-family: inherit; }
  .lbl { font-size: 11.5px; font-weight: 700; color: #8A93A8; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 8px; }
  .types { display: flex; flex-direction: column; gap: 14px; }
  .group { display: flex; flex-direction: column; gap: 6px; }
  .gname { font-size: 11px; font-weight: 700; color: #59627A; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
  .tile { appearance: none; border: 1px solid rgba(8,26,83,0.14); background: #FFFFFF; color: #59627A; border-radius: 12px; padding: 12px 6px 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: border-color .15s, color .15s, background .15s; }
  .tile:hover { border-color: #6818F8; color: #6818F8; }
  .tile.on { background: #6818F8; border-color: #6818F8; color: #FFFFFF; }
  .tile span { font-size: 11px; font-weight: 600; line-height: 1.2; text-align: center; }
  .chosen { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(104,24,248,0.08); color: #6818F8; }
  .chosen b { font-family: 'Manrope', sans-serif; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .link { appearance: none; border: none; background: none; color: #6818F8; font-weight: 700; font-size: 12.5px; cursor: pointer; padding: 4px 0; }
  .work { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); gap: 18px; margin-top: 16px; align-items: start; }
  @media (max-width: 820px) { .work { grid-template-columns: minmax(0, 1fr); } }
  .frame { border-radius: 14px; padding: 20px; border: 1px solid rgba(8,26,83,0.1); min-height: 300px; display: flex; flex-direction: column; gap: 4px; }
  .vt { font-size: 18px; font-weight: 700; line-height: 1.25; }
  .vs { font-size: 13px; opacity: 0.7; margin-bottom: 10px; }
  .cwrap { position: relative; height: 320px; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .btn { appearance: none; border: 1px solid rgba(8,26,83,0.16); background: #FFFFFF; color: #081A53; border-radius: 8px; padding: 8px 14px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 12.5px; cursor: pointer; }
  .btn:hover { border-color: #6818F8; color: #6818F8; }
  .panel { border: 1px solid rgba(8,26,83,0.1); border-radius: 14px; overflow: hidden; background: #FFFFFF; }
  .tabs { display: flex; border-bottom: 1px solid rgba(8,26,83,0.1); }
  .tab { flex: 1; appearance: none; border: none; background: #F5F7FA; padding: 11px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: #59627A; cursor: pointer; }
  .tab.on { background: #FFFFFF; color: #6818F8; box-shadow: inset 0 -2px 0 #6818F8; }
  .body { padding: 14px; display: flex; flex-direction: column; gap: 14px; max-height: 560px; overflow: auto; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field > span { font-size: 11.5px; font-weight: 700; color: #8A93A8; text-transform: uppercase; letter-spacing: 0.04em; }
  input[type=text], select { width: 100%; border: 1px solid rgba(8,26,83,0.16); border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: inherit; color: #081A53; background: #F5F7FA; }
  .seg { display: flex; background: #F5F7FA; border-radius: 9px; padding: 3px; gap: 3px; }
  .seg button { flex: 1; appearance: none; border: none; background: transparent; border-radius: 7px; padding: 7px 6px; font-size: 12px; font-weight: 700; color: #59627A; cursor: pointer; }
  .seg button.on { background: #FFFFFF; color: #6818F8; box-shadow: 0 1px 3px rgba(8,26,83,0.12); }
  .hint { font-size: 12px; color: #59627A; background: #F5F7FA; border-radius: 8px; padding: 8px 10px; line-height: 1.45; }
  .drop { border: 1.5px dashed rgba(104,24,248,0.45); border-radius: 12px; padding: 22px 14px; text-align: center; cursor: pointer; background: rgba(104,24,248,0.04); display: flex; flex-direction: column; gap: 4px; align-items: center; }
  .drop.over { background: rgba(104,24,248,0.12); }
  .drop b { font-family: 'Manrope', sans-serif; font-size: 14px; color: #6818F8; }
  .drop small { font-size: 12px; color: #59627A; }
  .status { font-size: 12px; font-weight: 600; color: #2E9E5B; }
  .status.err { color: #A32424; }
  .tbl { overflow: auto; border: 1px solid rgba(8,26,83,0.1); border-radius: 8px; max-height: 300px; }
  .tbl table { border-collapse: collapse; width: 100%; }
  .tbl th, .tbl td { border-bottom: 1px solid rgba(8,26,83,0.08); border-right: 1px solid rgba(8,26,83,0.06); padding: 0; position: relative; }
  .tbl input { width: 100%; min-width: 72px; border: none; background: transparent; padding: 7px 8px; font-size: 12.5px; font-family: inherit; color: #081A53; }
  .tbl th input { font-weight: 700; background: #F5F7FA; }
  .tbl input:focus { outline: 2px solid #6818F8; outline-offset: -2px; background: #FFFFFF; }
  .x { appearance: none; border: none; background: none; color: #8A93A8; cursor: pointer; font-size: 12px; padding: 0 6px; }
  .x:hover { color: #A32424; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .sw { width: 28px; height: 28px; border-radius: 7px; cursor: pointer; padding: 0; border: 2px solid transparent; position: relative; }
  .sw.on { border-color: #081A53; }
  .sw.off { opacity: 0.3; }
  .sw i { position: absolute; top: -6px; right: -6px; background: #081A53; color: #FFF; font-style: normal; font-size: 9px; font-weight: 700; width: 15px; height: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .tg { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: #59627A; cursor: pointer; }
  .tg input { accent-color: #6818F8; width: 15px; height: 15px; }
  input[type=range] { accent-color: #6818F8; width: 100%; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .tile { position: relative; }
  .dot { position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border-radius: 50%; background: #2E9E5B; }
  .note { font-size: 12px; color: #59627A; background: #F5F7FA; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; }
  .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .choice { appearance: none; border: 1.5px solid rgba(8,26,83,0.14); background: #FFFFFF; border-radius: 12px; padding: 18px 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #081A53; text-align: center; }
  .choice:hover { border-color: #6818F8; color: #6818F8; }
  .choice b { font-family: 'Manrope', sans-serif; font-size: 14px; }
  .choice small { font-size: 11.5px; color: #59627A; }
  .empty { font-size: 13px; color: #8A93A8; text-align: center; padding: 40px 0; }
  `;

  class CatalystDataViz extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._ds = normalize({}); this._brand = { colors: [] }; this._library = [];
      this._tab = 'data'; this._mode = null; this._picker = false; this._status = null; this._templates = {};
    }
    get isTemplate() { return this.getAttribute('mode') === 'template'; }
    set templates(map) {
      const sig = stable(map || {}); if (sig === this._tplSig) return; this._tplSig = sig; this._templates = clone(map);
      const k = this._ds.chartType;
      if (this.isTemplate && k) { this._ds.style = styleOf({ style: this._templates[k] }); if (this._built) this._render(); }
    }
    get templates() { return clone(this._templates); }
    connectedCallback() { if (!this._built) this._render(); }
    disconnectedCallback() { if (this._chart) { this._chart.destroy(); this._chart = null; } }
    set brand(b) {
      const next = { colors: [], ...(b || {}) }; const sig = stable(next);
      if (sig === this._brandSig) return; this._brandSig = sig; this._brand = next;
      ensureFont(next.headingFont); ensureFont(next.bodyFont);
      if (this._built) { this._renderPreview(); if (this._tab === 'style') this._renderBody(); }
    }
    get brand() { return this._brand; }
    set library(list) {
      const sig = stable(list || []); if (sig === this._libSig) return; this._libSig = sig; this._library = list || [];
      if (this._built && this._tab === 'data') this._renderBody();
    }
    set value(v) {
      const sig = stable(v || {});
      if (sig === this._sig) return;
      this._ds = normalize(clone(v)); this._sig = stable(this._ds);
      if (sig === this._sig && this._built) return;
      this._render();
    }
    get value() { return clone(this._ds); }
    get type() { return TYPE[this._ds.chartType]; }

    _colors() {
      const brand = (this._brand.colors || []).filter(Boolean);
      const p = this._ds.style.palette;
      return (p && p.length) ? p : (brand.length ? brand : FALLBACK);
    }
    _fonts() {
      const h = this._brand.headingFont || 'Manrope', b = this._brand.bodyFont || 'Inter';
      const q = (f) => "'" + f + "', sans-serif";
      return { heading: q(h), body: q(this._ds.style.font === 'heading' ? h : b), headingName: h, bodyName: b };
    }
    _theme() {
      const bg = this._ds.style.background;
      const dark = bg === 'dark';
      return { bg: bg === 'transparent' ? 'transparent' : dark ? (this._brand.darkColor || '#081A53') : bg === 'light' ? '#F5F7FA' : '#FFFFFF', text: dark ? '#FFFFFF' : '#081A53', muted: dark ? 'rgba(255,255,255,0.72)' : '#59627A', grid: dark ? 'rgba(255,255,255,0.14)' : 'rgba(8,26,83,0.08)', dark };
    }
    _emit() {
      this._sig = stable(this._ds);
      if (this.isTemplate) {
        const k = this._ds.chartType; if (!k) return;
        this._templates = { ...this._templates, [k]: clone(this._ds.style) }; this._tplSig = stable(this._templates);
        this.dispatchEvent(new CustomEvent('change', { detail: { templates: this.templates, chartType: k }, bubbles: true, composed: true }));
        return;
      }
      this.dispatchEvent(new CustomEvent('change', { detail: this.value, bubbles: true, composed: true }));
    }
    _set(patch, opts = {}) {
      Object.assign(this._ds, patch);
      if (patch.chartData && !opts.keepSample) delete this._ds.sampleOf;
      opts.full ? this._render() : this._renderPreview();
      if (opts.body) this._renderBody();
      this._emit();
    }
    _setStyle(k, v, rerenderBody) {
      this._ds.style = { ...this._ds.style, [k]: v };
      this._renderPreview(); if (rerenderBody) this._renderBody(); this._emit();
    }
    _selectType(key) {
      const d = this._ds;
      d.chartType = key;
      d.style = styleOf({ style: this._templates[key] });
      if (this.isTemplate) { d.chartData = clone(TYPE[key].sample); d.name = 'Chart title'; d.subtitle = 'Subtitle · sample data'; this._render(); return; }
      this._picker = false; this._tab = 'data'; this._status = null;
      if (!d.chartData) this._mode = null;
      this._render(); this._emit();
    }

    _render() {
      this._built = true;
      const t = this.type;
      const groups = [...new Set(TYPES.map((x) => x.group))];
      const svg = (ic, size) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ic + '</svg>';
      const tpl = this.isTemplate;
      const picker = '<div class="types"><div class="lbl">' + (tpl ? 'Choose a visualization to style' : 'Choose a visualization type') + '</div>' + groups.map((g) => '<div class="group"><div class="gname">' + g + '</div><div class="grid">' +
        TYPES.filter((x) => x.group === g).map((x) => '<button class="tile' + (t && t.key === x.key ? ' on' : '') + '" data-type="' + esc(x.key) + '" title="' + esc(x.key) + '">' + (tpl && this._templates[x.key] ? '<em class="dot" title="Customized"></em>' : '') + svg(x.icon, 30) + '<span>' + esc(x.key) + '</span></button>').join('') + '</div></div>').join('') + '</div>';
      if (tpl) {
        this.shadowRoot.innerHTML = '<style>' + CSS + '</style>' + picker + (t ?
          '<div class="work"><div><div class="note">Preview uses sample data. Real data is added when this visualization is used in an app.</div><div class="frame" id="frame"><div class="vt" id="vt"></div><div class="vs" id="vs"></div><div id="viz"></div></div></div>' +
          '<div class="panel"><div class="tabs"><div class="tab on" style="cursor:default">' + esc(t.key) + ' · Master style</div></div><div class="body" id="body"></div></div></div>' : '');
        const r0 = this.shadowRoot;
        r0.querySelectorAll('[data-type]').forEach((b) => b.onclick = () => this._selectType(b.dataset.type));
        this._tab = 'style';
        if (t) { this._renderBody(); this._renderPreview(); }
        return;
      }
      const chosen = t ? '<div class="chosen"><b>' + svg(t.icon, 20) + esc(t.key) + '</b><button class="link" data-act="picker">' + (this._picker ? 'Close' : 'Change type') + '</button></div>' : '';
      this.shadowRoot.innerHTML = '<style>' + CSS + '</style>' + (t ? chosen + (this._picker ? '<div style="margin-top:12px">' + picker + '</div>' : '') : picker) +
        (t ? '<div class="work"><div><div class="frame" id="frame"><div class="vt" id="vt"></div><div class="vs" id="vs"></div><div id="viz"></div></div>' +
          '<div class="actions"><button class="btn" data-act="png">Download PNG</button><button class="btn" data-act="csv">Download CSV</button></div></div>' +
          '<div class="panel"><div class="tabs"><button class="tab' + (this._tab === 'data' ? ' on' : '') + '" data-tab="data">Data</button><button class="tab' + (this._tab === 'style' ? ' on' : '') + '" data-tab="style">Style</button></div><div class="body" id="body"></div></div></div>' : '');
      const r = this.shadowRoot;
      r.querySelectorAll('[data-type]').forEach((b) => b.onclick = () => this._selectType(b.dataset.type));
      const pk = r.querySelector('[data-act=picker]'); if (pk) pk.onclick = () => { this._picker = !this._picker; this._render(); };
      r.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { this._tab = b.dataset.tab; r.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b)); this._renderBody(); });
      const png = r.querySelector('[data-act=png]'); if (png) png.onclick = async () => { const url = await this.toImage(); if (url) this._download((this._ds.name || 'chart') + '.png', url); };
      const csv = r.querySelector('[data-act=csv]'); if (csv) csv.onclick = () => this._download((this._ds.name || 'data') + '.csv', 'data:text/csv;charset=utf-8,' + encodeURIComponent(this.toCsv()));
      if (t) { this._renderBody(); this._renderPreview(); }
    }

    _renderBody() {
      const body = this.shadowRoot.getElementById('body'); if (!body) return;
      this._tab === 'style' ? this._renderStyle(body) : this._renderData(body);
    }

    _renderData(body) {
      const d = this._ds, t = this.type;
      const lib = this._library.filter((x) => x && x.chartData && x.id !== d.id);
      if (!d.chartData && this._mode !== 'upload' && this._mode !== 'saved') {
        const ic = (p) => '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
        body.innerHTML = '<div class="lbl" style="margin:0">Add your data</div><div class="hint">' + esc(t.hint) + '</div><div class="choices">' +
          '<button class="choice" data-pick="manual">' + ic('<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="10" y1="4" x2="10" y2="20"/>') + '<b>Enter manually</b><small>Type or paste into a grid</small></button>' +
          '<button class="choice" data-pick="upload">' + ic('<path d="M12 16V4m0 0l-5 5m5-5l5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>') + '<b>Upload a file</b><small>CSV or spreadsheet</small></button></div>' +
          (lib.length ? '<button class="link" data-pick="saved" style="align-self:flex-start">Or use saved data</button>' : '');
        body.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => {
          const m = b.dataset.pick; this._mode = m;
          if (m === 'manual') { const h = TYPE[d.chartType].sample.headers.slice(); d.chartData = { headers: h, rows: [0, 1, 2].map(() => h.map(() => '')) }; this._renderPreview(); this._emit(); }
          this._renderBody();
        });
        return;
      }
      const cd = d.chartData || { headers: TYPE[d.chartType].sample.headers.slice(), rows: [TYPE[d.chartType].sample.headers.map(() => '')] };
      body.innerHTML =
        '<div class="two"><label class="field"><span>Title</span><input type="text" id="f-name" value="' + esc(d.name) + '" placeholder="Chart title"></label>' +
        '<label class="field"><span>Subtitle</span><input type="text" id="f-sub" value="' + esc(d.subtitle) + '" placeholder="Optional"></label></div>' +
        '<div class="seg"><button data-mode="manual" class="' + (this._mode !== 'upload' && this._mode !== 'saved' ? 'on' : '') + '">Enter manually</button><button data-mode="upload" class="' + (this._mode === 'upload' ? 'on' : '') + '">Upload file</button>' + (lib.length ? '<button data-mode="saved" class="' + (this._mode === 'saved' ? 'on' : '') + '">Saved data</button>' : '') + '</div>' +
        '<div class="hint">' + esc(t.hint) + '</div>' +
        (this._status ? '<div class="status' + (this._status.err ? ' err' : '') + '">' + esc(this._status.msg) + '</div>' : '') +
        (this._mode === 'upload'
          ? '<label class="drop" id="drop"><b>Drop a spreadsheet or CSV</b><small>.csv, .tsv, .xlsx, .xls. First row is used as column headings.</small><input type="file" id="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,.ods" hidden></label>'
          : this._mode === 'saved'
            ? '<label class="field"><span>Load data from</span><select id="lib"><option value="">Choose saved data…</option>' + lib.map((x) => '<option value="' + esc(x.id) + '">' + esc(x.name || 'Untitled') + (x.chartType ? ' · ' + esc(x.chartType) : '') + '</option>').join('') + '</select></label>'
            : '<div class="tbl"><table><thead><tr>' + cd.headers.map((h, ci) => '<th><div style="display:flex;align-items:center"><input data-h="' + ci + '" value="' + esc(h) + '">' + (cd.headers.length > 1 ? '<button class="x" data-rc="' + ci + '" title="Remove column">✕</button>' : '') + '</div></th>').join('') + '<th style="width:28px"></th></tr></thead><tbody>' +
              cd.rows.map((row, ri) => '<tr>' + row.map((v, ci) => '<td><input data-r="' + ri + '" data-c="' + ci + '" value="' + esc(v) + '"></td>').join('') + '<td><button class="x" data-rr="' + ri + '" title="Remove row">✕</button></td></tr>').join('') +
              '</tbody></table></div><div class="row"><button class="btn" data-act="addrow">+ Row</button><button class="btn" data-act="addcol">+ Column</button><button class="link" data-act="clear" style="margin-left:auto">Clear all</button></div><div style="font-size:11.5px;color:#8A93A8">Tip: paste cells copied from Excel or Google Sheets into any cell.</div>');
      const q = (s) => body.querySelector(s), qa = (s) => body.querySelectorAll(s);
      q('#f-name').oninput = (e) => { d.name = e.target.value; this._renderPreview(); this._emit(); };
      q('#f-sub').oninput = (e) => { d.subtitle = e.target.value; this._renderPreview(); this._emit(); };
      qa('[data-mode]').forEach((b) => b.onclick = () => { this._mode = b.dataset.mode; this._status = null; if (this._mode === 'manual' && !d.chartData) { const h = TYPE[d.chartType].sample.headers.slice(); d.chartData = { headers: h, rows: [0, 1, 2].map(() => h.map(() => '')) }; this._renderPreview(); this._emit(); } this._renderBody(); });
      const grid = () => (d.chartData = d.chartData || clone(cd));
      let timer;
      const soon = () => { clearTimeout(timer); timer = setTimeout(() => { this._renderPreview(); this._emit(); }, 160); };
      qa('[data-h]').forEach((inp) => inp.oninput = (e) => { grid().headers[+inp.dataset.h] = e.target.value; delete d.sampleOf; soon(); });
      qa('[data-r]').forEach((inp) => {
        inp.oninput = (e) => { grid().rows[+inp.dataset.r][+inp.dataset.c] = e.target.value; delete d.sampleOf; soon(); };
        inp.onpaste = (e) => {
          const text = (e.clipboardData || window.clipboardData).getData('text');
          if (!/[\t\n]/.test(text)) return;
          e.preventDefault();
          const block = parseDelimited(text.replace(/\n$/, '')); const g = grid(); const r0 = +inp.dataset.r, c0 = +inp.dataset.c;
          block.forEach((br, i) => { const ri = r0 + i; while (g.rows.length <= ri) g.rows.push(g.headers.map(() => ''));
            br.forEach((v, j) => { const ci = c0 + j; while (g.headers.length <= ci) { g.headers.push('Series ' + g.headers.length); g.rows.forEach((rr) => rr.push('')); } g.rows[ri][ci] = v.trim(); }); });
          delete d.sampleOf; this._renderBody(); this._renderPreview(); this._emit();
        };
      });
      qa('[data-rr]').forEach((b) => b.onclick = () => { const g = grid(); g.rows.splice(+b.dataset.rr, 1); if (!g.rows.length) g.rows.push(g.headers.map(() => '')); this._set({ chartData: g }, { body: true }); });
      qa('[data-rc]').forEach((b) => b.onclick = () => { const g = grid(), ci = +b.dataset.rc; g.headers.splice(ci, 1); g.rows.forEach((r) => r.splice(ci, 1)); this._set({ chartData: g }, { body: true }); });
      const ar = q('[data-act=addrow]'); if (ar) ar.onclick = () => { const g = grid(); g.rows.push(g.headers.map(() => '')); this._set({ chartData: g }, { body: true }); };
      const ac = q('[data-act=addcol]'); if (ac) ac.onclick = () => { const g = grid(); g.headers.push('Series ' + g.headers.length); g.rows.forEach((r) => r.push('')); this._set({ chartData: g }, { body: true }); };
      const cl = q('[data-act=clear]'); if (cl) cl.onclick = () => { const g = grid(); this._set({ chartData: { headers: g.headers.map(() => ''), rows: [g.headers.map(() => '')] } }, { body: true }); };
      const lb = q('#lib'); if (lb) lb.onchange = () => { const src = lib.find((x) => x.id === lb.value); if (!src) return; this._status = { msg: 'Loaded data from "' + (src.name || 'Untitled') + '".' }; this._mode = 'manual'; this._set({ chartData: clone(src.chartData) }, { body: true }); };
      const drop = q('#drop'), file = q('#file');
      if (drop) {
        const handle = async (f) => {
          if (!f) return;
          try {
            const g = await parseFile(f);
            if (!g) throw new Error('empty');
            d.uploads = [...(d.uploads || []), { id: 'u' + Date.now(), filename: f.name, date: new Date().toLocaleDateString() }];
            this._status = { msg: 'Loaded ' + g.rows.length + ' rows × ' + g.headers.length + ' columns from ' + f.name + '.' };
            this._mode = 'manual';
            this._set({ chartData: g }, { body: true });
          } catch (err) { this._status = { msg: 'Could not read that file. Try a .csv or .xlsx with headings in the first row.', err: true }; this._renderBody(); }
        };
        file.onchange = () => handle(file.files[0]);
        drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
        drop.ondragleave = () => drop.classList.remove('over');
        drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); handle(e.dataTransfer.files[0]); };
      }
    }

    _renderStyle(body) {
      const s = this._ds.style, e = this.type.engine, colors = this._colors();
      const brand = (this._brand.colors || []).filter(Boolean);
      const f = this._fonts();
      const seg = (k, opts) => '<div class="seg">' + opts.map(([v, l]) => '<button data-seg="' + k + '" data-v="' + v + '" class="' + (String(s[k]) === String(v) ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
      const tg = (k, l) => '<label class="tg"><input type="checkbox" data-tg="' + k + '"' + (s[k] ? ' checked' : '') + '>' + l + '</label>';
      const custom = colors.filter((c) => !brand.includes(c));
      body.innerHTML =
        '<div class="field"><span>Colors</span><div class="row">' +
          [...brand, ...custom].map((c) => { const i = colors.indexOf(c); return '<button class="sw ' + (i >= 0 ? 'on' : 'off') + '" data-sw="' + c + '" title="' + c + '" style="background:' + c + '">' + (i >= 0 ? '<i>' + (i + 1) + '</i>' : '') + '</button>'; }).join('') +
          '<label class="sw" title="Add a custom color" style="background:#F5F7FA;border:1px dashed rgba(8,26,83,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;color:#59627A">+<input type="color" id="addc" style="position:absolute;opacity:0;inset:0;cursor:pointer"></label>' +
        '</div><div class="row" style="justify-content:space-between"><small style="font-size:11.5px;color:#8A93A8">' + (brand.length ? 'Brand colors, used in the numbered order.' : 'No brand colors set. Using the default palette.') + '</small>' + (s.palette ? '<button class="link" data-act="resetc">Reset to brand</button>' : '') + '</div></div>' +
        '<div class="field"><span>Font</span>' + seg('font', [['body', esc(f.bodyName) + ' (body)'], ['heading', esc(f.headingName) + ' (heading)']]) + '</div>' +
        '<div class="field"><span>Background</span>' + seg('background', [['white', 'White'], ['light', 'Light'], ['dark', 'Dark'], ['transparent', 'None']]) + '</div>' +
        (CHARTJS.includes(e) ? '<div class="field"><span>Legend</span>' + seg('legend', [['top', 'Top'], ['bottom', 'Bottom'], ['right', 'Right'], ['none', 'Hidden']]) + '</div>' : '') +
        '<div class="field"><span>Show</span><div class="toggles">' + tg('showTitle', 'Title') +
          (AXIS.includes(e) || e === 'radar' || e === 'polarArea' ? tg('showGrid', 'Gridlines') + tg('showAxis', 'Axis labels') : '') +
          (CHARTJS.includes(e) || e === 'heatmap' ? tg('dataLabels', 'Data labels') : '') +
          (LINES.includes(e) ? tg('smooth', 'Smooth lines') + tg('fill', 'Fill area') : '') + '</div></div>' +
        (CHARTJS.includes(e) || e === 'gauge' ? '<label class="field"><span>Line / border width · ' + s.stroke + 'px</span><input type="range" min="0" max="8" step="1" value="' + s.stroke + '" data-rg="stroke"></label>' : '') +
        (BARS.includes(e) ? '<label class="field"><span>Corner radius · ' + s.radius + 'px</span><input type="range" min="0" max="24" step="1" value="' + s.radius + '" data-rg="radius"></label>' : '') +
        '<div class="two"><label class="field"><span>Number format</span><select data-sel="numberFormat">' + [['plain', 'Plain'], ['currency', 'Currency ($)'], ['percent', 'Percent (%)'], ['compact', 'Compact (1.2K)']].map(([v, l]) => '<option value="' + v + '"' + (s.numberFormat === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
        '<label class="field"><span>Decimals</span><select data-sel="decimals">' + [['', 'Auto'], ['0', '0'], ['1', '1'], ['2', '2']].map(([v, l]) => '<option value="' + v + '"' + (String(s.decimals == null ? '' : s.decimals) === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>' +
        '<div class="two"><label class="field"><span>Prefix</span><input type="text" data-tx="prefix" value="' + esc(s.prefix) + '" placeholder="e.g. $"></label><label class="field"><span>Suffix</span><input type="text" data-tx="suffix" value="' + esc(s.suffix) + '" placeholder="e.g. users"></label></div>' +
        '<button class="link" data-act="resetall" style="align-self:flex-start">' + (this.isTemplate ? 'Reset to brand defaults' : 'Reset to brand master style') + '</button>';
      const qa = (x) => body.querySelectorAll(x);
      qa('[data-sw]').forEach((b) => b.onclick = () => {
        const c = b.dataset.sw, cur = this._colors().slice(), i = cur.indexOf(c);
        if (i >= 0) { if (cur.length <= 1) return; cur.splice(i, 1); } else cur.push(c);
        this._setStyle('palette', cur, true);
      });
      const addc = body.querySelector('#addc'); if (addc) addc.onchange = () => this._setStyle('palette', [...this._colors(), addc.value.toUpperCase()], true);
      const rc = body.querySelector('[data-act=resetc]'); if (rc) rc.onclick = () => this._setStyle('palette', null, true);
      body.querySelector('[data-act=resetall]').onclick = () => {
        this._ds.style = this.isTemplate ? { ...DEFAULT_STYLE } : styleOf({ style: this._templates[this._ds.chartType] });
        this._renderPreview(); this._renderBody(); this._emit();
      };
      qa('[data-seg]').forEach((b) => b.onclick = () => this._setStyle(b.dataset.seg, b.dataset.v, true));
      qa('[data-tg]').forEach((b) => b.onchange = () => this._setStyle(b.dataset.tg, b.checked));
      qa('[data-rg]').forEach((b) => b.oninput = () => { this._setStyle(b.dataset.rg, +b.value); b.previousElementSibling.textContent = b.previousElementSibling.textContent.replace(/·.*$/, '· ' + b.value + 'px'); });
      qa('[data-sel]').forEach((b) => b.onchange = () => this._setStyle(b.dataset.sel, b.dataset.sel === 'decimals' ? (b.value === '' ? null : +b.value) : b.value));
      qa('[data-tx]').forEach((b) => b.oninput = () => this._setStyle(b.dataset.tx, b.value));
    }

    _renderPreview() {
      const r = this.shadowRoot, frame = r.getElementById('frame'); if (!frame || !this.type) return;
      const d = this._ds, s = d.style, th = this._theme(), f = this._fonts(), e = this.type.engine;
      frame.style.background = th.bg; frame.style.color = th.text; frame.style.fontFamily = f.body;
      frame.style.borderStyle = s.background === 'transparent' ? 'dashed' : 'solid';
      const vt = r.getElementById('vt'), vs = r.getElementById('vs');
      vt.textContent = s.showTitle ? (d.name || '') : ''; vt.style.fontFamily = f.heading; vt.style.display = s.showTitle && d.name ? '' : 'none';
      vs.textContent = s.showTitle ? (d.subtitle || '') : ''; vs.style.display = s.showTitle && d.subtitle ? '' : 'none';
      const viz = r.getElementById('viz');
      const cd = d.chartData;
      if (!cd || !cd.rows || !cd.rows.length) { if (this._chart) { this._chart.destroy(); this._chart = null; } viz.innerHTML = '<div class="empty">Enter data or upload a file to see your visualization.</div>'; return; }
      if (CHARTJS.includes(e)) {
        if (!viz.querySelector('canvas')) viz.innerHTML = '<div class="cwrap"><canvas></canvas></div>';
        ensureChart().then(() => this._drawChart(viz.querySelector('canvas'))).catch(() => { viz.innerHTML = '<div class="empty">Chart library could not load.</div>'; });
      } else {
        if (this._chart) { this._chart.destroy(); this._chart = null; }
        viz.innerHTML = this._html(e, cd, s, th, f);
      }
    }

    _drawChart(canvas) {
      if (!canvas || !canvas.isConnected) return;
      const d = this._ds, s = d.style, e = this.type.engine, cd = d.chartData, th = this._theme(), f = this._fonts(), colors = this._colors();
      const c = (i) => colors[i % colors.length];
      const font = { family: f.body, size: 12 };
      const labels = cd.rows.map((r) => r[0]);
      const series = cd.headers.slice(1).map((h, i) => ({ label: h || 'Series ' + (i + 1), data: cd.rows.map((r) => num(r[i + 1])) }));
      const tickFmt = (v) => fmt(v, s);
      const axis = (value, extra) => ({ grid: { display: s.showGrid, color: th.grid }, border: { display: s.showAxis, color: th.grid }, ticks: { display: s.showAxis, font, color: th.muted, ...(value ? { callback: tickFmt } : {}) }, ...(extra || {}) });
      const tension = s.smooth ? 0.35 : 0;
      let type = e, data, scales;
      const bar = (sr, i) => ({ ...sr, backgroundColor: series.length === 1 && e !== 'stacked' ? c(0) : c(i), borderColor: c(i), borderWidth: 0, borderRadius: s.radius, maxBarThickness: 64 });
      if (e === 'bar' || e === 'hbar' || e === 'stacked') {
        type = 'bar'; data = { labels, datasets: series.map(bar) };
        const st = e === 'stacked';
        scales = e === 'hbar' ? { x: axis(true), y: axis(false, { grid: { display: false } }) } : { x: axis(false, { stacked: st, grid: { display: false } }), y: axis(true, { stacked: st }) };
      } else if (e === 'combo') {
        type = 'bar';
        data = { labels, datasets: series.map((sr, i) => i === 0 ? { ...bar(sr, 0), order: 2 } : { ...sr, type: 'line', yAxisID: 'y1', borderColor: c(i), backgroundColor: hexA(c(i), 0.18), fill: s.fill, borderWidth: Math.max(1, s.stroke), tension, pointRadius: 3, pointBackgroundColor: c(i), order: 1 }) };
        scales = { x: axis(false, { grid: { display: false } }), y: axis(true) };
        if (series.length > 1) scales.y1 = axis(true, { position: 'right', grid: { display: false } });
      } else if (e === 'waterfall') {
        type = 'bar'; let run = 0; const deltas = [];
        const vals = cd.rows.map((r, i) => { const v = num(r[1]); deltas.push(v); if (i === 0) { run = v; return [0, v]; } const a = run; run += v; return [a, run]; });
        labels.push('Total'); vals.push([0, run]); deltas.push(run);
        data = { labels, datasets: [{ label: cd.headers[1] || 'Change', data: vals, rawDelta: deltas, backgroundColor: vals.map((v, i) => i === 0 || i === vals.length - 1 ? c(0) : deltas[i] >= 0 ? c(1) : c(2)), borderRadius: s.radius, borderSkipped: false, maxBarThickness: 64 }] };
        scales = { x: axis(false, { grid: { display: false } }), y: axis(true) };
      } else if (e === 'line' || e === 'area') {
        type = 'line'; const fill = e === 'area' ? s.fill : false;
        data = { labels, datasets: series.map((sr, i) => ({ ...sr, borderColor: c(i), backgroundColor: fill ? hexA(c(i), 0.22) : c(i), fill: fill ? 'origin' : false, borderWidth: Math.max(1, s.stroke), tension, pointRadius: 3, pointBackgroundColor: c(i) })) };
        scales = { x: axis(false), y: axis(true) };
      } else if (e === 'pie' || e === 'doughnut' || e === 'polarArea') {
        const vals = cd.rows.map((r) => num(r[1]));
        data = { labels, datasets: [{ label: cd.headers[1] || 'Value', data: vals, backgroundColor: vals.map((_, i) => e === 'polarArea' ? hexA(c(i), 0.78) : c(i)), borderColor: th.bg === 'transparent' ? '#FFFFFF' : th.bg, borderWidth: s.stroke }] };
        if (e === 'polarArea') scales = { r: { grid: { display: s.showGrid, color: th.grid }, ticks: { display: s.showAxis, backdropColor: 'transparent', color: th.muted, font, callback: tickFmt } } };
      } else if (e === 'radar') {
        data = { labels, datasets: series.map((sr, i) => ({ ...sr, borderColor: c(i), backgroundColor: s.fill ? hexA(c(i), 0.2) : 'transparent', borderWidth: Math.max(1, s.stroke), pointBackgroundColor: c(i), tension: s.smooth ? 0.2 : 0 })) };
        scales = { r: { grid: { display: s.showGrid, color: th.grid }, angleLines: { display: s.showGrid, color: th.grid }, pointLabels: { font: { ...font, weight: '600' }, color: th.text }, ticks: { display: s.showAxis, backdropColor: 'transparent', color: th.muted, font } } };
      } else if (e === 'scatter') {
        data = { datasets: cd.headers.slice(1).map((h, i) => ({ label: h || 'Series ' + (i + 1), data: cd.rows.map((r) => ({ x: num(r[0]), y: num(r[i + 1]) })), backgroundColor: c(i), borderColor: c(i), pointRadius: 5 })) };
        scales = { x: axis(true, { title: { display: s.showAxis && !!cd.headers[0], text: cd.headers[0], color: th.muted, font } }), y: axis(true) };
      } else if (e === 'bubble') {
        const max = Math.max(1, ...cd.rows.map((r) => num(r[3])));
        data = { datasets: cd.rows.map((r, i) => ({ label: r[0], data: [{ x: num(r[1]), y: num(r[2]), r: 5 + 25 * (num(r[3]) / max) }], backgroundColor: hexA(c(i), 0.7), borderColor: c(i), borderWidth: s.stroke })) };
        scales = { x: axis(true, { title: { display: s.showAxis && !!cd.headers[1], text: cd.headers[1], color: th.muted, font } }), y: axis(true, { title: { display: s.showAxis && !!cd.headers[2], text: cd.headers[2], color: th.muted, font } }) };
      }
      const multi = ['pie', 'doughnut', 'polarArea', 'bubble'].includes(e) || (data.datasets.length > 1);
      const config = {
        type, data, plugins: [labelPlugin],
        options: {
          responsive: true, maintainAspectRatio: false, animation: this._chart ? false : { duration: 350 },
          indexAxis: e === 'hbar' ? 'y' : 'x', cutout: e === 'doughnut' ? '62%' : undefined,
          layout: { padding: s.dataLabels ? { top: 18, right: e === 'hbar' ? 40 : 8 } : 4 },
          plugins: {
            legend: { display: s.legend !== 'none' && multi, position: s.legend === 'none' ? 'bottom' : s.legend, labels: { font, color: th.text, usePointStyle: true, boxWidth: 8, padding: 14 } },
            tooltip: { titleFont: font, bodyFont: font, callbacks: { label: (ctx) => { const raw = ctx.raw; const v = Array.isArray(raw) ? (ctx.dataset.rawDelta ? ctx.dataset.rawDelta[ctx.dataIndex] : raw[1] - raw[0]) : raw && typeof raw === 'object' ? raw.y : raw; return (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + fmt(v, s); } } },
            cdvLabels: { enabled: s.dataLabels, family: f.body, color: th.text, format: (v) => fmt(v, s) },
          },
          scales,
        },
      };
      if (this._chart) this._chart.destroy();
      this._chart = new window.Chart(canvas, config);
    }

    _html(e, cd, s, th, f) {
      const colors = this._colors(), c = (i) => colors[i % colors.length];
      const R = s.radius;
      if (e === 'table') {
        return '<div style="overflow:auto;max-height:360px"><table style="width:100%;border-collapse:collapse;font-size:13px;font-family:' + f.body + '"><thead><tr>' +
          cd.headers.map((h, i) => '<th style="text-align:' + (i ? 'right' : 'left') + ';padding:10px 12px;background:' + hexA(c(0), th.dark ? 0.35 : 0.1) + ';color:' + th.text + ';font-weight:700;border-bottom:2px solid ' + c(0) + '">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
          cd.rows.map((r, ri) => '<tr style="background:' + (ri % 2 ? hexA(c(0), 0.04) : 'transparent') + '">' + r.map((v, i) => { const isNum = i && v !== '' && isFinite(num(v)) && /\d/.test(v); return '<td style="padding:9px 12px;border-bottom:1px solid ' + th.grid + ';text-align:' + (i ? 'right' : 'left') + ';color:' + (i ? th.text : th.text) + ';font-variant-numeric:tabular-nums">' + esc(isNum ? fmt(num(v), s) : v) + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>';
      }
      if (e === 'kpi') {
        const r = cd.rows[0] || [], v = num(r[1]), prev = r[2] !== undefined && r[2] !== '' ? num(r[2]) : null;
        const delta = prev ? ((v - prev) / Math.abs(prev)) * 100 : null;
        return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:40px 10px;text-align:center">' +
          '<div style="font-family:' + f.heading + ';font-weight:800;font-size:clamp(40px,7vw,68px);line-height:1;color:' + c(0) + ';letter-spacing:-0.02em">' + esc(fmt(v, s)) + '</div>' +
          '<div style="font-size:15px;font-weight:600;color:' + th.muted + '">' + esc(r[0] || cd.headers[1] || '') + '</div>' +
          (delta != null ? '<div style="margin-top:6px;font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px;background:' + (delta >= 0 ? 'rgba(46,158,91,0.14);color:#2E9E5B' : 'rgba(163,36,36,0.12);color:#C43B3B') + '">' + (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(1) + '% vs ' + esc(cd.headers[2] || 'previous').toLowerCase() + '</div>' : '') + '</div>';
      }
      if (e === 'gauge') {
        const r = cd.rows[0] || [], v = num(r[1]), max = num(r[2]) || 100, p = Math.max(0, Math.min(1, v / max));
        const a = Math.PI * (1 - p), x = 100 + 80 * Math.cos(a), y = 100 - 80 * Math.sin(a), w = Math.max(10, s.stroke * 4 + 10);
        return '<div style="display:flex;flex-direction:column;align-items:center;padding:10px 0 20px"><svg viewBox="0 0 200 118" style="width:100%;max-width:340px">' +
          '<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="' + th.grid + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
          (p > 0 ? '<path d="M20 100 A80 80 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + '" fill="none" stroke="' + c(0) + '" stroke-width="' + w + '" stroke-linecap="round"/>' : '') +
          '<text x="100" y="92" text-anchor="middle" style="font-family:' + f.heading.replace(/"/g, "'") + ';font-weight:800;font-size:30px" fill="' + th.text + '">' + esc(fmt(v, s)) + '</text>' +
          '<text x="100" y="112" text-anchor="middle" style="font-size:10px;font-weight:600" fill="' + th.muted + '">of ' + esc(fmt(max, s)) + '</text></svg>' +
          '<div style="font-size:14px;font-weight:600;color:' + th.muted + '">' + esc(r[0] || '') + '</div></div>';
      }
      if (e === 'progress') {
        return '<div style="display:flex;flex-direction:column;gap:18px;padding:12px 0">' + cd.rows.map((r, i) => {
          const v = num(r[1]), t = num(r[2]) || 100, p = Math.max(0, Math.min(100, (v / t) * 100));
          return '<div style="display:flex;flex-direction:column;gap:7px"><div style="display:flex;justify-content:space-between;gap:10px;font-size:13.5px"><b style="font-weight:700">' + esc(r[0]) + '</b><span style="color:' + th.muted + ';font-variant-numeric:tabular-nums">' + esc(fmt(v, s)) + ' / ' + esc(fmt(t, s)) + '</span></div>' +
            '<div style="height:12px;border-radius:' + R + 'px;background:' + th.grid + ';overflow:hidden"><div style="height:100%;width:' + p + '%;background:' + c(i) + ';border-radius:' + R + 'px"></div></div></div>';
        }).join('') + '</div>';
      }
      if (e === 'funnel') {
        const vals = cd.rows.map((r) => num(r[1])), max = Math.max(1, ...vals);
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 0">' + cd.rows.map((r, i) => {
          const w = 28 + 72 * (vals[i] / max), conv = i ? Math.round((vals[i] / (vals[i - 1] || 1)) * 100) : null;
          return '<div style="width:' + w + '%;background:' + c(i) + ';color:#FFFFFF;border-radius:' + R + 'px;padding:10px 14px;display:flex;justify-content:space-between;gap:10px;font-size:13px;min-width:180px"><b style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r[0]) + '</b><span style="font-variant-numeric:tabular-nums;white-space:nowrap">' + esc(fmt(vals[i], s)) + (conv != null ? ' · ' + conv + '%' : '') + '</span></div>';
        }).join('') + '</div>';
      }
      if (e === 'heatmap') {
        const matrix = cd.headers.length > 2;
        const cols = matrix ? cd.headers.slice(1) : null;
        const vals = matrix ? cd.rows.flatMap((r) => r.slice(1).map(num)) : cd.rows.map((r) => num(r[1]));
        const max = Math.max(1, ...vals), min = Math.min(0, ...vals);
        const cell = (v, title) => { const p = (v - min) / ((max - min) || 1); return '<div title="' + esc(title) + '" style="aspect-ratio:1.6;border-radius:' + Math.min(R, 10) + 'px;background:' + hexA(c(0), 0.08 + 0.87 * p) + ';display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:600;color:' + (p > 0.55 ? '#FFFFFF' : th.text) + '">' + (s.dataLabels ? esc(fmt(v, s)) : '') + '</div>'; };
        if (!matrix) { const n = Math.max(1, Math.ceil(Math.sqrt(cd.rows.length))); return '<div style="display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:4px">' + cd.rows.map((r) => cell(num(r[1]), r[0] + ': ' + r[1])).join('') + '</div>'; }
        return '<div style="display:grid;grid-template-columns:auto repeat(' + cols.length + ',minmax(0,1fr));gap:4px;align-items:center;font-size:12px">' +
          '<div></div>' + cols.map((h) => '<div style="text-align:center;font-weight:700;color:' + th.muted + ';padding-bottom:2px">' + esc(h) + '</div>').join('') +
          cd.rows.map((r) => '<div style="font-weight:700;color:' + th.muted + ';padding-right:8px">' + esc(r[0]) + '</div>' + cols.map((h, i) => cell(num(r[i + 1]), r[0] + ' · ' + h + ': ' + r[i + 1])).join('')).join('') + '</div>';
      }
      return '';
    }

    toCsv() {
      const cd = this._ds.chartData; if (!cd) return '';
      const q = (v) => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
      return [cd.headers, ...cd.rows].map((r) => r.map(q).join(',')).join('\n');
    }
    async toImage() {
      const frame = this.shadowRoot.getElementById('frame'); if (!frame) return null;
      const d = this._ds, s = d.style, th = this._theme(), f = this._fonts(), scale = 2;
      const canvas = this.shadowRoot.querySelector('#viz canvas');
      if (!canvas) {
        // HTML-based types: rasterize via SVG foreignObject.
        const w = frame.offsetWidth, h = frame.offsetHeight;
        const xml = new XMLSerializer().serializeToString(frame.cloneNode(true));
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:' + f.body.replace(/"/g, "'") + '">' + xml + '</div></foreignObject></svg>';
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        try { await img.decode(); } catch (e) { return null; }
        const out = document.createElement('canvas'); out.width = w * scale; out.height = h * scale;
        const ctx = out.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
        try { return out.toDataURL('image/png'); } catch (e) { return null; }
      }
      const pad = 24, titleH = s.showTitle && d.name ? 30 : 0, subH = s.showTitle && d.subtitle ? 22 : 0;
      const w = canvas.clientWidth + pad * 2, h = canvas.clientHeight + pad * 2 + titleH + subH + (titleH || subH ? 8 : 0);
      const out = document.createElement('canvas'); out.width = w * scale; out.height = h * scale;
      const ctx = out.getContext('2d'); ctx.scale(scale, scale);
      if (th.bg !== 'transparent') { ctx.fillStyle = th.bg; ctx.fillRect(0, 0, w, h); }
      let y = pad;
      if (titleH) { ctx.fillStyle = th.text; ctx.font = '700 18px ' + f.heading; ctx.textBaseline = 'top'; ctx.fillText(d.name, pad, y); y += titleH; }
      if (subH) { ctx.fillStyle = th.muted; ctx.font = '400 13px ' + f.body; ctx.textBaseline = 'top'; ctx.fillText(d.subtitle, pad, y); y += subH; }
      if (titleH || subH) y += 8;
      ctx.drawImage(canvas, pad, y, canvas.clientWidth, canvas.clientHeight);
      return out.toDataURL('image/png');
    }
    _download(name, href) { const a = document.createElement('a'); a.href = href; a.download = name.replace(/[^\w.\- ]+/g, '').trim() || 'chart'; document.body.appendChild(a); a.click(); a.remove(); }
  }
  customElements.define('catalyst-data-viz', CatalystDataViz);

  const brandFromProfile = (p) => p ? { colors: [p.primaryColor, p.secondaryColor, p.accentColor, p.neutralColor].filter(Boolean), headingFont: p.headingFont || '', bodyFont: p.bodyFont || '' } : { colors: [] };
  const sync = () => import(new URL('./firebase-sync.js', SCRIPT_SRC).href);

  // Opens a full-screen picker/editor. Resolves { dataSource, image } or null.
  async function open(opts = {}) {
    const { clientId, app = 'App', value, save = true } = opts;
    let brand = opts.brand, library = opts.library || [], templates = opts.templates || {};
    if (clientId && (!brand || !opts.library)) {
      try {
        const mod = await sync();
        const [profile, extra] = await Promise.all([mod.loadBrandProfile(clientId), mod.loadDataSourceEntries(clientId).catch(() => [])]);
        brand = brand || brandFromProfile(profile);
        if (!opts.templates) templates = (profile && profile.dataTemplates) || {};
        if (!opts.library) library = [...((profile && profile.dataSources) || []), ...(extra || [])];
      } catch (e) { /* offline: brand defaults fall back to palette */ }
    }
    return new Promise((resolve) => {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(5,8,24,0.62);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow:auto;font-family:Inter,system-ui,sans-serif';
      ov.innerHTML = '<div style="background:#FFFFFF;border-radius:18px;width:min(1180px,100%);box-shadow:0 30px 80px rgba(0,0,0,0.35);display:flex;flex-direction:column">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid rgba(8,26,83,0.1)"><div style="font-family:Manrope,sans-serif;font-weight:800;font-size:20px;color:#081A53">Add a data visualization</div><button data-x style="appearance:none;border:none;background:none;font-size:18px;color:#8A93A8;cursor:pointer">✕</button></div>' +
        '<div data-host style="padding:20px 22px"></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid rgba(8,26,83,0.1)"><button data-x style="appearance:none;border:1px solid rgba(8,26,83,0.16);background:#FFFFFF;color:#081A53;border-radius:10px;padding:10px 18px;font-family:Manrope,sans-serif;font-weight:700;font-size:13.5px;cursor:pointer">Cancel</button><button data-use disabled style="appearance:none;border:none;background:#6818F8;color:#FFFFFF;border-radius:10px;padding:10px 20px;font-family:Manrope,sans-serif;font-weight:800;font-size:13.5px;cursor:pointer;opacity:0.4">Use this visualization</button></div></div>';
      const el = document.createElement('catalyst-data-viz');
      el.brand = brand || { colors: [] }; el.library = library; el.templates = templates; el.value = value || {};
      ov.querySelector('[data-host]').appendChild(el);
      const use = ov.querySelector('[data-use]');
      const refresh = () => { const v = el.value; const ok = !!v.chartType && !!v.chartData && v.chartData.rows.some((r) => r.some((c) => String(c).trim())); use.disabled = !ok; use.style.opacity = ok ? 1 : 0.4; };
      el.addEventListener('change', refresh); refresh();
      const close = (result) => { ov.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
      const onKey = (e) => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', onKey);
      ov.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => close(null));
      use.onclick = async () => {
        const ds = { ...el.value, app: el.value.app || app, usedByApps: Array.from(new Set([...(el.value.usedByApps || []), app])), createdAt: el.value.createdAt || Date.now() };
        const image = await el.toImage();
        if (clientId && save) { try { const mod = await sync(); ds.libraryId = await mod.addDataSourceEntry(clientId, ds); } catch (e) {} }
        close({ dataSource: ds, image });
      };
      document.body.appendChild(ov);
    });
  }

  window.CatalystDataViz = { open, types: TYPES.map((t) => ({ key: t.key, group: t.group, hint: t.hint })), brandFromProfile };
})();
