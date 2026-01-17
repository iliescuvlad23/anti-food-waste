import { useState, useEffect } from 'react';
import api from '../api/client';
import './Groups.css';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await api.post('/groups', { name: newGroupName.trim() });
      setNewGroupName('');
      await loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    }
  };

  const handleInvite = async (groupId) => {
    if (!inviteEmail.trim()) return;

    try {
      const response = await api.post(`/groups/${groupId}/invite`, {
        email: inviteEmail.trim(),
      });
      alert(`Invitation sent! Share this link: ${response.data.inviteLink}`);
      setInviteEmail('');
      await loadGroups();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const loadMembers = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      setSelectedGroup({ id: groupId, members: response.data });
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  if (loading) {
    return <div className="groups-loading">Loading...</div>;
  }

  return (
    <div className="groups-page">
      <h1>Friend Groups</h1>

      <form onSubmit={handleCreateGroup} className="create-group-form">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Group name"
          required
        />
        <button type="submit">Create Group</button>
      </form>

      <div className="groups-list">
        {groups.length === 0 ? (
          <p className="empty-state">No groups yet. Create one to get started!</p>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-header">
                <h2>{group.name}</h2>
                <button onClick={() => loadMembers(group.id)}>View Members</button>
              </div>
              <div className="group-stats">
                <span>{group._count?.members || 0} members</span>
                <span>{group._count?.invitations || 0} pending invitations</span>
              </div>
              <div className="invite-section">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email to invite"
                />
                <button onClick={() => handleInvite(group.id)}>Send Invite</button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedGroup && (
        <div className="members-modal" onClick={() => setSelectedGroup(null)}>
          <div className="members-content" onClick={(e) => e.stopPropagation()}>
            <h2>Group Members</h2>
            <button className="close-btn" onClick={() => setSelectedGroup(null)}>×</button>
            <ul>
              {selectedGroup.members.map((member) => (
                <li key={member.id}>
                  <div>
                    <strong>{member.user.email}</strong>
                    {member.preferenceTags.length > 0 && (
                      <div className="preferences">
                        Preferences: {member.preferenceTags.join(', ')}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;
