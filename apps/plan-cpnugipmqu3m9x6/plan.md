Pending Application Name: "PA Map Explorer" 🗺️

An interactive map of Pennsylvania that users can pan, zoom, and explore with full mouse/touch controls.

Features:
• Interactive map with drag-to-pan and scroll-to-zoom functionality
• Zoom level indicators and control buttons
• Location search and marker placement
• Responsive layout that fills the window
• Offline map caching using tile-based rendering

Bridge & data:
• Uses os.network.fetch for map tile loading (requires 'network' capability)
• Stores user's last viewed location in os.storage as { lat, lng, zoom }
• Uses os.storage for saving custom markers and search history
• No file dialogs needed since it's purely visual

Layout:
Single full-window canvas element with control buttons overlayed at bottom-right

Build steps:
1. Create HTML structure with a full-size canvas and zoom controls
2. Implement map tile loading using os.network.fetch from OpenStreetMap tiles
3. Add drag-to-pan functionality with mouse/touch event handlers
4. Implement scroll-to-zoom with smooth zoom transitions
5. Add search functionality to place markers on the map
6. Save/load user preferences and custom locations using os.storage