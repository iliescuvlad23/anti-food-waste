import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import './Claims.css';

function Claims() {
  const { type } = useParams();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, [type]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.hasFocus()) {
        loadClaims();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [type]);

  const loadClaims = async () => {
    try {
      const endpoint = type === 'incoming' ? '/claims/incoming' : '/claims/mine';
      const response = await api.get(endpoint);
      setClaims(response.data);
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, status) => {
    try {
      await api.patch(`/claims/${claimId}`, { status });
      await loadClaims();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update claim');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545',
      cancelled: '#6c757d',
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="claims-loading">Loading...</div>;
  }

  return (
    <div className="claims-page">
      <div className="claims-header">
        <h1>{type === 'incoming' ? 'Incoming Claims' : 'My Claims'}</h1>
        <button onClick={loadClaims} className="refresh-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {claims.length === 0 ? (
        <p className="empty-state">
          {type === 'incoming'
            ? 'No incoming claim requests.'
            : 'You have no claims.'}
        </p>
      ) : (
        <div className="claims-list">
          {claims.map((claim) => (
            <div key={claim.id} className="claim-card">
              <div className="claim-header">
                <h3>{claim.item.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(claim.status) }}
                >
                  {claim.status}
                </span>
              </div>
              <div className="claim-details">
                <p><strong>Category:</strong> {claim.item.category.name}</p>
                <p><strong>Quantity:</strong> {claim.item.quantity}</p>
                <p><strong>Expires:</strong> {formatDate(claim.item.expiryDate)}</p>
                {type === 'incoming' ? (
                  <p><strong>Requested by:</strong> {claim.claimedBy.email}</p>
                ) : (
                  <p><strong>Owner:</strong> {claim.item.user.email}</p>
                )}
                <p><strong>Requested:</strong> {formatDate(claim.createdAt)}</p>
              </div>
              {type === 'incoming' && claim.status === 'requested' && (
                <div className="claim-actions">
                  <button
                    onClick={() => handleStatusUpdate(claim.id, 'approved')}
                    className="approve-btn"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(claim.id, 'rejected')}
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              )}
              {type === 'mine' && claim.status === 'requested' && (
                <button
                  onClick={() => handleStatusUpdate(claim.id, 'cancelled')}
                  className="cancel-btn"
                >
                  Cancel Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Claims;
