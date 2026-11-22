import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANIES } from '../companies.mjs';
import { START, STEP, award, companyMonth, compare, draft, economy, season, settleMonth, tieOrder, validOffer } from '../model.mjs';
import { advance, claim, newGame, nextLot, restore, seal } from '../game.mjs';
import { auctionView } from '../auction.mjs';
import { seasonView } from '../season.mjs';

const room='KITE27';
const rows=(fn)=>COMPANIES.map((_,i)=>fn(i));
function finishedGame(humans=1) {
  let g=newGame(room,humans);
  for(let lot=0;lot<12;lot++){
    if(g.handoff)g=claim(g);
    g=seal(g, lot===0?4000:0);
    if(humans===2)g=seal(claim(g), lot===0?3800:0);
    g=nextLot(g);
  }
  return g;
}
test('all company guides reconcile with neutral income and resale and each minimum accepts a legal increment',()=>{
  for(const c of COMPANIES) {
    assert.equal(c.guide,c.base+12*c.income);assert.ok(validOffer(c.reserve,START,c));
    assert.equal(validOffer(c.reserve-STEP,START,c),false);
  }
  assert.equal(new Set(COMPANIES.map(c=>c.code)).size,12);
});
test('four cash funded desks, exclusive ownership, first price and unchanged losing balances',()=>{
  const b=draft(room,2,[[4000,3950]]);
  assert.equal(b.ledger[0].winner,0);assert.equal(b.ledger[0].price,4000);
  assert.deepEqual(b.desks.map(d=>d.cash),[6000,10000,10000,10000]);
  assert.deepEqual(b.desks.map(d=>d.owned),[[0],[],[],[]]);
});
test('all passes leave the lot unsold; tied highest bids follow the announced draw order',()=>{
  assert.deepEqual(award(room,0,[0,0,0,0]),{winner:null,price:0,tied:false});
  const priority=tieOrder(room,1);
  for(const top of [[0,1],[1,2],[0,2,3],[0,1,2,3]]) {
    const bids=[0,1,2,3].map(i=>top.includes(i)?3000:2000);
    assert.deepEqual(award(room,1,bids),{winner:priority.find(i=>top.includes(i)),price:3000,tied:true});
  }
});
test('invalid increments, overdrafts and nonfinite orders cannot enter a live ticket',()=>{
  const g=newGame(room);
  for(const amount of [1,1649,1675,-50,10050,1700.001,NaN,Infinity,'1700'])assert.throws(()=>seal(g,amount));
  assert.ok(seal(g,0).reveal);assert.ok(seal(g,1650).reveal);
  const spent=nextLot(seal(g,START));
  assert.throws(()=>seal(spent,1650));assert.ok(seal(spent,0).reveal);
});
test('rival offers for the same lot are blind to both sealed human bids',()=>{
  const low=draft(room,2,[[0,0]]), high=draft(room,2,[[5500,5000]]);
  assert.deepEqual(low.ledger[0].bids.slice(2),high.ledger[0].bids.slice(2));
  const soloPass=draft(room,1,[[0]]), soloBuy=draft(room,1,[[7500]]);
  assert.deepEqual(soloPass.ledger[0].bids.slice(1),soloBuy.ledger[0].bids.slice(1));
});
test('a saved two person handoff (including a zero bid) discloses no first player amount or holdings',()=>{
  for(const value of [0,4250]) {
    const first=seal(newGame(room,2),value);
    assert.ok(first.handoff);assert.equal(first.orders.length,0);
    assert.deepEqual(restore(JSON.stringify(first)),first);
    assert.throws(()=>seal(first,4000));assert.throws(()=>nextLot(first));
    const board=draft(room,2,first.orders);
    const cover=auctionView(first,board);assert.match(cover,/Pass the device/);assert.doesNotMatch(cover,/42\.5|id="bid-input"/);
    const second=claim(first);assert.equal(second.pending,value);
    assert.doesNotMatch(auctionView(second,board),/42\.5/);
    const settled=seal(second,3150);assert.deepEqual(settled.orders,[[value,3150]]);
    assert.ok(settled.reveal);assert.throws(()=>seal(settled,0));assert.ok(nextLot(settled).handoff);
  }
});
test('resuming games at auction results, season opening and month twelve preserves the saved state',()=>{
  for(const n of [1,2]){
    const final=finishedGame(n);
    assert.equal(final.phase,'season');assert.equal(final.month,0);assert.equal(final.orders.length,12);
    assert.deepEqual(restore(JSON.stringify(final)),final);
    const jan=advance(final,1), dec=advance(jan,12);
    assert.deepEqual(restore(JSON.stringify(dec)),dec);assert.throws(()=>advance(dec,11));assert.throws(()=>advance(jan,13));
    assert.throws(()=>advance(newGame(room),1));assert.throws(()=>nextLot(dec));
  }
});
test('corrupt saves, impossible phases and unreachable balances are rejected',()=>{
  const g=newGame(room);
  for(const bad of ['{',null,42,{...g,version:77},{...g,seed:'"><script>'},{...g,handoff:true},
    {...g,reveal:true},{...g,phase:'season'},{...g,month:12},{...g,humans:7},{...g,orders:[[10000],[3500]]},
    {...g,orders:[[1234]]},{...g,orders:[[10,10]]}])assert.equal(restore(bad),null);
});
test('a room repeats monthly conditions and company shocks, and different rooms can differ',()=>{
  assert.deepEqual(economy(room),economy(room));
  assert.notDeepEqual(economy(room),economy('LIME72'));
  const b=draft(room,1,rows(()=>[0])), path=economy(room);
  assert.deepEqual(season(room,b.desks),season(room,b.desks,path));
  assert.equal(path.length,13);assert.equal(path[0].oil,80);assert.equal(path.at(-1).month,12);
});
test('oil alone creates opposite cash exposures for the airline and producer',()=>{
  const base={...economy(room)[1],oil:80,growth:2,rate:4,companyNews:null};
  const jump={...base,oil:100};
  const diff=i=>companyMonth(room,i,jump).operating-companyMonth(room,i,base).operating;
  assert.equal(diff(0),-120);assert.equal(diff(1),160);
  assert.ok(Math.abs(diff(0)+diff(1))<Math.abs(diff(0)));
});
test('loans cover a shortfall, accrue interest on opening debt and repay before building cash',()=>{
  const prior={cash:50,debt:0,totalOps:0,totalInterest:0,peakDebt:0};
  const first=settleMonth(prior,-1050,600,6);
  assert.equal(first.cash,0);assert.equal(first.draw,1000);assert.equal(first.interest,0);assert.equal(first.wealth,-400);
  const second=settleMonth(first,510,600,6);
  assert.equal(second.interest,10);assert.equal(second.repaid,500);assert.equal(second.debt,500);
  const third=settleMonth(second,705,600,6);
  assert.equal(third.interest,5);assert.equal(third.debt,0);assert.equal(third.cash,200);
  assert.equal(third.peakDebt,1000);assert.equal(third.totalInterest,15);
});
test('actual and alternate auctions use the same economy and shocks, with no changes before the forced pass',()=>{
  const orders=rows(i=>[i===0?4250:i===1?3500:0, i===0?3150:0]);
  const copy=structuredClone(orders), original=draft(room,2,orders);
  for(const r of original.ledger.filter(r=>r.winner!==null)){
    const cmp=compare(room,2,orders,r.lot,original);
    assert.equal(cmp.alternative.ledger[r.lot].bids[r.winner],0);
    assert.notEqual(cmp.alternative.ledger[r.lot].winner,r.winner);
    assert.deepEqual(cmp.alternative.ledger.slice(0,r.lot),original.ledger.slice(0,r.lot));
    assert.deepEqual(cmp.actual.map(({funds,...frame})=>frame),cmp.replay.map(({funds,...frame})=>frame));
  }
  assert.deepEqual(orders,copy);
  const cmp=compare(room,2,orders,0);
  assert.equal(cmp.alternative.ledger[0].winner,1);
  assert.equal(cmp.actual[12].funds[0].wealth-cmp.replay[12].funds[0].wealth,464);
});
test('passing can change later winners or prices and an unaffordable later instruction is capped',()=>{
  const orders=rows(i=>[i===0?4600:i===1?3500:2000, i===0?4500:i===1?6500:0]);
  const cmp=compare(room,2,orders,0);
  assert.equal(cmp.alternative.ledger[0].winner,1);
  assert.equal(cmp.original.ledger[1].bids[1],6500);
  assert.equal(cmp.alternative.ledger[1].bids[1],5500);
  assert.ok(cmp.changes.length>0);
});
test('unrevealed company events, future wealth values and future month reports stay out of the season view',()=>{
  const g=finishedGame(), board=draft(g.seed,g.humans,g.orders), frames=season(g.seed,board.desks);
  const copy=structuredClone(frames);
  for(let m=2;m<=12;m++){copy[m].title='FUTURE_EVENT_9';copy[m].funds.forEach(f=>{f.wealth=76543210;});}
  const first=advance(g,1);
  assert.equal(seasonView(first,board,frames,1,0),seasonView(first,board,copy,1,0));
  assert.doesNotMatch(seasonView(first,board,copy,1,0),/FUTURE_EVENT_9|765432\.1/);
});
test('250 two player drafts preserve eligible bids, spending limits and cash accounting in all 12 months',()=>{
  let borrowingObserved=false, unsoldObserved=false;
  for(let k=0;k<250;k++) {
    const seed='ROOM'+k;
    const orders=rows(i=>[(k%5===0&&i===0)?START:((k+i)%4===0?0:1500+((k*17+i*11)%60)*STEP),
      (k+i*3)%5===0?0:1800+((k*7+i*9)%51)*STEP]);
    const board=draft(seed,2,orders), previous=[START,START,START,START];
    const companies=board.desks.flatMap(d=>d.owned);
    assert.equal(companies.length,new Set(companies).size);
    for(const r of board.ledger) {
      for(let s=0;s<4;s++)assert.ok(validOffer(r.bids[s],previous[s],COMPANIES[r.lot]));
      if(r.winner!==null){assert.equal(r.price,Math.max(...r.bids)); previous[r.winner]-=r.price;}
      else unsoldObserved=true;
    }
    assert.deepEqual(board.desks.map(d=>d.cash),previous);
    const frames=season(seed,board.desks);
    for(const frame of frames)for(const [s,f] of frame.funds.entries()) {
      assert.ok(Number.isInteger(f.wealth)&&f.cash>=0&&f.debt>=0&&f.cash*f.debt===0);
      assert.equal(f.cash-f.debt,previous[s]+f.totalOps-f.totalInterest);
      assert.equal(f.wealth,f.cash+f.mark-f.debt);assert.ok(f.debt<=f.peakDebt);
      if(f.debt>0)borrowingObserved=true;
    }
  }
  assert.ok(borrowingObserved);assert.ok(unsoldObserved);
});

