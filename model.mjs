import { COMPANIES, FUNDS } from './companies.mjs';

export const START = 10000;
export const STEP = 50;
export const MONTHS = 12;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round1 = x => Math.round(x * 10) / 10;
const round2 = x => Math.round(x * 100) / 100;

function noise(seed, ...keys) {
  let h = 2166136261;
  for (const ch of [seed, ...keys].join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function validSeed(seed) {
  return typeof seed === 'string' && /^[A-Z0-9]{3,12}$/.test(seed);
}

export function validOffer(value, cash, company) {
  return Number.isSafeInteger(value) && (value === 0 ||
    (value >= company.reserve && value <= cash && value % STEP === 0));
}

function fitOffer(value, cash, company) {
  const offer = Math.floor(Math.min(cash, value) / STEP) * STEP;
  return offer >= company.reserve ? offer : 0;
}

function rivalOffer(seed, lot, seat, state) {
  const c = COMPANIES[lot];
  const existing = state.owned.map(i => COMPANIES[i]);
  const totalOil = existing.reduce((s, a) => s + a.oil, 0);
  const noiseTerm = (noise(seed, 'bid', lot, seat) - 0.5) * 0.30;
  let preference;
  if (seat === 1) preference = 0.85 + c.growth / 125 + c.risk / 500;
  else if (seat === 2) preference = 1.16 - c.risk / 140 + c.income / c.guide;
  else preference = 0.99 + (Math.abs(totalOil) - Math.abs(totalOil + c.oil)) * 0.029;
  const concentration = existing.filter(a => Math.abs(a.growth - c.growth) < 10 && Math.abs(a.oil - c.oil) < 3).length;
  const fairBid = c.guide * (preference + noiseTerm - concentration * 0.055);
  const remaining = COMPANIES.length - lot;
  const budget = remaining === 1 ? state.cash : state.cash * Math.min(0.94, 0.46 + 0.48 / remaining + lot * 0.025);
  return fitOffer(Math.max(0, Math.min(fairBid, budget)), state.cash, c);
}

export function tieOrder(seed, lot) {
  return FUNDS.map((_, i) => i).sort((a, b) => noise(seed, 'tie', lot, a) - noise(seed, 'tie', lot, b) || a - b);
}

export function award(seed, lot, bids) {
  const top = Math.max(...bids);
  if (top < COMPANIES[lot].reserve) return { winner: null, price: 0, tied: false };
  const contenders = tieOrder(seed, lot).filter(i => bids[i] === top);
  return { winner: contenders[0], price: top, tied: contenders.length > 1 };
}

// Rebuild the ledger from the human instructions. A what-if changes one decision only.
// Later bids use the resulting cash balances and, for the rivals, the resulting holdings.
export function draft(seed, humans, orders, forced = null) {
  if (!validSeed(seed) || ![1, 2].includes(humans) || !Array.isArray(orders) || orders.length > COMPANIES.length) throw new Error('Invalid draft');
  const desks = FUNDS.map(() => ({ cash: START, owned: [] }));
  const ledger = orders.map((row, lot) => {
    if (!Array.isArray(row) || row.length !== humans || row.some(n => !Number.isSafeInteger(n) || n < 0 || n > START || n % STEP !== 0)) throw new Error('Invalid sealed instructions');
    const bids = desks.map((desk, seat) => {
      if (forced && forced.lot === lot && forced.seat === seat) return 0;
      return seat < humans ? fitOffer(row[seat], desk.cash, COMPANIES[lot]) : rivalOffer(seed, lot, seat, desk);
    });
    const result = award(seed, lot, bids);
    if (result.winner !== null) {
      desks[result.winner].cash -= result.price;
      desks[result.winner].owned.push(lot);
    }
    return { lot, bids, ...result };
  });
  return { desks, ledger };
}

const NEWS = [
  ['Production cut', 'Oil producers trim supply', 16, -0.2, 0.05],
  ['Export rebound', 'Export orders accelerate', 4, 1.9, 0.10],
  ['Credit squeeze', 'Lenders tighten credit', -2, -1.6, 0.78],
  ['Rate relief', 'The policy rate falls', 0, 0.4, -0.85],
  ['Demand slump', 'Customers delay big orders', -12, -1.9, -0.12],
  ['Supply recovery', 'New wells come online', -15, 0.3, -0.08],
  ['Price pressure', 'Inflation pressures build', 9, -0.3, 0.82],
  ['Investment wave', 'Business investment picks up', 5, 1.4, 0.12],
  ['Quiet month', 'Markets settle into a rhythm', 0, 0, 0],
];

export function economy(seed) {
  const path = [{ month: 0, oil: 80, growth: 2, rate: 4, title: 'Draft close', event: 'Opening market', companyNews: null }];
  for (let m = 1; m <= MONTHS; m++) {
    const previous = path[m - 1];
    const event = NEWS[Math.floor(noise(seed, 'macro', m) * NEWS.length)];
    const jitter = (key, width) => (noise(seed, key, m) - 0.5) * width;
    const focus = Math.floor(noise(seed, 'incident-company', m) * COMPANIES.length);
    const surprise = noise(seed, 'incident-size', m);
    const companyNews = surprise < 0.50 ? null : {
      lot: focus, amount: Math.round((surprise > 0.76 ? 1 : -1) * (75 + COMPANIES[focus].risk * 2.4)),
      text: surprise > 0.76 ? 'wins a one time contract' : 'books a one time repair',
    };
    path.push({
      month: m, event: event[0], title: event[1], companyNews,
      oil: round1(clamp(80 + (previous.oil - 80) * 0.89 + event[2] + jitter('oil', 5), 32, 155)),
      growth: round1(clamp(2 + (previous.growth - 2) * 0.79 + event[3] + jitter('growth', 0.9), -6, 9)),
      rate: round2(clamp(4 + (previous.rate - 4) * 0.91 + event[4] + jitter('rates', 0.32), 0.25, 12)),
    });
  }
  return path;
}

export function companyMonth(seed, lot, market) {
  const c = COMPANIES[lot];
  const oilEffect = (market.oil - 80) * c.oil;
  const growthEffect = (market.growth - 2) * c.growth;
  const rateEffect = (market.rate - 4) * c.rate;
  const exposure = oilEffect + growthEffect + rateEffect;
  const regular = market.month ? Math.round((noise(seed, 'operations', market.month, lot) - 0.5) * 2 * c.risk) : 0;
  const shock = market.companyNews?.lot === lot ? market.companyNews.amount : 0;
  const operating = market.month ? Math.round(c.income + exposure) + regular + shock : 0;
  const mark = Math.max(Math.round(c.base * 0.22), Math.round(c.base + 4.6 * exposure - c.base * 0.028 * (market.rate - 4) + regular * 1.4));
  return { lot, operating, mark, oilEffect: Math.round(oilEffect), growthEffect: Math.round(growthEffect), rateEffect: Math.round(rateEffect), shock };
}

export function settleMonth(previous, operating, mark, rate) {
  const interest = Math.round(previous.debt * (rate + 6) / 1200);
  const available = previous.cash + operating - interest;
  const draw = Math.max(0, -available);
  const repaid = Math.min(previous.debt, Math.max(0, available));
  const cash = Math.max(0, available - repaid);
  const debt = previous.debt + draw - repaid;
  return { cash, debt, mark, wealth: cash + mark - debt, operating, interest, draw, repaid,
    peakDebt: Math.max(previous.peakDebt, debt), totalOps: previous.totalOps + operating,
    totalInterest: previous.totalInterest + interest };
}

export function season(seed, desks, path = economy(seed)) {
  return path.reduce((history, market) => {
    const companies = COMPANIES.map((_, lot) => companyMonth(seed, lot, market));
    const funds = desks.map((desk, seat) => {
      const holdings = desk.owned.map(i => companies[i]);
      const mark = holdings.reduce((s, h) => s + h.mark, 0);
      const operating = holdings.reduce((s, h) => s + h.operating, 0);
      const previous = history.at(-1)?.funds[seat] || { cash: desk.cash, debt: 0, peakDebt: 0, totalOps: 0, totalInterest: 0 };
      return settleMonth(previous, operating, mark, market.rate);
    });
    history.push({ ...market, companies, funds });
    return history;
  }, []);
}

export function compare(seed, humans, orders, lot, original = draft(seed, humans, orders)) {
  if (orders.length !== COMPANIES.length || !original.ledger[lot] || original.ledger[lot].winner === null) throw new Error('Select a completed acquisition');
  const seat = original.ledger[lot].winner;
  const alternative = draft(seed, humans, orders, { lot, seat });
  const path = economy(seed);
  const actual = season(seed, original.desks, path);
  const replay = season(seed, alternative.desks, path);
  const changes = original.ledger.filter((r, i) => i > lot && (r.winner !== alternative.ledger[i].winner || r.price !== alternative.ledger[i].price));
  return { seat, lot, original, alternative, actual, replay, changes };
}
