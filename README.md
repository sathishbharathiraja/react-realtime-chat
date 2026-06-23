# Internal Business Group Chat 💬

A fast, lightweight, and completely real-time group chat application focused on internal business communication. 
Built precisely to deliver sub-second messaging without page refreshes, persistent history, and seamless file sharing (images, videos) utilizing Firebase Storage.

## 🏗️ Project Structure

```text
client/
├── frontend/                 # React & Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── JoinScreen.jsx     # Authentication & Login UI
│   │   │   ├── RoomSelection.jsx  # Room code entry interface
│   │   │   ├── ChatRoom.jsx       # The core chat interface & file upload logic
│   │   │   └── MessageRow.jsx     # Individual message row component
│   │   ├── App.jsx            # Main React component routing & Socket logic
│   │   ├── firebase.js        # Firebase config for Auth and Storage (Images/Video)
│   │   └── main.jsx           # React entry point
│   ├── package.json
│   └── vite.config.js         # Vite configuration
│
└── backend/                  # Node.js & Socket.io Backend
    ├── models/
    │   └── Message.js         # Optional MongoDB schema for high-scale persistence
    ├── server.js              # Core Socket.io server & JSON File Backup logic
    ├── history.json           # Local MVP persistent database file
    └── package.json
```

## 🛠️ Technology Stack Rationale

1. **Frontend:** React + Vite + Tailwind CSS
   - *Rationale:* React allows for instantaneous DOM updates (sub-second UI reaction). Vite ensures the development server boots instantly, and Tailwind CSS provides the clean, Enterprise "Slack-like" UI required for internal business use.
2. **Backend:** Node.js + Socket.io
   - *Rationale:* Standard HTTP requests require polling, which delays messages and overloads servers. Socket.io maintains a persistent, bi-directional WebSocket connection. When a user sends a message, it is broadcasted instantly to everyone in the room in milliseconds.
3. **Database / Persistence:** JSON File Backup (MVP) + MongoDB (Scale)
   - *Rationale:* For the lightweight MVP, `history.json` acts as an automatic file-backed database. Every message is appended asynchronously. When the server restarts, it reads this file immediately. MongoDB is configured as an optional drop-in replacement when the business scales.
4. **File Sharing:** Firebase Storage
   - *Rationale:* Allows users to send `.png`, `.jpg`, and `.mp4` files exactly like WhatsApp. Files are securely uploaded directly from the browser to Firebase, and the lightweight URL is passed through the Socket.io server, preventing the Node server from crashing due to heavy file streams.

## 🚀 Setup & Installation (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- NPM or Yarn
- A Firebase Project (for Auth & Storage)

### 1. Clone & Install Dependencies
First, install the backend dependencies:
```bash
cd backend
npm install
```

Next, install the frontend dependencies:
```bash
cd ../frontend
npm install
```

### 2. Start the Backend Server
The backend handles the WebSocket connections and automatically creates your `history.json` database.
```bash
cd backend
npm start
```
*The server will run on port 3001.*

### 3. Start the Frontend Application
In a new terminal window, boot up the React interface:
```bash
cd frontend
npm run dev
```
*Vite will provide a local URL (e.g., http://localhost:5173). Open this in your browser.*

---

## 🌍 Deployment Guide

This repository is designed to be easily deployed to **Render**.

1. Create a free account on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Click **New +** -> **Web Service**.
4. Configure the following settings:
   - **Name:** `internal-chat-app`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `cd ../frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command:** `node server.js`
5. Click **Deploy**.

Render will automatically build your React frontend, place the compiled files inside the backend folder, and serve the entire full-stack application (WebSockets and Static Files) seamlessly from a single unified server.
