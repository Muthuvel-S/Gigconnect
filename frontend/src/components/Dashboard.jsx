import React, { useEffect, useState } from "react";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClock, FaDollarSign, FaTasks, FaPlus, FaUser } from "react-icons/fa";
import CountUp from "react-countup";
import "./Dashboard.css";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.user.role);

        const fetchUserData = async () => {
          try {
            const response = await api.get("/profile");
            setUserData(response.data);
          } catch (error) {
            if (error.response && error.response.status === 401) navigate("/login");
          }
        };

        const fetchStats = async () => {
          try {
            const url =
              decodedToken.user.role === "client"
                ? "/gigs/client/stats"
                : "/gigs/freelancer/stats";
            const res = await api.get(url);
            setStats(res.data);
          } catch (err) {
            console.error("Error fetching stats:", err.response);
          }
        };

        fetchUserData();
        fetchStats();
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!userData || !stats)
    return <div className="dashboard-loading">Loading dashboard...</div>;

  const getPercentage = (value, total) =>
    total ? Math.round((value / total) * 100) : 0;

  const totalClientGigs = stats.completed + stats.active + stats.inProgress;
  const totalFreelancerGigs = stats.completed + stats.inProgress;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {userData.username}!</h1>
      </header>

      {/* Stats Cards */}
      <div className="cards-grid">
        {role === "client" && (
          <>
            <div className="card completed">
              <FaCheckCircle className="card-icon completed-icon" />
              <h3>Completed Gigs</h3>
              <p><CountUp end={stats.completed} duration={1.5} /></p>
              <div className="progress-bar">
                <div
                  className="progress-fill completed"
                  style={{ width: `${getPercentage(stats.completed, totalClientGigs)}%` }}
                />
              </div>
            </div>

            <div className="card active">
              <FaTasks className="card-icon active-icon" />
              <h3>Active Gigs</h3>
              <p><CountUp end={stats.active} duration={1.5} /></p>
              <div className="progress-bar">
                <div
                  className="progress-fill active"
                  style={{ width: `${getPercentage(stats.active, totalClientGigs)}%` }}
                />
              </div>
            </div>

            <div className="card inprogress">
              <FaClock className="card-icon inprogress-icon" />
              <h3>In Progress</h3>
              <p><CountUp end={stats.inProgress} duration={1.5} /></p>
              <div className="progress-bar">
                <div
                  className="progress-fill inprogress"
                  style={{ width: `${getPercentage(stats.inProgress, totalClientGigs)}%` }}
                />
              </div>
            </div>
          </>
        )}

        {role === "freelancer" && (
          <>
            <div className="card completed">
              <FaCheckCircle className="card-icon completed-icon" />
              <h3>Completed Gigs</h3>
              <p><CountUp end={stats.completed} duration={1.5} /></p>
              <div className="progress-bar">
                <div
                  className="progress-fill completed"
                  style={{ width: `${getPercentage(stats.completed, totalFreelancerGigs)}%` }}
                />
              </div>
            </div>

            <div className="card inprogress">
              <FaClock className="card-icon inprogress-icon" />
              <h3>In Progress</h3>
              <p><CountUp end={stats.inProgress} duration={1.5} /></p>
              <div className="progress-bar">
                <div
                  className="progress-fill inprogress"
                  style={{ width: `${getPercentage(stats.inProgress, totalFreelancerGigs)}%` }}
                />
              </div>
            </div>

            <div className="card earnings">
              <FaDollarSign className="card-icon earnings-icon" />
              <h3>Total Earnings</h3>
              <p>₹ <CountUp end={stats.earnings} duration={1.5} separator="," /></p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {role === "client" && (
            <>
              <button onClick={() => navigate("/post-gig")}>
                <FaPlus /> Post New Gig
              </button>
              <button onClick={() => navigate("/my-gigs")}>
                <FaTasks /> My Gigs
              </button>
            </>
          )}
          {role === "freelancer" && (
            <>
              <button onClick={() => navigate("/browse-gigs")}>
                <FaTasks /> Browse Gigs
              </button>
            
              <button onClick={() => navigate("/applied-gigs")}>
                <FaTasks />Applied Gigs
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
