const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");

const app = express();
const httpServer = createServer(app);

// ===================================================================
// THIS IS THE CORRECTED PART
// ===================================================================
// This array now contains the exact, correct URL for your Vercel site.
const allowedOrigins = [
  "http://localhost:5173",
  "https://gigconnect-seven.vercel.app" // CORRECT URL
];
// ===================================================================

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Online users map
let onlineUsers = {};

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("userOnline", (userId) => { onlineUsers[userId] = socket.id; });
  socket.on("join_gig_chat", (gigId) => { socket.join(gigId); });
  socket.on("send_message", async (data) => {
    const { sender, recipient, gig, content } = data;
    const newMessage = new Message({ sender, recipient, gig, content });
    await newMessage.save();
    io.to(gig).emit("receive_message", newMessage);
  });
  socket.on("send_notification", ({ userId, message }) => {
    const socketId = onlineUsers[userId];
    if (socketId) {
      io.to(socketId).emit("newNotification", message);
    }
  });
  socket.on("disconnect", () => {
    for (const [userId, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) delete onlineUsers[userId];
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Helper to emit notifications from routes
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB Connection Error:", err.message));

// Routes
app.use("/api", require("./routes/userRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// Root route
app.get("/", (req, res) => {
  res.send("Hello from the GigConnect Backend!");
});

// Start server
const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});