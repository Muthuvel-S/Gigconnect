// GigDetails.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FaArrowLeft } from "react-icons/fa";
import "./GigDetails.css";

/** Simple safe API base */
const API_BASE = (typeof window !== "undefined" && window.REACT_APP_API_BASE) || (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) || "http://localhost:5000/api";

const normalize = (v) => (v || "").toString().toLowerCase();

export default function GigDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [gig, setGig] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch a single gig
  const fetchGig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/gigs/${id}`);
      setGig(res.data);
    } catch (err) {
      console.error("fetchGig error:", err);
      setGig(null);
    }
  };

  // Fetch proposals (client)
  const fetchProposals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/gigs/${id}/proposals`, {
        headers: token ? { "x-auth-token": token } : {},
      });
      setProposals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchProposals error:", err);
      setProposals([]);
    }
  };

  // Initial load
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        if (token) {
          try {
            const decoded = jwtDecode(token);
            if (mounted) setCurrentUserId(decoded?.user?.id || decoded?.user?._id || null);
          } catch (e) {
            // ignore
          }
        }

        await fetchGig();

        if (role === "client") await fetchProposals();

        if (role === "freelancer") {
          try {
            const appliedRes = await axios.get(`${API_BASE}/gigs/proposals/check/${id}`, {
              headers: token ? { "x-auth-token": token } : {},
            });
            if (mounted) setHasApplied(Boolean(appliedRes.data?.hasApplied));
          } catch (err) {
            if (mounted) setHasApplied(false);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id, role, token]);

  // Submit proposal (freelancer)
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/gigs/${id}/proposals`, { bidAmount, message }, { headers: { "x-auth-token": token } });
      setHasApplied(true);
      alert("Proposal submitted");
    } catch (err) {
      console.error("submitProposal error:", err);
      alert(err?.response?.data?.message || "Failed to submit proposal");
    }
  };

  // Core: handle accept/reject and update local state with merged proposal
  const handleProposalAction = async (proposalId, action) => {
    try {
      const res = await axios.put(
        `${API_BASE}/gigs/${id}/proposals/${proposalId}/${action}`,
        {},
        { headers: { "x-auth-token": token } }
      );

      // server-returned proposal (your server sends it)
      const returned = res.data?.proposal ?? null;

      if (returned) {
        setProposals((prev) =>
          prev.map((p) => {
            if (p._id !== returned._id) return p;

            // Keep populated freelancer object from the old state if returned.freelancer is a string ID
            const oldFreelancer = p.freelancer;
            const returnedFreelancer = returned.freelancer;
            const keepPopulated =
              returnedFreelancer && typeof returnedFreelancer === "string" && oldFreelancer && typeof oldFreelancer === "object";

            return {
              ...p,
              ...returned,
              freelancer: keepPopulated ? oldFreelancer : returnedFreelancer,
            };
          })
        );
      } else {
        // fallback: re-fetch proposals if nothing returned
        await fetchProposals();
      }

      // update gig if returned, or refetch when accepting (gig changes)
      if (res.data?.gig) {
        setGig(res.data.gig);
      } else if (action === "accept") {
        await fetchGig();
      }

      alert(res.data?.message || `Proposal ${action}ed`);
    } catch (err) {
      console.error("handleProposalAction error:", err);
      alert(err?.response?.data?.message || "Action failed");
    }
  };

  if (isLoading) return <div className="gig-page-minimal">Loading...</div>;
  if (!gig) return <div className="gig-page-minimal">Gig not found</div>;

  const isClientOwner = role === "client" && gig.postedBy?._id === currentUserId;
  const isFreelancerNotOwner = role === "freelancer" && gig.postedBy?._id !== currentUserId;
  const showProposalForm = isFreelancerNotOwner && normalize(gig.status) === "open" && !hasApplied;

  return (
    <div className="gig-details-page gig-page-minimal">
      <button className="back-btn-minimal" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <header className="header-minimal">
        <h1>
          {gig.title}
          <span className={`status-badge-minimal status-${normalize(gig.status)}`} style={{ marginLeft: 12 }}>{gig.status}</span>
        </h1>
        <div className="header-meta">
          Posted by <Link to={`/profile/${gig.postedBy?._id}`}>{gig.postedBy?.username}</Link>
        </div>
      </header>

      <div className="content-section">
        <h2>Project Overview</h2>
        <div className="detail-block-container">
          <div className="detail-item"><span>Budget</span><strong>₹{gig.budget?.toLocaleString()}</strong></div>
          <div className="detail-item"><span>Duration</span><strong>{gig.duration}</strong></div>
          <div className="detail-item"><span>Location</span><strong>{gig.location}</strong></div>
        </div>
      </div>

      <div className="content-section">
        <h2>Description</h2>
        <p>{gig.description}</p>
      </div>

      <div className="content-section">
        <h2>Required Skills</h2>
        <div className="skills-list-minimal">{(gig.skills || []).map(s => <span key={s} className="skill-tag-minimal">{s}</span>)}</div>
      </div>

      {showProposalForm && (
        <div className="content-section">
          <h2>Your Application</h2>
          <form className="proposal-form-minimal" onSubmit={handleProposalSubmit}>
            <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Your Bid (₹)" required />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your cover letter..." rows="5" required />
            <button className="btn-primary-minimal" type="submit">Submit Proposal</button>
          </form>
        </div>
      )}

      {isClientOwner && (
        <div className="content-section">
          <h2>Proposals ({proposals.length})</h2>
          {proposals.length === 0 ? <p>No proposals yet.</p> : (
            <div className="proposal-list-container">
              {proposals.map(p => {
                const status = normalize(p.status || "pending");
                return (
                  <div key={p._id} className="proposal-card-minimal">
                    <div className="proposal-header-minimal">
                      <Link to={`/profile/${p.freelancer?._id}`} className="freelancer-link-minimal">{p.freelancer?.username || "Freelancer"}</Link>
                      <span className="proposal-bid-minimal">₹{(p.bidAmount || 0).toLocaleString()}</span>
                    </div>

                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1rem' }}>{p.message}</p>

                    {normalize(gig.status) === "open" && status === "pending" ? (
                      <div className="proposal-actions">
                        <button className="btn-action-minimal accept" onClick={() => handleProposalAction(p._id, "accept")}>Accept</button>
                        <button className="btn-action-minimal reject" onClick={() => handleProposalAction(p._1d, "reject")}>Reject</button>
                      </div>
                    ) : status === "accepted" ? (
                      <p style={{ color: 'green', fontWeight: 700 }}>✔ Accepted</p>
                    ) : status === "rejected" ? (
                      <p style={{ color: 'red', fontWeight: 700 }}>✖ Rejected</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
