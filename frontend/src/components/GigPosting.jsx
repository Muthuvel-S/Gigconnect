import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GigPosting = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '',
    skills: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value) newErrors[key] = 'This field is required';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim());
      const gigData = { ...formData, skills: skillsArray };

      await axios.post('http://localhost:5000/api/gigs', gigData, {
        headers: { 'x-auth-token': token },
      });
      navigate('/my-gigs');
    } catch (err) {
      console.error('Gig posting failed:', err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Post a New Gig</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: 'title', label: 'Gig Title', type: 'text' },
            { name: 'duration', label: 'Duration', type: 'text' },
            { name: 'budget', label: 'Budget (INR)', type: 'number' },
            { name: 'location', label: 'Location', type: 'text' },
          ].map(({ name, label, type }) => (
            <div key={name} style={styles.inputContainer}>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  borderColor: errors[name] ? '#e74c3c' : '#ddd',
                }}
              />
              <label
                style={{
                  ...styles.label,
                  top: formData[name] ? '-10px' : '14px',
                  fontSize: formData[name] ? '0.75rem' : '0.9rem',
                  color: errors[name] ? '#e74c3c' : '#aaa',
                }}
              >
                {label}
              </label>
              {errors[name] && <span style={styles.error}>{errors[name]}</span>}
            </div>
          ))}

          <div style={styles.inputContainerFull}>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                ...styles.textarea,
                borderColor: errors.description ? '#e74c3c' : '#ddd',
              }}
            />
            <label
              style={{
                ...styles.label,
                top: formData.description ? '-10px' : '14px',
                fontSize: formData.description ? '0.75rem' : '0.9rem',
                color: errors.description ? '#e74c3c' : '#aaa',
              }}
            >
              Gig Description
            </label>
            {errors.description && <span style={styles.error}>{errors.description}</span>}
          </div>

          <div style={styles.inputContainerFull}>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: errors.skills ? '#e74c3c' : '#ddd',
              }}
            />
            <label
              style={{
                ...styles.label,
                top: formData.skills ? '-10px' : '14px',
                fontSize: formData.skills ? '0.75rem' : '0.9rem',
                color: errors.skills ? '#e74c3c' : '#aaa',
              }}
            >
              Skills (comma separated)
            </label>
            {errors.skills && <span style={styles.error}>{errors.skills}</span>}
          </div>

          <button type="submit" style={styles.button}>
            Post Gig
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '00px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    maxWidth: '700px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '40px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    color: '#333',
    fontWeight: '700',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainerFull: {
    gridColumn: '1 / -1',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none',
    transition: '0.2s all',
  },
  input: {
    padding: '18px 16px 6px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    outline: 'none',
    background: '#f9f9f9',
    transition: '0.2s all',
  },
  textarea: {
    padding: '18px 16px 6px 16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    outline: 'none',
    background: '#f9f9f9',
    resize: 'vertical',
    minHeight: '120px',
    transition: '0.2s all',
  },
  button: {
    gridColumn: '1 / -1',
    padding: '16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: '600',
    background: 'linear-gradient(90deg, #2d2f31, #303535)',
    color: '#fff',
    cursor: 'pointer',
    transition: '0.3s all',
  },
  error: {
    color: '#e74c3c',
    fontSize: '0.8rem',
    marginTop: '4px',
  },
};

export default GigPosting;
