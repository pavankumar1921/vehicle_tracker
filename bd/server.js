const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* serve driver page (important for Render) */
app.use(express.static(path.join(__dirname, "public")));

/* create http server */
const server = http.createServer(app);

/* socket server */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

/* database connect */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

/* store active vehicles in memory */
let vehicles = {};
// ===== HTTP REQUEST LOGGER =====
app.use((req, res, next) => {
  console.log("HTTP:", req.method, req.url);
  next();
});
/* socket logic */
// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id);

//   // user or driver joins vehicle room
//   socket.on("join-trip", (vehicleId) => {
//     socket.join(vehicleId);
//     console.log("Joined vehicle:", vehicleId);
//   });

//   // driver sends location
//   socket.on("send-location", (data) => {
//     const { tripId, lat, lng } = data;

//     vehicles[tripId] = { lat, lng };

//     // send only to users tracking this vehicle
//     io.to(tripId).emit("receive-location", { lat, lng });
//   });

//   socket.on("disconnect", () => {
//     console.log("Disconnected:", socket.id);
//   });
// });
/* socket logic */
io.on("connection", (socket) => {

  console.log("=========== NEW CLIENT ===========");
  console.log("Socket ID:", socket.id);
  console.log("Client IP:", socket.handshake.address);

  // when user joins vehicle
  socket.on("join-trip", (vehicleId) => {
    console.log("JOIN REQUEST:", vehicleId);

    socket.join(vehicleId);

    console.log("Rooms now:", socket.rooms);
  });

  // DRIVER GPS DATA (MOST IMPORTANT)
  socket.on("send-location", (data) => {

    console.log("📡 LOCATION PACKET RECEIVED");
    console.log(data);

    if(!data){
      console.log("No data received");
      return;
    }

    const { tripId, lat, lng } = data;

    console.log("Vehicle:", tripId);
    console.log("Latitude:", lat);
    console.log("Longitude:", lng);
    console.log("Google:", `https://maps.google.com/?q=${lat},${lng}`);

    vehicles[tripId] = { lat, lng };

    io.to(tripId).emit("receive-location", { lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
/* API for future hardware GPS device */
app.post("/api/location", (req, res) => {
  const { vehicleId, lat, lng } = req.body;

  vehicles[vehicleId] = { lat, lng };
  console.log("=== GPS DEVICE UPDATE ===");
  console.log("Vehicle:", vehicleId);
  console.log("Latitude :", lat);
  console.log("Longitude:", lng);
  console.log("Google Map:", `https://maps.google.com/?q=${lat},${lng}`);
  console.log("=========================");
  io.to(vehicleId).emit("receive-location", { lat, lng });

  res.json({ status: "ok" });
});

/* health route (Render uses it) */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* homepage test */
app.get("/", (req, res) => {
  res.send("Vehicle Tracking Server Running");
});

/* start server */
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});