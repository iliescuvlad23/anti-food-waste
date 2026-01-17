import { useState, useEffect } from 'react';
import api from '../api/client';
import './SharedItems.css';

function SharedItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadItems();
  }, [searchQuery, categoryFilter]);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await api.get(`/shared-items?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load shared items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (itemId) => {
    if (!window.confirm('Request to claim this item?')) {
      return;
    }

    try {
      await api.post(`/claims/items/${itemId}/claims`);
      const goToClaims = window.confirm('Claim request sent! View your claims?');
      if (goToClaims) {
        window.location.href = '/claims/mine';
      } else {
        await loadItems();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create claim');
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

  if (loading) {
    return <div className="shared-items-loading">Loading...</div>;
  }

  return (
    <div className="shared-items-page">
      <h1>Shared Items</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No shared items available.</p>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="shared-item-card">
              <h3>{item.name}</h3>
              <div className="item-details">
                <p><strong>Category:</strong> {item.category.name}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Expires:</strong> {formatDate(item.expiryDate)}</p>
                <p><strong>From:</strong> {item.user.email}</p>
              </div>
              {item.isClaimable && !item.hasApprovedClaim && (
                <button
                  onClick={() => handleClaim(item.id)}
                  className="claim-btn"
                >
                  Request to Claim
                </button>
              )}
              {(item.isClaimed || item.hasApprovedClaim) && (
                <div className="claimed-badge">Already Claimed</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedItems;
