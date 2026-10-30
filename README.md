<p align="center">
  <img src="https://i.vgy.me/NKrqQV.png" alt="WishReaper" width="100%">
</p>

<h1 align="center">WishReaper</h1>

<p align="center">
  <strong>Your backlog is big enough.</strong><br>
  A Steam wishlist cleaner that finds games you own or can play through Steam Families.
</p>

<p align="center">
  <a href="https://gist.githubusercontent.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/WishReaper.user.js"><img alt="Install WishReaper" src="https://img.shields.io/badge/INSTALL-WISHREAPER-bb2736?style=for-the-badge&logo=steam&logoColor=white"></a>
  <a href="https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce"><img alt="View official Gist" src="https://img.shields.io/badge/VIEW-GIST-24292f?style=for-the-badge&logo=github&logoColor=white"></a>
</p>

<p align="center">
  <img alt="Release" src="https://img.shields.io/badge/release-v0.7.1-bb2736?style=flat-square">
  <a href="https://github.com/NoahBK/WishReaper/actions/workflows/test.yml"><img alt="GitHub Actions tests" src="https://github.com/NoahBK/WishReaper/actions/workflows/test.yml/badge.svg"></a>
  <img alt="Steam Families" src="https://img.shields.io/badge/Steam-Families-1b2838?style=flat-square">
</p>

---

## What is WishReaper?

WishReaper scans your **entire Steam wishlist** and checks it against games you **personally own** or can **access through Steam Families**. It builds a reviewable list of matching AppIDs so you can clear redundant wishlist entries.

**Nothing is removed automatically.** You choose which games to remove, and every removal batch requires confirmation.

| Feature | What it does |
| :--- | :--- |
| **Complete wishlist scan** | Retrieves the full wishlist through Steam's API, including games that have not loaded on the page. |
| **Steam Families support** | Finds personally owned titles and games eligible for sharing from a family member. |
| **Exact AppID matching** | Avoids confusing games with similar names or separate DLC entries. |
| **Access checks** | Distinguishes owned, shared, excluded, and unknown entries rather than assuming everything is playable. |
| **Safe cleanup** | Starts with nothing selected, checks the account and wishlist, and verifies the result after removal. |
| **Optional diagnostics** | Inspect an AppID if something looks wrong. The field is empty by default and is not needed for automatic scanning. |
| **Manual entries** | Add individual AppIDs or store links to your preview, clearly marked as unverified. |

## Install

**[Install the latest WishReaper from the official Gist](https://gist.githubusercontent.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/WishReaper.user.js)**

1. Install **Tampermonkey** or **Violentmonkey**.
2. Open the install link above and confirm installation in your userscript manager.
3. Disable or remove any older WishReaper installation so you do not run two copies.
4. Sign in to Steam and open your [wishlist](https://store.steampowered.com/wishlist/id/Noah_BK/?sort=price).
5. Click **Scan complete wishlist** and review the results.

> **Official download:** [WishReaper on GitHub Gist](https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce). The Gist is the intended installation and update source. The userscript in this repository is kept for source review, version history, and automated tests.

## Using WishReaper

1. **Scan.** WishReaper reads the full wishlist and Steam Families library, then compares AppIDs.
2. **Review.** Check which titles are yours and which are available through family sharing. Sharing may end later.
3. **Select.** Choose individual titles or use the separate selection controls for owned and family games.
4. **Remove.** Confirm the exact list before any requests are sent. WishReaper checks and reports the outcome.

If a game seems missing, enter its **numeric AppID** in the optional **Diagnose** field *after* scanning. The scan works without this field.

<details>
<summary><strong>Why was a game not found?</strong></summary>

It may be absent from your wishlist, missing from Steam's family-library response, or excluded from sharing by its publisher or license. Use **Diagnose** to see how WishReaper classified it. Do not assume a family member owning a game means your account can launch it.

If Steam returns incomplete or unexpected data, the script stops instead of guessing which games are safe to remove.

</details>

<details>
<summary><strong>Can I use WishReaper on another Steam account?</strong></summary>

The current version is configured specifically for `/wishlist/id/Noah_BK`. To change it, edit both the `@match` header and the `PROFILE_PATH` constant in the userscript. Sign in as the account that owns the wishlist before scanning or removing anything.

</details>

<details>
<summary><strong>Will Steam Families games stay available forever?</strong></summary>

No. Shared access can change if the family membership, license, or publisher restrictions change. The script separates these titles from games you own so you can decide whether removing them is worth it.

</details>

## Latest changes

**v0.7.1**

* Removed the game-specific diagnostic prefill. Automatic detection does not require manual input.
* Kept complete wishlist scanning, Steam Families eligibility checks, and explicit removal confirmation.
* Added regression coverage for matching and diagnostic behavior.
* Restored **GitHub Gist** as the project's primary install and update location.

**v0.7.0**

* Replaced the old visible-row-only scan with a complete wishlist API scan and count check.
* Improved Steam Families classifications and added a per-AppID diagnostic tool.
* Added automated tests and post-removal verification.

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## Development

The GitHub repository contains the script, tests, and GitHub Actions workflow. With Node.js installed:

```sh
node --check WishReaper.user.js
node --test tests/*.test.cjs
```

**Keeping releases in sync:** The Gist and GitHub repository do **not** update each other automatically. When publishing an update, copy the tested userscript into the [official Gist](https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce) and use a new `@version` if the script changes. Both the Gist and repository copies should contain these **stable, unpinned** metadata URLs:

```javascript
// @downloadURL  https://gist.githubusercontent.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/WishReaper.user.js
// @updateURL    https://gist.githubusercontent.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/WishReaper.user.js
```

Do not use a revision-specific Gist URL; it will lock users to one version.

## Disclaimer

WishReaper is an unofficial project and is not affiliated with Valve or Steam. It relies in part on an undocumented Steam Families endpoint that Valve may change. Review selected games before removing them.
