import { COMPANIES, FUNDS } from './companies.mjs';
import { badge, kicker, owner } from './auction.mjs';
import { chart, icon, money, signed, MONTH_NAMES, pad } from './display.mjs';

function deltaClass(v) { return v>0?'good':v<0?'bad':''; }
function ordinal(n) { return ['1st','2nd','3rd','4th'][n-1]; }
function ranking(funds, seat) { return 1+funds.filter(f=>f.wealth>funds[seat].wealth).length; }
function seedLabel(seed) { return `<span class="seed-label">ROOM <b>${seed}</b></span>`; }
function monthOptions(n, selected) {
  return Array.from({length:n+1},(_,i)=>`<option value="${i}" ${selected===i?'selected':''}>${MONTH_NAMES[i]}</option>`).join('');
}
function fundOptions(seat) {
  return FUNDS.map((f,i)=>`<option value="${i}" ${seat===i?'selected':''}>${f.name}</option>`).join('');
}
function rankCard(frame, g, selected) {
  const order=[0,1,2,3].sort((a,b)=>frame.funds[b].wealth-frame.funds[a].wealth || a-b);
  return `<section class="panel rankings"><div class="section-title"><h2>Fund rankings</h2><span class="small-meta">${frame.month===12?'FINAL':'BY WEALTH'}</span></div>
    ${order.map(i=>`<button class="rank-row ${i===selected?'selected':''}" data-action="select-fund" data-i="${i}" aria-pressed="${i===selected}"><span class="rank-number">${ordinal(ranking(frame.funds,i))}</span>${badge(i)}<span class="rank-name"><b>${FUNDS[i].name}</b><small>${i<g.humans?(g.humans===1?'You':'Player '+(i+1)):FUNDS[i].style}</small></span><strong>${money(frame.funds[i].wealth)}</strong></button>`).join('')}
    <p class="small-note">Wealth is cash plus the current value of companies, less outstanding debt.</p></section>`;
}
function movement(current, previous, digits = 1, suffix='') {
  const d=current-previous;
  return `${d>0?'+':d<0?'−':''}${Math.abs(d).toFixed(digits)}${suffix}`;
}
function marketCard(frame, prev) {
  return `<section class="panel market"><div class="section-title"><h2>Market conditions</h2><span class="small-meta">${frame.month?MONTH_NAMES[frame.month]:'AT DRAFT CLOSE'}</span></div>
    <div class="market-grid">${[['Oil / barrel','$'+frame.oil.toFixed(1),movement(frame.oil,prev.oil,1)+' USD'],['Economic growth',frame.growth.toFixed(1)+'%',movement(frame.growth,prev.growth,1,' pts')],['Policy rate',frame.rate.toFixed(2)+'%',movement(frame.rate,prev.rate,2,' pts')]].map(([n,v,d])=>`<div><span>${n}</span><strong>${v}</strong><small>${frame.month?d:'Starting level'}</small></div>`).join('')}</div>
    <div class="market-news">${icon('flag',16)}<span>${frame.month?frame.title:'All four funds start in the same economy.'}${frame.companyNews?'. '+COMPANIES[frame.companyNews.lot].name+' '+frame.companyNews.text+' ('+signed(frame.companyNews.amount)+').':''}</span></div></section>`;
}
function fundDetail(frame, board, seat) {
  const f=frame.funds[seat], owned=board.desks[seat].owned;
  return `<section class="panel portfolio"><div class="section-title"><h2>Portfolio statement</h2><label class="select-label">Fund <select id="season-fund">${fundOptions(seat)}</select></label></div>
    <div class="account-grid">${[['Cash',f.cash],['Company value',f.mark],['Debt owed',f.debt],['Net wealth',f.wealth]].map(([label,val])=>`<div><span>${label}</span><strong>${money(val)}</strong></div>`).join('')}</div>
    <div class="statement-ledger"><span>Company cash this month <b class="${deltaClass(f.operating)}">${signed(f.operating)}</b></span><span>Borrowing interest <b>${money(f.interest)}</b></span><span>New borrowing <b>${money(f.draw)}</b></span><span>Debt repaid <b>${money(f.repaid)}</b></span></div>
    ${owned.length?`<div class="scroll-table"><table><thead><tr><th>Company</th><th>Paid at auction</th><th>Monthly cash</th><th>Current value</th></tr></thead><tbody>${owned.map(lot=>`<tr><th><button class="text-btn" data-action="report" data-i="${lot}">${COMPANIES[lot].name}</button></th><td>${money(board.ledger[lot].price)}</td><td class="${deltaClass(frame.companies[lot].operating)}">${signed(frame.companies[lot].operating)}</td><td>${money(frame.companies[lot].mark)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">This fund holds only cash. Idle cash earns no interest in this game.</p>'}</section>`;
}
export function seasonView(g, board, history, selectedMonth, seat) {
  const m=Math.min(selectedMonth,g.month), frame=history[m], prev=history[Math.max(0,m-1)];
  const series=FUNDS.map((f,i)=>({name:f.short,color:f.color,points:history.slice(0,m+1).map(h=>h.funds[i].wealth)}));
  const leader=FUNDS.filter((_,i)=>ranking(frame.funds,i)===1);
  const done=g.month===12, watchingPast=m<g.month;
  const sub=done?'The year is complete. Inspect each month or revisit an acquisition.':'Reveal one month at a time to see what your companies earn and what they are worth.';
  return `<div class="page-intro"><div>${kicker(done?'Season complete':'Market simulation',!done)}<h1>The season<span class="period">.</span></h1><p>${sub}</p></div>${seedLabel(g.seed)}</div>
    <section class="season-bar"><div class="season-stamp">${icon(done?'trophy':'flag',22)}</div><div><div class="ticket-kicker">${done?'FINAL STANDINGS':`MONTH ${pad(g.month)} / 12`}</div><h2>${done?(leaderNames(history.at(-1))):g.month===0?'The opening bell':history[g.month].title}</h2></div>
    <div class="bar-actions">${done?`<button class="action lime" data-action="view" data-view="replay">Open replay lab ${icon('arrow')}</button>`:`<button class="subtle-dark" data-action="finish">Run to December</button><button class="action lime" data-action="advance">Reveal ${MONTH_NAMES[g.month+1]} ${icon('arrow')}</button>`}</div></section>
    <div class="section-context"><h2>${m===0?'At draft close':MONTH_NAMES[m]+' results'}</h2><label class="select-label">Inspect month <select id="month-select">${monthOptions(g.month,m)}</select></label>${watchingPast?'<button class="text-btn" data-action="latest">Latest month</button>':''}</div>
    <div class="season-grid"><div class="season-left">${marketCard(frame,prev)}<section class="panel"><div class="section-title"><h2>Fund wealth</h2><span class="small-meta">USD MILLIONS</span></div>${chart(series,m,`${MONTH_NAMES[m]} fund wealth. ${leader.map(f=>f.name).join(' and ')} in first place.`)}</section></div>${rankCard(frame,g,seat)}</div>
    ${fundDetail(frame,board,seat)}`;
}
function leaderNames(frame) {
  const leaders=FUNDS.filter((_,i)=>ranking(frame.funds,i)===1);
  return leaders.length===1?leaders[0].name+' wins the year':leaders.map(f=>f.short).join(' & ')+' tie for first';
}
export function replayView(g, board, result) {
  const candidates=board.ledger.filter(r=>r.winner!==null);
  const intro=`<div class="page-intro"><div>${kicker('Decision review')}<h1>Replay lab<span class="period">.</span></h1><p>Make one fund pass on a company it won. Run both outcomes through the same year.</p></div>${seedLabel(g.seed)}</div>`;
  if(!result) return intro+'<section class="panel empty"><h2>No acquisitions to replay</h2><p>Every company went unsold in this draft.</p></section>';
  const {seat,lot,actual,replay,alternative,changes}=result;
  const c=COMPANIES[lot], fund=FUNDS[seat], a=actual[12].funds[seat], b=replay[12].funds[seat];
  const diff=a.wealth-b.wealth, newSale=alternative.ledger[lot], cost=board.ledger[lot].price;
  const individualOps=actual.slice(1).reduce((s,m)=>s+m.companies[lot].operating,0);
  const resale=actual[12].companies[lot].mark, standAlone=resale+individualOps-cost;
  const series=[{name:'Actual draft',color:'#244dd3',points:actual.map(m=>m.funds[seat].wealth)},{name:'If the fund passed',color:'#a44a27',points:replay.map(m=>m.funds[seat].wealth),dash:true}];
  return intro+`<section class="replay-pick panel"><div><h2>Revisit an acquisition</h2><p>All winning bids are available, including your rivals’ purchases.</p></div><label class="select-label">Acquisition <select id="replay-lot">${candidates.map(r=>`<option value="${r.lot}" ${r.lot===lot?'selected':''}>${COMPANIES[r.lot].name} · ${FUNDS[r.winner].short}</option>`).join('')}</select></label></section>
    <section class="verdict"><div class="verdict-symbol">${icon('replay',27)}</div><div>${kicker(fund.name+' · December outcome')}<h2>${diff===0?'Passing left final wealth unchanged.':`${diff>0?'Buying':'Passing on'} ${c.name} was worth ${money(Math.abs(diff))}.`}</h2><p>${diff===0?`Both versions finished at ${money(a.wealth)}.`:`The actual draft finished at ${money(a.wealth)}. With a pass, ${fund.short} finished at ${money(b.wealth)}.`}
    ${newSale.winner===null?'The company would have gone unsold.':`${owner(newSale.winner)} would have bought the company for ${money(newSale.price)}.`}</p></div></section>
    <div class="replay-grid"><section class="panel"><div class="section-title"><h2>Two paths for ${fund.short}</h2></div>${chart(series,12,'Monthly fund wealth for the actual draft and the same draft with the selected fund passing.')}</section>
    <section class="panel compare-panel"><div class="section-title"><h2>What changed</h2></div><div class="scroll-table"><table><thead><tr><th>Measure</th><th>Actual</th><th>With a pass</th></tr></thead><tbody>
    ${[['Final wealth',money(a.wealth),money(b.wealth)],['Final rank',ordinal(ranking(actual[12].funds,seat)),ordinal(ranking(replay[12].funds,seat))],['Peak debt',money(a.peakDebt),money(b.peakDebt)],['Interest paid',money(a.totalInterest),money(b.totalInterest)],['Cash from operations',signed(a.totalOps),signed(b.totalOps)]].map(([k,x,y])=>`<tr><th>${k}</th><td>${x}</td><td>${y}</td></tr>`).join('')}</tbody></table></div></section></div>
    <section class="panel attribution"><div class="section-title"><h2>The company on its own</h2><span class="small-meta">${c.code}</span></div>
    <p>${c.name} cost ${money(cost)}, generated ${signed(individualOps)} in operating cash and ended the year worth ${money(resale)}. That leaves <b>${signed(standAlone)}</b> before fund borrowing costs.</p></section>
    <section class="panel ripple"><div class="section-title"><h2>Later auction results</h2><span class="small-meta">${changes.length} CHANGED</span></div><p>The economy and human bid instructions stay fixed. Available cash limits each bid, and computer rivals reconsider their budgets and holdings.</p>
    ${changes.length?`<div class="scroll-table"><table><thead><tr><th>Company</th><th>Actual draft</th><th>With a pass</th></tr></thead><tbody>${changes.map(r=>{const alt=alternative.ledger[r.lot];return `<tr><th>${COMPANIES[r.lot].name}</th><td>${owner(r.winner)}${r.winner!==null?' · '+money(r.price):''}</td><td>${owner(alt.winner)}${alt.winner!==null?' · '+money(alt.price):''}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">Every later lot kept the same winner and price.</div>'}</section>`;
}

