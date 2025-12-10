import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import

// Socket URL
const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const socket = io(SOCKET_URL, { transports: ["websocket"] });

const Message = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const { gigId, recipientId } = useParams();
  const token = localStorage.getItem("token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.user.id); // ✅ ensures stable ID
    } catch (err) {
      console.error("Token decode failed:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/messages/${gigId}`,
          { headers: { "x-auth-token": token } }
        );

        // FIX: Normalize sender IDs so alignment stays correct after refresh
        const normalized = response.data.map((msg) => ({
          ...msg,
          sender: msg.sender?._id || msg.sender, // <- sometimes sender is object, sometimes ID
        }));

        setMessages(normalized);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    socket.emit("join_gig_chat", gigId);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          sender: msg.sender?._id || msg.sender, // normalize sender field
        },
      ]);
    });

    return () => socket.off("receive_message");
  }, [currentUserId, gigId, token]);

  useEffect(() => scrollToBottom(), [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const messageData = {
      sender: currentUserId,
      recipient: recipientId,
      gig: gigId,
      content: messageInput,
    };

    socket.emit("send_message", messageData);
    setMessageInput("");
  };

  if (isLoading)
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading…</div>;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Chat</h2>

      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #eee",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.sender === currentUserId;

          return (
            <div
              key={msg._id}
              style={{
                textAlign: isMe ? "right" : "left",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  backgroundColor: isMe ? "#dcf8c6" : "#f1f0f0",
                  padding: "10px",
                  borderRadius: "10px",
                  display: "inline-block",
                  maxWidth: "70%",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={handleSendMessage} style={{ display: "flex" }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 15px",
            marginLeft: "10px",
            backgroundColor: "#28a745",
            color: "white",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Message;
