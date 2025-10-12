import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import api from "../api";
import { FaEdit, FaPlus, FaStar, FaLink, FaTimes, FaCamera, FaUser, FaEnvelope, FaBriefcase, FaTools, FaCommentDots } from "react-icons/fa";
import "./Profile.css";

const Profile = () => {
    // --- All of your state and logic remains exactly the same ---
    const { id } = useParams();
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('portfolio');
    const [formData, setFormData] = useState({ username: "", email: "", profilePicture: "", skills: [], description: "", portfolio: [], upiId: "" });
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [projectData, setProjectData] = useState({ title: "", description: "", images: [], portfolioLink: "" });

    const fileInputRef = useRef(null);
    const projectImagesRef = useRef(null);

    const profileImageSrc = formData.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    const isOwnProfile = !id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const url = isOwnProfile ? "/profile" : `/profile/${id}`;
                const { data } = await api.get(url);
                setUserData(data);
                setFormData({
                    username: data.username || "", email: data.email || "", profilePicture: data.profilePicture || "",
                    skills: data.skills || [], description: data.description || "", portfolio: data.portfolio || [], upiId: data.upiId || ""
                });
                if (data.role === "freelancer") {
                    const reviewsRes = await api.get(`/gigs/freelancer/${data._id}/reviews`);
                    setReviews(reviewsRes.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }
        };
        fetchProfile();
    }, [id, isOwnProfile]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSkillsChange = (e) => setFormData({ ...formData, skills: e.target.value.split(",").map((skill) => skill.trim()) });

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put("/profile", formData);
            setUserData(data);
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        }
    };

    const handleUploadButtonClick = () => fileInputRef.current.click();
    const handleImageUpload = async (file, type = "profile") => {
        if (!file) return;
        setIsLoading(true);
        const form = new FormData();
        form.append(type === "profile" ? "profilePicture" : "projectImage", file);
        try {
            const url = type === "profile" ? "http://localhost:5000/api/upload/profile-picture" : "http://localhost:5000/api/upload/project-image";
            const { data } = await axios.post(url, form, { headers: { "Content-Type": "multipart/form-data" } });
            if (type === "profile") {
                setFormData((prev) => ({ ...prev, profilePicture: data.secure_url }));
            } else {
                setProjectData((prev) => ({ ...prev, images: [...(prev.images || []), data.secure_url] }));
            }
        } catch (err) {
            console.error("Image upload failed:", err);
            alert("Image upload failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectImagesSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => handleImageUpload(file, "project"));
    };
    const removeProjectImage = (index) => setProjectData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedPortfolio = [...(formData.portfolio || []), projectData];
            await api.put("/profile", { ...formData, portfolio: updatedPortfolio });
            setFormData((prev) => ({ ...prev, portfolio: updatedPortfolio }));
            setProjectData({ title: "", description: "", images: [], portfolioLink: "" });
            if (projectImagesRef.current) projectImagesRef.current.value = null;
            alert("Project added successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to add project.");
        }
    };

    if (!userData) return <div className="loading-indicator">Loading profile...</div>;

    // --- End of unchanged logic ---

    return (
        <div className="profile-page-container">
            <div className={`profile-layout ${userData.role === 'client' ? 'client-layout' : ''}`}>
                {/* === LEFT SIDEBAR PROFILE CARD === */}
                <aside className="profile-sidebar">
                    <div className={`profile-card ${isEditing ? 'editing' : ''}`}>
                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="profile-edit-form">
                                <h3>Edit Profile</h3>
                                <div className="input-group">
                                    <label><FaUser /> Username</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                                </div>
                                <div className="input-group">
                                    <label><FaEnvelope /> Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                {userData.role === 'freelancer' && (
                                    <div className="input-group">
                                        <label>About Me</label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
                                    </div>
                                )}
                                <div className="form-actions">
                                    <button type="submit" className="btn-save">Save</button>
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="profile-image-container" onClick={isOwnProfile ? handleUploadButtonClick : null}>
                                    <img src={profileImageSrc} alt="Profile" className="profile-image" />
                                    {isOwnProfile && (
                                        <div className="update-image-overlay">
                                            <FaCamera />
                                            <span>Update Image</span>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e.target.files[0], "profile")} style={{ display: 'none' }} />
                                </div>
                                <h1 className="profile-name">{userData.username}</h1>
                                <p className="profile-email">{userData.email}</p>
                                <span className={`role-badge role-${userData.role}`}>{userData.role}</span>
                                {userData.role === 'freelancer' && <p className="profile-description">{userData.description || "No description provided."}</p>}
                                {isOwnProfile && <button className="btn-edit-profile" onClick={() => setIsEditing(true)}><FaEdit /> Edit Profile</button>}
                            </>
                        )}
                    </div>
                </aside>

                {/* === MAIN CONTENT AREA (Only for Freelancers) === */}
                {userData.role === 'freelancer' && (
                    <main className="profile-content">
                        <div className="profile-tabs">
                            <button className={activeTab === 'portfolio' ? 'active' : ''} onClick={() => setActiveTab('portfolio')}><FaBriefcase /> Portfolio</button>
                            <button className={activeTab === 'skills' ? 'active' : ''} onClick={() => setActiveTab('skills')}><FaTools /> Skills</button>
                            <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}><FaCommentDots /> Reviews</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'portfolio' && (
                                <div className="portfolio-grid">
                                    {formData.portfolio.length > 0 ? formData.portfolio.map((proj, idx) => (
                                        <div key={idx} className="portfolio-item">
                                            {proj.images && proj.images.length > 0 && <img src={proj.images[0]} alt={proj.title} className="portfolio-img" />}
                                            <div className="portfolio-info">
                                                <h4>{proj.title}</h4>
                                                <p>{proj.description.substring(0, 100)}{proj.description.length > 100 && '...'}</p>
                                                {proj.portfolioLink && <a href={proj.portfolioLink} target="_blank" rel="noopener noreferrer"><FaLink /> View Project</a>}
                                            </div>
                                        </div>
                                    )) : <p className="empty-state">No portfolio projects yet.</p>}
                                </div>
                            )}
                            {activeTab === 'skills' && (
                                <div className="skills-container">
                                    {formData.skills.length > 0 ? formData.skills.map(skill => <span key={skill} className="skill-tag">{skill}</span>) : <p className="empty-state">No skills listed.</p>}
                                </div>
                            )}
                            {activeTab === 'reviews' && (
                                <div className="reviews-list">
                                    {reviews.length > 0 ? reviews.map(review => (
                                        <div key={review._id} className="review-card">
                                            <div className="review-rating">{"★".repeat(review.rating)}<span className="star-inactive">{"★".repeat(5 - review.rating)}</span></div>
                                            <p className="review-comment">"{review.comment}"</p>
                                            <span className="review-author">- {review.client?.username || "Anonymous Client"}</span>
                                        </div>
                                    )) : <p className="empty-state">No reviews received yet.</p>}
                                </div>
                            )}
                        </div>
                        
                        {isOwnProfile && (
                            <section className="add-project-section">
                                <h2><FaPlus /> Add New Project</h2>
                                <form onSubmit={handleProjectSubmit} className="add-project-form">
                                    <input type="text" placeholder="Project Title" value={projectData.title} onChange={(e) => setProjectData({ ...projectData, title: e.target.value })} required />
                                    <textarea placeholder="Project Description" value={projectData.description} onChange={(e) => setProjectData({ ...projectData, description: e.target.value })} rows="4" required />
                                    <input type="text" placeholder="External Link (e.g., GitHub)" value={projectData.portfolioLink} onChange={(e) => setProjectData({ ...projectData, portfolioLink: e.target.value })} />
                                    <label className="upload-label">Upload Images</label>
                                    <input type="file" multiple ref={projectImagesRef} onChange={handleProjectImagesSelect} className="file-input" />
                                    <div className="project-images-preview">
                                        {projectData.images.map((img, i) => (
                                            <div key={i} className="preview-image-wrapper">
                                                <img src={img} alt={`Preview ${i}`} />
                                                <button type="button" onClick={() => removeProjectImage(i)}><FaTimes /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? "Adding..." : "Add Project"}</button>
                                </form>
                            </section>
                        )}
                    </main>
                )}
            </div>
        </div>
    );
};

export default Profile;