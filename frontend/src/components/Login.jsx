import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; // <-- IMPORTED the configured api instance
import './Register.css';

const Login = () => {
  // 1. ADDED THE DEBUG LINE HERE
  console.log("Vercel is using this API URL:", import.meta.env.VITE_API_URL);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { email, password } = formData;
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. FIXED THE HARDCODED URL
      // Changed from axios.post('http://localhost...') to api.post('/login')
      const response = await api.post('/login', { idToken });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);

      navigate('/dashboard');

    } catch (err) {
      console.error('Login failed!', err);
      // Provide a more user-friendly error
      if (err.message === "Network Error") {
          setError("Unable to connect to the server. Please check your connection or try again later.");
      } else {
          setError(err.response?.data?.message || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">Login</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={email} onChange={handleChange} required />
          </div>
          <div className="form-group password-group">
            <label>Password</label>
            <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={handleChange} required />
            <button type="button" className="show-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button type="submit" className="register-btn">Login</button>
          <p className="login-link">
            Don't have an account? <Link to="/register"><strong>Register here</strong></Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;