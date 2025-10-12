import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FaBriefcase, FaUserPlus, FaLightbulb, FaCheckCircle, FaHandshake, FaCode, FaPaintBrush, FaPenNib, FaChartLine, FaMobileAlt, FaBullhorn } from "react-icons/fa";
import "./HeroSection.css";
import heroVideo from "../assets/gigconnect.mp4"; // Ensure your video is imported

// Data for sections
const clientSteps = [
  { icon: <FaLightbulb />, title: "Post Your Gig", description: "Detail your project needs, timeline, and budget. Our platform makes it easy to attract the right talent." },
  { icon: <FaHandshake />, title: "Collaborate & Pay Securely", description: "Use our tools to collaborate effectively and only release payment when the work is approved." },
  { icon: <FaUserPlus />, title: "Find Top Talent", description: "Browse profiles, review portfolios, and compare proposals to find the perfect match for your project." },
];
const freelancerSteps = [
  { icon: <FaUserPlus />, title: "Create Your Profile", description: "Build a stunning profile that showcases your skills, experience, and unique portfolio to stand out." },
  { icon: <FaBriefcase />, title: "Find Fulfilling Work", description: "Search for projects that align with your passions and expertise. Submit compelling proposals to win jobs." },
  { icon: <FaCheckCircle />, title: "Deliver Great Work & Get Paid", description: "Manage your projects, communicate with clients, and enjoy secure, timely payments for your efforts." },
];
const categories = [
  { icon: <FaCode />, name: "Web Development" },
  { icon: <FaPaintBrush />, name: "Graphic Design" },
  { icon: <FaPenNib />, name: "Content Writing" },
  { icon: <FaChartLine />, name: "Data & Analytics" },
  { icon: <FaMobileAlt />, name: "Mobile Apps" },
  { icon: <FaBullhorn />, name: "Digital Marketing" },
];
const testimonials = [
    { quote: "GigConnect revolutionized how we hire talent. We found an incredible developer in just two days!", name: "Aarav Patel", role: "Startup Founder, FinTech Co." },
    { quote: "As a freelance designer, this is the best platform I've used. The quality of clients is top-notch and payments are always secure.", name: "Priya Singh", role: "UI/UX Designer" },
    { quote: "The collaboration tools made managing a complex project across timezones incredibly simple. Highly recommended!", name: "John Davis", role: "Project Manager, Tech Corp." },
];

const HeroSection = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(true);
  }, []);

  return (
    <div className="landing-page">
      {/* ================= HERO SECTION ================= */}
      <section className="hero">
        {isVideoLoaded && (
          <video className="hero-video" autoPlay loop muted playsInline>
            <source src={heroVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>
            Connect with the Perfect Talent to
            <br />
            Bring Your <span className="rotating-text">Vision</span> to Life
          </h1>
          <p className="hero-subtitle">
            The ultimate marketplace to hire expert freelancers for any project, or to find work that inspires you.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-button primary">
              I Want to Hire
            </Link>
            <Link to="/register?role=freelancer" className="hero-button secondary">
              I Want to Work
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <section className="section how-it-works">
        <h2 className="section-title">Simple Steps to Success</h2>
        <div className="tab-buttons">
          <button className={`tab-button ${activeTab === "client" ? "active" : ""}`} onClick={() => setActiveTab("client")}>For Clients</button>
          <button className={`tab-button ${activeTab === "freelancer" ? "active" : ""}`} onClick={() => setActiveTab("freelancer")}>For Freelancers</button>
        </div>
        <div className="steps-container">
          {(activeTab === "client" ? clientSteps : freelancerSteps).map((step, index) => (
            <div className="step-card" key={index}><div className="step-icon">{step.icon}</div><h3>{step.title}</h3><p>{step.description}</p></div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES SECTION ================= */}
      <section className="section categories">
        <h2 className="section-title">Explore Popular Categories</h2>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div className="category-card" key={index}><div className="category-icon">{category.icon}</div><span>{category.name}</span></div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONIALS SECTION ================= */}
      <section className="section testimonials">
          <h2 className="section-title">Trusted by Innovators & Experts</h2>
          <div className="testimonial-carousel">
              {testimonials.map((testimonial, index) => (
                  <div className="testimonial-card" key={index}><p className="quote">"{testimonial.quote}"</p><div className="author"><span className="author-name">{testimonial.name}</span><span className="author-role">{testimonial.role}</span></div></div>
              ))}
          </div>
      </section>

      {/* ================= FINAL CTA SECTION ================= */}
      <section className="section cta-section">
          <h2 className="section-title">Ready to Start Your Next Project?</h2>
          <p>Join thousands of businesses and professionals building their future on GigConnect.</p>
          <div className="cta-buttons">
              <Link to="/register" className="cta-button primary">Sign Up Now</Link>
              <Link to="/browse-gigs" className="cta-button secondary">Explore Gigs</Link>
          </div>
      </section>
    </div>
  );
};

export default HeroSection;