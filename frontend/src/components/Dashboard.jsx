import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaTasks,
  FaPlus,
  FaBriefcase,
  FaSearch,
} from "react-icons/fa";
import CountUp from "react-countup";
import "./Dashboard.css";

// A smaller, reusable component for the statistic cards
const StatCard = ({ icon, title, value, color, progress }) => (
  <div className="stat-card" style={{ '--card-color': color }}>
    <div className="card-icon-container">{icon}</div>
    <div className="card-content">
      <p className="card-title">{title}</p>
      <h2 className="card-value">{value}</h2>
    </div>
    {progress !== undefined && (
      <div className="card-progress-bar">
        <div className="card-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken.user.role;

        const statsEndpoint = userRole === "client" 
          ? "/gigs/client/stats" 
          : "/gigs/freelancer/stats";

        // Fetch user profile and stats in parallel
        const [userResponse, statsResponse] = await Promise.all([
          api.get("/profile"),
          api.get(statsEndpoint).catch(() => ({ 
            data: { completed: 0, inProgress: 0, earnings: 0, active: 0 } 
          })) // Default stats on error
        ]);

        setUser({ ...userResponse.data, role: userRole });
        setStats(statsResponse.data);

      } catch (err) {
        console.error("Dashboard initialization failed:", err);
        setError("Could not load your dashboard. Please try logging in again.");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // useMemo to prevent recalculating on every render
  const cardConfig = useMemo(() => {
    if (!user || !stats) return [];

    if (user.role === "client") {
      const totalGigs = stats.completed + stats.inProgress + stats.active;
      const getPercentage = (value) => (totalGigs > 0 ? (value / totalGigs) * 100 : 0);
      return [
        {
          icon: <FaTasks />,
          title: "Active Gigs",
          value: <CountUp end={stats.active || 0} duration={2} />,
          color: "#3498db",
          progress: getPercentage(stats.active || 0),
        },
        {
          icon: <FaClock />,
          title: "In Progress",
          value: <CountUp end={stats.inProgress || 0} duration={2} />,
          color: "#f1c40f",
          progress: getPercentage(stats.inProgress || 0),
        },
        {
          icon: <FaCheckCircle />,
          title: "Completed Gigs",
          value: <CountUp end={stats.completed || 0} duration={2} />,
          color: "#2ecc71",
          progress: getPercentage(stats.completed || 0),
        },
      ];
    }

    if (user.role === "freelancer") {
      const totalGigs = stats.completed + stats.inProgress;
      const getPercentage = (value) => (totalGigs > 0 ? (value / totalGigs) * 100 : 0);
      return [
        {
          icon: <FaBriefcase />,
          title: "Gigs In Progress",
          value: <CountUp end={stats.inProgress || 0} duration={2} />,
          color: "#e67e22",
          progress: getPercentage(stats.inProgress || 0),
        },
        {
          icon: <FaCheckCircle />,
          title: "Completed Gigs",
          value: <CountUp end={stats.completed || 0} duration={2} />,
          color: "#2ecc71",
          progress: getPercentage(stats.completed || 0),
        },
        {
          icon: <FaDollarSign />,
          title: "Total Earnings",
          value: <>₹<CountUp end={stats.earnings || 0} duration={2} separator="," /></>,
          color: "#1abc9c",
        },
      ];
    }
    return [];
  }, [user, stats]);


  if (loading) {
    return <div className="dashboard-status">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-status error">{error}</div>;
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="welcome-message">
          <h1>Welcome back, {user?.username}!</h1>
          <p>Here's a summary of your activity.</p>
        </div>
      </header>

      <main className="dashboard-main-content">
        <section className="stats-grid">
          {cardConfig.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </section>

        <section className="dashboard-actions-container">
          <div className="quick-actions-card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              {user?.role === "client" && (
                <>
                  <button className="action-btn primary" onClick={() => navigate("/post-gig")}>
                    <FaPlus /> Post a New Gig
                  </button>
                  <button className="action-btn secondary" onClick={() => navigate("/my-gigs")}>
                    <FaTasks /> Manage My Gigs
                  </button>
                </>
              )}
              {user?.role === "freelancer" && (
                <>
                  <button className="action-btn primary" onClick={() => navigate("/browse-gigs")}>
                    <FaSearch /> Browse Gigs
                  </button>
                  <button className="action-btn secondary" onClick={() => navigate("/applied-gigs")}>
                    <FaBriefcase /> My Applications
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* The "Recent Activity" card has been removed from here */}

        </section>
      </main>
    </div>
  );
};

export default Dashboard;