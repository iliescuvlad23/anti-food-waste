import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getToken } from '../utils/auth';
import './AcceptInvitation.css';

function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    const authToken = getToken();
    if (!authToken) {
      setError('Please login first to accept the invitation');
      setLoading(false);
      return;
    }

    handleAccept();
  }, [token]);

  const handleAccept = async () => {
    try {
      const response = await api.post('/invitations/accept', { token });
      setSuccess(true);
      setTimeout(() => {
        navigate('/groups');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="accept-invitation-page">
        <div className="accept-invitation-card">
          <p>Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accept-invitation-page">
        <div className="accept-invitation-card error">
          <h2>Error</h2>
          <p>{error}</p>
          <div className="actions">
            <a href="/login">Go to Login</a>
            <a href="/dashboard">Go to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="accept-invitation-page">
        <div className="accept-invitation-card success">
          <h2>Success!</h2>
          <p>Invitation accepted successfully. Redirecting to groups...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default AcceptInvitation;
