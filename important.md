## Upwork Terms Compliance

**Upwork Job Tile Minimizer** is a Chrome extension that lets users hide job postings they're not interested in on Upwork. It changes only what the user sees in their own browser.

### What the extension does

- Adds a "Hide" control to job postings on Upwork pages the user is already viewing.
- When the user clicks "Hide," it saves **only that job's ID** in `chrome.storage` on the user's device.
- On later page loads, it hides postings whose IDs are on that list.

### What the extension does not do

- It does not crawl, fetch, or request any Upwork pages or data on its own. It works only on pages the user opened.
- It does not copy or store job content such as titles, descriptions, budgets, or client details.
- It does not send any data to external servers. Everything stays on the user's device.
- It does not use the Upwork API.
- It does not submit proposals, send messages, or take any action on the user's account.

### Relevant Upwork rules

- **No scraping.** The [Upwork Terms of Use](https://upwork.pactsafe.io/versions/642c4656d7711060c70315c5.pdf), §3.5, prohibit using "a robot, spider, scraper, or similar mechanisms" and copying information found on Upwork ("no scraping allowed"). The extension does neither: it collects no content and makes no automated requests.
- **Bots and automation.** Upwork's [bots and automation guidance](https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly) describes bots as automated requests or data collection faster than a person could do it. The extension runs only when the user clicks, on pages they're already viewing.
- **API data storage.** The [Upwork API & MCP Terms](https://upwork.pactsafe.io/versions/6ac41c2c2bb860f4d1fddb26.pdf), §8.3, limit caching of API content to 24 hours. This doesn't apply here, because the extension doesn't use the API.

### Summary

The extension is a personal display preference, similar to a user keeping their own list of hidden items. It doesn't scrape, automate, or redistribute Upwork content. It stores only the IDs of jobs the user chose to hide, locally on their own device.