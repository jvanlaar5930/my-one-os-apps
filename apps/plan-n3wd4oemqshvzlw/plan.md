Pending Application Name: "Weather Radar" 🌦️

A real-time weather radar visualization app that displays precipitation and storm tracking data.

Features:
• Live weather radar overlay with animated precipitation display
• Location-based weather data fetching and display
• User-configurable map zoom and pan controls
• Current weather conditions panel (temperature, humidity, wind)
• Saved locations bookmarking system
• Fullscreen radar view toggle

Bridge & data:
• Uses os.network.fetch for weather API calls
• Uses os.storage for saved locations and user preferences
• Uses os.fs.openDialog/os.fs.saveDialog for exporting radar images
• Storage keys: 'savedLocations', 'radarSettings', 'lastLocation'

Layout:
Single fullscreen map container with top toolbar, right sidebar panel, and bottom status bar

Build steps:
1. Set up basic HTML structure with map container and UI controls
2. Implement os.network.fetch to get weather radar data from API (use openweathermap or similar)
3. Create animated precipitation overlay using canvas rendering
4. Add location selection and saved locations management with os.storage
5. Build current conditions panel with real-time updates
6. Implement fullscreen toggle and responsive layout for small windows