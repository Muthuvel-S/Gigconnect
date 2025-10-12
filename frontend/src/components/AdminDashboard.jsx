import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { FaUsers, FaBriefcase, FaFolderOpen, FaSpinner, FaMoneyCheckAlt, FaTrash, FaCheck } from 'react-icons/fa';
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

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [stats, setStats] = useState({});
    const [payouts, setPayouts] = useState([]);
    const [activeTab, setActiveTab] = useState('payouts');
    const navigate = useNavigate();

    const fetchAdminData = async () => {
        try {
            // These API calls remain the same
            const statsResponse = await api.get('/admin/stats');
            setStats(statsResponse.data);
            const usersResponse = await api.get('/admin/users');
            setUsers(usersResponse.data);
            const gigsResponse = await api.get('/admin/gigs'); // This now returns populated data
            setGigs(gigsResponse.data);
            const payoutsResponse = await api.get('/admin/payouts');
            setPayouts(payoutsResponse.data);
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
    }, []);

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${id}`);
                alert('User deleted successfully!');
                fetchAdminData();
            } catch (err) {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user.');
            }
        }
    };

    const handleDeleteGig = async (id) => {
        if (window.confirm('Are you sure you want to delete this gig?')) {
            try {
                await api.delete(`/admin/gigs/${id}`);
                alert('Gig deleted successfully!');
                fetchAdminData();
            } catch (err) {
                console.error('Failed to delete gig:', err);
                alert('Failed to delete gig.');
            }
        }
    };

    const handleProcessPayout = async (id) => {
        if (window.confirm('Are you sure you want to process this payout?')) {
            try {
                await api.put(`/admin/payouts/${id}`);
                alert('Payout processed successfully!');
                fetchAdminData();
            } catch (err) {
                console.error('Failed to process payout:', err);
                alert('Failed to process payout.');
            }
        }
    };

    const RoleBadge = ({ role }) => <span className={`role-badge role-${role}`}>{role}</span>;

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
                    <button className={activeTab === 'payouts' ? 'active' : ''} onClick={() => setActiveTab('payouts')}><FaMoneyCheckAlt /> Payouts ({payouts.length})</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}><FaUsers /> Manage Users ({users.length})</button>
                    <button className={activeTab === 'gigs' ? 'active' : ''} onClick={() => setActiveTab('gigs')}><FaBriefcase /> Manage Gigs ({gigs.length})</button>
                </div>

                <div className="tab-content">
                    {activeTab === 'payouts' && (
                        payouts.length > 0 ? (
                            <div className="admin-table">
                                <div className="table-header payout-header">
                                    <div>Gig & Freelancer</div><div>Amount</div><div>UPI ID</div><div>Action</div>
                                </div>
                                {payouts.map(payout => (
                                    <div key={payout._id} className="table-row payout-row">
                                        <div>
                                            <div className="main-info">{payout.title}</div>
                                            <Link to={`/profile/${payout.hiredFreelancer._id}`} className="sub-info">{payout.hiredFreelancer.username}</Link>
                                        </div>
                                        <div>₹{payout.finalAmount.toLocaleString()}</div>
                                        <div>{payout.hiredFreelancer.upiId || 'N/A'}</div>
                                        <div><button className="btn-process" onClick={() => handleProcessPayout(payout._id)}><FaCheck /> Process</button></div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="empty-state">No pending payouts.</p>
                    )}

                    {activeTab === 'users' && (
                        users.length > 0 ? (
                            <div className="admin-table">
                                <div className="table-header user-header">
                                    <div>Username</div><div>Email</div><div>Role</div><div>Action</div>
                                </div>
                                {users.map(user => (
                                    <div key={user._id} className="table-row user-row">
                                        <div><Link to={`/profile/${user._id}`} className="main-info">{user.username}</Link></div>
                                        <div className="sub-info">{user.email}</div>
                                        <div><RoleBadge role={user.role} /></div>
                                        <div><button className="btn-delete" onClick={() => handleDeleteUser(user._id)}><FaTrash /> Delete</button></div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="empty-state">No users found.</p>
                    )}

                    {activeTab === 'gigs' && (
                        gigs.length > 0 ? (
                            <div className="admin-table">
                                <div className="table-header gig-header">
                                    <div>Title</div><div>Posted By</div><div>Status</div><div>Action</div>
                                </div>
                                {gigs.map(gig => (
                                    <div key={gig._id} className="table-row gig-row">
                                        <div><Link to={`/gig/${gig._id}`} className="main-info">{gig.title}</Link></div>
                                        <div className="sub-info">
                                            {/* THIS IS THE CORRECTED PART */}
                                            {gig.postedBy ? (
                                                <Link to={`/profile/${gig.postedBy._id}`} className="profile-link">{gig.postedBy.username}</Link>
                                            ) : 'Unknown User'}
                                        </div>
                                        <div><span className={`gig-status-badge status-${gig.status.toLowerCase()}`}>{gig.status}</span></div>
                                        <div><button className="btn-delete" onClick={() => handleDeleteGig(gig._id)}><FaTrash /> Delete</button></div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="empty-state">No gigs found.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;