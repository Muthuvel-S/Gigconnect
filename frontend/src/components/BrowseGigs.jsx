import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaLaptopCode, FaMoneyBillWave, FaClock, FaUndo, FaExclamationCircle } from 'react-icons/fa';
import './BrowseGigs.css'; // We will replace this file's content next

const BrowseGigs = () => {
    const [gigs, setGigs] = useState([]);
    const [filters, setFilters] = useState({
        skills: '',
        location: '',
        budget: '',
    });

    // --- All logic below is UNCHANGED ---
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async () => {
        try {
            const { skills, location, budget } = filters;
            const query = new URLSearchParams();
            if (skills) query.append('skills', skills);
            if (location) query.append('location', location);
            if (budget) query.append('budget', budget);

            const response = await axios.get(`http://localhost:5000/api/gigs/all?${query.toString()}`);
            setGigs(response.data);
        } catch (err) {
            console.error('Failed to fetch gigs:', err);
        }
    };
    
    // Auto-search on filter change
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 500); // Debounce search to avoid excessive API calls
        return () => clearTimeout(timer);
    }, [filters]);

    const timeAgo = (dateString) => {
        const now = new Date();
        const posted = new Date(dateString);
        const diffTime = Math.abs(now - posted);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    const handleReset = () => {
        setFilters({ skills: '', location: '', budget: '' });
    };
    
    // --- End of unchanged logic ---

    return (
        <div className="browse-gigs-page">
            <div className="browse-gigs-layout">
                {/* === STICKY SIDEBAR FOR FILTERS === */}
                <aside className="sidebar">
                    <div className="filter-card">
                        <h3><FaSearch /> Filter Gigs</h3>
                        <form onSubmit={(e) => e.preventDefault()} className="filter-form">
                            <div className="input-group">
                                <label htmlFor="skills"><FaLaptopCode /> Skills</label>
                                <input id="skills" type="text" name="skills" value={filters.skills} onChange={handleChange} placeholder="e.g., React, Node.js" />
                            </div>
                            <div className="input-group">
                                <label htmlFor="location"><FaMapMarkerAlt /> Location</label>
                                <input id="location" type="text" name="location" value={filters.location} onChange={handleChange} placeholder="e.g., Mumbai" />
                            </div>
                            <div className="input-group">
                                <label htmlFor="budget"><FaMoneyBillWave /> Max Budget</label>
                                <div className="budget-input-wrapper">
                                    <span>₹</span>
                                    <input id="budget" type="number" name="budget" value={filters.budget} onChange={handleChange} placeholder="e.g., 50000" />
                                </div>
                            </div>
                            <button type="button" onClick={handleReset} className="btn-reset">
                                <FaUndo /> Reset Filters
                            </button>
                        </form>
                    </div>
                </aside>

                {/* === MAIN CONTENT FOR GIGS === */}
                <main className="main-content">
                    <div className="content-header">
                        <h2>Open Gigs</h2>
                        <p>Found {gigs.length} opportunities</p>
                    </div>

                    {gigs.length > 0 ? (
                        <div className="gigs-list">
                            {gigs.map(gig => (
                                <div key={gig._id} className="gig-card">
                                    <div className="gig-header">
                                        <h3><Link to={`/gig/${gig._id}`}>{gig.title}</Link></h3>
                                    </div>
                                    <div className="gig-meta">
                                        <span><FaMoneyBillWave /> ₹{gig.budget.toLocaleString()}</span>
                                        <span><FaMapMarkerAlt /> {gig.location}</span>
                                        <span><FaClock /> {gig.duration}</span>
                                    </div>
                                    <p className="gig-description">
                                        {gig.description.substring(0, 150)}{gig.description.length > 150 && '...'}
                                    </p>
                                    <div className="gig-skills">
                                        {gig.skills.slice(0, 5).map((skill, idx) => (
                                            <span key={idx} className="skill-badge">{skill}</span>
                                        ))}
                                    </div>
                                    <div className="gig-footer">
                                        <span className="posted-date">Posted {timeAgo(gig.postedAt)}</span>
                                        <Link to={`/gig/${gig._id}`} className="view-details-btn">View & Apply</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-gigs-found">
                            <FaExclamationCircle />
                            <h3>No Gigs Found</h3>
                            <p>Try adjusting your filters or check back later for new opportunities.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BrowseGigs;