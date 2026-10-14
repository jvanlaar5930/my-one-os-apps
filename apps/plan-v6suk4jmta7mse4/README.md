# 📋 FlowBoard

Build a beautiful Kanban board app called "FlowBoard" with these features:

**Core Features:**
- Multiple columns (default: Backlog, To Do, In Progress, Review, Done)
- Cards within each column that can be dragged and dropped between columns
- Ability to add new cards by clicking an "Add Card" button at the bottom of each column
- Click on a card to edit its title, description, and assignee
- Delete cards with a trash icon
- Rename columns by double-clicking the column header
- Add new columns with a "+" button
- Color-coded labels/tags on cards (bug, feature, improvement, etc.)

**UI/Design:**
- Clean, modern design with soft shadows and rounded corners
- Smooth drag-and-drop animations
- Column backgrounds in subtle different colors
- Card hover effects
- Responsive layout that works well on screen
- Dark mode friendly color scheme

**Data Persistence:**
- Save all board state (columns, cards, positions) to localStorage so it persists between sessions

**Technical:**
- Single HTML file with embedded CSS and JavaScript
- Use native drag-and-drop API for card movement
- Modal or inline editing for card details
- No external dependencies — pure vanilla JS/CSS/HTML

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
