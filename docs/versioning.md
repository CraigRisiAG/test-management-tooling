# Documentation Versioning & Publishing

This project ships a versioned wiki using **MkDocs Material** + **mike** so docs live in the repo and each release keeps its own version. The workflow stays entirely git-managed.

## Install the docs toolchain

```bash
python -m venv .venv-docs
source .venv-docs/bin/activate  # Windows: .venv-docs\\Scripts\\activate
python -m pip install --upgrade pip
python -m pip install -r docs/requirements.txt
```

## Preview locally

```bash
mkdocs serve -a 0.0.0.0:8000
```

Then open http://localhost:8000.

## Publish a new version

Use `mike` to publish a new version and keep `latest` pointing to it.

```bash
# Example: publish version 1.0 and refresh the latest alias
mike deploy 1.0 latest

# Optionally set the default version shown in the selector
mike set-default latest
```

`mike` commits to the `gh-pages` branch by default. Push the branch after deployment:

```bash
git push origin gh-pages
```

## Listing and cleaning versions

```bash
mike list          # Show published versions
mike delete 0.9    # Remove an old version
```

## Recommended release flow

1. Update content under `docs/` on your release branch.
2. Build locally (`mkdocs build`) to verify.
3. Tag the release (e.g., `v1.0.0`).
4. From the release commit:
   ```bash
   mike deploy 1.0 latest
   mike set-default latest
   git push origin gh-pages
   ```
5. Confirm the version selector shows the new version.

## CI/CD hint (GitHub Actions)

Add a docs job that runs on release tags:

```yaml
- name: Deploy docs
  run: |
    python -m pip install -r docs/requirements.txt
    mike deploy ${{ github.ref_name }} latest
    mike set-default latest
  env:
    GIT_AUTHOR_NAME: docs-bot
    GIT_AUTHOR_EMAIL: docs@example.com
    GIT_COMMITTER_NAME: docs-bot
    GIT_COMMITTER_EMAIL: docs@example.com
```

> Tip: Keep the `mkdocs.yml` nav organized and prefer smaller pages that link to deeper topics. This keeps the wiki readable as it grows.
