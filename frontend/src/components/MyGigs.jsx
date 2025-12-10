import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaTasks,
  FaFolderOpen,
  FaSpinner,
  FaCheckDouble,
  FaMoneyBillWave,
  FaStar,
  FaPlus,
  FaUserTie,
  FaRocket,
  FaEye,
  FaDollarSign
} from 'react-icons/fa';
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
      alert(`Gig updated successfully.`);
      fetchMyGigs();
    } catch (err) {
      console.error(err);
      alert('Failed to update gig.');
    }
  };

  useEffect(() => {
    fetchMyGigs();
  }, [role]);

  const StatusBadge = ({ status }) => {
    const formatted = status.toLowerCase().replace(/\s+/g, '-');

    let icon = <FaTasks />;
    switch (formatted) {
      case 'open': icon = <FaFolderOpen />; break;
      case 'in-progress': icon = <FaSpinner className="fa-spin" />; break;
      case 'completed': icon = <FaCheckDouble />; break;
      case 'paid': icon = <FaMoneyBillWave />; break;
      case 'paidout': icon = <FaDollarSign />; break;
    }

    return (
      <span className={`status-badge status-${formatted}`}>
        {icon} {status}
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
            <div>Freelancer</div>
            <div>Status</div>
            
          </div>

          {gigs.map((gig) => (
            <div key={gig._id} className="table-row">
              <div className="gig-info">
                <h3 className="gig-title">{gig.title}</h3>
                <p className="gig-client">Budget: ₹{gig.budget.toLocaleString()}</p>
              </div>

              {/* Freelancer Info */}
              <div className="freelancer-info">
                {gig.hiredFreelancer ? (
                  <Link
                    to={`/profile/${gig.hiredFreelancer._id}`}
                    className="freelancer-link"
                  >
                    <FaUserTie /> {gig.hiredFreelancer.username}
                  </Link>
                ) : (
                  <span className="no-freelancer">Awaiting selection</span>
                )}
              </div>

              <div className="status-cell">
                <StatusBadge status={gig.status} />
              </div>

              <div className="action-cell">

                {/* ===== OPEN ===== */}
                {gig.status === 'open' && (
                  <Link to={`/gig-proposals/${gig._id}`} className="btn-view-gig">
                    View Proposals
                  </Link>
                )}

                {/* ===== IN PROGRESS ===== */}
                {gig.status === 'in progress' && (
                  <>
                    <button
                      onClick={() => handleGigStatusUpdate(gig._id, 'complete')}
                      className="action-btn success"
                    >
                      Mark Complete
                    </button>

                    <Link
                      to={`/message/${gig._id}/${gig.hiredFreelancer?._id}`}
                      className="btn-message"
                    >
                      Message
                    </Link>
                  </>
                )}

                {/* ===== COMPLETED ===== */}
                {gig.status === 'completed' && (
                  <button
                    onClick={() => navigate(`/checkout/${gig._id}`)}
                    className="action-btn payment"
                  >
                    Proceed to Payment
                  </button>
                )}

                {/* ===== PAID / PAIDOUT ===== */}
                {(gig.status === 'paid' || gig.status === 'paidout') && (
                  <>
                    {/* Review logic */}
                    {!gig.hasBeenReviewed && gig.status === 'paid' && (
                      <Link
                        to={`/gig/${gig._id}/review`}
                        className="action-btn review"
                      >
                        <FaStar /> Leave Review
                      </Link>
                    )}

                    {/* Always allow viewing details */}
                    <Link to={`/gig/${gig._id}`} className="action-btn secondary">
                      <FaEye /> View Details
                    </Link>
                  </>
                )}

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-gigs-found">
          <FaRocket className="no-gigs-icon" />
          <h2>No gigs posted yet.</h2>
          <p>Your posted gigs will appear here.</p>
          <Link to="/post-gig" className="btn-post-gig">
            <FaPlus /> Post a New Gig
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyGigs;
