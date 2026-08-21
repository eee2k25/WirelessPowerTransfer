# Changelog

All notable changes to **V2V PowerShare** will be documented in this file.

This project follows **Semantic Versioning** and records release highlights, product capabilities, and important limitations for each published version.

## [Unreleased]

- No unreleased changes recorded yet.

## [1.0.0] - 2026-08-21

Initial public release of **V2V PowerShare**.

**Release:** <https://github.com/eee2k25/WirelessPowerTransfer/releases/tag/v1.0.0>

### Added

- Cross-platform **Expo / React Native** application for a campus EV **vehicle-to-vehicle wireless power transfer** testbed.
- Full **Donor EV** and **Receiver EV** role flows across:
  - Splash
  - Role selection
  - Home
  - Find
  - Track
  - Session
  - History
  - Settings
- **Role-aware session flow** covering discovery, request, consent, system check, transfer, emergency stop, and post-session logging.
- **Privacy-first proximity system** that shares only campus zone, rounded distance band, heading, and ETA instead of an exact GPS pin.
- **Live WPT telemetry dashboard** with donor-side, transfer-path, and receiver-side metrics.
- **Live graphs** for voltage, current, power, and efficiency.
- **History persistence** for completed sessions and summaries.
- **Settings persistence** for role, safety limits, communication options, notify radius, and demo preferences.
- **Demo Mode** with synthetic telemetry and donor discovery so the full app can be explored without hardware attached.
- **Theme system** with:
  - original **Dark** instrument-panel theme
  - new **Day** theme
  - Settings → Appearance theme picker
  - Home header quick-toggle pill
  - themed splash gradient and accent-aware foregrounds
- **GitHub Pages export** committed in `docs/` for live web hosting.
- Project documentation covering architecture, telemetry protocol, privacy model, safety model, repository layout, and local setup.

### Safety and control model

- App-level **system checks** before transfer begins.
- App-level confirmation flow for **START WPT** and **EMERGENCY STOP** actions.
- App-visible handling for session fault, emergency, and completion states.
- Clear separation between **app orchestration** and **hardware protection**.

### Technical highlights

- Typed global app state with `AppContext`.
- Typed telemetry, session, and settings models in TypeScript.
- Flat `KEY=value` telemetry parsing and command serialization boundary for ESP32 integration.
- Shared communication boundary that supports demo telemetry injection without changing UI screens.
- Static web export support for GitHub Pages.

### Known limitations

- **BLE transport remains a stub** in the current app implementation; demo telemetry exercises the same app-facing service boundary intended for real hardware transport.
- Current scope is **bench-scale / student project hardware**, not a road-legal or production charging system.
- Final electrical protection remains on the **ESP32 and power stage hardware**, not the phone app.
