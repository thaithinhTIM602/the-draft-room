const SHAPES = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  seal: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m4 8 8 6 8-6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  rules: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.6a2.7 2.7 0 0 1 5.4.3c0 2.1-2.8 2.2-2.8 4m0 3h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  replay: '<path d="M4 10a8 8 0 1 1 1 7M4 5v5h5"/>',
  flag: '<path d="M5 20V4m1 1c4-3 7 3 12 0v8c-5 3-8-3-12 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6m0-9h.01"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  board: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  trophy: '<path d="M8 4h8v5c0 3-2 5-4 5s-4-2-4-5Zm8 1h4c0 4-1 6-5 6M8 5H4c0 4 1 6 5 6m3 3v4m-4 2h8"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m0-14a3 3 0 0 1 0 6m2 2a5 5 0 0 1 4 5"/>',
  stack: '<path d="m3 9 9-5 9 5-9 5Zm1 4 8 5 8-5m-16 4 8 4 8-4"/>',
  trend: '<path d="m3 16 6-6 4 4 8-9m-6 0h6v6"/>',
  wallet: '<path d="M4 7V5l13-2v4m-12 0h16v13H4V7Zm12 5h5v4h-5Z"/>',
};
export function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SHAPES[name] || ''}</svg>`;
}
export const logo = '<svg width="42" height="44" viewBox="0 0 42 44" fill="none" aria-hidden="true"><path d="m2 10 22-7 8 27-22 7z" fill="#a8bacf"/><path d="m9 6 23-2 3 30-23 2z" fill="#d7e9fb" stroke="#142438" stroke-width="1.7"/><rect x="17" y="8" width="21" height="30" rx="2" fill="#d5f67a" stroke="#142438" stroke-width="1.8"/><path d="m22 29 5-13h5l-5 13zm7 0 3-7h3l-3 7z" fill="#142438"/></svg>';
export function money(value, digits = null) {
  const places = digits ?? (value % 100 === 0 ? 0 : value % 10 === 0 ? 1 : 2);
  return (value < 0 ? '−$' : '$') + (Math.abs(value) / 100).toFixed(places) + 'm';
}
export function signed(value, digits = null) { return (value > 0 ? '+' : '') + money(value, digits); }
export const pad = n => String(n).padStart(2, '0');
export const MONTH_NAMES = ['Draft close','January','February','March','April','May','June','July','August','September','October','November','December'];
export function chart(series, months, summary) {
  const width=650, height=205, left=52, right=17, top=14, bottom=28;
  const values = series.flatMap(s => s.points);
  const min = Math.min(10000, ...values), max = Math.max(10000, ...values);
  const step = Math.max(500, Math.ceil(Math.max(500, (max-min)/3)/500)*500);
  const low = Math.floor((min-100)/step)*step, high = Math.ceil((max+100)/step)*step;
  const ix = m => left + m/12*(width-left-right);
  const iy = v => top + (high-v)/(high-low)*(height-top-bottom);
  const grids = [];
  for(let val=low;val<=high;val+=step) grids.push(`<path d="M${left} ${iy(val)} H${width-right}" stroke="#d8e0e8"/><text x="${left-7}" y="${iy(val)+4}" text-anchor="end">${money(val)}</text>`);
  const ticks = [0,3,6,9,12].map(m=>`<text x="${ix(m)}" y="${height-5}" text-anchor="middle">${m ? MONTH_NAMES[m].slice(0,3) : 'Close'}</text>`).join('');
  const curves = series.map(s => {
    const coords = s.points.map((v,i)=>[ix(i).toFixed(1),iy(v).toFixed(1)]);
    const last = coords.at(-1);
    return `<polyline fill="none" stroke="${s.color}" stroke-width="3" ${s.dash?'stroke-dasharray="7 4"':''} stroke-linejoin="round" stroke-linecap="round" points="${coords.map(p=>p.join(',')).join(' ')}"/><circle cx="${last[0]}" cy="${last[1]}" r="3.3" fill="${s.color}"/>`;
  }).join('');
  const cursor = months > 0 ? `<path d="M${ix(months)} ${top}V${height-bottom}" stroke="#9aa8b7" stroke-dasharray="2 4"/>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${summary}">${grids.join('')}${ticks}${cursor}${curves}</svg></div>
    <div class="legend">${series.map(s=>`<span><i style="--swatch:${s.color}" class="${s.dash?'dashed':''}"></i>${s.name}</span>`).join('')}</div>`;
}

