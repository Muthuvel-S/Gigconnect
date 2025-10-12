import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTasks, FaFolderOpen, FaSpinner, FaCheckDouble, FaMoneyBillWave, FaStar, FaPlus, FaUserTie, FaRocket, FaEye } from 'react-icons/fa';
import api from '../api';
import './MyGigs.css';

const MyGigs = () => {
    const [gigs, setGigs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    const fetchMyGigs = async () => {
        setIsLoading(true);
        try {
            if (role !== 'client') return;
            // The backend now sends the hasBeenReviewed property automatically
            const response = await api.get('/gigs/mygigs');
            setGigs(response.data);
        } catch (err) {
            console.error('Failed to fetch my gigs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGigStatusUpdate = async (gigId, newStatus) => {
        try {
            await api.put(`/gigs/${gigId}/${newStatus}`);
            alert(`Gig status updated successfully!`);
            fetchMyGigs(); // Refetch to get the latest status
        } catch (err) {
            console.error(`Failed to update gig status:`, err);
            alert(`Failed to update gig status.`);
        }
    };

    useEffect(() => {
        fetchMyGigs();
    }, [role]);

    const StatusBadge = ({ status }) => {
        const lowerCaseStatus = status.toLowerCase().replace(' ', '-');
        let icon;
        switch (lowerCaseStatus) {
            case 'open': icon = <FaFolderOpen />; break;
            case 'in-progress': icon = <FaSpinner className="fa-spin" />; break;
            case 'completed': icon = <FaCheckDouble />; break;
            case 'paid': icon = <FaMoneyBillWave />; break;
            default: icon = <FaTasks />;
        }
        return (
            <span className={`status-badge status-${lowerCaseStatus}`}>
                {icon}
                {status}
            </span>
        );
    };

    if (isLoading) {
        return <div className="loading-indicator">Loading your gigs...</div>;
    }

    return (
        <div className="my-gigs-container">
            <header className="page-header">
                <h1>My Posted Gigs</h1>
                <p>Manage your projects and collaborate with freelancers.</p>
            </header>

            {gigs.length > 0 ? (
                <div className="gigs-table">
                    <div className="table-header">
                        <div>Gig Title & Budget</div>
                        <div>Hired Freelancer</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>
                    {gigs.map((gig) => (
                        <div key={gig._id} className="table-row">
                            <div className="gig-info">
                                <h3>{gig.title}</h3>
                                <p>Budget: ₹{gig.budget.toLocaleString()}</p>
                            </div>
                            <div className="freelancer-info">
                                {gig.hiredFreelancer ? (
                                    <Link to={`/profile/${gig.hiredFreelancer._id}`} className="freelancer-link">
                                        <FaUserTie /> {gig.hiredFreelancer.username}
                                    </Link>
                                ) : (
                                    <span className="no-freelancer">Awaiting selection</span>
                                )}
                            </div>
                            <div className="status-cell">
                                <StatusBadge status={gig.status} />
                            </div>
                            <div className="actions-cell">
                                {gig.status === 'open' && (
                                    <Link to={`/gig-proposals/${gig._id}`} className="action-btn primary">View Proposals</Link>
                                )}
                                {gig.status === 'in progress' && (
                                    <>
                                        <button onClick={() => handleGigStatusUpdate(gig._id, 'complete')} className="action-btn success">Mark as Complete</button>
                                        <Link to={`/message/${gig._id}/${gig.hiredFreelancer._id}`} className="action-btn secondary">Message</Link>
                                    </>
                                )}
                                {gig.status === 'completed' && (
                                    <button onClick={() => navigate(`/checkout/${gig._id}`)} className="action-btn payment">Proceed to Payment</button>
                                )}
                                {gig.status === 'paid' && (
                                    <>
                                        {/* --- NEW CONDITIONAL LOGIC HERE --- */}
                                        {gig.hasBeenReviewed ? (
                                            // If review is submitted, only show "View Details"
                                            <Link to={`/gig/${gig._id}`} className="action-btn secondary"><FaEye /> View Details</Link>
                                        ) : (
                                            // If review is NOT submitted, show both buttons
                                            <>
                                                <Link to={`/gig/${gig._id}/review`} className="action-btn review"><FaStar /> Leave Review</Link>
                                                <Link to={`/gig/${gig._id}`} className="action-btn secondary">View Details</Link>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-gigs-found">
                    <FaRocket className="no-gigs-icon" />
                    <h2>You haven't posted any gigs yet.</h2>
                    <p>Attract top talent by posting your project details now.</p>
                    <Link to="/post-gig" className="btn-post-gig">
                        <FaPlus /> Post a New Gig
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MyGigs;