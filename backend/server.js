const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");

const app = express();
const httpServer = createServer(app);

// Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:5173",                     // local dev
  "https://your-vercel-frontend-url.vercel.app" // deployed frontend
];

// Express CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Socket.IO with dynamic CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const port = process.env.PORT || 5000;

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

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_gig_chat", (gigId) => {
    socket.join(gigId);
    console.log(`User ${socket.id} joined gig chat: ${gigId}`);
  });

  socket.on("send_message", async (data) => {
    const { sender, recipient, gig, content } = data;
    const newMessage = new Message({ sender, recipient, gig, content });
    await newMessage.save();
    io.to(gig).emit("receive_message", newMessage);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.send("Hello from the GigConnect Backend!");
});

httpServer.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
