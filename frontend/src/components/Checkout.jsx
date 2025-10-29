import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Checkout.css'; // import external CSS

const Checkout = () => {
  const [checkoutData, setCheckoutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/gigs/${id}/checkout-details`, {
          headers: { 'x-auth-token': token },
        });
        setCheckoutData(response.data);
      } catch (err) {
        console.error('Failed to fetch checkout details:', err);
        setError('Failed to load checkout details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCheckoutDetails();
  }, [id, token, API_URL]);

  const handlePayment = async () => {
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      const { data: { id: order_id, amount, currency } } = await axios.post(
        `${API_URL}/payment/order`,
        { gigId: id },
        { headers: { 'x-auth-token': token } }
      );

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'MV WORK',
        description: 'Payment for Gig',
        order_id,
        handler: async function (response) {
          await axios.post(
            `${API_URL}/payment/verify`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              gigId: id,
            },
            { headers: { 'x-auth-token': token } }
          );
          alert('Payment was successful!');
          navigate('/my-gigs');
        },
        prefill: { name: 'Your Name', email: 'your.email@example.com', contact: '9999999999' },
        theme: { color: '#556ee6' },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error('Payment Error:', err?.response?.data || err);
      alert(err?.response?.data?.message || 'Payment failed.');
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const gigStatus = checkoutData?.gigDetails?.status?.toLowerCase();
  const isClient = role === 'client';
  const isPaymentAllowed = gigStatus === 'completed' && isClient;

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2>Checkout: {checkoutData?.gigDetails?.title || 'N/A'}</h2>
        <p>Secure payment powered by Razorpay</p>
      </div>

      <div className="checkout-details">
        <p><strong>Freelancer:</strong> {checkoutData?.freelancerName || 'N/A'}</p>
        <p><strong>Client's Budget:</strong> ₹{checkoutData?.gigDetails?.budget || 0}</p>
        <p><strong>Freelancer's Bid:</strong> ₹{checkoutData?.bidAmount || 0}</p>
        <h3>Final Amount: ₹{checkoutData?.bidAmount || 0}</h3>
      </div>

      {isPaymentAllowed ? (
        <button className="payment-button" onClick={handlePayment}>
          Proceed to Payment
        </button>
      ) : (
        <p className="info-text">
          {gigStatus === 'completed'
            ? 'Only the client can proceed with the payment.'
            : 'Payment not available yet.'}
        </p>
      )}
    </div>
  );
};

export default Checkout;
