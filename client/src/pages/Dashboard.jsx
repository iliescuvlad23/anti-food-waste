import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { removeToken } from '../utils/auth';
import CategoryList from '../components/CategoryList';
import ItemList from '../components/ItemList';
import ItemModal from '../components/ItemModal';
import NotificationPanel from '../components/NotificationPanel';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expiringItems, setExpiringItems] = useState({ expiring: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadExpiringItems();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/items'),
      ]);
      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringItems = async () => {
    try {
      const response = await api.get('/items/expiring?days=3');
      setExpiringItems(response.data);
    } catch (error) {
      console.error('Failed to load expiring items:', error);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete(`/items/${itemId}`);
      await loadData();
      await loadExpiringItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleToggleShareable = async (itemId) => {
    try {
      await api.patch(`/items/${itemId}/shareable`);
      await loadData();
      await loadExpiringItems();
    } catch (error) {
      console.error('Failed to toggle shareable:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSave = async () => {
    await loadData();
    await loadExpiringItems();
    handleModalClose();
  };

  const handleLogout = () => {
    removeToken();
    onLogout();
    navigate('/login');
  };

  const filteredItems = selectedCategoryId
    ? items.filter((item) => item.categoryId === selectedCategoryId)
    : items;

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Anti Food Waste</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <NotificationPanel
        expiring={expiringItems.expiring}
        expired={expiringItems.expired}
      />

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <CategoryList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={handleCategorySelect}
            onRefresh={loadData}
          />
          <button onClick={handleCreateItem} className="create-item-btn">
            + Add Item
          </button>
        </aside>

        <main className="dashboard-main">
          <ItemList
            items={filteredItems}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onToggleShareable={handleToggleShareable}
          />
        </main>
      </div>

      {isModalOpen && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default Dashboard;
