import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { getToken } from '../utils/auth';
import './ShareItem.css';

function ShareItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/share/item/${id}`);
      if (!response.ok) {
        throw new Error('Item not found');
      }
      const data = await response.json();
      setItem(data);
    } catch (err) {
      setError('Item not found or not shareable');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    const token = getToken();
    if (!token) {
      navigate('/login?redirect=/share/item/' + id);
      return;
    }

    setClaiming(true);
    try {
      await api.post(`/claims/items/${id}/claims`);
      alert('Claim request sent! The owner will be notified.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create claim');
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="share-item-loading">Loading...</div>;
  }

  if (error || !item) {
    return (
      <div className="share-item-error">
        <h2>Item Not Found</h2>
        <p>{error || 'This item is not available for sharing.'}</p>
        <Link to="/dashboard">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="share-item-page">
      <div className="share-item-card">
        <h1>Shared Item</h1>
        <div className="item-info">
          <h2>{item.name}</h2>
          <div className="item-details">
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Expiry Date:</strong> {formatDate(item.expiryDate)}</p>
          </div>
          {item.isClaimed ? (
            <div className="claimed-notice">
              This item has already been claimed.
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="claim-button"
            >
              {claiming ? 'Processing...' : 'Claim This Item'}
            </button>
          )}
        </div>
        <div className="share-item-footer">
          <Link to="/login">Login</Link> or <Link to="/register">Register</Link> to claim items
        </div>
      </div>
    </div>
  );
}

export default ShareItem;
