Pending Application Name: "Stock Tier Trader" 📈

A day trading app that recommends the top 10 stocks to trade based on investment tier ($10-100, $100-1000, $1000-10000) with pricing and performance metrics.

Features:
• Tier-based stock recommendations (3 price ranges with top 10 stocks each)
• Real-time stock price fetching and performance tracking
• Portfolio simulation with tier-based investment limits
• Stock detail view with key metrics (price, change, volume)
• Save and load favorite stocks for each tier
• Visual performance indicators (up/down arrows, color coding)

Bridge & data:
• Uses os.network.fetch for stock data from external API
• Uses os.storage for saving favorite stocks and user preferences
• Uses os.fs.openDialog/os.fs.saveDialog for exporting portfolio reports
• Storage keys: "favorites_tier1", "favorites_tier2", "favorites_tier3", "user_tier"

Layout: Single column layout with tier selector at top, stock list below, stock detail panel on right (collapses to bottom on small screens)

Build steps:
1. Set up basic UI with tier selector and stock list container
2. Implement stock data fetching using os.network.fetch with mock API data
3. Create tier-based filtering and sorting logic for top 10 stocks
4. Add stock detail view with metrics display and favorite toggle
5. Implement portfolio simulation with tier-based investment limits
6. Add export functionality using os.fs.saveDialog for portfolio reports