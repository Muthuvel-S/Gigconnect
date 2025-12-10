import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaEnvelopeOpenText } from 'react-icons/fa';

const VerificationMessage = ({ email }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff',
        padding: '20px',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffff',
          padding: '2.5rem',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '430px',
          textAlign: 'center',
          boxShadow: '0 10px 35px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.6s ease-out',
        }}
      >
        {/* Icon */}
        <FaCheckCircle size={55} color="#0A6E7C" style={{ marginBottom: '10px' }} />

        <h2
          style={{
            fontSize: '1.9rem',
            fontWeight: '700',
            marginBottom: '10px',
            color: '#0A6E7C',
          }}
        >
          Registration Successful!
        </h2>

        <p
          style={{
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            marginBottom: '15px',
          }}
        >
          We've sent a verification link to:
        </p>

        <p
          style={{
            fontWeight: '600',
            color: '#222',
            fontSize: '1.05rem',
            wordBreak: 'break-word',
          }}
        >
          <FaEnvelopeOpenText style={{ marginRight: '6px', color: '#0A6E7C' }} />
          {email}
        </p>

        <p
          style={{
            color: '#777',
            fontSize: '0.95rem',
            marginTop: '10px',
            marginBottom: '25px',
          }}
        >
          Didn't receive it? Check your spam/junk folder.
        </p>

        {/* Button */}
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            backgroundColor: '#0A6E7C',
            color: '#fff',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: '0.25s ease',
            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#085560')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#0A6E7C')}
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default VerificationMessage;
