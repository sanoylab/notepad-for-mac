# Release Process

Follow these steps to publish a new release of Notepad for Mac.

---

## Steps

### 1. Update the version number

Edit `notepad-app/package.json` and bump the `"version"` field:

```json
{
  "version": "1.1.0"
}
```

Use [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

### 2. Update CHANGELOG.md

Move items from `[Unreleased]` into a new versioned section:

```markdown
## [1.1.0] - 2024-06-01

### Added
- ...

### Fixed
- ...
```

### 3. Commit the changes

```bash
git add notepad-app/package.json notepad-app/CHANGELOG.md
git commit -m "chore: release v1.1.0"
```

### 4. Create and push the version tag

```bash
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

The `v*` tag push triggers the GitHub Actions `release.yml` workflow.

### 5. GitHub Actions builds the DMG

The workflow will:
1. Check out the code on `macos-latest`
2. Install Node.js 20 and run `npm ci`
3. Run `npm run build` → produces `.dmg` files in `notepad-app/dist/`
4. Create a GitHub Release and attach the DMG files

Monitor the build at: `https://github.com/sanoylab/notepad-for-mac/actions`

### 6. Verify the release

Once the workflow completes:
- Check `https://github.com/sanoylab/notepad-for-mac/releases`
- Download the DMG and do a smoke test
- Update the website download badge/version if needed

---

## Hotfix releases

For urgent fixes, create a branch from the tag, apply the fix, bump `PATCH`, and follow the same tag-push process.

---

## Required secrets

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions — no setup needed |
