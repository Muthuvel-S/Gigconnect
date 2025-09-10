import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import './Navbar.css';
import logo from '../assets/gigconnect.png';
import api from '../api'; // Axios instance
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'); // use env variable for production

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (token) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
        } catch (err) {
          console.error('Fetch Notifications Error:', err);
        }
      };
      fetchNotifications();
    }
  }, [token]);

  // Socket.IO: listen for new notifications
  useEffect(() => {
    if (token) {
      socket.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      return () => socket.off('newNotification');
    }
  }, [token]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Mark As Read Error:', err);
    }
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <img src={logo} alt="GigConnect Logo" className="logo-img" />
        <span>𝐆𝐢𝐠𝐂𝐨𝐧𝐧𝐞𝐜𝐭</span>
      </Link>

      <div className="nav-right">
        {token && (
          <div className="notification-container">
            <FaBell className="bell-icon" onClick={toggleDropdown} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            {dropdownOpen && (
              <div className="notification-dropdown">
                {notifications.length === 0 && <p>No notifications</p>}
                {notifications.map(n => (
                  <div
                    key={n._id}
                    className={`notification-item ${n.isRead ? '' : 'unread'}`}
                    onClick={() => markAsRead(n._id)}
                  >
                    GigConnect: {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        {token ? (
          <>
            {role === 'client' && <>
              <Link to="/post-gig" className="nav-link">Post a Gig</Link>
              <Link to="/my-gigs" className="nav-link">My Gigs</Link>
            </>}
            {role === 'freelancer' && <>
              <Link to="/browse-gigs" className="nav-link">Browse Gigs</Link>
              <Link to="/applied-gigs" className="nav-link">Applied Gigs</Link>
            </>}
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
