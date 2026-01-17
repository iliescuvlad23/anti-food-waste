import { useState } from 'react';
import api from '../api/client';
import './CategoryList.css';

function CategoryList({ categories, selectedCategoryId, onSelect, onRefresh }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      await api.post('/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAdding(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-list">
      <h2>Categories</h2>
      <div className="category-items">
        <button
          className={`category-item ${selectedCategoryId === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          All Items
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      {isAdding ? (
        <form onSubmit={handleAddCategory} className="add-category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            autoFocus
            disabled={loading}
          />
          <div className="add-category-actions">
            <button type="submit" disabled={loading}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="add-category-btn"
          onClick={() => setIsAdding(true)}
        >
          + Add Category
        </button>
      )}
    </div>
  );
}

export default CategoryList;
