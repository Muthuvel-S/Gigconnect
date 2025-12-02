// src/components/MaintenanceOverlay.js
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

const overlayRootId = "maintenance-overlay-root";

const MaintenanceOverlay = ({
  title = "🚧 Site Under Maintenance",
  message = "Sorry for the inconvenience — updates are in progress. The site is temporarily unavailable.",
}) => {
  // Ensure a container div exists in <body> for the portal
  useEffect(() => {
    let root = document.getElementById(overlayRootId);
    if (!root) {
      root = document.createElement("div");
      root.id = overlayRootId;
      document.body.appendChild(root);
    }

    // disable background scroll while overlay is shown
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // restore overflow when overlay removed
      document.body.style.overflow = prevOverflow || "";
      // optional: remove the root when not needed (safe to leave)
      // const el = document.getElementById(overlayRootId);
      // if (el) document.body.removeChild(el);
    };
  }, []);

  const overlay = (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Maintenance mode"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647, // extremely high to beat any site z-index
        pointerEvents: "auto",
      }}
    >
      {/* Dark background that covers everything */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.85)",
          // ensure it captures clicks so background is not clickable
          pointerEvents: "auto",
        }}
      />

      {/* Content card on top */}
      <div
        style={{
          position: "relative",
          zIndex: 2147483648,
          maxWidth: 980,
          width: "90%",
          margin: "0 16px",
          background: "#fff",
          borderRadius: 12,
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: 26, marginBottom: 10 }}>{title}</h1>
        <p style={{ color: "#333", fontSize: 16, lineHeight: 1.4 }}>
          {message}
        </p>
        <p style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
          We apologise for the inconvenience — thank you for your patience.
        </p>
      </div>
    </div>
  );

  // Render into the body root so overlay always sits above fixed navs, etc.
  const root = document.getElementById(overlayRootId);
  if (root) return ReactDOM.createPortal(overlay, root);

  // Fallback if root isn't present yet (very rare)
  return null;
};

export default MaintenanceOverlay;
