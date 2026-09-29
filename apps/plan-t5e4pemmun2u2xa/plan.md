Pending Application Name: "Weather Station" 🌤️

A weather app that looks up a zip code, fetches current conditions from a public API, and displays the weather on an interactive map with a radar-style visualization.

Features:
- Clean zip code search with validation, error handling, and persistence of the last location
- Real-time weather data (temperature, description, humidity, wind speed) displayed in a prominent card
- Interactive Leaflet map centered on the location with weather radar tile overlay
- One-click search to update weather and map for a new zip code
- Responsive layout that adapts to window size, styled in blues and grays for a weather theme
- Handles network failures gracefully with helpful messages

Bridge & data:
- os.network.fetch (requires 'network:open-meteo.com') — call Open-Meteo's geocoding API to convert zip code → coordinates, and weather API to fetch current conditions
- os.storage: { lastZip, lastCoords, lastWeather } to remember the user's most recent search
- No database required

Layout:
Full-screen app with search bar at top (zip input + search button), below it a weather card showing temperature/conditions/humidity/wind, and the bottom half an interactive Leaflet map centered on the location with a free weather radar tile layer. Stack vertically on small windows, scale proportionally on large ones.

Build steps:
1. **Search UI & Validation** — Build the zip code input form with a search button, clear/load-recent toggles, and loading/error states; wire form submission to trigger a weather fetch.
2. **Geocoding & Weather API Integration** — Create useWeather composable that chains Open-Meteo's geocoding API (zip → coordinates) and weather API (coordinates → current conditions), with error handling for invalid zips and network failures.
3. **Weather Display Card** — Build a WeatherCard component showing temperature (in °F), weather description, humidity (%), and wind speed (mph) with visual icons and formatted numbers.
4. **Map & Radar Visualization** — Integrate Leaflet with an OpenStreetMap basemap and add a free weather radar tile layer (e.g., RainViewer or Openweather Radar); update the center and zoom whenever the user searches a new location.
5. **State Persistence & Styling** — Save last zip/coordinates/weather to os.storage for return visits; add blue/gray CSS gradient theme, weather icon sprites, and responsive spacing; test edge cases (very small windows, network timeouts, typos).