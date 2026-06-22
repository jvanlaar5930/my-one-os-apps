Pending Application Name: "Crypto Ticker" 📈

A live cryptocurrency price ticker that displays Bitcoin and Ethereum prices updated every 15 seconds from CoinGecko API with visual up/down direction indicators.

**Features:**
- Auto-fetch BTC and ETH prices every 15 seconds via CoinGecko API
- Display current USD price in large, readable text with minimal visual clutter
- Color-coded directional indicator (green ↑ for up, red ↓ for down, gray — for first load)
- Manual refresh button to fetch immediately
- Show last-update timestamp
- Persist last-known prices to track direction across app reloads

**Bridge & data:**
- `os.network.fetch()` for CoinGecko API calls (requires 'network' capability)
- `os.storage` keys: `lastPrices` (object: { bitcoin, ethereum }), `lastUpdate` (ISO timestamp)

**Layout:**
Two equal-width price cards stacked vertically or side-by-side (flex), each showing cryptocurrency name, large price, direction indicator with color, and small timestamp at bottom.

**Build steps:**
1. Create HTML with two price card divs, a refresh button, and a loading/error message zone
2. Style cards with glassmorphism; use flexbox for responsive stacking; size root to 100% vh/vw
3. Write async `fetchPrices()` function to call the CoinGecko endpoint and parse JSON response
4. On app load, restore last prices from `os.storage`, then immediately fetch and set up `setInterval(fetchPrices, 15000)`
5. Compare new prices against stored prices; set indicator color and symbol (green/red/gray); update and persist both new prices and timestamp
6. Add error state (show "—" or "Error" on fetch failure); disable refetch during in-flight request