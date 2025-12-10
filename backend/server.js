const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Message = require("./models/messageModel");

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://gigconnect-seven.vercel.app"
];

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

// IMPORTANT
app.use(express.json());

// SOCKET IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = {};
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("userOnline", (userId) => (onlineUsers[userId] = socket.id));
  socket.on("join_gig_chat", (gigId) => socket.join(gigId));
  socket.on("send_message", async (data) => {
    const newMessage = await Message.create(data);
    io.to(data.gig).emit("receive_message", newMessage);
  });
});

// ROUTES (ORDER MATTERS)
app.use("/api", require("./routes/userRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

app.get("/", (req, res) => res.send("GigConnect Backend Running"));

// DB + SERVER
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

httpServer.listen(5000, () =>
  console.log("Server Running at http://localhost:5000")
);
