(function () {
  const permissionScreen = document.getElementById("permission-screen");
  const errorScreen = document.getElementById("error-screen");
  const errorMessage = document.getElementById("error-message");
  const enableBtn = document.getElementById("enable-location-btn");
  const retryBtn = document.getElementById("retry-btn");
  const statusText = document.getElementById("permission-status");
  const infoBar = document.getElementById("info-bar");
  const recenterBtn = document.getElementById("recenter-btn");
  const weatherPill = document.getElementById("weather-pill");
  const weatherIcon = document.getElementById("weather-icon");
  const weatherTemp = document.getElementById("weather-temp");
  const accuracyPill = document.getElementById("accuracy-pill");
  const accuracyText = document.getElementById("accuracy-text");
  const nearbyBar = document.getElementById("nearby-bar");
  const nearbySheet = document.getElementById("nearby-sheet");
  const nearbySheetTitle = document.getElementById("nearby-sheet-title");
  const nearbySheetBody = document.getElementById("nearby-sheet-body");
  const nearbySheetClose = document.getElementById("nearby-sheet-close");

  const socket = io();

  let map = null;
  let myMarker = null;
  let myAccuracyCircle = null;
  let watchId = null;
  let hasCentered = false;
  let lastWeatherFetch = 0;
  let myLat = null;
  let myLng = null;
  const WEATHER_REFRESH_MS = 10 * 60 * 1000; // refresh every 10 minutes

  const markers = {}; // socket.id -> marker
  let placeMarkers = []; // markers for currently shown nearby places
  let activeCategory = null;

  function initMap(lat, lng) {
    map = L.map("map").setView([lat, lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
  }

  // Classic teardrop map pin (like Google Maps). The tip of the
  // teardrop — not the center of the icon box — must sit exactly on
  // the coordinate, so iconAnchor points at the tip's pixel position
  // (20, 50) within the 40x60 box, not the box center.
  function meIcon() {
    return L.divIcon({
      className: "",
      html: '<div class="pin-wrap"><div class="user-label me">You</div><div class="teardrop me"><div class="teardrop-dot"></div></div><div class="teardrop-pulse me"></div></div>',
      iconSize: [40, 60],
      iconAnchor: [20, 50],
    });
  }

  function otherIcon(id) {
    return L.divIcon({
      className: "",
      html: `<div class="pin-wrap"><div class="user-label">User ${id.slice(0, 4)}</div><div class="teardrop"><div class="teardrop-dot"></div></div></div>`,
      iconSize: [40, 60],
      iconAnchor: [20, 50],
    });
  }

  function updateMyMarker(lat, lng, accuracy) {
    myLat = lat;
    myLng = lng;

    if (!map) {
      initMap(lat, lng);
    }

    if (!myMarker) {
      myMarker = L.marker([lat, lng], { icon: meIcon(), zIndexOffset: 1000 }).addTo(map);
    } else {
      myMarker.setLatLng([lat, lng]);
    }

    // Accuracy circle shows the radius (in meters) the browser is
    // confident your real position is within — makes it clear the pin
    // itself is exact; any visible "offset" is GPS accuracy, not a bug.
    if (typeof accuracy === "number") {
      if (!myAccuracyCircle) {
        myAccuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: "#2455c9",
          fillColor: "#2455c9",
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
      } else {
        myAccuracyCircle.setLatLng([lat, lng]);
        myAccuracyCircle.setRadius(accuracy);
      }

      updateAccuracyBadge(accuracy);
    }

    if (!hasCentered) {
      map.setView([lat, lng], 17);
      hasCentered = true;
    }
  }

  function updateAccuracyBadge(accuracy) {
    accuracyPill.classList.remove("hidden");
    const rounded = Math.round(accuracy);
    accuracyText.textContent = `±${rounded} m`;

    accuracyPill.classList.remove("good", "ok", "poor");
    if (accuracy <= 20) {
      accuracyPill.classList.add("good");
    } else if (accuracy <= 75) {
      accuracyPill.classList.add("ok");
    } else {
      accuracyPill.classList.add("poor");
      // Very poor accuracy usually means GPS hasn't locked yet (indoors,
      // or a laptop/desktop using wifi-based location instead of true
      // GPS). Let the person know so they're not confused by the pin
      // not matching their exact spot.
      accuracyText.textContent = `±${rounded} m (weak signal)`;
    }
  }

  function recenter() {
    if (map && myMarker) {
      map.setView(myMarker.getLatLng(), 16);
    }
  }

  // ---------- Weather ----------
  const weatherCodeMap = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌦️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "🌨️",
    80: "🌧️", 81: "🌧️", 82: "🌧️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
  };

  async function fetchWeather(lat, lng) {
    const now = Date.now();
    if (now - lastWeatherFetch < WEATHER_REFRESH_MS) return;
    lastWeatherFetch = now;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&temperature_unit=celsius`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");

      const data = await res.json();
      const temp = data?.current?.temperature_2m;
      const code = data?.current?.weather_code;

      if (typeof temp === "number") {
        weatherTemp.textContent = `${Math.round(temp)}°C`;
        weatherIcon.textContent = weatherCodeMap[code] || "🌡️";
        weatherPill.classList.remove("hidden");
      }
    } catch (err) {
      console.warn("Could not fetch weather:", err);
      // Fail silently — weather is a bonus feature, shouldn't block tracking
    }
  }

  // ---------- Nearby places (fuel / hospital / food) ----------
  const CATEGORY_CONFIG = {
    fuel: {
      label: "Fuel Stations",
      icon: "⛽",
      query: '["amenity"="fuel"]',
    },
    hospital: {
      label: "Hospitals & Clinics",
      icon: "🏥",
      query: '["amenity"~"^(hospital|clinic|doctors|pharmacy)$"]',
    },
    food: {
      label: "Food & Restaurants",
      icon: "🍔",
      query: '["amenity"~"^(restaurant|fast_food|cafe)$"]',
    },
  };

  const SEARCH_RADIUS_M = 3000; // 3km

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function clearPlaceMarkers() {
    placeMarkers.forEach((m) => map.removeLayer(m));
    placeMarkers = [];
  }

  function placeIcon(category) {
    const cfg = CATEGORY_CONFIG[category];
    return L.divIcon({
      className: "",
      html: `<div class="place-pin ${category}"><span>${cfg.icon}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }

  async function searchNearby(category) {
    if (myLat === null || myLng === null) {
      alert("Still getting your location — please wait a moment and try again.");
      return;
    }

    activeCategory = category;
    document.querySelectorAll(".nearby-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    nearbySheet.classList.remove("hidden");
    nearbySheetTitle.textContent = CATEGORY_CONFIG[category].label;
    nearbySheetBody.innerHTML = '<p class="nearby-loading">Searching nearby…</p>';

    const cfg = CATEGORY_CONFIG[category];
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node${cfg.query}(around:${SEARCH_RADIUS_M},${myLat},${myLng});
        way${cfg.query}(around:${SEARCH_RADIUS_M},${myLat},${myLng});
      );
      out center 20;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
      });

      if (!res.ok) throw new Error("Overpass request failed");

      const data = await res.json();
      const results = (data.elements || [])
        .map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (lat === undefined || lng === undefined) return null;
          return {
            name: el.tags?.name || cfg.label.replace(/s$/, ""),
            lat,
            lng,
            distance: haversineMeters(myLat, myLng, lat, lng),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 15);

      renderNearbyResults(category, results);
    } catch (err) {
      console.warn("Nearby search failed:", err);
      nearbySheetBody.innerHTML =
        '<p class="nearby-loading">Couldn\'t load nearby places. Please check your connection and try again.</p>';
    }
  }

  function renderNearbyResults(category, results) {
    clearPlaceMarkers();

    if (results.length === 0) {
      nearbySheetBody.innerHTML = `<p class="nearby-loading">No ${CATEGORY_CONFIG[category].label.toLowerCase()} found within ${SEARCH_RADIUS_M / 1000}km.</p>`;
      return;
    }

    nearbySheetBody.innerHTML = "";

    results.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: placeIcon(category),
      }).addTo(map);
      marker.bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${(place.distance / 1000).toFixed(2)} km away`);
      placeMarkers.push(marker);

      const item = document.createElement("div");
      item.className = "nearby-item";
      item.innerHTML = `
        <span class="nearby-item-icon">${CATEGORY_CONFIG[category].icon}</span>
        <div class="nearby-item-info">
          <div class="nearby-item-name">${escapeHtml(place.name)}</div>
          <div class="nearby-item-dist">${(place.distance / 1000).toFixed(2)} km away</div>
        </div>
      `;
      item.addEventListener("click", () => {
        map.setView([place.lat, place.lng], 17);
        marker.openPopup();
      });
      nearbySheetBody.appendChild(item);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  document.querySelectorAll(".nearby-btn").forEach((btn) => {
    btn.addEventListener("click", () => searchNearby(btn.dataset.category));
  });

  nearbySheetClose.addEventListener("click", () => {
    nearbySheet.classList.add("hidden");
    document.querySelectorAll(".nearby-btn").forEach((b) => b.classList.remove("active"));
    clearPlaceMarkers();
    activeCategory = null;
  });

  // ---------- Geolocation ----------
  function startTracking() {
    if (!navigator.geolocation) {
      showError("Your browser doesn't support geolocation.");
      return;
    }

    statusText.textContent = "Requesting location access…";
    enableBtn.disabled = true;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        permissionScreen.classList.add("hidden");
        errorScreen.classList.add("hidden");
        infoBar.classList.remove("hidden");
        nearbyBar.classList.remove("hidden");

        updateMyMarker(latitude, longitude, accuracy);
        fetchWeather(latitude, longitude);

        socket.emit("send-location", { latitude, longitude, accuracy });
      },
      (error) => {
        enableBtn.disabled = false;
        handleGeoError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleGeoError(error) {
    let message = "We couldn't access your location.";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Location access was denied. Please allow location permission in your browser settings and try again.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Your location is currently unavailable. Please check your GPS/network connection.";
        break;
      case error.TIMEOUT:
        message = "Location request timed out. Please try again.";
        break;
    }

    showError(message);
  }

  function showError(message) {
    permissionScreen.classList.add("hidden");
    errorMessage.textContent = message;
    errorScreen.classList.remove("hidden");
  }

  enableBtn.addEventListener("click", startTracking);

  retryBtn.addEventListener("click", () => {
    errorScreen.classList.add("hidden");
    permissionScreen.classList.remove("hidden");
    statusText.textContent = "";
  });

  recenterBtn.addEventListener("click", recenter);

  // ---------- Socket events for other users ----------
  socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    if (!map) return; // wait until our own map is ready

    if (markers[id]) {
      markers[id].setLatLng([latitude, longitude]);
    } else {
      markers[id] = L.marker([latitude, longitude], { icon: otherIcon(id) }).addTo(map);
    }
  });

  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });
})();
