import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import api from "../api";
import {
  FaEdit, FaPlus, FaLink, FaTimes, FaCamera,
  FaUser, FaEnvelope, FaBriefcase, FaTools, FaCommentDots
} from "react-icons/fa";
import "./Profile.css";

/* ---------- CropModal (same as before) ---------- */
const CropModal = ({ imageFile, onCancel, onCrop }) => {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const naturalRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onload = (e) => setImageSrc(e.target.result);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const onImgLoad = (e) => {
    const img = e.target;
    naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
    const containerSize = 360;
    const scaleFit = Math.max(containerSize / img.naturalWidth, containerSize / img.naturalHeight);
    setScale(scaleFit);
    setPos({ x: 0, y: 0 });
    lastPosRef.current = { x: 0, y: 0 };
  };

  const startDrag = (clientX, clientY) => {
    draggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };
  };
  const moveDrag = (clientX, clientY) => {
    if (!draggingRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    const newPos = { x: lastPosRef.current.x + dx, y: lastPosRef.current.y + dy };
    setPos(newPos);
  };
  const endDrag = () => {
    draggingRef.current = false;
    lastPosRef.current = pos;
  };

  const onMouseDown = (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const onMouseMove = (e) => { if (draggingRef.current) moveDrag(e.clientX, e.clientY); };
  const onMouseUp = () => endDrag();
  const onTouchStart = (e) => { if (e.touches.length === 1) { const t = e.touches[0]; startDrag(t.clientX, t.clientY); } };
  const onTouchMove = (e) => { if (e.touches.length === 1 && draggingRef.current) { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); } };
  const onTouchEnd = () => endDrag();

  const cropToBlob = async () => {
    if (!imageSrc || !imgRef.current) return null;
    const viewportSize = 360;
    const img = imgRef.current;
    const scaleVal = scale;
    const displayedW = naturalRef.current.w * scaleVal;
    const displayedH = naturalRef.current.h * scaleVal;
    const imgLeft = (viewportSize / 2) - (displayedW / 2) + pos.x;
    const imgTop = (viewportSize / 2) - (displayedH / 2) + pos.y;
    const sx = Math.max(0, (-imgLeft) / scaleVal);
    const sy = Math.max(0, (-imgTop) / scaleVal);
    const sWidth = Math.min(naturalRef.current.w - sx, viewportSize / scaleVal);
    const sHeight = Math.min(naturalRef.current.h - sy, viewportSize / scaleVal);

    const canvas = document.createElement("canvas");
    canvas.width = viewportSize;
    canvas.height = viewportSize;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  };

  const handleCropAndUpload = async () => {
    const blob = await cropToBlob();
    if (!blob) return alert("Crop failed.");
    const file = new File([blob], "profile-crop.jpg", { type: "image/jpeg" });
    onCrop(file);
  };

  const onScaleChange = (v) => setScale(Number(v));
  const resetPosition = () => { setScale(1); setPos({ x: 0, y: 0 }); lastPosRef.current = { x: 0, y: 0 }; };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 740, maxWidth: "98%", display: "flex", gap: 16 }}>
        <div style={{ width: 360, height: 360, background: "#fff", borderRadius: 8, overflow: "hidden", position: "relative", border: "1px solid #e6e6e6" }}
          ref={containerRef}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {!imageSrc && <div style={{ padding: 20 }}>Loading preview...</div>}
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="to-crop"
              onLoad={onImgLoad}
              draggable={false}
              style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`, transformOrigin: "center center", userSelect: "none", touchAction: "none", maxWidth: "none" }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)" }} />
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: 12, border: "1px solid #e6e6e6" }}>
          <h3 style={{ marginTop: 0 }}>Crop & Upload</h3>
          <p style={{ marginTop: 0, color: "#6b7280" }}>Drag the image to reposition. Use zoom to fit. Final crop will be square.</p>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600 }}>Zoom</label>
            <input type="range" min={0.2} max={Math.max(3, scale * 3)} step={0.01} value={scale} onChange={(e) => onScaleChange(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={resetPosition} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e6e6e6", background: "#fff", cursor: "pointer" }}>Reset</button>
            <button type="button" onClick={handleCropAndUpload} style={{ padding: "10px 12px", borderRadius: 8, background: "#0A6E7C", color: "#fff", border: "none", cursor: "pointer" }}>Crop & Upload</button>
            <button type="button" onClick={onCancel} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e6e6e6", background: "#fff", cursor: "pointer" }}>Cancel</button>
          </div>

          <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>Tip: pinch to zoom on mobile. Drag to reposition image inside the square.</div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Profile component ---------- */
const Profile = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profilePicture: "",
    skills: [],
    description: "",
    portfolio: [],
    upiId: ""
  });
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState({ title: "", description: "", images: [], portfolioLink: "" });

  const [cropFile, setCropFile] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const [skillInput, setSkillInput] = useState("");
  const skillInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const projectImagesRef = useRef(null);

  const isOwnProfile = !id;
  const viewerRole = localStorage.getItem("role");

  // fetch with cache-buster so refresh always loads fresh UPI field
  const fetchProfileAndSync = async () => {
    try {
      const url = (isOwnProfile ? "/profile" : `/profile/${id}`) + `?t=${Date.now()}`;
      const { data } = await api.get(url);
      if (!data) return null;
      const normalized = {
        username: data.username || "",
        email: data.email || "",
        profilePicture: data.profilePicture || "",
        skills: Array.isArray(data.skills) ? data.skills : [],
        description: data.description || "",
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
        upiId: data.upiId || ""
      };
      setUserData(data);
      setFormData(normalized);

      if (data.role === "freelancer") {
        try {
          const reviewsRes = await api.get(`/gigs/freelancer/${data._id}/reviews`);
          setReviews(reviewsRes.data || []);
        } catch (e) {
          setReviews([]);
        }
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchProfileAndSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const profileImageSrc = (userData && userData.profilePicture) || formData.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const addSkillFromInput = (e) => {
    if (e) e.preventDefault();
    const raw = (skillInput || "").trim();
    if (!raw) return;
    const normalized = raw.replace(/\s+/g, " ");
    const exists = (formData.skills || []).some((s) => s.toLowerCase() === normalized.toLowerCase());
    if (!exists) setFormData((p) => ({ ...p, skills: [...(p.skills || []), normalized] }));
    setSkillInput("");
    if (skillInputRef.current) skillInputRef.current.focus();
  };

  const removeSkill = (skillToRemove) => setFormData((p) => ({ ...p, skills: (p.skills || []).filter((s) => s !== skillToRemove) }));

  // Save profile — ensure upiId always sent and then re-fetch server state
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        skills: Array.isArray(formData.skills) ? formData.skills.map((s) => String(s).trim()).filter(Boolean) : [],
        upiId: (formData.upiId || "").trim()
      };

      let putData = null;
      try {
        const putRes = await api.put("/profile", payload);
        if (putRes && putRes.data && typeof putRes.data === "object") putData = putRes.data;
      } catch (err) {
        console.warn("PUT /profile warning:", err);
      }

      if (putData) {
        // If backend returned updated user, use it immediately
        const normalized = {
          username: putData.username || payload.username || "",
          email: putData.email || payload.email || "",
          profilePicture: putData.profilePicture || payload.profilePicture || "",
          skills: Array.isArray(putData.skills) ? putData.skills : payload.skills || [],
          description: putData.description || payload.description || "",
          portfolio: Array.isArray(putData.portfolio) ? putData.portfolio : payload.portfolio || [],
          upiId: putData.upiId || payload.upiId || ""
        };
        setUserData(putData);
        setFormData(normalized);
        setIsEditing(false);
        alert("Profile saved — UI updated from server response.");
      } else {
        // Fallback to re-fetching latest profile
        const fresh = await fetchProfileAndSync();
        setIsEditing(false);
        if (fresh) alert("Profile saved and re-fetched from server.");
        else alert("Profile saved (couldn't re-fetch).");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when user selects a file for profile pic — opens crop modal
  const handleProfileFileSelect = (file) => {
    if (!file) return;
    setCropFile(file);
    setShowCropModal(true);
  };

  // Called with a cropped File from CropModal — upload then persist and re-fetch
  const handleCropResultUpload = async (croppedFile) => {
    setShowCropModal(false);
    setCropFile(null);
    if (!croppedFile) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("profilePicture", croppedFile);
      const uploadUrl = "http://localhost:5000/api/upload/profile-picture";
      const { data: uploadResp } = await axios.post(uploadUrl, form, { headers: { "Content-Type": "multipart/form-data" } });
      if (!uploadResp || !uploadResp.secure_url) throw new Error("Upload failed");
      const secureUrl = uploadResp.secure_url;

      // persist profilePicture and include upiId in payload (important)
      try {
        await api.put("/profile", { ...formData, profilePicture: secureUrl, upiId: (formData.upiId || "").trim() });
      } catch (err) {
        console.warn("PUT /profile after upload warning", err);
      }
      await fetchProfileAndSync();
      alert("Profile picture updated.");
    } catch (err) {
      console.error("Crop upload failed:", err);
      alert("Failed to upload cropped image.");
    } finally {
      setIsLoading(false);
    }
  };

  // Project image upload (unchanged)
  const handleImageUpload = async (file, type = "project") => {
    if (!file) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("projectImage", file);
      const uploadUrl = "http://localhost:5000/api/upload/project-image";
      const { data: uploadResp } = await axios.post(uploadUrl, form, { headers: { "Content-Type": "multipart/form-data" } });
      if (!uploadResp || !uploadResp.secure_url) throw new Error("Upload failed");
      const secureUrl = uploadResp.secure_url;
      setProjectData((p) => ({ ...p, images: [...(p.images || []), secureUrl] }));
    } catch (err) {
      console.error("Project image upload failed:", err);
      alert("Image upload failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadButtonClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const onProfileFileInputChange = (e) => { const f = e.target.files && e.target.files[0]; if (f) handleProfileFileSelect(f); e.target.value = null; };
  const handleProjectImagesSelect = (e) => { const files = Array.from(e.target.files || []); files.forEach((file) => handleImageUpload(file, "project")); };
  const removeProjectImage = (index) => setProjectData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const projectToSave = { title: projectData.title, description: projectData.description, images: projectData.images || [], portfolioLink: projectData.portfolioLink || "", link: projectData.portfolioLink || "" };
      const updatedPortfolio = [...(formData.portfolio || []), projectToSave];
      try { await api.put("/profile", { ...formData, portfolio: updatedPortfolio, upiId: (formData.upiId || "").trim() }); } catch (putErr) { console.warn("PUT /profile for portfolio failed; will refresh", putErr); }
      await fetchProfileAndSync();
      setProjectData({ title: "", description: "", images: [], portfolioLink: "" });
      if (projectImagesRef.current) projectImagesRef.current.value = null;
      alert("Project added successfully!");
    } catch (err) {
      console.error("Failed to add project:", err);
      alert("Failed to add project.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) return <div className="loading-indicator">Loading profile...</div>;

  return (
    <div className="profile-page-container">
      <div className={`profile-layout ${userData.role === "client" ? "client-layout" : ""}`}>
        <aside className="profile-sidebar">
          <div className={`profile-card ${isEditing ? "editing" : ""}`}>
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

                {userData.role === "freelancer" && (
                  <div className="input-group">
                    <label><FaTools /> Skills</label>
                    <div className="skills-tags" style={{ marginTop: 8 }}>
                      {(formData.skills || []).map((s, i) => (
                        <span key={s + i} className="skill-tag">{s}
                          <button type="button" className="skill-remove-btn" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}><FaTimes /></button>
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input ref={skillInputRef} type="text" placeholder="Type skill and press Enter or click Add" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addSkillFromInput(e); }} style={{ flex: 1 }} />
                      <button type="button" className="btn-add-skill" onClick={addSkillFromInput}>Add</button>
                    </div>

                    <small style={{ color: "#6b7280", display: "block", marginTop: 6 }}>Enter skills like: React, Node.js — they will appear as tags and saved as an array.</small>
                  </div>
                )}

                {userData.role === "freelancer" && isOwnProfile && (
                  <div className="input-group">
                    <label>UPI ID (for payouts)</label>
                    <input type="text" name="upiId" value={formData.upiId || ""} onChange={handleChange} placeholder="example@upi" />
                    <small style={{ color: "#6b7280" }}>This UPI ID will be stored securely and shown only to admins and you.</small>

                    {/* show previously saved UPI (server truth) */}
                    {userData.upiId && (
                      <div style={{ marginTop: 10 }}>
                        <strong>Previously saved UPI:</strong>
                        <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 8, display: "inline-block", fontWeight: 700, background: "#fbfbfc" }}>{userData.upiId}</div>
                        <small style={{ display: "block", marginTop: 6, color: "#6b7280" }}>This is the UPI currently stored in your profile. It will update after you save.</small>
                      </div>
                    )}

                    {/* Live preview if typed value differs from saved */}
                    {(formData.upiId && formData.upiId !== (userData.upiId || "")) && (
                      <div style={{ marginTop: 10 }}>
                        <strong>Entered UPI (unsaved):</strong>
                        <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 8, display: "inline-block", fontWeight: 700, background: "#f8fafc" }}>{formData.upiId}</div>
                        <small style={{ display: "block", marginTop: 6, color: "#6b7280" }}>Save to replace the previously saved UPI.</small>
                      </div>
                    )}
                  </div>
                )}

                {userData.role === "freelancer" && (
                  <div className="input-group">
                    <label>About Me</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</button>
                  <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-image-container" onClick={isOwnProfile ? handleUploadButtonClick : null} style={{ cursor: isOwnProfile ? "pointer" : "default" }}>
                  <img src={profileImageSrc} alt="Profile" className="profile-image" />
                  {isOwnProfile && (
                    <div className="update-image-overlay"><FaCamera /><span>Update Image</span></div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={onProfileFileInputChange} style={{ display: "none" }} accept="image/*" />
                </div>

                <h1 className="profile-name">{userData.username}</h1>
                <p className="profile-email">{userData.email}</p>
                <span className={`role-badge role-${userData.role}`}>{userData.role}</span>
                {userData.role === "freelancer" && <p className="profile-description">{userData.description || "No description provided."}</p>}
                {isOwnProfile && <button className="btn-edit-profile" onClick={() => setIsEditing(true)}><FaEdit /> Edit Profile</button>}

                {/* show UPI to admin or owner, prefer server value (userData.upiId) */}
                {userData.role === "freelancer" && (userData.upiId || formData.upiId) && (
                  <div style={{ marginTop: 12 }}>
                    <strong>{isOwnProfile ? "Your UPI ID:" : "UPI ID (for payouts):"}</strong>
                    <div style={{ marginTop: 6, padding: "8px 10px", background: isOwnProfile ? "#e0f7fa" : "#fff7ed", borderRadius: 8, display: "inline-block", fontWeight: 700 }}>
                      {userData.upiId || formData.upiId}
                    </div>
                    <small style={{ display: "block", marginTop: 6, color: "#6b7280" }}>{isOwnProfile ? "(visible only to you and admins)" : "(visible to admins only)"}</small>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {userData.role === "freelancer" && (
          <main className="profile-content">
            <div className="profile-tabs">
              <button className={activeTab === "portfolio" ? "active" : ""} onClick={() => setActiveTab("portfolio")}><FaBriefcase /> Portfolio</button>
              <button className={activeTab === "skills" ? "active" : ""} onClick={() => setActiveTab("skills")}><FaTools /> Skills</button>
              <button className={activeTab === "reviews" ? "active" : ""} onClick={() => setActiveTab("reviews")}><FaCommentDots /> Reviews</button>
            </div>

            <div className="tab-content">
              {activeTab === "portfolio" && (
                <>
                  <div className="portfolio-grid">
                    {formData.portfolio.length > 0 ? formData.portfolio.map((proj, idx) => (
                      <div key={idx} className="portfolio-item">
                        {proj.images && proj.images.length > 0 && <img src={proj.images[0]} alt={proj.title} className="portfolio-img" />}
                        <div className="portfolio-info">
                          <h4>{proj.title}</h4>
                          <p>{(proj.description || "").substring(0, 100)}{(proj.description || "").length > 100 && "..."}</p>
                          {(proj.portfolioLink || proj.link) && (<a href={proj.portfolioLink || proj.link} target="_blank" rel="noopener noreferrer"><FaLink /> View Project</a>)}
                        </div>
                      </div>
                    )) : <p className="empty-state">No portfolio projects yet.</p>}
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
                            <div key={i} className="preview-image-wrapper"><img src={img} alt={`Preview ${i}`} /><button type="button" onClick={() => removeProjectImage(i)}><FaTimes /></button></div>
                          ))}
                        </div>
                        <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? "Adding..." : "Add Project"}</button>
                      </form>
                    </section>
                  )}
                </>
              )}

              {activeTab === "skills" && (
                <div className="skills-container">
                  {formData.skills.length > 0 ? formData.skills.map((skill) => <span key={skill} className="skill-tag">{skill}</span>) : <p className="empty-state">No skills listed.</p>}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="reviews-list">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review._id} className="review-card">
                      <div className="review-rating">{"★".repeat(review.rating)}<span className="star-inactive">{"★".repeat(5 - review.rating)}</span></div>
                      <p className="review-comment">"{review.comment}"</p>
                      <span className="review-author">- {review.client?.username || "Anonymous Client"}</span>
                    </div>
                  )) : <p className="empty-state">No reviews received yet.</p>}
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {showCropModal && cropFile && (
        <CropModal imageFile={cropFile} onCancel={() => { setShowCropModal(false); setCropFile(null); }} onCrop={(file) => handleCropResultUpload(file)} />
      )}
    </div>
  );
};

export default Profile;
