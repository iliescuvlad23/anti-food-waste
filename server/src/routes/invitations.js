import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.email !== req.user.email) {
      return res.status(403).json({ error: 'Invitation email does not match your account' });
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: invitation.groupId,
          userId: req.user.userId,
        },
      },
    });

    if (existingMember) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    const [member] = await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId: req.user.userId,
          preferenceTags: [],
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          userId: req.user.userId,
        },
      }),
    ]);

    res.json({
      message: 'Invitation accepted successfully',
      group: member.group,
      membership: {
        id: member.id,
        userId: member.userId,
        user: member.user,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

export default router;
