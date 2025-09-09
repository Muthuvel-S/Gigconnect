import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import api from "../api";
import "./Profile.css";

const Profile = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profilePicture: "",
    skills: [],
    description: "",
    portfolio: [],
    upiId: "",
  });
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    images: [],
    portfolioLink: "",
  });

  const fileInputRef = useRef(null);
  const projectImageRef = useRef(null);

  const profileImageSrc =
    userData?.profilePicture ||
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  const isOwnProfile = !id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = isOwnProfile ? "/profile" : `/profile/${id}`;
        const response = await api.get(url);
        setUserData(response.data);
        setFormData({
          username: response.data.username || "",
          email: response.data.email || "",
          profilePicture: response.data.profilePicture || "",
          skills: response.data.skills || [],
          description: response.data.description || "",
          portfolio: response.data.portfolio || [],
          upiId: response.data.upiId || "",
        });

        if (response.data.role === "freelancer") {
          const reviewsResponse = await api.get(
            `/gigs/freelancer/${response.data._id}/reviews`
          );
          setReviews(reviewsResponse.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [id, isOwnProfile]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSkillsChange = (e) =>
    setFormData({
      ...formData,
      skills: e.target.value.split(",").map((skill) => skill.trim()),
    });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/profile", formData);
      setUserData(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    }
  };

  const handleUploadButtonClick = () => fileInputRef.current.click();

  const handleImageUpload = async (file, type = "profile") => {
    if (!file) return;
    setIsLoading(true);
    const data = new FormData();
    data.append(type === "profile" ? "profilePicture" : "projectImage", file);

    try {
      const url =
        type === "profile"
          ? "http://localhost:5000/api/upload/profile-picture"
          : "http://localhost:5000/api/upload/project-image";
      const response = await axios.post(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (type === "profile") {
        setFormData((prev) => ({ ...prev, profilePicture: response.data.secure_url }));
        setUserData((prev) => ({ ...prev, profilePicture: response.data.secure_url }));
      } else {
        setProjectData((prev) => ({
          ...prev,
          images: [...prev.images, response.data.secure_url],
        }));
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedPortfolio = [...formData.portfolio, projectData];
      const response = await api.put("/profile", { ...formData, portfolio: updatedPortfolio });
      setFormData(response.data);
      setUserData(response.data);
      setProjectData({ title: "", description: "", images: [], portfolioLink: "" });
      alert("Project added successfully!");
    } catch (err) {
      console.error("Failed to add project:", err);
      alert("Failed to add project.");
    }
  };

  if (!userData) return <div className="loading">Loading profile...</div>;

  return (<div className="profile-container">
  <div className="profile-header">
    <img src={profileImageSrc} alt="Profile" className="profile-image" />
    <div className="profile-info">
      <h2>{userData.username}</h2>
      <p>Email: {userData.email}</p>
    </div>
    <div className="role-badge">{userData.role}</div> {/* Role Badge */}
  </div>

  {userData.role === "freelancer" && (
    <>
      <section className="profile-about">
        <h3>About Me</h3>
        <p>{userData.description}</p>

        <h3>Skills</h3>
        <p>{userData.skills.join(", ")}</p>

        <h3>Portfolio</h3>
        <div className="portfolio-list">
          {formData.portfolio.length > 0 ? (
            formData.portfolio.map((proj, idx) => (
              <div key={idx} className="portfolio-card">
                <h4>{proj.title}</h4>
                <p>{proj.description}</p>
                {proj.images.map((img, i) => (
                  <img key={i} src={img} alt="Project" className="portfolio-img" />
                ))}
                {proj.portfolioLink && (
                  <a href={proj.portfolioLink} target="_blank" rel="noopener noreferrer">
                    View Online
                  </a>
                )}
              </div>
            ))
          ) : (
            <p>No projects yet.</p>
          )}
        </div>

        <h3>Reviews & Ratings</h3>
        {reviews.length > 0 ? (
          <ul className="reviews-list">
            {reviews.map((review) => (
              <li key={review._id} className="review-card">
                <p className="rating">{"⭐".repeat(review.rating)}</p> {/* Star Ratings */}
                <p><strong>Comment:</strong> {review.comment}</p>
                <p><em>- {review.client.username}</em></p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reviews yet.</p>
        )}
      </section>
    </>
  )}


      {isOwnProfile && (
        <>
          {!isEditing ? (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit Profile</button>
          ) : (
            <form onSubmit={handleUpdate} className="profile-form">
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />

              <div className="upload-container">
                <button type="button" onClick={handleUploadButtonClick} disabled={isLoading}>
                  {isLoading ? "Uploading..." : "Upload Profile Picture"}
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e.target.files[0], "profile")} />
              </div>

              {userData.role === "freelancer" && (
                <>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="About you..." />
                  <input type="text" name="skills" value={formData.skills.join(", ")} onChange={handleSkillsChange} placeholder="Skills (React, Node.js, etc.)" />
                  <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="UPI ID" />
                </>
              )}

              <div className="form-buttons">
                <button type="submit" className="btn-save">Save Changes</button>
                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          )}

          {userData.role === "freelancer" && (
            <section className="add-project">
              <h3>Add New Project</h3>
              <form onSubmit={handleProjectSubmit}>
                <input
                  type="text"
                  placeholder="Project Title"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Project Description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  required
                />
                
                <input
                  type="text"
                  placeholder="Your Project Link"
                  value={projectData.portfolioLink}
                  onChange={(e) => setProjectData({ ...projectData, portfolioLink: e.target.value })}
                />
                <button type="submit" className="btn-save">Add Project</button>
              </form>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
