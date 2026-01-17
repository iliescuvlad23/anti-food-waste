import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, q } = req.query;

    const itemsWithApprovedClaims = await prisma.claim.findMany({
      where: {
        status: 'approved',
      },
      select: {
        itemId: true,
      },
    });

    const approvedItemIds = itemsWithApprovedClaims.map(c => c.itemId);

    const where = {
      isShareable: true,
      isClaimed: false,
      id: {
        notIn: approvedItemIds,
      },
      userId: {
        not: req.user.userId,
      },
    };

    if (category) {
      where.category = {
        name: {
          contains: category,
          mode: 'insensitive',
        },
      };
    }

    if (q) {
      where.name = {
        contains: q,
        mode: 'insensitive',
      };
    }

    const items = await prisma.productItem.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        claims: {
          where: {
            status: 'approved',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    const itemsWithClaimStatus = items.map(item => ({
      ...item,
      hasApprovedClaim: item.claims.length > 0,
      isClaimable: item.claims.length === 0,
    }));

    res.json(itemsWithClaimStatus);
  } catch (error) {
    console.error('Get shared items error:', error);
    res.status(500).json({ error: 'Failed to fetch shared items' });
  }
});

export default router;
