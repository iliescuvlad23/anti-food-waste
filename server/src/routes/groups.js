import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name required' });
    }

    const group = await prisma.friendGroup.create({
      data: {
        name,
        ownerUserId: req.user.userId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await prisma.friendGroup.findMany({
      where: {
        ownerUserId: req.user.userId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            invitations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const group = await prisma.friendGroup.findFirst({
      where: {
        id,
        ownerUserId: req.user.userId,
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        user: {
          email,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        groupId: id,
        email,
        token,
        expiresAt,
      },
    });

    res.status(201).json({
      invitation,
      inviteLink: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/accept?token=${token}`,
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await prisma.friendGroup.findFirst({
      where: {
        id,
        OR: [
          { ownerUserId: req.user.userId },
          {
            members: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        ],
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await prisma.groupMember.findMany({
      where: {
        groupId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.patch('/:id/members/:memberId/preferences', authenticateToken, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { preferenceTags } = req.body;

    const group = await prisma.friendGroup.findFirst({
      where: {
        id,
        ownerUserId: req.user.userId,
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = await prisma.groupMember.findFirst({
      where: {
        id: memberId,
        groupId: id,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.userId !== req.user.userId && group.ownerUserId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        preferenceTags: preferenceTags || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
