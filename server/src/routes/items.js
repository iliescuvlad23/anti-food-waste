import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = { userId: req.user.userId };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const items = await prisma.productItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const expiringItems = await prisma.productItem.findMany({
      where: {
        userId: req.user.userId,
        expiryDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    const expiredItems = await prisma.productItem.findMany({
      where: {
        userId: req.user.userId,
        expiryDate: {
          lt: today,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    res.json({ expiring: expiringItems, expired: expiredItems });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, categoryId, quantity, expiryDate, isShareable } = req.body;

    if (!name || !categoryId || !quantity || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.user.userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = await prisma.productItem.create({
      data: {
        name,
        categoryId,
        quantity,
        expiryDate: new Date(expiryDate),
        isShareable: isShareable || false,
        userId: req.user.userId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, quantity, expiryDate, isShareable } = req.body;

    const item = await prisma.productItem.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (isShareable !== undefined) updateData.isShareable = isShareable;

    const updatedItem = await prisma.productItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.patch('/:id/shareable', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.productItem.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedItem = await prisma.productItem.update({
      where: { id },
      data: {
        isShareable: !item.isShareable,
      },
      include: {
        category: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Toggle shareable error:', error);
    res.status(500).json({ error: 'Failed to toggle shareable' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.productItem.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.productItem.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
