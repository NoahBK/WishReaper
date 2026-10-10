<p align="center">
  <img src="https://i.vgy.me/NKrqQV.png" alt="WishReaper banner" width="100%">
</p>

# WishReaper

> Your backlog is big enough.

WishReaper is a userscript that finds games on your Steam wishlist that you already own or can access through Steam Families, helping you clear out redundant entries.

[**Install Userscript**](https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/837cbe945befe51275bbfbcad1c392f9a9304b44/WishReaper.user.js)

## Overview

When running on your Steam wishlist page, WishReaper compares listed games against your owned library and shared family games. It displays exact AppID matches so you can review and select which entries to clean up. Nothing is removed without explicit confirmation.

### Features

* **Dual Library Checks:** Cross-references wishlist items with both your personal library and your Steam Families shared pool.
* **Exact Matching:** Scans AppIDs directly from loaded wishlist entries to avoid false positives.
* **Controlled Removal:** Select specific items to delete. WishReaper uses Steam's native removal controls and verifies that the item was successfully removed.
* **Manual Entry Support:** Add custom AppIDs or store links manually if Steam's library lookup misses anything.

## Setup

1. **Requirements:** Install a browser extension that supports `GM_xmlhttpRequest` (such as Tampermonkey or Violentmonkey).
2. **Installation:** Click here to [Install WishReaper from GitHub Gist](https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce/raw/837cbe945befe51275bbfbcad1c392f9a9304b44/WishReaper.user.js).
3. **Configuration:** The script defaults to `/wishlist/id/Noah_BK`. Update both the `@match` rule and the `PROFILE_PATH` constant in the script header to match your Steam profile URL.
4. **Execution:** Open your Steam wishlist while logged into your account.

## Usage

1. Open your wishlist and allow the initial library lookup to complete.
2. Click **Refresh preview** to scan the entries currently loaded on the page.
3. Select the games you want to remove.
4. Click **Remove selected** and review the confirmation prompt before proceeding.

## Limitations

* **Page Loading:** WishReaper only scans wishlist items currently loaded in your DOM. For large wishlists, scroll down to load additional items and click **Refresh preview** again.
* **Undocumented API:** Steam Families lookup uses an undocumented endpoint and could break if Valve updates their backend.
* **Family Access vs. Ownership:** Shared games are not permanently owned. Removing a family-shared game from your wishlist means you will no longer have a reminder to buy your own copy if sharing ends.
* **DOM Dependency:** Item removal depends on locating Steam's native removal element on the page.

## Disclaimer

WishReaper is an unofficial open-source project and is not affiliated with, maintained by, or endorsed by Valve or Steam.
