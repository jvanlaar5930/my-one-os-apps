# Bitcoin Trade Live â€” Changelog

## Changelog
- 2026-06-22 â€” Edit the Bitcoin trade feed app — replace the Binance WebSocket URL with CoinCap's: wss://ws.coincap.io/prices?assets=bitcoin,ethereum. The message format from CoinCap is a JSON object like {"bitcoin":"94382.11","ethereum":"3241.87"} — parse it and update the displayed prices. Remove the buy/sell direction since CoinCap doesn't provide that; show price and a green/red indicator for whether it went up or down from the previous update instead.
