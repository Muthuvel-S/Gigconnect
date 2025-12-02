// App.js
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import VerificationMessage from "./components/VerificationMessage";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./components/Profile";
import GigPosting from "./components/GigPosting";
import MyGigs from "./components/MyGigs";
import BrowseGigs from "./components/BrowseGigs";
import GigDetails from "./components/GigDetails";
import Message from "./components/Message";
import AppliedGigs from "./components/AppliedGigs";
import GigProposals from "./components/GigProposals";
import ReviewForm from "./components/ReviewForm";
import AdminDashboard from "./components/AdminDashboard";
import Checkout from "./components/Checkout";
import Footer from "./components/Footer";

// ---------------------
// FULL SCREEN MAINTENANCE COMPONENT
// ---------------------
const MaintenanceScreen = ({ title = "🚧 Website Under Maintenance", message = "Sorry for the inconvenience. We are currently updating the website. Please check back shortly." }) => {
  return (
    // pointer-events-auto ensures this overlay receives clicks and prevents interaction with background
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center px-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Maintenance notice"
    >
      {/* dark background */}
      <div className="absolute inset-0 bg-black/85" />

      {/* content card */}
      <div className="relative max-w-xl w-full bg-white rounded-lg p-8 text-center shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{title}</h1>
        <p className="text-sm md:text-lg text-gray-700">{message}</p>

        {/* optional small note */}
        <p className="mt-4 text-xs text-gray-500">We apologise for the inconvenience — thank you for your patience.</p>
      </div>
    </div>
  );
};

// ---------------------
// APP CONTENT
// ---------------------
function AppContent() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Turn maintenance mode on/off here
  const maintenanceMode = true; // <-- set to false to disable maintenance

  // Prevent background scroll when maintenance is active
  useEffect(() => {
    if (maintenanceMode) {
      // store previous overflow to restore later (defensive)
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    // if maintenanceMode is false, no cleanup needed here
    return;
  }, [maintenanceMode]);

  const renderDashboard = () => {
    switch (role) {
      case "admin":
        return <AdminDashboard />;
      case "client":
      case "freelancer":
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {/* Render maintenance overlay FIRST so it sits above everything */}
      {maintenanceMode && (
        <MaintenanceScreen
          title="🚧 Site Maintenance"
          message="Sorry for the inconvenience — updates are in progress. The site is temporarily unavailable."
        />
      )}

      {/* App UI (will be visually behind the maintenance overlay when maintenanceMode === true) */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-message" element={<VerificationMessage />} />
        <Route path="/browse-gigs" element={<BrowseGigs />} />
        <Route path="/gig/:id" element={<GigDetails />} />

        {/* Protected Routes */}
        <Route
          path="/message/:gigId/:recipientId"
          element={
            <PrivateRoute>
              <Message />
            </PrivateRoute>
          }
        />
        <Route
          path="/gig/:id/review"
          element={
            <PrivateRoute>
              <ReviewForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={<PrivateRoute>{renderDashboard()}</PrivateRoute>}
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/post-gig"
          element={
            <PrivateRoute>
              <GigPosting />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-gigs"
          element={
            <PrivateRoute>
              <MyGigs />
            </PrivateRoute>
          }
        />
        <Route
          path="/applied-gigs"
          element={
            <PrivateRoute>
              <AppliedGigs />
            </PrivateRoute>
          }
        />
        <Route
          path="/gig-proposals/:id"
          element={
            <PrivateRoute>
              <GigProposals />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout/:id"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
      </Routes>

      {/* Footer only on homepage */}
      {location.pathname === "/" && <Footer />}
    </>
  );
}

// ---------------------
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;


