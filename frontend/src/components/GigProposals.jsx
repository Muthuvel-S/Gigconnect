import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const GigProposals = () => {
  const [gig, setGig] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // { [proposalId]: true }
  const token = localStorage.getItem('token');
  const { id } = useParams();

  useEffect(() => {
    const fetchGigDetailsAndProposals = async () => {
      setLoadingProposals(true);
      try {
        const gigResponse = await axios.get(`http://localhost:5000/api/gigs/${id}`);
        setGig(gigResponse.data || null);

        // fetch proposals (auth required)
        const proposalsResponse = await axios.get(`http://localhost:5000/api/gigs/${id}/proposals`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        setProposals(proposalsResponse.data || []);
      } catch (err) {
        console.error('Failed to fetch gig details or proposals:', err);
      } finally {
        setLoadingProposals(false);
      }
    };
    fetchGigDetailsAndProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refresh = async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/gigs/${id}`),
        axios.get(`http://localhost:5000/api/gigs/${id}/proposals`, { headers: token ? { 'x-auth-token': token } : {} })
      ]);
      setGig(gRes.data || null);
      setProposals(pRes.data || []);
    } catch (err) {
      console.warn('Refresh failed:', err);
    }
  };

  const handleProposalAction = async (proposalId, action) => {
    // action = 'accept' or 'reject'
    if (!token) { alert('Authentication token missing. Please login again.'); return; }

    const confirmMsg = action === 'accept'
      ? 'Are you sure you want to ACCEPT this proposal? This will hire the freelancer and change the gig status.'
      : 'Are you sure you want to REJECT this proposal? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(prev => ({ ...prev, [proposalId]: true }));

    try {
      const endpoint = `http://localhost:5000/api/gigs/${id}/proposals/${proposalId}/${action}`;
      await axios.put(endpoint, {}, { headers: { 'x-auth-token': token } });

      // optimistic UI update for that proposal
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: action === 'accept' ? 'accepted' : 'rejected' } : p));

      // if accept, update gig optimistically (server will return canonical state on refresh)
      if (action === 'accept') setGig(prev => prev ? { ...prev, status: 'in progress' } : prev);

      // refresh canonical state
      await refresh();

      alert(`Proposal ${action}ed successfully.`);
    } catch (err) {
      console.error(`Failed to ${action} proposal:`, err);
      alert(`Failed to ${action} proposal. See console for details.`);
      // try to refresh to revert optimistic change
      await refresh();
    } finally {
      setActionLoading(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleGigStatusUpdate = async (newStatus) => {
    if (!token) { alert('Authentication token missing. Please login again.'); return; }

    const confirmMsg = `Are you sure you want to mark this gig as "${newStatus}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`http://localhost:5000/api/gigs/${id}/${newStatus}`, {}, { headers: { 'x-auth-token': token } });
      alert(`Gig status updated to ${newStatus}!`);
      await refresh();
    } catch (err) {
      console.error(`Failed to update gig status:`, err);
      alert('Failed to update gig status.');
    }
  };

  if (!gig) return <div style={{ textAlign: 'center', marginTop: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: 'auto' }}>
      <h2 style={{ marginBottom: 6 }}>{gig.title}</h2>
      <p style={{ marginBottom: 6 }}><strong>Description:</strong> {gig.description}</p>
      <p style={{ marginBottom: 6 }}>
        <strong>Posted By:</strong>{' '}
        {gig.postedBy ? <Link to={`/profile/${gig.postedBy._id}`}>{gig.postedBy.username}</Link> : 'Unknown'}
      </p>

      {gig.status === 'in progress' && gig.hiredFreelancer && (
        <p style={{ marginBottom: 6 }}>
          <strong>Done By:</strong> <Link to={`/profile/${gig.hiredFreelancer._id}`}>{gig.hiredFreelancer.username}</Link>
        </p>
      )}

      <p style={{ marginBottom: 6 }}><strong>Budget:</strong> ₹{gig.budget?.toLocaleString?.() ?? gig.budget}</p>
      {gig.status !== 'open' && <p style={{ marginBottom: 6 }}><strong>Final Amount:</strong> ₹{gig.finalAmount}</p>}
      <p style={{ marginBottom: 12 }}><strong>Status:</strong> {gig.status}</p>

      {gig.status === 'in progress' && (
        <button onClick={() => handleGigStatusUpdate('complete')} style={{ marginRight: 8, marginBottom: 12, padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Mark as Complete
        </button>
      )}

      {gig.status === 'completed' && (
        <button onClick={() => handleGigStatusUpdate('paid')} style={{ marginRight: 8, marginBottom: 12, padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Mark as Paid
        </button>
      )}

      {gig.status === 'paid' && (
        <Link to={`/gig/${gig._id}/review`} style={{ display: 'inline-block', marginBottom: 12, padding: '8px 15px', backgroundColor: '#007bff', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>
          Leave a Review
        </Link>
      )}

      <h3 style={{ marginTop: 24, marginBottom: 12 }}>Freelancer Proposals ({proposals.length})</h3>

      {loadingProposals ? (
        <p>Loading proposals...</p>
      ) : proposals.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {proposals.map(proposal => {
            const pStatus = String(proposal.status || '').toLowerCase();
            const showActions = gig.status === 'open' && pStatus === 'pending';

            return (
              <li key={proposal._id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 10, borderRadius: 8 }}>
                <p style={{ margin: 0 }}><strong>Freelancer:</strong>{' '}
                  {proposal.freelancer ? <Link to={`/profile/${proposal.freelancer._id}`}>{proposal.freelancer.username}</Link> : 'Unknown'}
                </p>
                <p style={{ margin: '6px 0' }}><strong>Bid Amount:</strong> ₹{(proposal.bidAmount || 0).toLocaleString()}</p>
                <p style={{ margin: '6px 0' }}><strong>Message:</strong> {proposal.message || '-'}</p>
                <p style={{ margin: '6px 0', fontWeight: 600 }}>Proposal Status: <span style={{ textTransform: 'capitalize' }}>{pStatus || 'pending'}</span></p>

                {showActions ? (
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => handleProposalAction(proposal._id, 'accept')}
                      disabled={!!actionLoading[proposal._id]}
                      style={{ marginRight: 8, padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      {actionLoading[proposal._id] ? 'Processing...' : 'Accept'}
                    </button>

                    <button
                      onClick={() => handleProposalAction(proposal._id, 'reject')}
                      disabled={!!actionLoading[proposal._id]}
                      style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      {actionLoading[proposal._id] ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    {pStatus === 'rejected' && <div style={{ color: '#9b2226', fontWeight: 700 }}>This proposal was rejected.</div>}
                    {pStatus === 'accepted' && <div style={{ color: '#0d6e3a', fontWeight: 700 }}>This proposal was accepted.</div>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No proposals submitted yet.</p>
      )}
    </div>
  );
};

export default GigProposals;
