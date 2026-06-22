Pending Application Name: "Bitcoin Trade Live" 💹

Real-time BTC/USDT trade stream from Binance with color-coded buy/sell indicators and live connection status.

**Features:**
- Live WebSocket connection to Binance trade stream with status badge
- Scrolling list of last 20 trades (price, quantity, timestamp)
- Green for buy trades, red for sell trades (determined by maker flag)
- Automatic reconnection with exponential backoff on disconnect
- Manual reconnect button
- Trade timestamps displayed as "Xs ago"

**Bridge & data:**
- `os.network.socket()` for WebSocket connection to Binance
- `os.storage` to persist reconnect attempt count (optional, can reset on close)
- No file operations needed

**Layout:**
Top status bar (connected/disconnected badge, reconnect button) → scrollable trade list (rows: time, price, quantity, buy/sell color indicator).

**Build steps:**
1. Create HTML with a status bar, trade list container, and inline CSS for green (buy) / red (sell) styling
2. On app load, open WebSocket to `wss://stream.binance.com:9443/ws/btcusdt@trade`, set up onMessage handler
3. Parse trade JSON from each message: extract `p` (price), `q` (quantity), `m` (true=sell/red, false=buy/green), `T` (timestamp)
4. Maintain a trades array (max 20 items); unshift new trade, trim to length 20
5. Render trades with absolute price formatting and quantity, compute relative time ("3s ago")
6. Implement reconnection: on socket close, exponential backoff (base 1s, max 10 retries); log attempt count to storage; reset on successful connect
7. Add manual reconnect button; update status badge (connecting → connected → disconnected) and disable button during retry