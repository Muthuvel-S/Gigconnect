import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css"; // external CSS

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Navigation Links */}
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>


        {/* Copyright */}
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
