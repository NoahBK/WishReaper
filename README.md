<p align="center">
  <img src="https://i.vgy.me/NKrqQV.png" alt="WishReaper banner" width="100%">
</p>

# WishReaper

> Your backlog is big enough.

WishReaper is a Tampermonkey or Violentmonkey userscript that compares the complete Steam wishlist to games owned or playable through Steam Families. Exact AppIDs are used. Nothing is removed automatically.

## Install

**Development version: 0.7.1**

1. Install Tampermonkey or Violentmonkey.
2. Open [the branch userscript](https://github.com/NoahBK/WishReaper/blob/fix/complete-wishlist-family-audit/WishReaper.user.js), click **Raw**, and install it in your userscript manager.
3. Disable the old v0.6.0 Gist installation so only one copy runs.
4. Open [the configured Steam wishlist](https://store.steampowered.com/wishlist/id/Noah_BK/?sort=price) while logged in and click **Scan complete wishlist**.

After merge, use this permanent installation and automatic update URL:

https://raw.githubusercontent.com/NoahBK/WishReaper/main/WishReaper.user.js

The older installer linked to a commit-pinned Gist, so it cannot receive updates from this repository.

## Changes in v0.7.1

* Reads the full wishlist from Steam's IWishlistService/GetWishlist/v1/ instead of inspecting only currently rendered page items.
* Checks the count with IWishlistService/GetWishlistItemCount/v1/ and refuses cleanup if the list appears incomplete.
* Retrieves the Steam account token from Steam's own page configuration or authenticated points-summary endpoint. Tokens are not saved, displayed, or sent to third-party hosts.
* Queries Steam Families with owned apps, excluded apps, and non-game entries included, so DLC and excluded family titles are not silently skipped.
* Distinguishes personally owned, family playable, excluded, and unknown games.
* Includes an optional, initially empty AppID diagnostic field. It does not affect automatic detection of wishlisted games.
* Allows manual AppIDs or Steam store links for exceptional cases. Manual entries are clearly marked unverified.
* Requires explicit checkbox selection, a confirmation prompt, an account check, a fresh wishlist check, and post-removal verification.

## Limitations

Steam Families is an undocumented API. Valve may change its response structure. Owning a title in a Steam Family does not guarantee a second account can play it. A temporary license, excluded title, or incomplete API response must not automatically trigger removal.

The script is scoped to /wishlist/id/Noah_BK. If using a different wishlist, change both the metadata match rule and PROFILE_PATH, and ensure you are logged in as that wishlist's owner.

This release has automated tests using simulated Steam API data, but has not been tested against your authenticated Steam account. Check the scan and diagnostics before deleting anything.

## Development

Run with Node.js:

    node --check WishReaper.user.js
    node --test tests/*.test.cjs

A GitHub Actions workflow runs these checks on pull requests and changes to main.

## Disclaimer

WishReaper is unofficial and is not affiliated with Valve or Steam.
