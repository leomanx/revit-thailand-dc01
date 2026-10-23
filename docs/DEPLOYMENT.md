# GitHub / Pages publication

User authorized publication on 2026-10-22. Target: public repository `leomanx/revit-thailand-dc01` and GitHub Pages. Repository creation, push, Pages configuration and a live URL are **not completed** as of the failed connectivity attempt. The connected GitHub app confirms account `leomanx` and reports target repository not found; it does not expose repository-creation / Pages-management tools. Local API and browser attempts timed out. No DNS, firewall, proxy or security configuration was changed.

## Credits

This publisher uses no Netlify service and performs no purchase or plan upgrade. [GitHub Pages is available for public repositories on GitHub Free](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), subject to GitHub's usage limits. It does not consume a Netlify credit balance.

For a [Netlify credit-based plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), a successful production deployment consumes credits even when the static output was built locally; requests/bandwidth can also use credits. [Exhausted team allowances can pause sites/deploys](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/). This review did not inspect or change the user's actual Netlify plan/balance. A local compile does not bypass those account limits.

## Run when GitHub is reachable

From this checkout, with the normal Git Credential Manager account authenticated as `leomanx`:

```text
python tests/publish-github.test.py
python tools/package-public-source.py
python tools/publish-github.py
```

The final command is a publishing action. It verifies the curated source archive, checks the authenticated account, creates the named public repository only if absent, pushes the initial main branch, configures Pages for Actions, dispatches the prepared Pages workflow, waits for its result and checks hashes on the live Pages origin. It prints and stores actual repository/site/workflow URLs only after success. A timeout/failure does not mean deployment completed; inspect repository Actions before retrying.

The initial publisher refuses nonempty unrelated or different-version repositories. Exact matching source may resume Pages setup without another push. It never force-pushes, changes an existing repository's visibility, purchases hosting, disables TLS verification, or changes networking. Credentials use Git's standard helper protocol in memory; API authorization is sent only to GitHub, not to the public Pages site. The Pages URL's origin is checked. Future feature updates should use normal Git changes/review rather than this initial-seed publisher.

## Offline checks

`python tests/publish-github.test.py` performs four mocked tests: wrong account stops; nonempty repository cannot be overwritten; modified archive stops before credential/network use; the initial-publication flow checks dispatch and hosted payload hashes without leaking authorization to Pages. No real repository, token or deployment is used by these tests. These checks run in the prepared GitHub workflows in addition to the 154 Node tests.

Source assets remain a public beta with real browser/mobile acceptance pending. Use the scope in `public-notes.html`; do not describe a completed CI/hosting deployment until its actual result and hosted payloads have been verified.
