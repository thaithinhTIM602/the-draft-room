# The Draft Room

[Play The Draft Room](https://thaithinhtim602.github.io/the-draft-room/)

Four funds begin with $100 million each. Bid for twelve fictional businesses, then play through a year of oil prices, economic growth and interest rates. The fund with the greatest December wealth wins.

## Playing

1. Open a **Company report** to see what a business earns and how the economy affects it. The guide adds its baseline resale value to twelve months of operating cash.
2. Bid in steps of $0.5 million or pass. The highest eligible bidder pays its own offer. A published priority order breaks ties. Unspent money stays in the fund.
3. After the draft, reveal one month at a time. Click a fund to inspect its cash, businesses and loans. Each browser saves its own game.
4. Open **Replay lab** in December. Pick any winning acquisition and see what the same fund would have been worth if it had passed. The comparison includes returns, peak borrowing and changes to later auctions.

The game opens in solo mode. For two people at the same table, select **New game**, then **Two players**. Pass the device when prompted. Both people can see completed lots. A room code recreates the same scenario in a fresh game. Players on different devices have separate drafts.

## How the simulation works

* Cash is stored in integer units of $10,000. The bid increment is 50 units.
* Each company's monthly operating cash starts with a baseline. Its published oil, growth and rate sensitivities determine the change from the opening economy of $80 oil, 2% economic growth and a 4% policy rate. Each company can also have a monthly variation or a one time event.
* Company values respond to those operating conditions, financing rates and monthly variation. Wealth is cash plus the current company values less debt. A losing company can reduce wealth below the starting $100 million.
* If a fund runs out of cash, it borrows the shortfall. Monthly interest uses the debt at the start of the month. The annual borrowing rate is the policy rate plus six percentage points. For example, a 6% policy rate gives a 12% annual borrowing rate, or 1% for that month. Later cash first pays outstanding debt. Idle cash earns no interest.
* Computer funds have different preferences for growth, steady income and diversification. They bid from the visible auction state, their budgets and room specific preferences.
* Replay removes the selected winning bid. Every other human bid instruction stays fixed, subject to the money that fund now has. Rival bids are recalculated using their updated holdings. Both versions receive exactly the same market path and company shocks. The replay also reports the company's own resale value and cash less its purchase price.

All businesses, prices, economic events and results are fictional. All game logic and artwork run locally in the browser.

## Running the source

The project uses standard browser JavaScript modules, CSS and Canvas. No package installation or build step is needed.

With Python installed, run this command from the project directory and open the address printed in the terminal in your browser.

```sh
python3 -m http.server 8000
```

With Node.js 20 or later, run the tests from the same directory.

```sh
npm test
```

The model tests cover sealed bidding, exclusive ownership, budgets, loan accounting, saved games, and replays with identical market events. One test also checks all monthly balances across 250 different drafts.

Rubik Bold is distributed under the SIL Open Font License. See [font-license.txt](./font-license.txt).

