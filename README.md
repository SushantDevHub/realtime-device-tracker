## 🌐 Live Demo
https://realtime-device-tracker-etz1.onrender.com

_Add your deployed link here once available._
# 📍 Realtime Device Tracker

A **realtime location-sharing web app** where a group of people can open a shared link and see each other's live position on a map — along with the current temperature, and the nearest fuel stations, hospitals, and food spots. No account, no app install, just a link.

Built with **Node.js**, **Express**, **Socket.IO**, **EJS**, and **Leaflet.js**.

---

## ✨ Features

- **Live location sharing** — your position updates on everyone's map in real time as you move.
- **Room-based sessions** — every visit generates a short shareable room code (e.g. `blue-fox-42`); only people in the same room see each other, not every visitor to the server.
- **Named users** — pick a display name when you join so people aren't just anonymous dots.
- **Accurate, honest pins** — your marker is a precise teardrop pin anchored exactly at your GPS coordinate (not just visually centered), with a live accuracy radius shown so the displayed position reflects real GPS confidence instead of fake precision.
- **Current temperature** — fetched for your exact coordinates and shown in the top bar.
- **Nearby places** — tap a button to find the closest:
  - ⛽ Fuel stations
  - 🏥 Hospitals, clinics & pharmacies
  - 🍔 Restaurants & food spots
- **Auto cleanup** — when someone closes the tab or loses connection, their marker disappears for everyone else automatically.
- **Mobile-friendly UI** — built for one-thumb use on a phone, since that's where GPS tracking actually happens.

---

## 🧠 How It Works

1. Open the app — you're redirected to a new room with a unique shareable code.
2. Enter a name and tap **Join Map**. Share the room link with others so they land in the same room.
3. Allow location access when prompted.
4. Your live position appears on the map as a pin, along with everyone else currently in the room.
5. Use the **Fuel / Hospital / Food** buttons to pull nearby results for your current location.
6. Close the tab anytime — your marker is removed for everyone else instantly.

---

## 🛠️ Tech Stack

**Backend**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) — server and routing
- [Socket.IO](https://socket.io/) — real-time, room-scoped communication between clients
- [EJS](https://ejs.co/) — server-side view rendering

**Frontend**
- [Leaflet.js](https://leafletjs.com/) — interactive map rendering
- Vanilla JavaScript — no frontend framework, kept deliberately lightweight
- Plain CSS — custom UI, mobile-first

**Data sources (both free, no API key required)**
- [Open-Meteo](https://open-meteo.com/) — current temperature by coordinates
- [OpenStreetMap Overpass API](https://overpass-api.de/) — nearby fuel, hospital, and food data

---

## 📂 Project Structure

```
realtime-device-tracker/
├── app.js                  # Express server, Socket.IO rooms & events
├── package.json
├── views/
│   └── index.ejs            # Join screen, map UI, all markup
└── public/
    ├── css/
    │   └── style.css        # All styling
    └── js/
        └── script.js         # Geolocation, map rendering, weather & nearby-places logic
```

---

## 🚀 Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/sumitprajapati1/Realtime-Device-Tracker.git
   cd Realtime-Device-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open it in your browser**
   ```
   http://localhost:3000
   ```

> ⚠️ **Note:** Browsers only allow geolocation access over HTTPS or on `localhost`. If you deploy this, make sure it's served over HTTPS (most hosts like Render do this automatically) — otherwise location requests will be blocked.


## 🔮 Possible Future Improvements

- Movement trails (fading line behind each moving pin)
- Persistent room history / chat alongside the map
- More nearby-place categories (ATMs, pharmacies, EV chargers)
- Dark mode
