import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import itemRoutes from './routes/items.js';
import groupRoutes from './routes/groups.js';
import invitationRoutes from './routes/invitations.js';
import sharedItemsRoutes from './routes/shared-items.js';
import claimsRoutes from './routes/claims.js';
import externalRoutes from './routes/external.js';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);
app.use('/groups', groupRoutes);
app.use('/invitations', invitationRoutes);
app.use('/shared-items', sharedItemsRoutes);
app.use('/claims', claimsRoutes);
app.use('/external', externalRoutes);

app.get('/share/item/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.productItem.findUnique({
      where: { id },
      include: {
        category: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!item || !item.isShareable) {
      return res.status(404).json({ error: 'Item not found or not shareable' });
    }

    res.json({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      expiryDate: item.expiryDate,
      category: item.category.name,
      isClaimed: item.isClaimed,
    });
  } catch (error) {
    console.error('Get share item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
