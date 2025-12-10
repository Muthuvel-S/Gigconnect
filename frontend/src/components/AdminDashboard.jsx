import React, { useState, useEffect } from 'react';
import api from '../api'; // axios instance
import { useNavigate, Link } from 'react-router-dom';
import {
  FaUsers,
  FaBriefcase,
  FaFolderOpen,
  FaSpinner,
  FaMoneyCheckAlt,
  FaTrash,
  FaCheck,
  FaDollarSign,
  FaSquare,
  FaRegSquare
} from 'react-icons/fa';
import CountUp from 'react-countup';
import './AdminDashboard.css';

const StatCard = ({ icon, title, value }) => (
  <div className="admin-stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <p>{title}</p>
      <h3><CountUp end={value || 0} duration={2} /></h3>
    </div>
  </div>
);

const RoleBadge = ({ role }) => <span className={`role-badge role-${role}`}>{role}</span>;

const GigStatusBadge = ({ status }) => {
  const lowerCaseStatus = (status || '').toLowerCase().replace(' ', '-');
  let icon;
  switch (lowerCaseStatus) {
    case 'open': icon = <FaFolderOpen />; break;
    case 'in-progress': icon = <FaSpinner className="fa-spin" />; break;
    case 'completed': icon = <FaCheck />; break;
    case 'paid': icon = <FaMoneyCheckAlt />; break;
    case 'paidout': icon = <FaDollarSign />; break;
    default: icon = <FaBriefcase />;
  }
  return (
    <span className={`gig-status-badge status-${lowerCaseStatus}`}>
      {icon} {status}
    </span>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [stats, setStats] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [activeTab, setActiveTab] = useState('payouts');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedGigs, setSelectedGigs] = useState(new Set());
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const [selectAllGigs, setSelectAllGigs] = useState(false);
  const navigate = useNavigate();

  const fetchAdminData = async () => {
    try {
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data || {});
      const usersResponse = await api.get('/admin/users');
      setUsers(usersResponse.data || []);
      const gigsResponse = await api.get('/admin/gigs');
      setGigs(gigsResponse.data || []);
      const payoutsResponse = await api.get('/admin/payouts');
      setPayouts((payoutsResponse.data || []).filter(p => p.status !== 'processed'));
      // reset selections when refetching
      setSelectedUsers(new Set());
      setSelectedGigs(new Set());
      setSelectAllUsers(false);
      setSelectAllGigs(false);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      if (err.response && err.response.status === 403) {
        alert('Access Denied: Admin privileges required.');
        navigate('/dashboard');
      }
    }
  };

  useEffect(() => {
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      alert('User deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    }
  };

  const handleDeleteGig = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) return;
    try {
      await api.delete(`/admin/gigs/${id}`);
      alert('Gig deleted successfully!');
      fetchAdminData();
    } catch (err) {
      console.error('Failed to delete gig:', err);
      alert('Failed to delete gig.');
    }
  };

  const handleProcessPayout = async (payoutId, gigTitle) => {
    if (!window.confirm(`Are you sure you want to process the payout for gig: "${gigTitle}"? This will finalize the project status to 'Paid Out'.`)) return;
    try {
      await api.put(`/admin/payouts/${payoutId}`);
      alert('Payout processed successfully! Gig status is now Paid Out.');
      fetchAdminData();
    } catch (err) {
      console.error('Failed to process payout:', err);
      alert('Failed to process payout. Check if gig status allows payout.');
    }
  };

  // Selection handlers for Users
  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      setSelectAllUsers(s.size === users.length && users.length > 0);
      return s;
    });
  };

  const toggleSelectAllUsers = () => {
    setSelectAllUsers(prevAll => {
      const next = !prevAll;
      setSelectedUsers(() => {
        if (!next) return new Set();
        return new Set(users.map(u => u._id));
      });
      return next;
    });
  };

  // Selection handlers for Gigs
  const toggleSelectGig = (id) => {
    setSelectedGigs(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      setSelectAllGigs(s.size === gigs.length && gigs.length > 0);
      return s;
    });
  };

  const toggleSelectAllGigs = () => {
    setSelectAllGigs(prevAll => {
      const next = !prevAll;
      setSelectedGigs(() => {
        if (!next) return new Set();
        return new Set(gigs.map(g => g._id));
      });
      return next;
    });
  };

  // Bulk delete users (try bulk endpoint first, else fallback to per-ID delete)
  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.size === 0) {
      alert('No users selected.');
      return;
    }
    if (!window.confirm(`Delete ${selectedUsers.size} selected user(s)? This action cannot be undone.`)) return;
    const ids = Array.from(selectedUsers);
    try {
      // Try bulk endpoint
      await api.post('/admin/users/bulk-delete', { ids });
      alert('Selected users deleted successfully.');
      fetchAdminData();
    } catch (err) {
      console.warn('Bulk delete endpoint failed, falling back to single deletes:', err);
      // fallback: delete one-by-one
      try {
        await Promise.all(ids.map(id => api.delete(`/admin/users/${id}`)));
        alert('Selected users deleted successfully.');
        fetchAdminData();
      } catch (err2) {
        console.error('Failed to delete selected users:', err2);
        alert('Failed to delete selected users.');
      }
    }
  };

  // Bulk delete gigs
  const handleBulkDeleteGigs = async () => {
    if (selectedGigs.size === 0) {
      alert('No gigs selected.');
      return;
    }
    if (!window.confirm(`Delete ${selectedGigs.size} selected gig(s)? This action cannot be undone.`)) return;
    const ids = Array.from(selectedGigs);
    try {
      await api.post('/admin/gigs/bulk-delete', { ids });
      alert('Selected gigs deleted successfully.');
      fetchAdminData();
    } catch (err) {
      console.warn('Bulk delete endpoint failed, falling back to single deletes:', err);
      try {
        await Promise.all(ids.map(id => api.delete(`/admin/gigs/${id}`)));
        alert('Selected gigs deleted successfully.');
        fetchAdminData();
      } catch (err2) {
        console.error('Failed to delete selected gigs:', err2);
        alert('Failed to delete selected gigs.');
      }
    }
  };

  // Small helper to show checkbox icon (keeps styling consistent)
  const CheckboxIcon = ({ checked }) => (
    checked ? <FaSquare className="checkbox-icon checked" /> : <FaRegSquare className="checkbox-icon" />
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Platform Overview & Management</p>
      </header>

      <section className="stats-grid">
        <StatCard icon={<FaUsers />} title="Total Users" value={stats.totalUsers} />
        <StatCard icon={<FaBriefcase />} title="Total Gigs" value={stats.totalGigs} />
        <StatCard icon={<FaFolderOpen />} title="Open Gigs" value={stats.openGigs} />
        <StatCard icon={<FaSpinner />} title="Gigs In Progress" value={stats.inProgressGigs} />
      </section>

      <main className="admin-content">
        <div className="tab-navigation">
          <button className={activeTab === 'payouts' ? 'active' : ''} onClick={() => setActiveTab('payouts')}><FaMoneyCheckAlt /> Pending Payouts ({payouts.length})</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><FaUsers /> Manage Users ({users.length})</button>
          <button className={activeTab === 'gigs' ? 'active' : ''} onClick={() => setActiveTab('gigs')}><FaBriefcase /> Manage Gigs ({gigs.length})</button>
        </div>

        <div className="tab-content">

          {/* --- Payouts Tab --- */}
          {activeTab === 'payouts' && (
            payouts.length > 0 ? (
              <div className="admin-table">
                <div className="table-header payout-header">
                  <div>Gig & Freelancer</div><div>Amount</div><div>UPI ID</div><div>Action</div>
                </div>
                {payouts.map(payout => (
                  <div key={payout._id} className="table-row payout-row">
                    <div>
                      <Link to={`/gig/${payout.gig}`} className="main-info">{payout.title}</Link>
                      <Link to={`/profile/${payout.hiredFreelancer._id}`} className="sub-info">Freelancer: {payout.hiredFreelancer.username}</Link>
                    </div>
                    <div>₹{payout.finalAmount.toLocaleString()}</div>
                    <div>{payout.hiredFreelancer.upiId || 'N/A'}</div>
                    <div>
                      <button
                        className="btn-process"
                        onClick={() => handleProcessPayout(payout._id, payout.title)}>
                        <FaCheck /> Process
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="empty-state">No pending payouts.</p>
          )}

          {/* --- Users Tab --- */}
          {activeTab === 'users' && (
            users.length > 0 ? (
              <>
                <div className="bulk-action-row">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectAllUsers}
                      onChange={toggleSelectAllUsers}
                      aria-label="Select all users"
                    />
                    Select all users
                  </label>

                  <div className="bulk-actions">
                    <button className="btn-delete bulk" onClick={handleBulkDeleteUsers}><FaTrash /> Delete Selected ({selectedUsers.size})</button>
                  </div>
                </div>

                <div className="admin-table">
                  <div className="table-header user-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span className="checkbox-header" /> Username
                    </div>
                    <div>Email</div><div>Role</div><div>Action</div>
                  </div>

                  {users.map(user => (
                    <div key={user._id} className="table-row user-row">
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user._id)}
                          onChange={() => toggleSelectUser(user._id)}
                          aria-label={`Select user ${user.username}`}
                        />
                        <Link to={`/profile/${user._id}`} className="main-info">{user.username}</Link>
                      </div>

                      <div className="sub-info">{user.email}</div>
                      <div><RoleBadge role={user.role} /></div>
                      <div>
                        <button className="btn-delete" onClick={() => handleDeleteUser(user._id)}><FaTrash /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="empty-state">No users found.</p>
          )}

          {/* --- Gigs Tab --- */}
          {activeTab === 'gigs' && (
            gigs.length > 0 ? (
              <>
                <div className="bulk-action-row">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectAllGigs}
                      onChange={toggleSelectAllGigs}
                      aria-label="Select all gigs"
                    />
                    Select all gigs
                  </label>

                  <div className="bulk-actions">
                    <button className="btn-delete bulk" onClick={handleBulkDeleteGigs}><FaTrash /> Delete Selected ({selectedGigs.size})</button>
                  </div>
                </div>

                <div className="admin-table">
                  <div className="table-header gig-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span className="checkbox-header" /> Title
                    </div>
                    <div>Posted By</div><div>Status</div><div>Action</div>
                  </div>

                  {gigs.map(gig => (
                    <div key={gig._id} className="table-row gig-row">
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <input
                          type="checkbox"
                          checked={selectedGigs.has(gig._id)}
                          onChange={() => toggleSelectGig(gig._id)}
                          aria-label={`Select gig ${gig.title}`}
                        />
                        <Link to={`/gig/${gig._id}`} className="main-info">{gig.title}</Link>
                      </div>

                      <div className="sub-info">
                        {gig.postedBy ? (
                          <Link to={`/profile/${gig.postedBy._id}`} className="profile-link">{gig.postedBy.username}</Link>
                        ) : 'Unknown User'}
                      </div>
                      <div><GigStatusBadge status={gig.status} /></div>
                      <div><button className="btn-delete" onClick={() => handleDeleteGig(gig._id)}><FaTrash /> Delete</button></div>
                    </div>
                  ))}

                </div>
              </>
            ) : <p className="empty-state">No gigs found.</p>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
