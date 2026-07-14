Pending Application Name: "WealthFlow" 📈

A passive income simulator where users manage a portfolio of virtual assets, simulate market fluctuations, and track their growing net worth over time.

**Features:**
- **Asset Portfolio:** Manage a diverse portfolio of assets (Stocks, Real Estate, Crypto) with unique growth rates and volatility.
- **Market Simulation:** Real-time price updates and passive income generation based on a configurable time scale.
- **Financial Dashboard:** Visualize net worth, daily income, and investment performance.
- **Transaction History:** Persistent log of all buys, sells, and income events using the OS database.
- **Persistence:** Auto-saves portfolio state to `os.storage` so users can return to their progress.

**Bridge & data:**
- `os.storage`: `wf_state` (balance, inventory, settings).
- `os.database`: `transactions` table (id, type, asset, amount, date).
- `os.notify`: Milestone alerts.
- `os.fs`: None (no user files).

**Layout:**
- Top stats bar (Net Worth, Income).
- Central grid of asset cards (Current Price, Holdings, Yield).
- Bottom scrollable transaction log.

**Build steps:**
1. **App Skeleton & State** — Setup Vue 3 app structure and reactive state for balance and asset inventory.
2. **Simulation Engine** — Implement the core `tick()` logic for market fluctuations and passive income calculation.
3. **Portfolio UI** — Build the asset grid with dynamic cards showing current prices and yield percentages.
4. **Transaction System** — Implement the database schema and UI for logging buys, sells, and income events.
5. **Persistence & Polish** — Add `os.storage` save/load logic, CSS styling, and milestone notifications.