Pending Application Name: "Dow Ticker" 📈

A real-time stock ticker and charting app that fetches live Dow Jones prices, displays them in a responsive grid, and renders an inline SVG historical chart for any configurable symbol.

Features:
- Live price fetching for a user-configurable list of stock symbols (defaulting to top 10 popular US stocks).
- Real-time auto-refresh with a customizable interval.
- Inline SVG line chart rendering for historical data over configurable time ranges (1D, 5D, 30D, etc.).
- Visual indicators for price changes (green/red coloring) and percentage growth.
- Persistent user settings stored in `os.storage` (symbols list, time range, refresh rate).
- Graceful fallback to realistic mock data if external API fetches fail due to sandbox/network constraints.

Bridge & data:
- `os.network.fetch`: To retrieve stock data from Yahoo Finance API (`https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`).
- `os.storage`: Persists `symbols` (array), `timeRange` (number), and `refreshRate` (number).
- `os.notify`: Displays toast messages for fetch errors or connection status.

Layout:
- Top control bar with title, settings toggle, and refresh indicator.
- Middle section: Responsive grid of ticker cards showing symbol, price, and change %.
- Bottom section: SVG chart area with time range selector buttons and axis labels.

Build steps:
1. Create the HTML structure with CSS variables for a dark-mode financial theme; ensure all layouts use flex/grid and percentages to fit small windows.
2. Implement `os.storage` logic to load default symbols (top 10 Dow components) and settings on startup, saving changes when users edit them.
3. Build the `fetchStockData(symbol, range)` function using `os.network.fetch`; implement a robust fallback to generate realistic mock data if the fetch fails or returns an error.
4. Develop the SVG chart renderer: calculate path coordinates from the fetched historical data, handle scaling/normalization, and draw the line with color based on net change.
5. Implement the ticker card grid with auto-refresh logic using `setInterval`, updating prices and colors dynamically without full page reloads.
6. Wire up UI controls (settings modal, time range buttons) to update state, trigger refetches, and redraw the chart accordingly.