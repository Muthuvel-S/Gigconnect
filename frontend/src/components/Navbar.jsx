import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/MV work.png';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper to close menu when a link is clicked
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu(); // Close menu on logout too
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" onClick={closeMenu}>
        <img src={logo} alt="GigConnect Logo" className="logo-img" />
        <span>MV WORK</span>
      </Link>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* The 'open' class controls visibility via CSS */}
      <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        {token ? (
          <>
            {role === 'client' && (
              <>
                <Link to="/post-gig" className="nav-link" onClick={closeMenu}>Post a Gig</Link>
                <Link to="/my-gigs" className="nav-link" onClick={closeMenu}>My Gigs</Link>
              </>
            )}
            {role === 'freelancer' && (
              <>
                <Link to="/browse-gigs" className="nav-link" onClick={closeMenu}>Browse Gigs</Link>
                <Link to="/applied-gigs" className="nav-link" onClick={closeMenu}>Applied Gigs</Link>
              </>
            )}
            <Link to="/profile" className="nav-link" onClick={closeMenu}>Profile</Link>
            <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
            <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
            <Link to="/register" className="nav-link" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;