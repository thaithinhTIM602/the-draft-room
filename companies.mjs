// Money is stored in hundredths of one million dollars.
function company(code, name, sector, art, color, base, income, oil, growth, rate, risk, brief, driver) {
  const guide = base + 12 * income;
  return Object.freeze({
    code, name, sector, art, color, base, income, oil, growth, rate, risk, brief, driver, guide,
    reserve: Math.max(50, Math.floor(guide * 0.58 / 50) * 50),
  });
}

export const COMPANIES = Object.freeze([
  company('KSTL', 'Kestrel Air', 'Aviation', 'air', '#b7d5ed', 1880, 86, -6, 30, -12, 34,
    'A regional airline that fills its seats when the economy grows. Fuel is its biggest variable cost.',
    'Higher oil prices squeeze profit. An oil producer can help offset that exposure.'),
  company('EMBR', 'Ember Basin', 'Oil production', 'oil', '#f1ac7e', 1760, 92, 8, 12, -15, 42,
    'An independent producer that sells crude at the going market price. Its wells keep pumping through the cycle.',
    'Higher oil prices lift profit. A fuel buyer can soften the blow when crude falls.'),
  company('HBRL', 'Harborline Freight', 'Shipping', 'ship', '#aecbc1', 1550, 77, -3, 39, -8, 27,
    'A cargo line carrying goods between industrial ports. When orders slow, ships sail with empty space.',
    'It needs a strong economy to keep its ships full and cheap fuel to keep them moving.'),
  company('IONF', 'Ion Foundry', 'Semiconductors', 'chip', '#c8baf2', 2310, 104, -1, 47, -25, 51,
    'A chipmaker with expensive fabrication plants. A busy factory earns far more than an idle one.',
    'Fast growth lifts orders. Higher interest rates hurt its capital intensive operations.'),
  company('SALT', 'Saltwind Power', 'Wind energy', 'wind', '#b9d7c3', 1880, 65, 2, 5, -32, 20,
    'An offshore wind operator with long contracts and large construction loans.',
    'Higher rates weigh on cash flow. Its power contracts are relatively steady through a slowdown.'),
  company('JUNI', 'Juniper Market', 'Food retail', 'retail', '#e4c28a', 1600, 66, -1, 5, -5, 12,
    'A neighborhood grocery chain. Households still buy food when they cut other spending.',
    'Low sensitivity to growth can help a fund that already owns several cyclical companies.'),
  company('ALWY', 'Alloy Works', 'Steelmaking', 'steel', '#d4b7a4', 1940, 88, -3, 46, -14, 38,
    'A steel mill serving builders and automakers. Its furnaces cost money even when the order book is thin.',
    'Strong growth fills the order book. Expensive energy cuts into mill margins.'),
  company('VLTB', 'Vaultline Bank', 'Banking', 'bank', '#aabfda', 1990, 78, 0, 26, 24, 31,
    'A regional lender that earns interest on business loans. Local borrowers fare better in a strong economy.',
    'Higher rates improve its monthly lending margin in this model. A downturn still hurts borrowers.'),
  company('LUMN', 'Lumen Grid', 'Electric utility', 'grid', '#d2d997', 1790, 69, -1, 4, -18, 15,
    'A regulated utility that delivers electricity to homes. It borrows to maintain its network.',
    'Steady household demand limits its growth exposure. Rate increases raise its financing costs.'),
  company('FILD', 'Fieldstone RE', 'Real estate', 'tower', '#dfbdce', 2210, 81, 0, 21, -43, 29,
    'A property owner with office leases and floating rate loans. Vacancy and refinancing affect its cash.',
    'Lower rates ease the cost of debt. A weaker economy leaves more space unoccupied.'),
  company('SLCE', 'Solace Health', 'Health services', 'health', '#a5ced3', 1840, 71, -1, 7, -7, 16,
    'A network of neighborhood clinics with repeat patients and relatively stable demand.',
    'Its small response to growth and rates can moderate a fund with more volatile holdings.'),
  company('NSTR', 'Northstar Signal', 'Telecommunications', 'signal', '#c7bbd8', 2100, 85, -1, 17, -26, 24,
    'A mobile network with recurring subscriptions. Towers and spectrum require long term financing.',
    'Subscriptions steady its income, while higher rates make network expansion more expensive.'),
]);

export const FUNDS = Object.freeze([
  { name: 'Apex Capital', short: 'Apex', mark: 'AC', color: '#254dd5', style: 'Your fund' },
  { name: 'Parallax Fund', short: 'Parallax', mark: 'PX', color: '#ad3f18', style: 'Favors growth' },
  { name: 'Bastion Partners', short: 'Bastion', mark: 'BP', color: '#267061', style: 'Seeks steady income' },
  { name: 'Kinetic Capital', short: 'Kinetic', mark: 'KC', color: '#6b489e', style: 'Balances exposures' },
]);
