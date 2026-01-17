import { useState, useEffect } from 'react';
import api from '../api/client';
import './ItemModal.css';

function ItemModal({ item, categories, onClose, onSave }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isShareable, setIsShareable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.categoryId);
      setQuantity(item.quantity);
      setExpiryDate(item.expiryDate.split('T')[0]);
      setIsShareable(item.isShareable);
    } else {
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setExpiryDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [item, categories]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await api.get(`/external/products/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.products || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleBarcodeLookup = async () => {
    if (!barcode.trim()) return;

    setSearching(true);
    try {
      const response = await api.get(`/external/products/barcode/${barcode}`);
      const product = response.data.product;
      setName(product.name);
      if (product.quantity) setQuantity(product.quantity);
      if (product.categories && product.categories.length > 0) {
        const matchingCategory = categories.find(cat =>
          product.categories.some(pCat => pCat.toLowerCase().includes(cat.name.toLowerCase()))
        );
        if (matchingCategory) setCategoryId(matchingCategory.id);
      }
      setSearchResults([]);
    } catch (err) {
      alert('Product not found. Please enter details manually.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product) => {
    setName(product.name);
    if (product.quantity) setQuantity(product.quantity);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (item) {
        await api.patch(`/items/${item.id}`, {
          name,
          categoryId,
          quantity,
          expiryDate,
          isShareable,
        });
      } else {
        await api.post('/items', {
          name,
          categoryId,
          quantity,
          expiryDate,
          isShareable,
        });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Please create a category first before adding items.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Item' : 'Create Item'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {!item && (
            <div className="product-search-section">
              <h3>Search Product Info</h3>
              <div className="search-controls">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <button type="button" onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
              <div className="barcode-controls">
                <input
                  type="text"
                  placeholder="Or enter barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleBarcodeLookup())}
                />
                <button type="button" onClick={handleBarcodeLookup} disabled={searching}>
                  {searching ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="search-results">
                  <h4>Select a product:</h4>
                  {searchResults.map((product, idx) => (
                    <div
                      key={idx}
                      className="search-result-item"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <strong>{product.name}</strong>
                      {product.brand && <span> - {product.brand}</span>}
                      {product.quantity && <div className="product-quantity">{product.quantity}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 2 kg, 500 ml"
              required
            />
          </div>
          <div className="form-group">
            <label>Expiry Date *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isShareable}
                onChange={(e) => setIsShareable(e.target.checked)}
              />
              Available to share
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
