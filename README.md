# **Realtime Device Tracker**

A **realtime device tracking application** where multiple users can see their live location on the map. This app uses **Socket.IO** to send and receive location updates and displays them on a map powered by **Leaflet.js**.

![Realtime Device Tracker](https://github.com/sumitprajapati1/Realtime-Device-Tracker/blob/master/images/realtime-device-tracker.png?raw=true)  

## **Live Demo**
Check out the live project: [Realtime Device Tracker](https://realtime-device-tracker-1-osqo.onrender.com)

---

## **How It Works**

1. **Open the Application**:  
   - When you open the app on any device, it will ask for location permission.
   - Once allowed, your live location is shared on the map.

2. **Realtime Tracking**:  
   - If multiple users open the app from different devices, their locations are shown on the same map.
   - Whenever a device moves, the location updates in realtime.

3. **Disconnecting Users**:  
   - When a user closes the app, their marker is automatically removed from the map.

---

## **Tech Stack**

- **Frontend**:  
  - **Leaflet.js** for interactive maps.
  - **HTML**, **CSS** for layout and styling.

- **Backend**:  
  - **Node.js** with **Express** for the server.
  - **Socket.IO** for realtime communication between users.

- **Other Tools**:  
  - **EJS** for server-side rendering.
  - **Render** for deployment.

---

## **Features**

- Realtime location updates for multiple devices.
- Automatically removes disconnected users from the map.
- User-friendly map view with zoom and pan options.
- Responsive design for mobile and desktop users.

---

## **How to Run Locally**

1. Clone the repository:
   ```bash
   git clone https://github.com/sumitprajapati1/Realtime-Device-Tracker.git
   cd Realtime-Device-Tracker
