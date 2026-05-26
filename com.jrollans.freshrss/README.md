Pulls your unread articles from a **FreshRSS** instance using the GReader API
and marks them read after loading.

**Setup:**
- Instance URL: the root URL of your FreshRSS install (e.g. `https://rss.example.com`)
- Username: your FreshRSS login username
- API Password: set this in FreshRSS under *Profile → API Management* — it is **not** your login password

Articles are fetched in batches of 50. All fetched articles are marked read immediately after loading.
