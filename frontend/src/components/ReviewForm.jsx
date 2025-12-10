import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

const ReviewForm = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/gigs/${id}/review`,
        { rating, comment },
        { headers: { 'x-auth-token': token } }
      );

      alert('⭐ Review submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Review submission failed:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '650px',
        margin: '40px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          fontWeight: '700',
          marginBottom: '10px',
          color: '#0A6E7C',
        }}
      >
        Leave a Review
      </h2>

      <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '25px' }}>
        Your feedback helps freelancers grow 🌟
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ⭐ RATING AREA */}
        <div>
          <h4 style={{ marginBottom: '8px' }}>Your Rating:</h4>
          <div>
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                size={40}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  cursor: 'pointer',
                  transition: '0.2s',
                  color: star <= (hoverRating || rating) ? '#FFD700' : '#d1d1d1',
                }}
              />
            ))}
          </div>
        </div>

        {/* 📝 COMMENT AREA */}
        <div>
          <h4 style={{ marginBottom: '8px' }}>Your Review:</h4>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write something helpful for others..."
            required
            style={{
              width: '100%',
              padding: '14px',
              minHeight: '130px',
              borderRadius: '10px',
              border: '1px solid #ced4da',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid #0A6E7C')}
            onBlur={(e) => (e.target.style.border = '1px solid #ced4da')}
          ></textarea>
        </div>

        {/* 🚀 SUBMIT BUTTON */}
        <button
          type="submit"
          style={{
            padding: '14px',
            backgroundColor: '#0A6E7C',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: '0.25s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#085560')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#0A6E7C')}
        >
          Submit Review ⭐
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
