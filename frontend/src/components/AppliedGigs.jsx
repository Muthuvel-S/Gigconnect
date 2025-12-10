import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBriefcase,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaCheckDouble,
  FaMoneyBillWave,
  FaComments
} from 'react-icons/fa';
import api from '../api';
import './AppliedGigs.css';

const normalizeStatus = (s) => {
  if (s === null || s === undefined) return '';
  return String(s).toLowerCase().replace(/[\s_-]/g, '');
};

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
        const data = response.data || [];

        // Sort so finished/closed/paid gigs go to the bottom (stable)
        const finishedStatuses = new Set(['finished', 'completed', 'paid', 'paidout', 'closed', 'cancelled']);
        const sorted = [...data].sort((a, b) => {
          const aGig = a.gig || null;
          const bGig = b.gig || null;

          // missing gig considered finished (move to bottom)
          const aIsFinished = !aGig || finishedStatuses.has(normalizeStatus(aGig.status));
          const bIsFinished = !bGig || finishedStatuses.has(normalizeStatus(bGig.status));

          if (aIsFinished === bIsFinished) {
            // keep original order (stable) if both same category
            return 0;
          }
          return aIsFinished ? 1 : -1; // non-finished first
        });

        setProposals(sorted);
      } catch (err) {
        console.error('Failed to fetch applied gigs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppliedGigs();
  }, [role]);

  const StatusBadge = ({ proposalStatus, gigStatus }) => {
    const pNorm = normalizeStatus(proposalStatus || 'pending');
    const gNorm = normalizeStatus(gigStatus || 'open');

    // display text: keep original human-friendly text when possible
    let displayText = proposalStatus || 'pending';
    let statusClass = pNorm || 'pending';
    let icon = <FaHourglassHalf />;

    // if proposal accepted, show gig status instead (accepted -> gig state)
    if (pNorm === 'accepted') {
      displayText = gigStatus || 'accepted';
      statusClass = gNorm || 'accepted';
    }

    switch (statusClass) {
      case 'accepted':
      case 'completed':
        icon = <FaCheckDouble />;
        break;
      case 'rejected':
        icon = <FaTimesCircle />;
        break;
      case 'inprogress':
        icon = <FaSpinner className="fa-spin" />;
        break;
      case 'paid':
      case 'paidout':
        icon = <FaMoneyBillWave />;
        break;
      case 'pending':
      default:
        icon = <FaHourglassHalf />;
    }

    // special: if proposal accepted but gig still marked "open", show Accepted label
    if (pNorm === 'accepted' && gNorm === 'open') {
      displayText = 'Accepted';
      statusClass = 'accepted';
      icon = <FaCheckCircle />;
    }

    return (
      <span className={`status-badge status-${statusClass}`}>
        {icon}
        <span className="status-text">{displayText}</span>
      </span>
    );
  };

  // decide when to show 'Message' button:
  // Message button should NOT be visible after gig is paid / paidout / closed / cancelled
  const canMessage = (proposal, gig) => {
    if (!gig || !gig.postedBy || !gig.postedBy._id) return false;

    const pNorm = normalizeStatus(proposal?.status || '');
    const gNorm = normalizeStatus(gig?.status || '');

    // If proposal accepted: allow messaging only if gig is NOT paid/paidout/closed/cancelled
    if (pNorm === 'accepted') {
      return !['paid', 'paidout', 'closed', 'cancelled'].includes(gNorm);
    }

    // Allowed gig statuses for messaging when proposal not accepted
    const allowedGigStates = new Set(['inprogress', 'completed']);

    // Do not allow messaging for paid/paidout/closed/cancelled
    if (['paid', 'paidout', 'closed', 'cancelled'].includes(gNorm)) return false;

    return allowedGigStates.has(gNorm);
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
        <div className="applications-table" role="table" aria-label="Applied gigs">
          <div className="table-header" role="row">
            <div role="columnheader">Gig Title & Client</div>
            <div role="columnheader">Your Bid</div>
            <div role="columnheader">Status</div>
            
          </div>

          {proposals.map((proposal) => {
            const gig = proposal.gig || null;
            const client = gig?.postedBy || null;
            const isGigDeleted = !gig;

            if (isGigDeleted) {
              return (
                <div key={proposal._id} className="table-row deleted" role="row">
                  <FaExclamationTriangle />
                  <span className="deleted-text">This gig is no longer available. It may have been removed by the client.</span>
                </div>
              );
            }

            return (
              <div key={proposal._id} className="table-row" role="row">
                {/* Gig info */}
                <div className="gig-info" role="cell">
                  <h3 className="gig-title" title={gig.title}>{gig.title}</h3>
                  <p className="gig-client">by {client?.username || 'Unknown Client'}</p>
                </div>

                {/* Bid */}
                <div className="bid-amount" role="cell">
                  ₹{(Number(proposal.bidAmount) || 0).toLocaleString()}
                </div>

                {/* Status */}
                <div className="status-cell" role="cell">
                  <StatusBadge proposalStatus={proposal.status || 'pending'} gigStatus={gig.status || 'open'} />
                </div>

                {/* Actions */}
                <div className="action-cell" role="cell">
                  <Link to={`/gig/${gig._id}`} className="btn-view-gig" aria-label={`View ${gig.title}`}>
                    View Details
                  </Link>

                  {canMessage(proposal, gig) && client && client._id && (
                    <Link
                      to={`/message/${gig._id}/${client._id}`}
                      className="btn-message"
                      aria-label={`Message ${client.username || 'client'}`}
                    >
                      <FaComments />
                      <span className="btn-text">Message</span>
                    </Link>
                  )}
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
          <Link to="/browse-gigs" className="btn-browse-gigs">Browse Gigs</Link>
        </div>
      )}
    </div>
  );
};

export default AppliedGigs;
