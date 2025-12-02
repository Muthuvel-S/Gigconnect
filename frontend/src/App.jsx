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

import MaintenancePage from "./components/MaintenancePage";

function AppContent() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Toggle maintenance ON/OFF here
  const maintenanceMode = true; // <- set to false to restore normal app

  // Optional: Admin bypass (if you want to preview the site while maintenance is on)
  // Set localStorage.setItem('maintenanceBypass', 'true') in browser to bypass.
  const bypass = localStorage.getItem("maintenanceBypass") === "true";

  useEffect(() => {
    if (maintenanceMode && !bypass) {
      // prevent scroll just for visual niceness (not required)
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [maintenanceMode, bypass]);

  // If maintenance enabled and user is not bypassing, render only the maintenance page.
  if (maintenanceMode && !bypass) {
    return <MaintenancePage />;
  }

  // Otherwise render the normal app
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





