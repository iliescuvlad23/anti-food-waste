import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/items/:id/claims', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.productItem.findUnique({
      where: { id },
      include: {
        claims: {
          where: {
            status: {
              in: ['requested', 'approved'],
            },
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot claim your own item' });
    }

    if (!item.isShareable) {
      return res.status(400).json({ error: 'Item is not shareable' });
    }

    if (item.isClaimed || item.claims.length > 0) {
      return res.status(400).json({ error: 'Item is already claimed or has pending claims' });
    }

    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId: id,
        claimedByUserId: req.user.userId,
        status: {
          in: ['requested', 'approved'],
        },
      },
    });

    if (existingClaim) {
      return res.status(400).json({ error: 'You already have a pending or approved claim for this item' });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId: id,
        claimedByUserId: req.user.userId,
        status: 'requested',
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(claim);
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

router.get('/incoming', authenticateToken, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: {
        item: {
          userId: req.user.userId,
        },
        status: {
          in: ['requested', 'approved'],
        },
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(claims);
  } catch (error) {
    console.error('Get incoming claims error:', error);
    res.status(500).json({ error: 'Failed to fetch incoming claims' });
  }
});

router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: {
        claimedByUserId: req.user.userId,
      },
      include: {
        item: {
          include: {
            category: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(claims);
  } catch (error) {
    console.error('Get my claims error:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.item.userId !== req.user.userId && claim.claimedByUserId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (status === 'cancelled' && claim.claimedByUserId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the claimer can cancel' });
    }

    if (status === 'approved' && claim.item.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the item owner can approve' });
    }

    if (status === 'rejected' && claim.item.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the item owner can reject' });
    }

    if (status === 'approved' && claim.status !== 'requested') {
      return res.status(400).json({ error: 'Can only approve requested claims' });
    }

    const updateData = { status };

    if (status === 'approved') {
      updateData.item = {
        update: {
          isClaimed: true,
        },
      };

      await prisma.claim.updateMany({
        where: {
          itemId: claim.itemId,
          id: { not: id },
          status: 'requested',
        },
        data: {
          status: 'rejected',
        },
      });
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          include: {
            category: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

export default router;
