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

import MaintenanceOverlay from "./components/MaintenanceOverlay";

function AppContent() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Turn maintenance mode on/off here
  const maintenanceMode = true; // <-- set to false to disable maintenance

  // Optional: ensure focus management or additional page-level side effects
  useEffect(() => {
    if (maintenanceMode) {
      // you could also set an "aria-hidden" attribute on the main app container
      // but since the overlay is portaled and modal, it's usually sufficient
    }
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
      {/* Overlay is portaled to document.body and will sit above the Navbar */}
      {maintenanceMode && (
        <MaintenanceOverlay
          title="🚧 Site Maintenance"
          message="Sorry for the inconvenience — updates are in progress. The site is temporarily unavailable."
        />
      )}

      {/* Your normal app UI (will be visually behind the overlay) */}
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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;




