# V2V PowerShare (Wireless Power Transfer)

Expo app for campus vehicle-to-vehicle wireless power sharing.

**Live site: https://eee2k25.github.io/WirelessPowerTransfer/**

## Why GitHub Pages looked empty

Pages was publishing the **repo root** (this README), not a built website. This is an Expo app, so it must be exported first. GitHub also ignores folders like `_expo/` unless `.nojekyll` is present.

The production web build is committed in `docs/` and GitHub Pages is set to serve that folder.

## Local web

```bash
cd agon-agent_2-9df68349
npm ci --legacy-peer-deps
npm run web
```

## Rebuild the GitHub Pages site

```bash
cd agon-agent_2-9df68349
npm ci --legacy-peer-deps
BASE_URL=/WirelessPowerTransfer npx expo export -p web
rm -rf ../docs && mkdir ../docs && cp -a dist/. ../docs/
cp ../docs/index.html ../docs/404.html
touch ../docs/.nojekyll
```
