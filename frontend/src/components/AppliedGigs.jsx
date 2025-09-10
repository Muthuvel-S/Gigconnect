import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const formatStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

  if (isLoading) {
    return <div className="loading-text">Loading applied gigs...</div>;
  }

  return (
    <div className="mygigs-page">
      <div className="mygigs-container">
        <h2>My Applied Gigs</h2>

        {proposals.length > 0 ? (
          <div className="mygigs-list">
            {proposals.map((proposal) => {
              const isGigDeleted = !proposal.gig;

              return (
                <div
                  key={proposal._id}
                  className={`gig-card fade-in ${
                    isGigDeleted ? 'gig-deleted' : formatStatusClass(proposal.gig.status)
                  }`}
                >
                  {isGigDeleted ? (
                    <p className="no-proposals">
                      Gig details not found. It may have been deleted.
                    </p>
                  ) : (
                    <>
                      <h3>{proposal.gig.title}</h3>
                      <p>
                        <strong>Your Bid:</strong> ₹{proposal.bidAmount}
                      </p>
                      <p>
                        <strong>Gig Status:</strong>{' '}
                        <span className={`gig-status ${formatStatusClass(proposal.gig.status)}`}>
                          {proposal.gig.status}
                        </span>
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`proposal-status ${formatStatusClass(proposal.status)}`}>
                          {proposal.status}
                        </span>
                      </p>

                      <div className="gig-actions">
                        <Link
                          to={`/gig/${proposal.gig._id}`}
                          className="action-btn view"
                        >
                          View Gig
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-proposals">You have not applied for any gigs yet.</p>
        )}
      </div>
    </div>
  );
};

export default AppliedGigs;
