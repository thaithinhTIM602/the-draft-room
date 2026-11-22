import { COMPANIES, FUNDS } from './companies.mjs';
import { STEP, tieOrder } from './model.mjs';
import { icon, money, pad, signed } from './display.mjs';

export function badge(seat, big = false) {
  const f = FUNDS[seat];
  return `<span class="fund-badge badge-${seat} ${big?'large':''}" style="--fund:${f.color}" aria-hidden="true"><b>${f.mark}</b></span>`;
}
export function owner(winner) { return winner === null ? 'Unsold' : FUNDS[winner].name; }
export function kicker(text, dot = false) { return `<div class="eyebrow">${dot?'<i class="live-dot"></i>':''}${text}</div>`; }
export function poster(lot) {
  const c = COMPANIES[lot];
  return `<figure class="poster" style="--paper:${c.color}"><div class="poster-head"><b>DR<span>/</span>EXCHANGE</b><span>ISSUE ${pad(lot+1)}</span></div>
    <canvas data-art="${lot}" width="840" height="472" aria-hidden="true"></canvas>
    <figcaption><span class="poster-code">${c.code}</span><span class="poster-sector">${c.sector}</span><span class="barcode" aria-hidden="true"></span></figcaption></figure>`;
}
export function metrics(c) {
  return `<dl class="metrics"><div><dt>Guide value</dt><dd>${money(c.guide)}</dd></div><div><dt>Minimum bid</dt><dd>${money(c.reserve)}</dd></div></dl>`;
}
export function report(lot) {
  const c=COMPANIES[lot];
  return `${kicker(`Company report · Lot ${pad(lot+1)}`)}<h2 id="dialog-title">${c.name}</h2><p>${c.brief}</p>${metrics(c)}
    <div class="report-note"><b>How to read the guide</b><p>${money(c.base)} in estimated resale value plus twelve months of ${money(c.income)} in operating cash gives ${money(c.guide)} under neutral conditions.</p></div>
    <h3>What moves monthly profit?</h3><p class="muted">Estimated change in monthly cash if just one condition moves. A percentage point is the difference between 2% and 3%.</p>
    <dl class="report-rows">${[['Oil rises $10 per barrel',c.oil*10],['Economic growth rises 1 percentage point',c.growth],['The interest rate rises 1 percentage point',c.rate]].map(([label,val])=>`<div><dt>${label}</dt><dd class="${val>0?'good':val<0?'bad':''}">${signed(val)}</dd></div>`).join('')}</dl>
    <p class="scout">${icon('info',18)}<span>${c.driver}</span></p>`;
}
function lotCard(lot, revealed) {
  const c=COMPANIES[lot];
  return `<article class="lot-panel panel">
    <div class="panel-strip"><span class="tag"><i class="live-dot"></i>${revealed?'Lot closed':'On the block'}</span><span class="mono">LOT ${pad(lot+1)} / 12</span></div>
    <div class="lot-content">${poster(lot)}<div class="lot-info">${kicker(c.sector)}<h2>${c.name}</h2><p>${c.brief}</p>${metrics(c)}
      <button class="text-btn" data-action="report" data-i="${lot}">Company report ${icon('arrow',16)}</button></div></div></article>`;
}
function dotsProgress(n) {
  return `<div class="progress-meter" aria-label="${n} of 12 lots closed"><div><span>Draft progress</span><b>${pad(n)} <em>/ 12</em></b></div><div class="ticks" aria-hidden="true">${COMPANIES.map((_,i)=>`<i class="${i<n?'done':i===n?'current':''}"></i>`).join('')}</div></div>`;
}
function ticket(g, board, lot) {
  const seat=g.pending===null?0:1;
  const f=FUNDS[seat], c=COMPANIES[lot], desk=board.desks[seat];
  const max=Math.floor(desk.cash/STEP)*STEP;
  const available=max>=c.reserve;
  const opening=available?Math.min(max,Math.max(c.reserve,Math.round(c.guide/STEP)*STEP)):0;
  if(g.handoff) return `<section class="ticket handoff" aria-labelledby="ticket-title"><div class="ticket-kicker">${icon('lock')} PRIVATE HANDOFF</div><h2 id="ticket-title">Pass the device</h2><p>Give the screen to Player ${seat+1} at ${f.name}. Only that player should open this ticket.</p><button class="action lime" data-action="claim">I’m Player ${seat+1} ${icon('arrow')}</button></section>`;
  return `<section class="ticket" aria-labelledby="ticket-title"><div class="ticket-top"><span class="ticket-kicker">${icon('seal',17)} SEALED BID</span><span class="ticket-person">${g.humans===2?'Player '+(seat+1):'Your turn'}</span></div>
    <h2 id="ticket-title">Your bid ticket</h2><div class="ticket-fund"><span>${f.name}</span><b>${money(desk.cash)} available</b></div>
    ${available?`<form id="bid-form" novalidate><label for="bid-input">Bid amount <span>USD millions</span></label>
      <div class="bid-input"><button type="button" data-action="lower" aria-label="Lower bid by half a million">${icon('minus',16)}</button><span>$</span><input id="bid-input" type="number" step="0.5" min="${c.reserve/100}" max="${max/100}" value="${opening/100}" inputmode="decimal" autocomplete="off" required><button type="button" data-action="raise" aria-label="Raise bid by half a million">${icon('plus',16)}</button></div>
      <div id="bid-help">Minimum ${money(c.reserve)} · $0.5m increments</div><p id="bid-error" role="alert"></p>
      <button class="action lime" type="submit">Seal bid ${icon('arrow',18)}</button></form>`:`<p class="no-cash">This lot opens at ${money(c.reserve)}. Your available cash is ${money(desk.cash)}.</p>`}
    <button class="pass-btn" data-action="pass">Pass on this company ${icon('next',13)}</button></section>`;
}
function resultTicket(g, record) {
  const c=COMPANIES[record.lot];
  const own=record.winner!==null && record.winner < g.humans;
  return `<section class="ticket result" aria-labelledby="ticket-title"><div class="ticket-kicker">${icon('flag',17)} BIDS REVEALED</div>
    <h2 id="ticket-title">${record.winner===null?'Lot unsold':own?(g.humans===1?'You won the lot':FUNDS[record.winner].short+' wins') : FUNDS[record.winner].short+' wins'}</h2>
    <p class="result-sub">${record.winner===null?'All four funds passed.':`${owner(record.winner)} pays <b>${money(record.price)}</b> for ${c.name}.`}</p>
    <div class="bid-receipt">${[0,1,2,3].map(i=>`<div class="${record.winner===i?'winning':''}"><span>${FUNDS[i].short}${record.winner===i?' <small>WIN</small>':''}</span><b>${record.bids[i]?money(record.bids[i]):'Pass'}</b></div>`).join('')}</div>
    ${record.tied?'<p class="tie-note">The published tie order decided this lot.</p>':''}
    <button class="action lime" data-action="next">${g.orders.length===12?'Open the season':'Next company'} ${icon('arrow')}</button></section>`;
}
export function standings(g, board) {
  return `<section class="panel fund-panel"><div class="section-title"><h2>Fund standings</h2><span class="small-meta">4 DESKS</span></div>
    <div class="table-key"><span>Fund</span><span>Owned</span><span>Cash left</span></div>
    ${FUNDS.map((f,i)=>`<button class="fund-row" data-action="fund" data-i="${i}"><span class="fund-id">${badge(i)}<span><strong>${f.name}</strong><small>${g.humans===2&&i===1?'Player 2':g.humans===2&&i===0?'Player 1':f.style}</small></span></span><span class="owned">${board.desks[i].owned.length}</span><b>${money(board.desks[i].cash)}</b></button>`).join('')}</section>`;
}
export function catalog(g, board) {
  return `${kicker('Company directory')}<h2 id="dialog-title">Draft board</h2><p>Open any company to study its economics before you bid.</p><div class="catalog-list">${COMPANIES.map((c,i)=>{
    const r=board.ledger[i];
    return `<button class="catalog-row" data-action="report" data-i="${i}"><span class="catalog-num">${pad(i+1)}</span><span class="catalog-stock" style="background:${c.color}">${c.code}</span><span><b>${c.name}</b><small>${r?owner(r.winner):c.sector}</small></span><span class="catalog-price">${r ? (r.winner===null?'Unsold':money(r.price)) : money(c.guide)} ${icon('next',13)}</span></button>`;
  }).join('')}</div>`;
}
function upcoming(g, board) {
  const next=g.reveal?g.orders.length:g.orders.length+1;
  const items=COMPANIES.slice(next,next+3);
  return `<section class="panel upcoming"><div class="section-title"><h2>Draft board</h2><button class="text-btn" data-action="catalog">All 12 ${icon('arrow',15)}</button></div>
    ${items.length?`<div class="up-label"><span>Coming up</span><span>Guide value</span></div>${items.map((c,j)=>`<button class="up-row" data-action="report" data-i="${next+j}"><span class="lot-no">${pad(next+j+1)}</span><span class="mini-art" style="background:${c.color}"><canvas aria-hidden="true" data-art="${next+j}"></canvas></span><span class="up-id"><strong>${c.name}</strong><small>${c.sector}</small></span><b>${money(c.guide)}</b></button>`).join('')}`:`<p class="empty">This is the end of the board. Open the directory to inspect every company.</p>`}
    <button class="board-foot" data-action="ledger">${icon('board',16)} Auction ledger <span>${board.ledger.length} closed ${icon('next',13)}</span></button></section>`;
}
export function ledger(board) {
  return `${kicker('Auction record')}<h2 id="dialog-title">Auction ledger</h2>${board.ledger.length?'<p>Each winner paid its own sealed bid. Open a lot for all four bids.</p>':'<p>The first result appears after all funds submit their bids.</p>'}
    <div class="ledger-list">${board.ledger.map(r=>`<details><summary><span>${pad(r.lot+1)} · ${COMPANIES[r.lot].name}</span><b>${r.winner===null?'Unsold':money(r.price)}</b></summary><p>${owner(r.winner)}${r.tied?' won on the published tie order.':''}</p><dl class="report-rows">${r.bids.map((b,i)=>`<div><dt>${FUNDS[i].name}</dt><dd>${b?money(b):'Pass'}</dd></div>`).join('')}</dl></details>`).join('')}</div>`;
}
export function fundReport(seat,g,board) {
  const desk=board.desks[seat];const f=FUNDS[seat];
  return `${kicker('Fund portfolio')}<h2 id="dialog-title">${f.name}</h2><p>${g.humans>seat?'Human managed fund.':f.style+'.'} Available after acquisitions: <b>${money(desk.cash)}</b>.</p><h3>Companies owned</h3>
    ${desk.owned.length?`<div class="catalog-list">${desk.owned.map(lot=>`<button class="catalog-row" data-action="report" data-i="${lot}"><span class="catalog-stock" style="background:${COMPANIES[lot].color}">${COMPANIES[lot].code}</span><span><b>${COMPANIES[lot].name}</b><small>${COMPANIES[lot].sector}</small></span><span class="catalog-price">${money(board.ledger[lot].price)} ${icon('next',14)}</span></button>`).join('')}</div>`:'<p class="empty">No acquisitions yet. Unspent cash stays in the fund.</p>'}`;
}
export function auctionView(g, board) {
  const closed=g.phase==='season';
  const lot=Math.min(11,g.orders.length-(g.reveal?1:0));
  return `<div class="page-intro"><div>${kicker(closed?'Auction closed':`Live auction · ${g.humans===1?'Solo table':'Two player table'}`,!closed)}<h1>Auction floor<span class="period">.</span></h1><p>Four funds. Twelve companies. Finish the year with the most wealth.</p></div>${dotsProgress(g.orders.length)}</div>
    ${closed?`<section class="closed-banner"><div>${icon('flag')} <strong>The draft is complete.</strong> All twelve lots are settled.</div><button class="action navy" data-action="view" data-view="season">View season ${icon('arrow')}</button></section>`:`<div class="auction-main">${lotCard(lot,g.reveal)}${g.reveal?resultTicket(g,board.ledger.at(-1)):ticket(g,board,lot)}</div>`}
    <div class="support-grid">${standings(g,board)}${upcoming(g,board)}</div>
    ${closed?'':`<p class="auction-fine">${icon('info',15)} Tied bids follow this lot’s draw order: ${tieOrder(g.seed,lot).map(i=>FUNDS[i].short).join(' → ')}.</p>`}`;
}

