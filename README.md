# TalkBack — Tap-to-Talk Web App

Peer-to-peer walkie-talkie for two users. One tap to start talking, another tap to stop. No server needed for audio — direct WebRTC between browsers.

## Quick Start

```bash
npm install
npm start
```

Then open on your phone at `http://YOUR_LOCAL_IP:3000`

## How to Use

1. Both users open the app
2. Both enter the **same room code** (e.g. `crew42`) and a name
3. Tap **Join Room**
4. One person becomes the host automatically
5. Once both are connected — tap the big mic button to start talking
6. Tap again to stop

## Features

- **Tap-to-toggle** — one tap starts the session, another tap ends it (no holding required)
- **Noise suppression** — toggle on/off for lousy/noisy environments
- **Mute** — mute yourself while keeping the session open
- **Live indicator** — see who's speaking in real time
- **Space bar** shortcut on desktop

## Deploy (to share a link)

```bash
npm run build
```

Then drag the `build/` folder to [Netlify Drop](https://app.netlify.com/drop) or [Vercel](https://vercel.com) for a free public URL both phones can access.

> **Note:** For production reliability, consider hosting your own PeerJS server:
> ```bash
> npx peerjs --port 9000
> ```
> Then update `usePeer.js` → `new Peer(id, { host: 'your-server.com', port: 9000 })`

## Tech Stack

- React 18
- Tailwind CSS 3
- PeerJS (WebRTC wrapper)
- No backend required
