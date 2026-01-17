import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const OFF_SEARCH_V1 = "https://en.openfoodfacts.org/cgi/search.pl";

router.get('/products/search', authenticateToken, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const url =
      `${OFF_SEARCH_V1}?search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1` +
      `&page_size=20` +
      `&fields=code,product_name,product_name_en,quantity,brands,categories_tags,image_url` +
      `&lc=en`;

    const response = await fetch(url, {
      headers: { "User-Agent": "AntiFoodWaste/1.0 (demo project)" },
    });

    if (!response.ok) throw new Error(`External API error: ${response.status}`);

    const data = await response.json();

    const products = (data.products || [])
      .map((p) => ({
        name: p.product_name_en || p.product_name || p.code || "Unknown",
        quantity: p.quantity || "",
        brand: p.brands || "",
        categories: p.categories_tags || [],
        imageUrl: p.image_url || null,
      }))
      .filter((p) => /[A-Za-z]/.test(p.name)) // keeps mostly English/Latin names
      .slice(0, 10);

    res.json({ products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});


router.get('/products/barcode/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Barcode required' });
    }

    const response = await fetch(
      `${OPEN_FOOD_FACTS_API}/product/${code}.json?fields=product_name,quantity,brands,categories_tags,image_url,lang&lc=en`
    );

    if (!response.ok) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const data = await response.json();

    if (!data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const isEnglishText = (text) => {
      if (!text) return false;
      const englishPattern = /^[a-zA-Z0-9\s\-.,;:!?'"()&]+$/;
      const hasNonLatin = /[^\x00-\x7F]/.test(text);
      return englishPattern.test(text) && !hasNonLatin;
    };

    const productName = data.product.product_name || 'Unknown';
    
    if (!isEnglishText(productName)) {
      return res.status(404).json({ error: 'Product not available in English' });
    }

    const product = {
      name: productName,
      quantity: data.product.quantity || '',
      brand: data.product.brands || '',
      categories: data.product.categories_tags || [],
      imageUrl: data.product.image_url || null,
    };

    res.json({ product });
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
