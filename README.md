# 🚀 AnyDrop — Universal Cross-Platform File Transfer (Works on ANY Network)

**AnyDrop** is a modern, responsive file transfer application that uses your phone's storage (or any device's storage) to stream and transfer files **from anywhere in the world on ANY network** — across **PC, iOS (iPhone/iPad), and Android**.

Whether your phone is on **Cellular 5G/LTE** and your PC is on home Wi-Fi, or you are transferring between two phones in different cities, AnyDrop connects them instantly.

---

## 🌐 How "Any Network" Mode Works

Most local file-sharing tools (like AirDrop or QuickShare) only work when devices are connected to the exact same Wi-Fi router. AnyDrop is designed to break that barrier:

1. **🌍 Global Public HTTPS Access (Zero Setup)**:
   - When you start AnyDrop with **Any-Network Mode** (`start-anywhere.bat` or `node server.js --anywhere`), it automatically establishes an instant public HTTPS link (e.g., `https://abcdef.a.pinggy.link`).
   - The on-screen QR code and share links automatically update to this global link.
   - Any phone, anywhere in the world, can scan the QR code or click the link over 5G, 4G, or public Wi-Fi.

2. **⚡ Multi-STUN & OpenRelay TURN**:
   - Direct encrypted P2P data streaming using Google, Cloudflare, Twilio, and Mozilla STUN servers.
   - Includes **OpenRelay TURN servers** to punch through Carrier-Grade NAT (CGNAT) and mobile firewall restrictions.

3. **🛡️ 100% Guaranteed WebSocket Fallback Relay**:
   - If a strict corporate VPN or cellular carrier blocks direct UDP/WebRTC traffic, AnyDrop **automatically and seamlessly switches to Cloud Relay mode**.
   - Encrypted 64KB chunks stream through the WebSocket tunnel, ensuring file transfers **never fail on any network**.

---

## ✨ Core Features

- **📱 Direct Phone Storage Access**:
  - **Photos & Videos**: Direct access to your camera roll or photo gallery.
  - **Files & Documents**: Pick any file, PDF, ZIP, or document from your phone's internal storage or SD card.
  - **Live Camera**: Snap a photo or record video directly to beam immediately.
  - **PC Desktop**: Drag-and-drop support and `Ctrl + V` clipboard screenshot pasting.

- **🎛️ Dedicated Sender & Receiver Menu**:
  - **📤 Sender Mode**: Select files, see thumbnail previews and size, generate 6-digit room code, and start transfer.
  - **📥 Receiver Mode**: Shows your receiving code and QR code, incoming transfer prompts (Accept/Decline), and auto-saves files directly to phone or PC storage.
  - Switch roles anytime with the top header pills.

- **💻 Multi-Platform Native Support**:
  - **PC**: Windows, Mac, Linux (Chrome, Edge, Safari, Firefox).
  - **iOS**: iPhone and iPad (Safari) — saves directly to Files app or Photos.
  - **Android**: Android phones and tablets (Chrome) — saves to Downloads folder.
  - **PWA Ready**: Add to Home Screen on iOS and Android for a fullscreen native app experience.

- **⚡ Real-Time Transfer Dashboard**:
  - Live progress bar (0% - 100%).
  - Live transfer speed tracker (e.g. `18.5 MB/s`).
  - Estimated time remaining (ETA countdown).
  - Audio chimes & mobile haptic vibration feedback.

---

## 🚀 How to Run It Right Now

### Option 1: Any-Network Mode (Works on 5G, LTE, Different Wi-Fi, Anywhere)

```
Or run `start.bat` and choose **Option [1]**.

- An instant public HTTPS link is generated (e.g. `https://xyz.a.pinggy.link`).
- The QR code on your PC screen immediately reflects this global link.
- Pick up your iPhone or Android phone on **Cellular 5G/4G**, scan the QR code with your camera, and beam files immediately!

### Option 2: Local Network Mode (Same Wi-Fi only)
Run `start.bat` and choose **Option [2]**.
- Runs strictly on your local network: `http://localhost:3000` and `http://192.168.x.x:3000`.

---

## 📲 How to Transfer Files

### Send from Phone (iPhone/Android on 5G) to PC (Home Wi-Fi):
1. On your **PC**, open AnyDrop and click **"📥 Receiver"**.
2. On your **Phone**, scan the QR code on the PC screen (or enter the PC's 6-digit code).
3. Tap **"Browse Files"** or **"Photos & Videos"** on your phone to select files from storage.
4. Tap **"Transfer Files Now"**.
5. The files stream across the internet and save directly into your PC's Downloads folder!

### Send from PC to Phone:
1. On your **Phone**, open AnyDrop and select **"📥 Receiver"**.
2. On your **PC**, select **"📤 Sender"** and drag-and-drop the files.
3. Enter the phone's 6-digit code and click **"Transfer Files Now"**.
4. On your phone, tap **"Accept"** — files are saved directly into your phone storage (Files / Photos)!

---

## ☁️ Permanent Free 24/7 Cloud Hosting (No PC Required)

You can also host AnyDrop for free on **Render**, **Railway**, or **Vercel** so it runs 24/7:

1. Push this folder to a GitHub repo.
2. In [Render.com](https://render.com) or [Railway.app](https://railway.app), create a new **Web Service**.
3. Set the build command to empty, and start command to `node server.js`.
4. You get a permanent link (e.g., `https://my-anydrop.onrender.com`).
5. Open this link on any device anywhere in the world at any time!
