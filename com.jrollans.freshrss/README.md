# FreshRSS Connector for Tapestry

Pulls unread articles from a FreshRSS instance using the GReader API and weaves them into your Tapestry timeline.

## Features

- Fetches up to 50 unread articles per refresh
- Marks all fetched articles as read automatically
- Star/unstar articles directly from the timeline
- Apply or remove a custom label from the timeline (toggleable)

## Setup

- **Instance URL** — the root URL of your FreshRSS install (e.g. `https://rss.example.com`)
- **Username** — your FreshRSS login username
- **API Password** — set this under *Profile → API Management* in FreshRSS; this is **not** your login password
- **Label Name** — the FreshRSS label to apply/remove via the label action button (e.g. `Released`); the label must already exist in FreshRSS

## Notes

- All fetched articles are marked read immediately after loading; there is no read/unread toggle
- The label action is a toggle: tap once to apply, tap again to remove
- The star action is also a toggle: tap once to star, tap again to unstar