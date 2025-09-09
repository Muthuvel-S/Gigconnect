import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './MyGigs.css'; // LinkedIn-style CSS

const MyGigs = () => {
  const [gigs, setGigs] = useState([]);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  // Fetch gigs
  const fetchMyGigs = async () => {
    try {
      if (role !== 'client') return;
      const response = await axios.get('http://localhost:5000/api/gigs/mygigs', {
        headers: { 'x-auth-token': token },
      });
      setGigs(response.data);
    } catch (err) {
      console.error('Failed to fetch my gigs:', err);
    }
  };

  // Gig status update
  const handleGigStatusUpdate = async (gigId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/gigs/${gigId}/${newStatus}`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      alert(`Gig status updated to ${newStatus}!`);
      fetchMyGigs();
    } catch (err) {
      console.error(`Failed to update gig status:`, err);
      alert(`Failed to update gig status.`);
    }
  };

  useEffect(() => {
    fetchMyGigs();
  }, [token, role]);

  return (
    <div className="mygigs-page">
      <div className="mygigs-container">
        <h2>My Posted Gigs</h2>
        {gigs.length > 0 ? (
          <div className="mygigs-list">
            {gigs.map((gig) => (
              <div
                key={gig._id}
                className={`gig-card fade-in ${gig.status.replace(' ', '-')}`}
              >
                <div className="gig-info">
                  <h3>{gig.title}</h3>
                  <p>Budget: ₹{gig.budget}</p>
                  <p>
                    Status:{' '}
                    <span className={`gig-status ${gig.status.replace(' ', '-')}`}>
                      {gig.status}
                    </span>
                  </p>
                  {gig.hiredFreelancer && (
                    <p>
                      Hired Freelancer:{' '}
                      <Link
                        to={`/profile/${gig.hiredFreelancer._id}`}
                        className="freelancer-link"
                      >
                        {gig.hiredFreelancer.username}
                      </Link>
                    </p>
                  )}
                </div>

                <div className="gig-actions">
                  {role === 'client' && gig.status === 'open' && (
                    <Link to={`/gig/${gig._id}`} className="action-btn view">
                      View Gig
                    </Link>
                  )}
                  {gig.status === 'in progress' && gig.hiredFreelancer && (
                    <>
                      <button
                        onClick={() => handleGigStatusUpdate(gig._id, 'complete')}
                        className="action-btn complete"
                      >
                        Mark as Complete
                      </button>
                      <Link
                        to={`/message/${gig._id}/${gig.hiredFreelancer._id}`}
                        className="action-btn message"
                      >
                        Message Freelancer
                      </Link>
                    </>
                  )}
                  {gig.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/checkout/${gig._id}`)}
                      className="action-btn payment"
                    >
                      Proceed to Payment
                    </button>
                  )}
                  {gig.status === 'paid' && (
                    <Link
                      to={`/gig/${gig._id}/review`}
                      className="action-btn review"
                    >
                      Leave a Review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-proposals">
            You have not posted any gigs yet. <Link to="/post-gig">Post one now</Link>!
          </p>
        )}
      </div>
    </div>
  );
};

export default MyGigs;
