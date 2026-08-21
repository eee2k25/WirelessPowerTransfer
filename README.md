# V2V PowerShare (Wireless Power Transfer)

Expo app for campus vehicle-to-vehicle wireless power sharing. Live site:

**https://eee2k25.github.io/WirelessPowerTransfer/**

## Why GitHub Pages looked broken

Pages was publishing the **repo root** (`README.md` + source), not a built website. This is an Expo app, so it has to be exported first (`npx expo export -p web`). Assets also live under `_expo/…`, which Jekyll would skip unless `.nojekyll` is present.

GitHub Actions now builds the app in `agon-agent_2-9df68349/` and deploys the `dist/` folder to Pages.

## Local web

```bash
cd agon-agent_2-9df68349
npm ci
npm run web
```

Production export (without the GitHub Pages subpath):

```bash
cd agon-agent_2-9df68349
npm ci
npm run export:web
npx serve dist
```
