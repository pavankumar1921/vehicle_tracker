const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* serve driver page */
app.use(express.static("public"));

/* create http server */
const server = http.createServer(app);

/* socket server */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/* database connect */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* store active vehicles in memory */
let vehicles = {};

/* socket logic */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // user or driver joins vehicle room
  socket.on("join-trip", (vehicleId) => {
    socket.join(vehicleId);
    console.log("Joined vehicle:", vehicleId);
  });

  // driver sends location
  socket.on("send-location", (data) => {
    const { tripId, lat, lng } = data;

    vehicles[tripId] = { lat, lng };

    // send to only that vehicle watchers
    io.to(tripId).emit("receive-location", { lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

/* API for hardware tracker later */
app.post("/api/location", (req, res) => {
  const { vehicleId, lat, lng } = req.body;

  vehicles[vehicleId] = { lat, lng };

  io.to(vehicleId).emit("receive-location", { lat, lng });

  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Vehicle Tracking Server Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,"0.0.0.0", () => console.log("Server running on port", PORT));