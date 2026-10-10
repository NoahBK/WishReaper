# WishReaper

Your backlog is big enough.

WishReaper is a userscript that finds games on your Steam wishlist that
you already own or can access through Steam Families.

It previews exact AppID matches and lets you choose which entries to
remove. Nothing is removed without your confirmation.

## How it works

The script loads your owned games and Steam Families library, then
compares them against wishlist entries currently loaded on the page.

Select the matches you want to remove and click **Remove selected**.
WishReaper asks for confirmation, uses Steam’s own removal controls,
and checks your wishlist afterward to verify the removal.

If Steam’s library data is incomplete, you can add AppIDs or Steam
store links manually.

## Setup

Install the script in a userscript manager that supports
`GM_xmlhttpRequest`, then open your Steam wishlist while signed in.

The current script is configured for `/wishlist/id/Noah_BK`.
To use it with a different profile, update both the `@match` rule
and the `PROFILE_PATH` constant to match your wishlist URL.

## Usage

Open your wishlist and let the library lookup finish. Click
**Refresh preview** to scan the entries currently loaded on the page.

Check the games you want to remove, click **Remove selected**,
and review the confirmation before proceeding.

## Limitations

Only wishlist entries currently loaded on the page are scanned.
Load more entries and refresh the preview as needed.

Steam Families lookup relies on an undocumented endpoint and may
stop working if Valve changes it.

Family access is not ownership and can change. Consider whether you
still want your own copy before removing a shared game.

Removal depends on finding Steam’s native Remove control on the page.

## Disclaimer

Unofficial project. Not affiliated with Valve or Steam.
