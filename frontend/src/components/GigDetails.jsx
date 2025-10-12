import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaMoneyBillWave, FaClock, FaMapMarkerAlt, FaTag, FaCheckCircle, FaTimes, FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import "./GigDetails.css";

const GigDetails = () => {
    // --- All of your state and logic from before remains exactly the same ---
    const [gig, setGig] = useState(null);
    const [bidAmount, setBidAmount] = useState("");
    const [message, setMessage] = useState("");
    const [hasApplied, setHasApplied] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(false);

    const { id } = useParams();
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUserId(decodedToken.user.id);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
        const fetchGigAndProposals = async () => {
            try {
                const gigRes = await axios.get(`http://localhost:5000/api/gigs/${id}`);
                setGig(gigRes.data);
                if (role === "client") {
                    setLoadingProposals(true);
                    const proposalsRes = await axios.get(`http://localhost:5000/api/gigs/${id}/proposals`, { headers: { "x-auth-token": token } });
                    setProposals(proposalsRes.data);
                    setLoadingProposals(false);
                }
            } catch (err) {
                console.error("Failed to fetch gig/proposals:", err);
            }
        };
        fetchGigAndProposals();
        const checkIfApplied = async () => {
            if (!token || role !== "freelancer") return;
            try {
                const res = await axios.get(`http://localhost:5000/api/gigs/proposals/check/${id}`, { headers: { "x-auth-token": token } });
                setHasApplied(res.data.hasApplied);
            } catch (err) {
                console.error("Failed to check if applied:", err);
            }
        };
        checkIfApplied();
    }, [id, token, role]);

    const handleProposalSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:5000/api/gigs/${id}/proposals`, { bidAmount, message }, { headers: { "x-auth-token": token } });
            alert("Proposal submitted successfully!");
            setHasApplied(true);
        } catch (err) {
            console.error("Proposal submission failed:", err);
            alert("Failed to submit proposal.");
        }
    };

    const handleProposalAction = async (proposalId, action) => {
        try {
            const endpoint = `http://localhost:5000/api/gigs/${id}/proposals/${proposalId}/${action}`;
            await axios.put(endpoint, {}, { headers: { "x-auth-token": token } });
            alert(`Proposal ${action} successfully!`);
            const gigRes = await axios.get(`http://localhost:5000/api/gigs/${id}`);
            setGig(gigRes.data);
            const proposalsRes = await axios.get(`http://localhost:5000/api/gigs/${id}/proposals`, { headers: { "x-auth-token": token } });
            setProposals(proposalsRes.data);
        } catch (err) {
            console.error(`Failed to ${action} proposal:`, err);
            alert(`Failed to ${action} proposal.`);
        }
    };
    
    // --- End of unchanged logic ---

    if (!gig) return <div className="loading-indicator">Loading gig details...</div>;

    const isClientOwner = role === "client" && gig.postedBy._id === currentUserId;
    const isFreelancerNotOwner = role === "freelancer" && gig.postedBy._id !== currentUserId;
    const showProposalForm = isFreelancerNotOwner && gig.status === "open" && !hasApplied;
    const isHiredFreelancer = gig.hiredFreelancer && gig.hiredFreelancer._id === currentUserId;

    const StatusBadge = ({ status }) => {
        const lowerCaseStatus = status.toLowerCase().replace(' ', '-');
        return <span className={`status-badge status-${lowerCaseStatus}`}>{status}</span>;
    };

    return (
        <div className="gig-details-page">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back to Gigs</button>

            {/* NEW BEAUTIFUL HEADER */}
            <header className="gig-page-header">
                <div className="header-content">
                    <StatusBadge status={gig.status} />
                    <h1>{gig.title}</h1>
                    <div className="client-info">
                        Posted by <Link to={`/profile/${gig.postedBy._id}`}>{gig.postedBy.username}</Link>
                    </div>
                </div>
            </header>
            
            <div className="gig-details-body">
                {/* Main Content (Left Column) */}
                <div className="main-content">
                    <div className="section">
                        <h2>Project Description</h2>
                        <p>{gig.description}</p>
                    </div>
                    <div className="section">
                        <h2>Required Skills</h2>
                        <div className="skills-container">
                            {gig.skills.map((skill) => (
                                <span key={skill} className="skill-tag"><FaTag /> {skill}</span>
                            ))}
                        </div>
                    </div>

                    {isClientOwner && (
                        <div className="section">
                            <h2>Proposals Received ({proposals.length})</h2>
                            {loadingProposals ? <p>Loading...</p> : 
                            proposals.length > 0 ? (
                                <div className="proposal-list-container">
                                    {proposals.map(p => (
                                        <div key={p._id} className="proposal-card">
                                            <div className="proposal-header">
                                                {p.freelancer.profilePicture ? (
                                                    <img src={p.freelancer.profilePicture} alt={p.freelancer.username} className="freelancer-avatar"/>
                                                ) : (
                                                    <FaUserCircle className="freelancer-avatar-placeholder" />
                                                )}
                                                <Link to={`/profile/${p.freelancer._id}`} className="freelancer-link">{p.freelancer.username}</Link>
                                                <span className="proposal-bid">₹{p.bidAmount.toLocaleString()}</span>
                                            </div>
                                            <p className="proposal-message">{p.message}</p>
                                            {gig.status === "open" && (
                                                <div className="proposal-actions">
                                                    <button onClick={() => handleProposalAction(p._id, "accept")} className="btn-accept"><FaCheckCircle /> Accept</button>
                                                    <button onClick={() => handleProposalAction(p._id, "reject")} className="btn-reject"><FaTimes /> Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <p>No proposals submitted yet.</p>}
                        </div>
                    )}
                </div>

                {/* Sticky Sidebar (Right Column) */}
                <div className="sidebar">
                    <div className="sticky-sidebar">
                        <div className="sidebar-card details-card">
                            <h3>Project Details</h3>
                            <ul>
                                <li><FaMoneyBillWave /> <strong>₹{gig.budget.toLocaleString()}</strong><span>Budget</span></li>
                                <li><FaClock /> <strong>{gig.duration}</strong><span>Est. Duration</span></li>
                                <li><FaMapMarkerAlt /> <strong>{gig.location}</strong><span>Location</span></li>
                            </ul>
                        </div>

                        <div className="sidebar-card action-card">
                            {showProposalForm && (
                                <form onSubmit={handleProposalSubmit} className="proposal-form">
                                    <h3>Apply for this Gig</h3>
                                    <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Your Bid (₹)" required />
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your cover letter..." rows="5" required />
                                    <button type="submit" className="btn-primary">Submit Proposal</button>
                                </form>
                            )}
                            {hasApplied && (
                                <div className="feedback-box applied">
                                    <FaCheckCircle />
                                    <h3>Proposal Submitted</h3>
                                    <p>The client has received your application.</p>
                                </div>
                            )}
                            {isHiredFreelancer && (
                                <div className="feedback-box hired">
                                    <h3>You're Hired!</h3>
                                    <p>This project is in progress.</p>
                                    <Link to={`/message/${gig._id}/${gig.postedBy._id}`} className="btn-primary"><FaPaperPlane /> Message Client</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GigDetails;