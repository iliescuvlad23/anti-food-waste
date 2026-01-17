import './NotificationPanel.css';

function NotificationPanel({ expiring, expired }) {
  const hasNotifications = expiring.length > 0 || expired.length > 0;

  if (!hasNotifications) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="notification-panel">
      {expired.length > 0 && (
        <div className="notification-section expired-section">
          <h3>⚠️ Expired Items ({expired.length})</h3>
          <ul>
            {expired.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> - {item.quantity} - Expired on{' '}
                {formatDate(item.expiryDate)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {expiring.length > 0 && (
        <div className="notification-section expiring-section">
          <h3>⏰ Expiring Soon ({expiring.length})</h3>
          <ul>
            {expiring.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> - {item.quantity} - Expires on{' '}
                {formatDate(item.expiryDate)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
