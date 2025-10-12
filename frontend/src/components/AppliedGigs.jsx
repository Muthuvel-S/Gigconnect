import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, FaCheckDouble, FaMoneyBillWave } from 'react-icons/fa';
import api from '../api';
import './AppliedGigs.css';

const AppliedGigs = () => {
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const role = localStorage.getItem('role');

    useEffect(() => {
        const fetchAppliedGigs = async () => {
            if (role !== 'freelancer') {
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.get('/gigs/applied');
                setProposals(response.data);
            } catch (err) {
                console.error('Failed to fetch applied gigs:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppliedGigs();
    }, [role]);

    // NEW, more advanced StatusBadge component
    const StatusBadge = ({ proposalStatus, gigStatus }) => {
        let statusText = proposalStatus;
        let statusClass = proposalStatus.toLowerCase();
        let icon = <FaHourglassHalf />;

        // If the proposal was accepted, we show the GIG's status instead
        if (proposalStatus === 'accepted') {
            statusText = gigStatus;
            statusClass = gigStatus.toLowerCase().replace(' ', '-');
        }

        switch (statusClass) {
            case 'accepted':
            case 'completed':
                icon = <FaCheckDouble />;
                break;
            case 'rejected':
                icon = <FaTimesCircle />;
                break;

            case 'in-progress':
                icon = <FaSpinner className="fa-spin" />;
                break;
            case 'paid':
                icon = <FaMoneyBillWave />;
                break;
            case 'pending':
            default:
                icon = <FaHourglassHalf />;
        }
        
        // Handle "accepted" separately to show the right text
        if (proposalStatus === 'accepted' && gigStatus === 'open') {
            statusText = 'Accepted';
            statusClass = 'accepted';
            icon = <FaCheckCircle />;
        }


        return (
            <span className={`status-badge status-${statusClass}`}>
                {icon}
                {statusText}
            </span>
        );
    };

    if (isLoading) {
        return <div className="loading-indicator">Loading your applications...</div>;
    }

    return (
        <div className="applied-gigs-container">
            <header className="page-header">
                <h1>My Applications</h1>
                <p>Track the status of all your submitted proposals.</p>
            </header>

            {proposals.length > 0 ? (
                <div className="applications-table">
                    <div className="table-header">
                        <div>Gig Title & Client</div>
                        <div>Your Bid</div>
                        <div>Status</div>
                        <div>Action</div>
                    </div>
                    {proposals.map((proposal) => {
                        const isGigDeleted = !proposal.gig;

                        if (isGigDeleted) {
                            return (
                                <div key={proposal._id} className="table-row deleted">
                                    <FaExclamationTriangle />
                                    <span>This gig is no longer available. It may have been removed by the client.</span>
                                </div>
                            );
                        }

                        return (
                            <div key={proposal._id} className="table-row">
                                <div className="gig-info">
                                    <h3>{proposal.gig.title}</h3>
                                    <p>by {proposal.gig.postedBy?.username || 'Unknown Client'}</p>
                                </div>
                                <div className="bid-amount">
                                    ₹{proposal.bidAmount.toLocaleString()}
                                </div>
                                <div className="status-cell">
                                    <StatusBadge proposalStatus={proposal.status} gigStatus={proposal.gig.status} />
                                </div>
                                <div className="action-cell">
                                    <Link to={`/gig/${proposal.gig._id}`} className="btn-view-gig">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="no-applications-found">
                    <FaBriefcase className="no-apps-icon" />
                    <h2>No Applications Yet</h2>
                    <p>You haven't applied to any gigs. Start exploring opportunities now!</p>
                    <Link to="/browse-gigs" className="btn-browse-gigs">
                        Browse Gigs
                    </Link>
                </div>
            )}
        </div>
    );
};

export default AppliedGigs;