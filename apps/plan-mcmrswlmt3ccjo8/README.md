# 🚨 Deal Alert System

Build a Deal Alert System app with these features:

1. **Feed Manager**: Allow users to add/edit/delete RSS feed URLs (default feeds: Slickdeals Hot Deals, Slickdeals Frontpage, DealNews). Each feed has a name and URL.

2. **Alert Rules**: Users can create rules with criteria like:
   - Keywords to match (comma-separated)
   - Max price threshold
   - Category/tags
   - Whether to alert on new deals only or all matching

3. **Deal Feed Display**: Show parsed deals from all feeds in a unified list, sorted by newest. Each deal shows: title, price, original price, discount %, source feed, time posted, and whether it matches any rule (with highlight).

4. **Matched Deals Panel**: A separate view showing only deals that match active rules, with the matching rule(s) shown.

5. **Notifications**: Show browser notifications for new matched deals. Include a sound option toggle.

6. **Stats Dashboard**: Show total feeds monitored, active rules count, matches found today, best deal of the day (highest discount).

7. **Auto-refresh**: A refresh button and auto-refresh interval setting (every 5/10/15/30 minutes).

Design: Dark theme, clean card-based layout. Use a color system where matched deals glow green, unmatched are neutral gray. Make it feel like a trader's dashboard — dense but readable.

Technical notes: Parse RSS feeds using a CORS proxy or direct fetch where possible. Handle feed parsing gracefully with fallback messages for unavailable feeds. Store all config (feeds, rules, preferences) in localStorage so it persists between sessions.

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
