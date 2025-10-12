import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* About Section */}
        <div className="footer-section footer-about">
          <h3>About GigConnect</h3>
          <p>
            GigConnect is a global freelance platform connecting skilled professionals 
            with clients across the world. We empower freelancers to grow their careers, 
            showcase their talents, and collaborate on meaningful projects.
          </p>
        </div>

        {/* Contact Section */}
        <div className="footer-section footer-contact">
          <h3>Contact Us</h3>
          <p>Email: support@gigconnect.com</p>
          <p>Phone: +91 123 456 7890</p>
          <p>Address: 123 Freelancer Street, Mumbai, India</p>
        </div>

        {/* Policies Section */}
        <div className="footer-section footer-policies">
          <h3>Policies</h3>
          <Link to="/privacy">Privacy Policy</Link>
          {/* The stray character that was between these two links has been removed. */}
          <Link to="/terms">Terms & Conditions</Link>
        </div>

        {/* Newsletter */}
        <div className="footer-section footer-newsletter">
          <h3>Subscribe to our Newsletter</h3>
          <p>Get updates on new gigs, features, and special offers.</p>
          <form>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* Social Media */}
        <div className="footer-section footer-social">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;