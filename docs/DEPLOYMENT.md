# GitHub / Pages publication

Published on 2026-10-24 after the user's authorization: [public repository](https://github.com/leomanx/revit-thailand-dc01) and [live GitHub Pages site](https://leomanx.github.io/revit-thailand-dc01/). GitHub Desktop and Git Credential Manager were available locally; normal Git credentials were used without exposing tokens. The Pages workflow completed successfully and the public landing page, access-request layout and Architecture Lab were opened in a real desktop browser. Full mobile, keyboard and screen-reader acceptance remains pending. No DNS, firewall, proxy or security configuration was changed.

## Credits

This publisher uses no Netlify service and performs no purchase or plan upgrade. [GitHub Pages is available for public repositories on GitHub Free](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), subject to GitHub's usage limits. It does not consume a Netlify credit balance.

For a [Netlify credit-based plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), a successful production deployment consumes credits even when the static output was built locally; requests/bandwidth can also use credits. [Exhausted team allowances can pause sites/deploys](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/). This review did not inspect or change the user's actual Netlify plan/balance. A local compile does not bypass those account limits.

## Publish or resume a reviewed source seed

From this checkout, with the normal Git Credential Manager account authenticated as `leomanx`:

```text
python tests/publish-github.test.py
python tools/package-public-source.py
python tools/publish-github.py
```

The final command is a publishing action. It verifies the curated source archive, checks the authenticated account, creates the named public repository only if absent, pushes the initial main branch, configures Pages for Actions, dispatches the prepared Pages workflow, waits for its result and checks hashes on the live Pages origin. It prints and stores actual repository/site/workflow URLs only after success. A timeout/failure does not mean deployment completed; inspect repository Actions before retrying.

The initial publisher refuses nonempty unrelated or different-version repositories. Exact matching source may resume Pages setup without another push. It never force-pushes, changes an existing repository's visibility, purchases hosting, disables TLS verification, or changes networking. Credentials use Git's standard helper protocol in memory; API authorization is sent only to GitHub, not to the public Pages site. The Pages URL's origin is checked. Future feature updates should use normal Git changes/review rather than this initial-seed publisher.

## Offline checks

`python tests/publish-github.test.py` performs five mocked tests: wrong account stops; nonempty repository cannot be overwritten; modified archive stops before credential/network use; the initial-publication flow checks dispatch and hosted payload hashes without leaking authorization to Pages; only the exact empty `.nojekyll` hosting control marker is excluded from HTTP payload verification. No real repository, token or deployment is used by these tests. These checks run in GitHub workflows in addition to the 155 Node tests. Git attributes preserve reviewed file bytes across Windows and Linux, including offline exchange downloads.

Source assets remain a public beta. Use the scope in `public-notes.html`. Each successful publisher run saves actual workflow URLs and hosted-payload verification counts to local `output/deployment-report.json`; this generated receipt is excluded from the public repository.
