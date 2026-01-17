import './ItemList.css';

function ItemList({ items, onEdit, onDelete, onToggleShareable }) {
  if (items.length === 0) {
    return (
      <div className="item-list-empty">
        <p>No items found. Create your first item!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (dateString) => {
    const days = getDaysUntilExpiry(dateString);
    if (days < 0) return { label: 'Expired', class: 'expired' };
    if (days === 0) return { label: 'Expires today', class: 'expiring-today' };
    if (days <= 3) return { label: `Expires in ${days} days`, class: 'expiring-soon' };
    return { label: `Expires in ${days} days`, class: 'expiring-later' };
  };

  return (
    <div className="item-list">
      <h2>Items {items.length > 0 && `(${items.length})`}</h2>
      <div className="item-grid">
        {items.map((item) => {
          const expiryStatus = getExpiryStatus(item.expiryDate);
          return (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h3>{item.name}</h3>
                <span className={`expiry-badge ${expiryStatus.class}`}>
                  {expiryStatus.label}
                </span>
              </div>
              <div className="item-details">
                <p>
                  <strong>Category:</strong> {item.category.name}
                </p>
                <p>
                  <strong>Quantity:</strong> {item.quantity}
                </p>
                <p>
                  <strong>Expiry:</strong> {formatDate(item.expiryDate)}
                </p>
              </div>
              <div className="item-actions">
                <label className="shareable-toggle">
                  <input
                    type="checkbox"
                    checked={item.isShareable}
                    onChange={() => onToggleShareable(item.id)}
                  />
                  <span>Available to share</span>
                </label>
                <div className="item-buttons">
                  <button onClick={() => onEdit(item)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(item.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItemList;
