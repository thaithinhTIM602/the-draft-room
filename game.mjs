import { COMPANIES } from './companies.mjs';
import { draft, validOffer, validSeed } from './model.mjs';

export function newGame(seed, humans = 1) {
  if (!validSeed(seed) || ![1, 2].includes(humans)) throw new Error('Choose a valid room code and player count.');
  return { version: 1, seed, humans, orders: [], pending: null, handoff: false, reveal: false, phase: 'auction', month: 0 };
}
export function seal(game, value) {
  const lot = game.orders.length;
  if (game.phase !== 'auction' || game.reveal || game.handoff || lot >= COMPANIES.length) throw new Error('This ticket is closed.');
  const player = game.pending === null ? 0 : 1;
  const balance = draft(game.seed, game.humans, game.orders).desks[player].cash;
  if (!validOffer(value, balance, COMPANIES[lot])) throw new Error('Choose an eligible bid or pass.');
  if (game.humans === 2 && player === 0) return { ...game, pending: value, handoff: true };
  const row = game.humans === 1 ? [value] : [game.pending, value];
  return { ...game, orders: [...game.orders, row], pending: null, handoff: false, reveal: true };
}
export function claim(game) {
  if (!game.handoff) throw new Error('No ticket to claim.');
  return { ...game, handoff: false };
}
export function nextLot(game) {
  if (!game.reveal || game.phase !== 'auction') throw new Error('Finish this lot first.');
  const done = game.orders.length === COMPANIES.length;
  return { ...game, reveal: false, handoff: !done && game.humans === 2, phase: done ? 'season' : 'auction' };
}
export function advance(game, month) {
  if (game.phase !== 'season' || !Number.isInteger(month) || month < game.month || month > 12) throw new Error('Invalid month.');
  return { ...game, month };
}
export function restore(raw) {
  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!g || g.version !== 1 || !validSeed(g.seed) || ![1, 2].includes(g.humans) ||
        !Array.isArray(g.orders) || g.orders.length > COMPANIES.length ||
        typeof g.reveal !== 'boolean' || typeof g.handoff !== 'boolean' ||
        !['auction', 'season'].includes(g.phase) || !Number.isInteger(g.month) || g.month < 0 || g.month > 12) return null;
    const all = draft(g.seed, g.humans, g.orders);
    if (!all.ledger.every((r, i) => g.orders[i].every((n, seat) => r.bids[seat] === n))) return null;
    if (g.phase === 'season') {
      if (g.orders.length !== COMPANIES.length || g.handoff || g.reveal || g.pending !== null) return null;
    } else {
      if (g.month !== 0 || (g.orders.length === COMPANIES.length && !g.reveal) ||
          (g.reveal && (!g.orders.length || g.handoff || g.pending !== null)) ||
          (g.humans === 1 && (g.handoff || g.pending !== null))) return null;
      if (g.pending !== null && !validOffer(g.pending, all.desks[0].cash, COMPANIES[g.orders.length])) return null;
    }
    return { version:1, seed:g.seed, humans:g.humans, orders:g.orders.map(row=>[...row]),
      pending:g.pending, handoff:g.handoff, reveal:g.reveal, phase:g.phase, month:g.month };
  } catch { return null; }
}

