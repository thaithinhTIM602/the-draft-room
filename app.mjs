import { COMPANIES } from './companies.mjs';
import { compare, draft, season, validOffer } from './model.mjs';
import { advance, claim, newGame, nextLot, restore, seal } from './game.mjs';
import { auctionView, catalog, fundReport, kicker, ledger, report } from './auction.mjs';
import { replayView, seasonView } from './season.mjs';
import { icon, logo, money } from './display.mjs';
import { paintArt } from './art.mjs';

const KEY='the-draft-room.game.v1';
const header=document.querySelector('#header'), main=document.querySelector('#main');
const modal=document.querySelector('#modal'), footer=document.querySelector('#footer');
function roomCode() {
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), v=>chars[v%chars.length]).join('');
}
let saved=null, persistence=true;
try { saved=localStorage.getItem(KEY); } catch { persistence=false; }
let game=restore(saved) || newGame(roomCode());
let view=game.phase, month=game.month, seat=0, replayLot=null, modalStack=[];
let board=null, history=null, signature='', busy=false;
const tabs=[['auction','Auction floor'],['season','The season'],['replay','Replay lab']];

function persist(next) {
  if(persistence) {
    try { const raw=JSON.stringify(next); localStorage.setItem(KEY,raw); saved=raw; }
    catch { persistence=false; }
  }
  game=next;
}
if(!restore(saved)) persist(game);

function announce(message) { document.querySelector('#announcer').textContent=message; }
function permitted(target) {
  return target==='auction' || (target==='season' && game.phase==='season') || (target==='replay' && game.month===12);
}
function refreshBoard() {
  const current=JSON.stringify([game.seed,game.humans,game.orders,game.phase]);
  if(current===signature)return;
  signature=current;board=draft(game.seed,game.humans,game.orders);
  history=game.phase==='season'?season(game.seed,board.desks):null;
}
function top() {
  return `<div class="nav-wrap"><a class="brand" href="#main" data-action="home" aria-label="The Draft Room home">${logo}<span>The Draft Room<span class="brand-dot">.</span></span></a>
    <nav aria-label="Game stages">${tabs.map(([id,title])=>`<button data-action="view" data-view="${id}" ${view===id?'aria-current="page"':''} ${permitted(id)?'':`disabled title="${id==='season'?'Finish the auction to open the season':'Finish December to open the replay lab'}"`}>${title}</button>`).join('')}</nav>
    <div class="nav-tools"><button class="rules-btn" data-action="rules">${icon('rules',17)}<span>Rules</span></button><button class="new-btn" data-action="new">${icon('plus',15)} New game</button></div></div>`;
}
function render(focus=null) {
  refreshBoard();
  if(!permitted(view))view=game.phase;
  header.innerHTML=top();
  if(view==='auction') main.innerHTML=auctionView(game,board);
  if(view==='season') main.innerHTML=seasonView(game,board,history,month,seat);
  if(view==='replay') {
    const candidate=board.ledger.find(r=>r.lot===replayLot&&r.winner!==null) || board.ledger.find(r=>r.winner===seat) || board.ledger.find(r=>r.winner!==null);
    replayLot=candidate?.lot??null;
    main.innerHTML=replayView(game,board,candidate?compare(game.seed,game.humans,game.orders,replayLot,board):null);
  }
  main.querySelectorAll('canvas[data-art]').forEach(canvas=>paintArt(canvas,COMPANIES[Number(canvas.dataset.art)]));
  footer.innerHTML=`<div class="footer-wrap"><span><b>The Draft Room</b> <i>/</i> Fictional market simulation</span><span>${persistence?'Progress saves on this device':'Device storage is unavailable. Keep this tab open to preserve your game.'} <i>/</i> Room <b>${game.seed}</b></span></div>`;
  if(focus) {
    const el=focus==='ticket'?document.querySelector('#ticket-title'):main;
    if(el) { el.setAttribute('tabindex','-1');el.focus({preventScroll:true}); if(focus==='ticket' && matchMedia('(max-width: 760px)').matches)el.closest('.ticket').scrollIntoView({block:'nearest'}); }
  }
}

function rules() {
  return `${kicker('Field guide')}<h2 id="dialog-title">How to play</h2>
    <div class="rule"><span>01</span><div><h3>Buy a business</h3><p>Four funds start with $100 million each. For each of twelve companies, enter a bid in millions or pass. The highest eligible bid wins the entire company and pays exactly what it offered. If everyone passes, the lot stays unsold.</p></div></div>
    <div class="rule"><span>02</span><div><h3>Build a portfolio</h3><p>The guide estimates a company’s resale value plus twelve months of cash in a neutral economy. Open the company report to see its risks. For example, higher oil prices hurt Kestrel Air and help Ember Basin.</p></div></div>
    <div class="rule"><span>03</span><div><h3>Play the year</h3><p>Reveal monthly oil prices, growth, interest rates and company events. Your businesses may earn or lose cash. A shortfall triggers a loan at the policy rate plus six percentage points per year. Later cash first repays that loan. Idle cash earns no interest.</p></div></div>
    <div class="rule"><span>04</span><div><h3>Check your decisions</h3><p>Highest December wealth wins. Add cash and the value of your companies, then subtract outstanding loans. Replay a winning bid to see what passing would have changed in the same economy.</p></div></div>
    <div class="report-note"><b>Playing with a friend?</b><p>Choose New game and select Two players. Share one device and pass it when prompted. A room code recreates the economic scenario and tie draws for a fresh draft.</p></div>
    <p class="small-note">Computer funds use their play styles, available cash and current holdings. Their bids do not use the other players’ sealed offers or future market results. Each lot shows its tie order before bidding.</p>`;
}
function setup() {
  const hasMoves=game.orders.length>0||game.pending!==null;
  return `${kicker('Set up your table')}<h2 id="dialog-title">New game</h2><p>Choose who will manage the funds. Each starts with $100 million.</p>
    <form id="setup-form" novalidate><fieldset><legend>Players</legend><div class="mode-options">
    <label><input type="radio" name="humans" value="1" ${game.humans===1?'checked':''}><span><b>Solo</b><small>You and three computer funds</small></span></label>
    <label><input type="radio" name="humans" value="2" ${game.humans===2?'checked':''}><span><b>Two players</b><small>Share a device with a friend</small></span></label></div></fieldset>
    <label class="field-label" for="room-code">Room code <small>Optional</small></label><input type="text" class="standard-input" id="room-code" autocomplete="off" maxlength="12" placeholder="Random room" aria-describedby="room-tip">
    <p id="room-tip" class="small-note">Use 3 to 12 letters or numbers to repeat a scenario. Your current code is <b>${game.seed}</b>.</p>
    ${hasMoves?'<p class="replace-note">Starting a new draft replaces the game saved on this device.</p>':''}
    <p id="setup-error" role="alert"></p><button class="action navy" type="submit">Start new draft ${icon('arrow')}</button></form>`;
}
function modalContent(entry) {
  const [kind,i]=entry;
  if(kind==='rules')return rules();
  if(kind==='new')return setup();
  if(kind==='catalog')return catalog(game,board);
  if(kind==='fund')return fundReport(i,game,board);
  if(kind==='ledger')return ledger(board);
  return report(i);
}
function drawModal() {
  if(!modalStack.length){if(modal.open)modal.close();return;}
  const entry=modalStack.at(-1);
  modal.innerHTML=`<div class="modal-top">${modalStack.length>1?'<button class="text-btn" data-action="back-dialog">‹ Back</button>':'<span></span>'}<button class="close-btn" data-action="close-dialog" aria-label="Close dialog">${icon('close',19)}</button></div><div class="modal-content">${modalContent(entry)}</div>`;
  if(!modal.open)modal.showModal();
  modal.scrollTop=0;
}
function showModal(kind,i) {
  if(!modal.open)modalStack=[];
  modalStack.push([kind,i]);drawModal();
}
function syncSaved(raw) {
  const incoming=restore(raw);
  if(!incoming || raw===saved)return false;
  saved=raw;game=incoming;view=game.phase;month=game.month;seat=0;replayLot=null;
  if(modal.open){modalStack=[];drawModal();}
  render();announce('The game was updated in another tab.');
  return true;
}
async function change(fn, after, focus) {
  if(busy)return;busy=true;
  try {
    const commit=()=>{
      if(persistence){try{if(syncSaved(localStorage.getItem(KEY)))return;}catch{persistence=false;}}
      const next=fn(game);persist(next);if(after)after();render(focus);
    };
    if(navigator.locks)await navigator.locks.request(KEY,commit);else commit();
  } catch(error) { announce(error.message); }
  finally {busy=false;}
}
function go(target) {
  if(!permitted(target))return;
  view=target;month=game.month;render('main');window.scrollTo(0,0);
}
function submitBid() {
  const field=document.querySelector('#bid-input'), error=document.querySelector('#bid-error');
  if(!field)return;
  const number=field.valueAsNumber, value=Math.round(number*100);
  const i=game.orders.length, s=game.pending===null?0:1, cash=board.desks[s].cash;
  if(!Number.isFinite(number) || Math.abs(number*100-value)>0.000001 || value===0 || !validOffer(value,cash,COMPANIES[i])) {
    error.textContent=`Bid from ${money(COMPANIES[i].reserve)} to ${money(cash)} in $0.5m steps, or choose Pass.`;
    field.setAttribute('aria-invalid','true');field.focus();return;
  }
  change(g=>seal(g,value),null,'ticket');
}
document.addEventListener('submit',event=>{
  if(event.target.id==='bid-form'){event.preventDefault();submitBid();}
  if(event.target.id==='setup-form'){
    event.preventDefault();
    const code=document.querySelector('#room-code').value.trim().toUpperCase() || roomCode();
    const humans=Number(new FormData(event.target).get('humans'));
    if(!/^[A-Z0-9]{3,12}$/.test(code)){document.querySelector('#setup-error').textContent='Enter 3 to 12 letters or numbers, or leave the code blank.';return;}
    change(()=>newGame(code,humans),()=>{modalStack=[];drawModal();view='auction';seat=0;month=0;replayLot=null;window.scrollTo(0,0);},'main');
  }
});
document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-action]');
  if(!btn)return;
  event.preventDefault();
  const a=btn.dataset.action, i=Number(btn.dataset.i);
  if(['rules','new','catalog','fund','ledger','report'].includes(a)){showModal(a,i);return;}
  if(a==='close-dialog'){modalStack=[];drawModal();return;}
  if(a==='back-dialog'){modalStack.pop();drawModal();return;}
  if(a==='home'){go(game.phase);return;}
  if(a==='view'){go(btn.dataset.view);return;}
  if(a==='pass'){change(g=>seal(g,0),null,'ticket');return;}
  if(a==='claim'){change(claim,null,'ticket');return;}
  if(a==='next'){change(nextLot,()=>{view=game.phase;month=game.month;if(view==='season')window.scrollTo(0,0);},game.orders.length===12?'main':'ticket');return;}
  if(a==='lower'||a==='raise'){
    const field=document.querySelector('#bid-input');
    const base=Number.isFinite(field.valueAsNumber)?field.valueAsNumber:Number(field.min);
    const up=a==='raise';
    const shifted=up?(Math.floor(base*2)+1)/2:(Math.ceil(base*2)-1)/2;
    field.value=Math.max(Number(field.min),Math.min(Number(field.max),shifted));
    field.removeAttribute('aria-invalid');document.querySelector('#bid-error').textContent='';return;
  }
  if(a==='advance'||a==='finish'){change(g=>advance(g,a==='finish'?12:g.month+1),()=>{month=game.month;announce(`Month ${month} of 12 revealed.`);},'main');return;}
  if(a==='latest'){month=game.month;render();return;}
  if(a==='select-fund'){seat=i;render();document.querySelector('#season-fund')?.focus({preventScroll:true});}
});
document.addEventListener('input',event=>{
  if(event.target.id==='bid-input'){event.target.removeAttribute('aria-invalid');document.querySelector('#bid-error').textContent='';}
});
document.addEventListener('change',event=>{
  const t=event.target;
  if(t.id==='month-select'){month=Number(t.value);render();}
  else if(t.id==='season-fund'){seat=Number(t.value);render();}
  else if(t.id==='replay-lot'){replayLot=Number(t.value);render();}
  else return;
  document.getElementById(t.id)?.focus({preventScroll:true});
});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){modalStack=[];drawModal();}}});
modal.addEventListener('close',()=>{modalStack=[];});
window.addEventListener('storage',e=>{if(e.key===KEY && e.newValue)syncSaved(e.newValue);});
render();

