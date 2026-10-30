# Changelog

Changes to the WishReaper userscript. Releases distributed from the [official GitHub Gist](https://gist.github.com/NoahBK/555e821c91b5cdc4fa1a9b3cf5f6f1ce).

## v0.7.1

* Removed the prefilled AppID from the optional diagnostic field.
* Kept full wishlist discovery independent from the diagnostic input.
* Improved matching regression tests to guard against hardcoded game-specific matching.
* Restored Gist-based installation and update metadata in the repository copy.

## v0.7.0

* Reworked wishlist scanning to retrieve the complete wishlist from Steam instead of only rendered page rows.
* Added count verification to detect incomplete wishlist responses.
* Improved Steam Families checks, including owned, shareable, and excluded entries.
* Added an optional AppID diagnostic field and manual AppID entry support.
* Kept every removal behind explicit selection and confirmation.
* Added pre-removal account and wishlist checks plus post-removal verification.
* Added Node tests and GitHub Actions for syntax and matching checks.

## v0.6.0

* Earlier Gist-based release with DOM-based wishlist discovery.
* Included manual AppID input and controlled removal.
* Large wishlists could have missing matches because only loaded page rows were scanned.

## Release process

1. Update and test the userscript in the repository.
2. Increment its `@version` for script changes.
3. Publish the updated file to the existing Gist.
4. Keep `@downloadURL` and `@updateURL` pointing to the unpinned Gist raw file in both copies.
5. Verify the installed version and automatic update behavior from a browser.

The GitHub repository and Gist are not automatically synchronized.
