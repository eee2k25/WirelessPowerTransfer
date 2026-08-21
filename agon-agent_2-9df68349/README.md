# V2V PowerShare live demo

The app supports a real two-browser room flow over WebSockets.

1. From this directory, run `npm install` once.
2. Run `npm run dev`. This starts the Expo web app and the room relay on port `8787`.
3. Open the printed Expo web URL in two browser tabs.
4. Select `DONOR EV` in one tab and `RECEIVER EV` in the other.
5. On `Find`, create a room in one tab and enter its six-character code in the other.
6. The receiver can request power; the donor accepts. System check, WPT status, and donor telemetry then mirror between tabs.

For a deployed web app, run `server.js` on a reachable Node host and set `EXPO_PUBLIC_WPT_WS_URL` to its `wss://` endpoint before exporting the web build. GitHub Pages can host the static app, but it cannot host the WebSocket relay itself.